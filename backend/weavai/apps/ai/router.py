# WEAV AI AI 서비스 라우터
# 요청을 적절한 AI 클라이언트로 분배

import os
from typing import Dict, Any, Union
from .openai_client import OpenAIClient
from .gemini_client import GeminiClient
from .fal_client import FalClient
from .schemas import TextGenerationRequest, ImageGenerationRequest, VideoGenerationRequest
from .errors import AIServiceError, AIProviderError


class AIServiceRouter:
    """AI 서비스 라우터"""

    def __init__(self):
        self.clients = {}
        self.default_provider = os.getenv('AI_PROVIDER_DEFAULT', 'openai')

    def _get_client(self, provider: str):
        """클라이언트 인스턴스 가져오기 (Lazy Loading)"""
        if provider not in self.clients:
            if provider == 'openai':
                self.clients[provider] = OpenAIClient()
            elif provider == 'gemini':
                self.clients[provider] = GeminiClient()
            elif provider == 'fal':
                self.clients[provider] = FalClient()
            else:
                raise AIProviderError(provider, f"지원하지 않는 AI 제공자: {provider}")

        return self.clients[provider]

    def generate_text(self, provider: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        텍스트 생성 라우팅

        Args:
            provider: AI 제공자 ('openai', 'gemini')
            arguments: 요청 파라미터

        Returns:
            Dict: 표준화된 AI 응답
        """
        try:
            # 요청 데이터 검증
            request = TextGenerationRequest(**arguments)

            # 클라이언트 가져오기
            client = self._get_client(provider)

            # 텍스트 생성 호출
            return client.generate_text(request)

        except AIServiceError:
            # 이미 커스텀 에러인 경우 그대로 전파
            raise
        except Exception as e:
            # 예상치 못한 에러 처리
            raise AIProviderError(provider, f"텍스트 생성 중 예상치 못한 오류: {str(e)}")

    def generate_image(self, provider: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        이미지 생성 라우팅

        Args:
            provider: AI 제공자 ('openai', 'gemini')
            arguments: 요청 파라미터

        Returns:
            Dict: 표준화된 AI 응답
        """
        try:
            # 요청 데이터 검증
            request = ImageGenerationRequest(**arguments)

            # 클라이언트 가져오기
            client = self._get_client(provider)

            # 이미지 생성 호출
            return client.generate_image(request)

        except AIServiceError:
            raise
        except Exception as e:
            raise AIProviderError(provider, f"이미지 생성 중 예상치 못한 오류: {str(e)}")

    def generate_video(self, provider: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        비디오 생성 라우팅

        Args:
            provider: AI 제공자 ('openai', 'gemini')
            arguments: 요청 파라미터

        Returns:
            Dict: 표준화된 AI 응답
        """
        try:
            # 요청 데이터 검증
            request = VideoGenerationRequest(**arguments)

            # 클라이언트 가져오기
            client = self._get_client(provider)

            # 비디오 생성 호출
            return client.generate_video(request)

        except AIServiceError:
            raise
        except Exception as e:
            raise AIProviderError(provider, f"비디오 생성 중 예상치 못한 오류: {str(e)}")

    def route_and_run(self, provider: str, model_type: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        범용 라우팅 메소드

        Args:
            provider: AI 제공자
            model_type: 모델 타입 ('text', 'image', 'video')
            arguments: 요청 파라미터

        Returns:
            Dict: 표준화된 AI 응답
        """
        if model_type == 'text':
            return self.generate_text(provider, arguments)
        elif model_type == 'image':
            return self.generate_image(provider, arguments)
        elif model_type == 'video':
            return self.generate_video(provider, arguments)
        else:
            raise ValueError(f"지원하지 않는 모델 타입: {model_type}")


# 글로벌 라우터 인스턴스
ai_router = AIServiceRouter()
