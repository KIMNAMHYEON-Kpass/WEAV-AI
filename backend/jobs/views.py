# WEAV AI Jobs 앱 뷰
# AI 작업 관리 API (OpenAI, Gemini 연동)

import logging
import os
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
from .models import Job, Artifact
from .serializers import (
    JobCreateSerializer, JobDetailSerializer,
    JobListSerializer, ArtifactSerializer
)

logger = logging.getLogger(__name__)


def call_ai_service(provider: str, arguments: dict) -> dict:
    """
    AI 서비스 호출 함수

    Args:
        provider: AI 제공자 ('openai', 'gemini')
        arguments: API 호출 파라미터

    Returns:
        dict: AI 응답 결과
    """
    try:
        if provider == 'openai':
            return call_openai_service(arguments)
        elif provider == 'gemini':
            return call_gemini_service(arguments)
        else:
            raise ValueError(f"지원하지 않는 AI 제공자: {provider}")
    except Exception as e:
        logger.error(f"AI 서비스 호출 실패: {provider} - {e}")
        raise


def call_openai_service(arguments: dict) -> dict:
    """
    OpenAI API 직접 호출 (requests 사용)

    Args:
        arguments: API 호출 파라미터

    Returns:
        dict: OpenAI 응답 결과
    """
    import requests

    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다")

    # 요청 파라미터 추출
    input_text = arguments.get('input_text', '')
    system_prompt = arguments.get('system_prompt')
    temperature = arguments.get('temperature', 0.7)

    # 메시지 구성
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": input_text})

    # requests를 사용한 직접 API 호출
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 1000
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()

        # 결과 구성
        choice = data['choices'][0]
        message = choice['message']
        usage = data['usage']

        result = {
            "provider": "openai",
            "model": data['model'],
            "text": message['content'],
            "usage": {
                "prompt_tokens": usage['prompt_tokens'],
                "completion_tokens": usage['completion_tokens'],
                "total_tokens": usage['total_tokens']
            },
            "finish_reason": choice['finish_reason']
        }

        return result

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise ValueError("OpenAI API 키가 유효하지 않습니다")
        elif e.response.status_code == 429:
            raise ValueError("OpenAI API 사용량 제한에 도달했습니다")
        else:
            raise ValueError(f"OpenAI API 호출 실패: {e.response.status_code}")
    except Exception as e:
        raise ValueError(f"OpenAI API 호출 중 오류 발생: {str(e)}")


def call_gemini_service(arguments: dict) -> dict:
    """
    Gemini API 호출 (추후 구현)

    Args:
        arguments: API 호출 파라미터

    Returns:
        dict: Gemini 응답 결과
    """
    # 현재는 OpenAI만 구현
    raise NotImplementedError("Gemini API는 아직 구현되지 않았습니다")


@api_view(['POST'])
def create_job(request):
    """
    AI 작업 생성 및 실행

    동기식으로 AI API를 호출하여 결과를 즉시 반환합니다.
    추후 비동기 처리로 전환 가능합니다.
    """
    try:
        # 요청 데이터 검증
        serializer = JobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Job 레코드 생성
        job = Job.objects.create(**serializer.validated_data)
        logger.info(f"새 AI 작업 생성됨: {job.id} (제공자: {job.provider})")

        # 실제 AI 서비스 호출
        from weavai.apps.ai.router import ai_router
        ai_result = ai_router.route_and_run(
            provider=job.provider,
            model_type='text',  # 현재는 텍스트만 지원, 추후 확장
            arguments=job.arguments
        )

        # 작업 성공 처리
        job.status = 'COMPLETED'
        job.result_json = ai_result
        job.save()

        # Artifact 생성 (결과 타입에 따라)
        if ai_result.get('text'):
            Artifact.objects.create(
                job=job,
                kind='text',
                text_content=ai_result['text']
            )
        elif ai_result.get('url'):  # 이미지/비디오 URL
            artifact_kind = 'image' if model_type == 'image' else 'video' if model_type == 'video' else 'file'
            Artifact.objects.create(
                job=job,
                kind=artifact_kind,
                presigned_url=ai_result['url'],
                mime_type=ai_result.get('mime_type', 'image/png' if artifact_kind == 'image' else 'video/mp4')
            )

        logger.info(f"AI 작업 완료: {job.id}")

        return Response({
            'id': str(job.id),
            'status': job.status,
            'result': ai_result,
            'message': 'AI 작업이 성공적으로 완료되었습니다.'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        # 요청 검증 실패 등
        logger.error(f"Job 생성 요청 에러: {e}")
        return Response({
            'error': '잘못된 요청입니다.',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)