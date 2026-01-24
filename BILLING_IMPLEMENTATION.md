# 💳 Billing MVP (PortOne 일회 결제 30일권)

## ✅ 구현된 내용

### 백엔드
- **PaymentAttempt** 모델: `paymentId`, `user`, `plan`, `amount`, `currency`, `status`, `portone_payment_id`
- **POST /api/v1/billing/payment/prepare/**  
  - Body: `{ "plan": "standard" | "premium" }`  
  - 응답: PortOne SDK용 `paymentId`, `orderName`, `totalAmount`, `currency`, `payMethod`
- **POST /api/v1/billing/payment/complete/**  
  - Body: `{ "paymentId": "uuid" }`  
  - 서버에서 PortOne 결제 조회 → 금액/통화 검증 → 멤버십 반영 (30일)
- **POST /api/v1/billing/webhook/**  
  - PortOne 웹훅 수신, 서명 검증(HMAC-SHA256) 후 이벤트 처리
- **GET /api/v1/billing/plans/**  
  - 30일권 플랜 목록 (AllowAny)

### 프론트엔드
- **/pricing**: 플랜 표시 → “결제하기” 클릭 시 `prepare` → PortOne SDK 결제창 → `complete` → `/billing/success` 이동
- **/billing/success**: “결제 완료” 메시지 및 `refreshUserInfo`
- **storeId / channelKey**: `VITE_PORTONE_STORE_ID`, `VITE_PORTONE_CHANNEL_KEY` (프론트 전용, 공개 가능)

### Stripe (선택)
- `USE_STRIPE=True` 시에만 **checkout-session**, **webhook/stripe** 노출. 기본은 비활성.

---

## 🚀 설정 방법

### 1. PortOne 콘솔
- Store 생성 후 **Store ID**, **Channel Key** 확인
- **API Secret**, **Webhook Secret** 발급 (결제연동/웹훅 설정)
- 웹훅 URL: `https://yourdomain.com/api/v1/billing/webhook/`  
  (로컬 테스트 시 터널 등으로 공개 URL 사용)

### 2. 환경 변수

**프론트엔드 (루트 `.env`) — 공개 식별자만**
```bash
VITE_PORTONE_STORE_ID=store-xxx
VITE_PORTONE_CHANNEL_KEY=channel-key-xxx
```

**백엔드 (`infra_WEAV/.env` 또는 `backend/.env`) — 비밀키만**
```bash
USE_PORTONE=True
USE_STRIPE=False

PORTONE_API_SECRET=your-portone-api-secret
PORTONE_WEBHOOK_SECRET=your-portone-webhook-secret

FRONTEND_URL=http://localhost:3000
```

### 3. 마이그레이션
```bash
cd infra_WEAV
docker compose run --rm --entrypoint "" api python manage.py migrate
```

---

## 🧪 테스트

1. 프론트: `VITE_PORTONE_*` 설정 후 `npm run dev`
2. 백엔드: `PORTONE_*`, `FRONTEND_URL` 설정 후 `docker compose up`
3. 로그인 → `/pricing` → 플랜 선택 → 결제하기 → PortOne 결제창 → 결제 완료 후 `/billing/success` 확인
4. `GET /api/v1/auth/profile/` 에서 `membership_type`, `membership_expires_at` 반영 확인

---

## 📁 주요 파일

| 역할 | 경로 |
|------|------|
| 결제 시도 모델 | `backend/payments/models.py` |
| prepare/complete/webhook | `backend/payments/views.py` |
| PortOne 조회 클라이언트 | `backend/payments/portone_client.py` |
| Celery task (자동 복구) | `backend/payments/tasks.py` |
| billing URL | `backend/payments/urls.py` |
| 가격 페이지 | `src/components/billing/PricingPage.tsx` |
| 결제 완료 페이지 | `src/components/billing/BillingSuccessPage.tsx` |
| billing API | `src/services/billingService.ts` |
| PortOne SDK 래퍼 | `src/services/portone.ts` |

---

## ⚠️ 참고

- **결제 조회 API**: `GET /payments/{paymentId}` (PortOne V2 표준)
- **웹훅 서명**: Standard Webhooks 규격 (`webhook-id`, `webhook-timestamp`, `webhook-signature` 헤더)
  - `signed_payload = "{webhook_id}.{webhook_timestamp}.{payload_string}"`
  - `signature = HMAC-SHA256(signed_payload, secret)` → **Base64** 인코딩
  - `webhook-signature` 헤더: `"v1,{base64_signature}"` (예: `"v1,aW52...="`)
  - 타임스탬프 검증 (5분 이내)
- **웹훅 역할**: '신호'로만 사용. 웹훅 수신 시 Celery task를 enqueue하여 결제 조회 API로 최종 확정.
  - **complete 누락 자동 복구**: 사용자가 브라우저를 닫거나 네트워크 이슈로 complete가 호출되지 않아도, 웹훅 → Celery task가 자동으로 멤버십 반영.
- **멱등**: 웹훅/Celery task에서 `PaymentAttempt.status == 'paid'` 이면 재처리 스킵.
- **Content-Type**: `application/json`만 지원 (PortOne V2, 2024-04-25 이후)
- **paymentId**: UUID 사용 (안전한 형식: [A-Za-z0-9-]{36})
- **정기결제**: 현재 30일 일회권만 구현. 빌링키 + Celery Beat 등 정기결제는 별도 단계.

---

---

## 🚨 운영 Go 직전 필수 확인 (실패율/CS 좌우)

### 1. 웹훅 raw body 검증 ⚠️ 필수
- 코드에서 `request.body` (raw bytes)를 JSON 파싱 **전**에 검증에 사용
- `payload_str = payload_raw.decode("utf-8")` → `signed_payload` 생성
- PortOne SDK 요구사항: "JSON 파싱 전 문자열 그대로" 준수 ✅

### 2. Celery 워커 실행 확인 ⚠️ 필수
- `docker compose ps worker`로 워커 컨테이너 상태 확인
- 워커가 죽어 있으면 **complete 누락 자동 복구가 무력화됨**
- 워커 환경변수에 `PORTONE_API_SECRET` 포함 확인 (결제 조회 API 호출용)

### 3. PortOne 콘솔 호출 테스트 ⚠️ 필수
- 웹훅 URL **저장 후** "호출 테스트" 버튼 클릭
- **주의**: "저장 안 하고 테스트" 시도 시 실패 (PortOne 문서 주의사항)
- 서버 로그에서 웹훅 수신 및 서명 검증 통과 확인

### 4. (선택) IP 필터링
- PortOne V2 웹훅 IP 확인 (문서 참조)
- Nginx/Firewall에서 해당 IP만 허용 (변경 가능하므로 운영 프로세스 필요)

---

**마지막 업데이트**: 2026-01-24 (PortOne 전환, 운영 Go 준비 완료)
