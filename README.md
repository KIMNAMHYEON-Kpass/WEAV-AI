# WEAV AI

fal.ai(GPT·Gemini 채팅, Google Imagen·OpenAI DALL-E·FLUX 이미지) 기반 채팅·이미지 생성 서비스.  
채팅/이미지 세션은 DB에 저장되며, 비동기(Celery)로 처리됩니다.

---

## 요구 사항

- **Docker**, **Docker Compose**
- (프론트엔드 로컬 실행 시) Node.js 18+
- [fal.ai](https://fal.ai) API 키 → **FAL_KEY**
- (선택) OpenAI API 키 → **OPENAI_API_KEY** (DALL-E 3 사용 시)

---

## 1. Docker 올리는 방법

모든 실행·테스트는 **Docker 기준**입니다. 프로젝트 루트에서 진행합니다.

### 1-1. 환경 변수 설정

```bash
cd infra
cp .env.example .env
```

`.env` 파일을 열어 다음을 설정합니다.

| 변수 | 설명 | 예시 |
|------|------|------|
| `FAL_KEY` | fal.ai API 키 (필수) | `your_fal_ai_key` |
| `OPENAI_API_KEY` | OpenAI API 키 (DALL-E 3 사용 시) | (비워두면 DALL-E 3 미사용) |

### 1-2. 이미지 빌드 및 서비스 기동

```bash
# 프로젝트 루트로 이동
cd ..

# 이미지 빌드 (최초 1회 또는 Dockerfile/의존성 변경 시)
make build

# 서비스 기동 (postgres, redis, api, worker, nginx)
make up
```

또는 `infra`에서 직접:

```bash
cd infra
docker compose build
docker compose up -d
```

### 1-3. 기동 확인

- **API(경유)**: 브라우저 또는 `curl http://localhost:8080/api/v1/health/` → `{"status":"ok"}` 확인
- **서비스 목록**: `cd infra && docker compose ps` 로 postgres, redis, api, worker, nginx 모두 `Up` 인지 확인

### 1-4. 마이그레이션

`api` 컨테이너의 `entrypoint.sh`에서 **자동으로** `migrate`가 실행됩니다.  
수동으로 한 번 더 실행하려면:

```bash
make migrate
```

### 1-5. 서비스 중지

```bash
make down
```

---

## 2. 테스트 진행 방법

**로컬 테스트 환경은 없습니다.** 테스트는 **반드시 Docker 환경**에서만 실행합니다.

### 2-1. 테스트 실행 (권장)

서비스를 띄운 뒤, **프로젝트 루트**에서:

```bash
make test
```

- `infra`로 들어가 `api` 컨테이너를 일회성으로 띄우고, 그 안에서 `python manage.py test tests`를 실행합니다.
- `tests` 패키지(헬스체크, 세션 API 등)만 실행됩니다.

### 2-2. 테스트만 실행 (서비스 미기동 상태)

`make up` 없이 테스트만 돌리려면 (DB·Redis 등이 필요하므로 **실제로는 postgres·redis가 떠 있어야** 테스트가 성공할 수 있음):

```bash
make up    # 최소한 postgres, redis, api 실행
make test  # 테스트 실행
```

또는 직접:

```bash
cd infra
docker compose run --rm api python manage.py test tests
```

### 2-3. 테스트 실패 시

- `make up`으로 api·postgres·redis가 올라와 있는지 확인
- `make logs`로 api 로그 확인
- `make shell`로 api 컨테이너 안에 들어가 `python manage.py test tests -v 2` 등으로 상세 로그 확인

---

## 3. Makefile 요약

**프로젝트 루트**에서 실행합니다.

| 명령 | 설명 |
|------|------|
| `make help` | 사용 가능한 make 목록 출력 |
| `make build` | Docker 이미지 빌드 |
| `make up` | 인프라 기동 (postgres, redis, api, worker, nginx) |
| `make down` | 인프라 중지 |
| `make test` | **테스트 실행 (Docker 전용)** |
| `make migrate` | DB 마이그레이션 실행 |
| `make logs` | api 서비스 로그 스트리밍 |
| `make shell` | api 컨테이너 셸 접속 |

---

## 4. 프론트엔드 로컬 실행 (선택)

API는 Docker로 `http://localhost:8080`에서 떠 있는 상태를 가정합니다.

```bash
cd frontend
cp .env.example .env
```

`.env`에 다음 설정:

```
VITE_API_BASE_URL=http://localhost:8080
```

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속. `/api` 요청은 Vite 프록시로 `http://localhost:8080`으로 전달됩니다.

---

## 5. 서비스 사용 방법

1. **햄버거 메뉴(☰)**  
   - **새 채팅** / **새 이미지**로 세션 생성  
   - 채팅·이미지 세션 목록에서 기존 세션 선택

2. **채팅**  
   - 모델 선택(Gemini 2.5 Flash/Pro, GPT-4o 등) 후 메시지 입력·전송  
   - 응답은 비동기 처리, 완료 시 자동 갱신

3. **이미지 생성**  
   - 모델 선택(Imagen 4, DALL-E 3, FLUX Pro v1.1 Ultra) 후 프롬프트 입력·생성  
   - 생성된 이미지는 세션별 목록에 표시

---

## 6. API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/v1/health/` | 헬스체크 |
| GET | `/api/v1/sessions/` | 세션 목록 (`?kind=chat` \| `?kind=image`) |
| POST | `/api/v1/sessions/` | 세션 생성 (`kind`, `title`) |
| GET | `/api/v1/sessions/:id/` | 세션 상세 (메시지·이미지 포함) |
| POST | `/api/v1/chat/complete/` | 채팅 전송 (비동기, `session_id`, `prompt`, `model`) |
| POST | `/api/v1/chat/image/` | 이미지 생성 (비동기, `session_id`, `prompt`, `model`) |
| GET | `/api/v1/chat/job/:task_id/` | 비동기 작업 상태·결과 조회 |

---

## 7. 프로젝트 구조

| 경로 | 설명 |
|------|------|
| **backend/** | Django 4 + DRF, Celery, fal.ai·OpenAI 연동 |
| **backend/config/** | 설정(settings, urls, wsgi, celery) |
| **backend/apps/** | users, chats, core, ai |
| **backend/tests/** | 프로젝트 테스트 (Docker에서만 실행) |
| **frontend/** | React 19 + Vite 7 + TypeScript, Tailwind |
| **infra/** | Docker Compose (postgres, redis, api, worker, nginx) |
| **Makefile** | Docker 기준 up, down, build, test, migrate, logs, shell |
| **docs/** | 프로젝트 프레임워크·참고 문서 |

자세한 구성은 [docs/프로젝트_프레임워크.md](docs/프로젝트_프레임워크.md)를 참고하세요.
