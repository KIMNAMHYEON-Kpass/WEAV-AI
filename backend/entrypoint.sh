#!/bin/bash

# WEAV AI 백엔드 엔트리포인트 스크립트
# Docker 컨테이너 시작 시 실행되는 초기화 작업

set -e  # 에러 발생 시 스크립트 중단

# 작업 디렉토리 설정 (Dockerfile의 WORKDIR과 일치)
cd /app

echo "🚀 WEAV AI 백엔드 시작..."

# ===== 데이터베이스 연결 대기 =====
echo "⏳ 데이터베이스 연결 대기 중..."
while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
    echo "   PostgreSQL이 준비되지 않음, 2초 후 재시도..."
    sleep 2
done
echo "✅ 데이터베이스 연결 성공"

# ===== 데이터베이스 마이그레이션 =====
echo "📦 데이터베이스 마이그레이션 실행..."
# --fake-initial: 이미 존재하는 테이블에 대해서는 마이그레이션을 fake로 처리
python manage.py migrate --noinput --fake-initial || {
    echo "⚠️  마이그레이션 중 일부 에러 발생, 재시도 중..."
    # 실패한 경우 일반 migrate로 재시도 (이미 적용된 마이그레이션은 건너뜀)
    python manage.py migrate --noinput 2>&1 | grep -v "already exists" || true
}
echo "✅ 데이터베이스 마이그레이션 완료"

# ===== 정적 파일 수집 =====
echo "📄 정적 파일 수집..."
python manage.py collectstatic --noinput --clear
echo "✅ 정적 파일 수집 완료"

# ===== MinIO 버킷 생성 (선택사항) =====
if [ "$CREATE_BUCKET_ON_STARTUP" = "true" ]; then
    echo "📦 MinIO 버킷 확인/생성..."
    python -c "
import os
import sys
sys.path.insert(0, '/app')
from apps.storage.s3 import S3Storage
try:
    storage = S3Storage()
    storage.create_bucket_if_not_exists()
    print('✅ MinIO 버킷 준비 완료')
except Exception as e:
    print(f'⚠️  MinIO 버킷 생성 실패 (무시): {e}')
"
fi

# ===== 커맨드 실행 =====
# docker-compose의 command 인자가 있으면 그것을 실행, 없으면 Gunicorn 실행
if [ $# -gt 0 ]; then
    # 커맨드 인자가 있으면 그것을 실행 (예: celery worker)
    # 작업 디렉토리를 /app으로 명시적으로 설정
    cd /app
    echo "🚀 커맨드 실행 (작업 디렉토리: $(pwd)): $@"
    exec "$@"
else
    # 커맨드 인자가 없으면 Gunicorn 실행 (기본 동작)
    echo "🌟 Gunicorn 서버 시작..."

    # Gunicorn 설정
    WORKERS=${GUNICORN_WORKERS:-4}
    THREADS=${GUNICORN_THREADS:-2}
    BIND=${GUNICORN_BIND:-0.0.0.0:8000}
    TIMEOUT=${GUNICORN_TIMEOUT:-300}

    echo "   워커: $WORKERS, 스레드: $THREADS"
    echo "   바인드: $BIND, 타임아웃: ${TIMEOUT}초"

    # Gunicorn 실행 (디버그: 상세 로그 출력)
    exec gunicorn \
        --workers $WORKERS \
        --threads $THREADS \
        --bind $BIND \
        --timeout $TIMEOUT \
        --access-logfile - \
        --error-logfile - \
        --log-level debug \
        --capture-output \
        --reload \
        weavai.wsgi:application
fi