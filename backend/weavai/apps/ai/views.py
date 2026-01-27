# WEAV AI AI 서비스 뷰
# 텍스트 채팅 완료 엔드포인트 (Gateway)

import logging
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .router import AIServiceRouter
from .schemas import TextGenerationRequest
from .errors import AIServiceError, AIProviderError, AIRequestError

logger = logging.getLogger(__name__)
router = AIServiceRouter()

# 무료 모델 목록 (멤버십 체크 불필요)
# 프론트엔드 모델 ID와 매칭: gpt-5.2-instant만 무료
FREE_MODELS = {
    'gpt-5.2-instant',  # 프론트엔드 모델 ID
    'gpt-5-mini',  # API 모델 이름
    'gpt-4o-mini',  # API 모델 이름
}


def _is_premium_model(model_id: str) -> bool:
    """
    모델이 프리미엄 모델인지 확인
    
    프리미엄 모델:
    - gemini-3-flash (Gemini)
    - gpt-image-1.5, nano-banana (Image)
    - sora (Video)
    
    무료 모델:
    - gpt-5.2-instant (GPT)
    """
    if not model_id:
        return False
    model_lower = model_id.lower()
    
    # 무료 모델 체크 (정확히 일치하거나 포함)
    if any(free_model in model_lower for free_model in FREE_MODELS):
        return False
    
    # 프리미엄 모델: gemini, image, video 등
    # gemini, image, video 키워드가 있으면 프리미엄
    premium_keywords = ['gemini', 'image', 'video', 'sora', 'veo', 'dall-e', 'banana']
    if any(keyword in model_lower for keyword in premium_keywords):
        return True
    
    # 기본값: 알 수 없는 모델은 프리미엄으로 간주 (안전)
    return True


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_chat(request):
    """
    텍스트 채팅 완료 (Gateway)
    
    Request Body:
    {
        "provider": "openai" | "gemini",
        "model_id": "gpt-4o-mini" | "gemini-1.5-flash" | ...,
        "input_text": "사용자 입력",
        "system_prompt": "시스템 프롬프트 (선택)",
        "history": [{"role": "user|assistant", "content": "..."}, ...],
        "temperature": 0.7,
        "max_output_tokens": 1024
    }
    
    Response:
    {
        "text": "AI 응답 텍스트",
        "provider": "openai",
        "model": "gpt-4o-mini",
        "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
    }
    """
    try:
        provider = request.data.get('provider', 'openai')
        model_id = request.data.get('model_id')
        input_text = request.data.get('input_text')
        system_prompt = request.data.get('system_prompt')
        history = request.data.get('history', [])
        temperature = request.data.get('temperature', 0.7)
        max_output_tokens = request.data.get('max_output_tokens', 1024)
        
        if not input_text:
            return Response(
                {'error': 'input_text가 필요합니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 프리미엄 모델 사용 시 멤버십 체크
        if settings.ENFORCE_MEMBERSHIP and _is_premium_model(model_id):
            if not request.user.can_use_premium_features:
                return Response(
                    {
                        'error': '프리미엄 모델 사용을 위해서는 멤버십이 필요합니다.',
                        'membership_required': True,
                        'current_membership': request.user.membership_type,
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # 모델 ID에서 provider 추론
        if not provider:
            model_lower = (model_id or '').lower()
            if 'gpt' in model_lower or 'dall-e' in model_lower or 'sora' in model_lower:
                provider = 'openai'
            elif 'gemini' in model_lower:
                provider = 'gemini'
            else:
                provider = 'openai'  # 기본값
        
        # 히스토리 처리: OpenAI는 messages 배열, Gemini는 contents 배열
        # 현재는 간단하게 시스템 프롬프트에 통합 (향후 개선 가능)
        if history:
            history_text = '\n'.join([
                f"{'User' if msg.get('role') == 'user' else 'Assistant'}: {msg.get('content', '')}"
                for msg in history[-5:]  # 최근 5개만
            ])
            if system_prompt:
                system_prompt = f"{system_prompt}\n\n이전 대화:\n{history_text}"
            else:
                system_prompt = f"이전 대화:\n{history_text}"
        
        # 라우터로 텍스트 생성
        arguments = {
            'input_text': input_text,
            'system_prompt': system_prompt,
            'temperature': temperature,
            'max_output_tokens': max_output_tokens,
            'model_id': model_id  # 모델 ID 전달 (클라이언트에서 사용)
        }
        
        result = router.generate_text(provider, arguments)
        
        logger.info(f"텍스트 생성 완료: provider={provider}, user={request.user.username}, tokens={result.get('usage', {}).get('total_tokens', 0)}")
        
        return Response(result, status=status.HTTP_200_OK)
        
    except AIProviderError as e:
        logger.error(f"AI Provider Error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except AIRequestError as e:
        logger.error(f"AI Request Error: {e}")
        return Response(
            {'error': str(e)},
            status=e.status_code if hasattr(e, 'status_code') else status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Unexpected error in complete_chat: {e}", exc_info=True)
        return Response(
            {'error': '서버 오류가 발생했습니다.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
