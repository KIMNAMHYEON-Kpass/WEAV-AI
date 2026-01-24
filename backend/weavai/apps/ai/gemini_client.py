# WEAV AI Gemini 클라이언트
# Google Gen AI SDK 기반 텍스트/이미지 생성

import os
from typing import Dict, Any, Optional
from google import genai
from .schemas import TextGenerationRequest, ImageGenerationRequest, VideoGenerationRequest
from .errors import AIProviderError, AIRequestError, AIQuotaExceededError


class GeminiClient:
    """Gemini API 클라이언트"""

    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise AIProviderError('gemini', 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다')

        self.client = genai.Client(api_key=api_key)
        self.default_text_model = os.getenv('GEMINI_TEXT_MODEL', 'gemini-1.5-flash')

    def generate_text(self, request: TextGenerationRequest) -> Dict[str, Any]:
        """
        텍스트 생성 (Google Gen AI SDK 사용)

        Args:
            request: 검증된 텍스트 생성 요청

        Returns:
            Dict: 표준화된 응답 데이터
        """
        try:
            # 설정 구성
            config = {
                "temperature": request.temperature,
                "max_output_tokens": request.max_output_tokens,
            }

            # 시스템 프롬프트 처리 (Gemini에서는 system_instruction으로 설정)
            system_instruction = request.system_prompt if request.system_prompt else None

            # 모델 선택 (model_id가 있으면 사용, 없으면 기본값)
            model_name = request.model_id if hasattr(request, 'model_id') and request.model_id else self.default_text_model
            # 모델 ID 매핑 (프론트 모델 ID → Gemini API 모델명)
            model_mapping = {
                'gemini-3-flash': 'gemini-1.5-flash',
                'gemini-3-pro-preview': 'gemini-1.5-pro',
            }
            if model_name in model_mapping:
                model_name = model_mapping[model_name]
            
            # API 호출
            response = self.client.models.generate_content(
                model=model_name,
                contents=request.input_text,
                config=config,
            )

            # 응답 데이터 표준화
            result = {
                "provider": "gemini",
                "model": self.default_text_model,
                "text": response.text,
                "usage": getattr(response, 'usage_metadata', None)
            }

            return result

        except Exception as e:
            error_message = str(e)

            # 에러 타입에 따른 구분 처리
            if "quota_exceeded" in error_message.lower() or "rate_limit" in error_message.lower():
                raise AIQuotaExceededError("gemini")
            elif "invalid_api_key" in error_message.lower() or "permission_denied" in error_message.lower():
                raise AIProviderError("gemini", "API 키가 유효하지 않습니다")
            elif "model_not_found" in error_message.lower():
                raise AIRequestError("gemini", f"모델 '{self.default_text_model}'을 찾을 수 없습니다", 400)
            else:
                raise AIRequestError("gemini", f"텍스트 생성 실패: {error_message}", 500)

    def generate_image(self, request: ImageGenerationRequest) -> Dict[str, Any]:
        """
        이미지 생성 (Gemini Vision 사용)

        Args:
            request: 검증된 이미지 생성 요청

        Returns:
            Dict: 표준화된 응답 데이터
        """
        try:
            # Gemini에서는 텍스트로 이미지 설명을 생성하고,
            # 실제 이미지 생성은 별도 처리 필요할 수 있음
            # 현재는 텍스트 기반 응답으로 구현

            config = {
                "temperature": 0.7,
            }

            prompt = f"이미지를 생성하기 위한 자세한 설명을 작성해주세요: {request.prompt}"

            response = self.client.models.generate_content(
                model=self.default_text_model,
                contents=prompt,
                config=config
            )

            # 실제로는 이미지 생성 API를 호출해야 하지만,
            # 현재는 텍스트 기반 응답만 제공
            result = {
                "provider": "gemini",
                "model": self.default_text_model,
                "description": response.text,
                "note": "Gemini 이미지 생성은 추가 구현이 필요합니다"
            }

            return result

        except Exception as e:
            error_message = str(e)

            if "quota_exceeded" in error_message.lower():
                raise AIQuotaExceededError("gemini")
            else:
                raise AIRequestError("gemini", f"이미지 생성 실패: {error_message}", 500)

    def generate_video(self, request: VideoGenerationRequest) -> Dict[str, Any]:
        """
        비디오 생성 (Gemini에서는 지원하지 않음)

        Args:
            request: 검증된 비디오 생성 요청

        Returns:
            Dict: 표준화된 응답 데이터
        """
        raise AIRequestError("gemini", "Gemini는 비디오 생성을 지원하지 않습니다", 501)