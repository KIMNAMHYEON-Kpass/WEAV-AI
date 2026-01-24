# WEAV AI 인프라 설정

Mac Mini + 외장하드 기반 프로덕션급 AI 생성 서비스 인프라입니다.

## 🏗️ 서비스 구성

- **Nginx**: 리버스 프록시 (포트 8080)
- **Django + DRF**: API 서버 (포트 8000)
- **PostgreSQL**: 데이터베이스
- **Redis**: Celery 브로커 및 캐시
- **Celery**: 비동기 작업 처리
- **MinIO**: S3 호환 파일 스토리지 (외장하드)

---

## 🚀 빠른 시작

### 1. 환경 변수 설정

`infra/.env` 파일 생성:

```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=weavai.hub,localhost

# 데이터베이스
POSTGRES_PASSWORD=your-password

# AI API 키
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/firebase-key.json

# MinIO (외장하드 경로)
MINIO_DATA_DIR=/Volumes/WEAVAI_2T/minio-data
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=your-password
```

### 2. 외장하드 설정

```bash
# MinIO 데이터 디렉토리 생성
sudo mkdir -p /Volumes/WEAVAI_2T/minio-data
sudo chown -R $(whoami) /Volumes/WEAVAI_2T/minio-data
```

### 3. 서비스 시작

```bash
cd infra
docker compose up -d --build
```

### 4. 상태 확인

```bash
# 서비스 상태
docker compose ps

# 헬스체크
curl http://localhost:8080/healthz
curl http://localhost:8080/api/v1/health/
```

---

## 🔧 주요 명령어

### 로그 확인

```bash
# 모든 서비스 로그
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f api
docker compose logs -f nginx
```

### 데이터베이스 관리

```bash
# 마이그레이션
docker compose exec api python manage.py makemigrations
docker compose exec api python manage.py migrate

# Django 쉘
docker compose exec api python manage.py shell
```

### 서비스 재시작

```bash
# 전체 재시작
docker compose restart

# 특정 서비스 재시작
docker compose restart api
```

---

## 📊 모니터링

### 헬스체크 엔드포인트

- `GET /healthz` - Nginx 상태
- `GET /api/v1/health/` - 전체 시스템 상태

### MinIO 콘솔

- URL: `http://localhost:9001`
- 사용자명: `MINIO_ROOT_USER`
- 비밀번호: `MINIO_ROOT_PASSWORD`

---

## 🔒 보안 고려사항

- 환경 변수로 민감한 정보 관리
- 프로덕션에서는 `DEBUG=False` 설정
- 강력한 비밀번호 사용
- 외장하드 정기 백업 필수

---

**마지막 업데이트**: 2026-01-24
