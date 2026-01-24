# WEAV-AI

AI 기반 콘텐츠 생성 플랫폼. 사용자가 목표를 입력하면 AI가 작업 단계를 계획하고, 단계별로 적합한 모델을 선택해 텍스트/이미지/비디오를 생성합니다.

---

## 🎯 프로젝트 개요

**WEAV-AI**는 AI 기반 콘텐츠 생성 플랫폼입니다. 사용자가 프로젝트 목표를 입력하면 AI가 자동으로 작업 단계를 계획하고, 각 단계에 맞는 AI 모델을 선택하여 텍스트, 이미지, 비디오를 생성할 수 있습니다.

### 핵심 기능

- 🤖 **AI 기반 프로젝트 계획**: 사용자 목표 분석 → 단계별 작업 계획 생성
- 💬 **멀티 모델 채팅**: OpenAI GPT, Google Gemini 등 다양한 모델 지원
- 🎨 **이미지 생성**: DALL-E 3 기반 생성 (준비 중)
- 🎬 **비디오 생성**: SORA, VEO (준비 중)
- 📁 **폴더 기반 관리**: 프로젝트별 채팅방 및 생성물 관리
- 🎨 **다크/라이트 모드**: 사용자 맞춤형 테마 지원
- 🔐 **Google 로그인**: Firebase 인증 + 백엔드 JWT 토큰 발급

---

## 🏗️ 아키텍처

```
사용자 (브라우저)
    ↓
Cloudflare Tunnel (프로덕션)
    ↓
Nginx (리버스 프록시, 포트 8080)
    ↓
┌─────────────┬─────────────┐
│  Django API │  React App  │
│  (포트 8000)│  (포트 5173)│
└──────┬──────┴─────────────┘
       │
       ├── PostgreSQL (데이터베이스)
       ├── Redis (캐시/작업 큐)
       ├── Celery (비동기 작업)
       └── MinIO (파일 저장소)
```

---

## 🛠️ 기술 스택

### 프론트엔드
- React 18 + TypeScript + Vite
- React Router DOM
- Tailwind CSS
- Firebase Auth (Google 로그인)
- Sonner (Toast 알림)

### 백엔드
- Django 4.2.7 + Django REST Framework
- PostgreSQL 15
- Redis 7
- Celery 5.3.4
- MinIO (S3 호환)
- Firebase Admin SDK (토큰 검증)

### AI 서비스
- OpenAI: GPT-4o-mini, DALL-E 3, SORA
- Google Gemini: Gemini 1.5 Flash, Gemini 3 Pro

---

## 🚀 빠른 시작

### 1. 환경 변수 설정

#### 프론트엔드 (`.env`)
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE_URL=http://localhost:8080
```

#### 백엔드 (`infra/.env`)
```bash
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 데이터베이스
POSTGRES_PASSWORD=your-password

# AI API 키
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/firebase-key.json

# MinIO
MINIO_DATA_DIR=/Volumes/WEAVAI_2T/minio-data
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=your-password
```

### 2. 백엔드 실행

```bash
cd infra
docker compose up -d
```

### 3. 프론트엔드 실행

```bash
npm install
npm run dev
```

### 4. 접속

- 프론트엔드: `http://localhost:5173`
- 백엔드 API: `http://localhost:8080/api/v1/`
- MinIO 콘솔: `http://localhost:9001`

---

## 📡 주요 API 엔드포인트

### 인증
- `POST /api/v1/auth/verify-firebase-token/` - Firebase 토큰 검증 및 JWT 발급
- `POST /api/v1/auth/token/refresh/` - JWT 토큰 갱신
- `GET /api/v1/auth/profile/` - 사용자 프로필 조회

### AI 작업
- `POST /api/v1/jobs/` - AI 작업 생성 (텍스트/이미지/비디오)
- `GET /api/v1/jobs/{job_id}/` - 작업 상태 조회

---

## 📊 현재 진행 상황

### ✅ 완료
- 프론트엔드 UI/UX (채팅, 폴더 관리, 테마)
- Google 로그인 (Firebase + 백엔드 JWT 연동)
- OpenAI 텍스트 생성 API 연동
- 백엔드 기본 인프라 (Docker, PostgreSQL, Redis, MinIO)
- 사용자별 데이터 분리 (localStorage)

### 🔄 진행 중
- Gemini API 연동 (코드 작성 완료, 테스트 필요)
- 이미지 생성 (DALL-E 3)
- 비디오 생성 (SORA, VEO)
- 프론트엔드-백엔드 완전 연동

### 📋 예정
- 실시간 작업 진행 상황 표시
- 파일 업로드/다운로드
- 결제 시스템 (Stripe)

---

## 🔒 보안

- AI API 키는 백엔드에서만 관리 (프론트엔드 노출 금지)
- Firebase ID Token 검증 후 JWT 발급
- 사용자별 데이터 분리
- HTTPS 적용 (Cloudflare Tunnel)

---

## 📚 문서

- [배포 가이드](./DEPLOYMENT_GUIDE.md) - Cloudflare Tunnel 배포 방법
- [프로젝트 문서](./PROJECT_DOCUMENTATION.md) - 상세 기술 문서
- [백엔드 README](./backend/README.md) - 백엔드 설정 가이드
- [인프라 README](./infra/README.md) - 인프라 설정 가이드

---

**마지막 업데이트**: 2026-01-24
