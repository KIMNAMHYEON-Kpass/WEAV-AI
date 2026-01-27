# WEAV AI Backend

Django REST Framework 기반의 AI 생성 서비스 백엔드입니다.

##  아키텍처

```
Nginx → Django + DRF → PostgreSQL (User, Folder, ChatSession, Job, Artifact)
                      → Redis (캐시 / Celery 브로커)
                      → Celery (비동기 AI 작업, 사용자당 최대 4건 동시)
                      → MinIO (파일 저장)
```

##  빠른 시작

### Docker Compose로 실행 (권장)

```bash
cd infra
docker compose up -d
```

### 마이그레이션

```bash
cd infra
docker compose run --rm --entrypoint "" api python manage.py migrate
```

### 로컬 개발 환경

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp env.example .env
# .env 편집
python manage.py migrate
python manage.py runserver
```

---

##  주요 API 엔드포인트

### 인증
- `POST /api/v1/auth/verify-firebase-token/` - Firebase 토큰 검증, JWT 발급, **User·멤버십 DB 저장**
- `POST /api/v1/auth/token/refresh/` - JWT 갱신
- `GET /api/v1/auth/profile/` - 프로필·멤버십 조회

### 채팅·폴더 (인증 필수)
- `GET/POST /api/v1/chats/folders/` - 폴더 목록/생성
- `GET/PUT/DELETE /api/v1/chats/folders/<uuid>/` - 폴더 상세
- `GET /api/v1/chats/chats/?folder=<uuid>` - 채팅 목록
- `POST /api/v1/chats/chats/` - 채팅 생성
- `GET/PUT/DELETE /api/v1/chats/chats/<uuid>/` - 채팅 상세

### AI 작업 (인증 필수, 비동기)
- `GET /api/v1/jobs/` - 내 작업 목록
- `POST /api/v1/jobs/` - 작업 생성 → **202 + job_id** (Celery 비동기, 사용자당 최대 4건, 초과 시 429)
- `GET /api/v1/jobs/<job_id>/` - 상태·결과 조회 (폴링용)

---

##  환경 변수

### 필수

```bash
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

POSTGRES_DB=weavai
POSTGRES_USER=weavai_user
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

REDIS_URL=redis://redis:6379/0

OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/firebase-key.json
# 또는 FIREBASE_SERVICE_ACCOUNT_KEY_JSON='{"type":"service_account",...}'
```

---

##  데이터베이스 모델

### User (커스텀 `users.User`)
- Firebase UID → `username`
- **멤버십**: `membership_type` (free/standard/premium), `membership_expires_at`
- **API 키 상태**: `has_openai_key`, `has_gemini_key`
- `photo_url`, `last_login_at`

### Folder / ChatSession (chats)
- 사용자별 폴더·채팅 세션, DB 저장

### Job / Artifact
- **Job**: `user` FK, 상태(IN_QUEUE → IN_PROGRESS → COMPLETED/FAILED), provider, model_id, arguments, result_json
- **Artifact**: 생성물(텍스트/이미지/비디오), S3 키, Presigned URL

---

##  보안

- Firebase ID Token 검증 후 JWT 발급
- 채팅·폴더·Jobs **사용자별 접근 제어**
- AI API 키는 서버 전용
- CORS 설정

---

##  현재 구현 상태

###  완료
- Firebase 토큰 검증, JWT, **User·멤버십 DB 저장**
- **chats** API (폴더·채팅 CRUD)
- **Jobs** API (목록/생성/상세), **Celery 비동기**, 사용자당 최대 4건
- OpenAI 텍스트·이미지, SORA 비디오 (Jobs 경유)
- PostgreSQL, Redis, MinIO 연동

###  진행 중
- Gemini API 연동 (코드 완료, 테스트)

---

**마지막 업데이트**: 2026-01-24
