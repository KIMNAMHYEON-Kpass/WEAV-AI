# WEAV AI OpenAI 클라이언트
# OpenAI Responses API 기반 텍스트/이미지/비디오 생성

import os
from typing import Dict, Any, Optional
from openai import OpenAI
from .schemas import TextGenerationRequest, ImageGenerationRequest, VideoGenerationRequest
from .errors import AIProviderError, AIRequestError, AIQuotaExceededError


class OpenAIClient:
    """OpenAI API 클라이언트"""

    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise AIProviderError('openai', 'OPENAI_API_KEY 환경변수가 설정되지 않았습니다')

        self.client = OpenAI(api_key=api_key)
        self.default_text_model = os.getenv('OPENAI_TEXT_MODEL', 'gpt-4o-mini')

    def generate_text(self, request: TextGenerationRequest) -> Dict[str, Any]:
        """
        텍스트 생성 (OpenAI Responses API 사용)

        Args:
            request: 검증된 텍스트 생성 요청

        Returns:
            Dict: 표준화된 응답 데이터
        """
        try:
            # 메시지 구성
            messages = []

            # 시스템 프롬프트 추가
            if request.system_prompt:
                messages.append({
                    "role": "system",
                    "content": request.system_prompt
                })

            # 사용자 입력 추가
            messages.append({
                "role": "user",
                "content": request.input_text
            })

            # API 호출
            response = self.client.chat.completions.create(
                model=self.default_text_model,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_output_tokens,
                # Responses API에서는 response_format을 사용할 수 있음
            )

            # 응답 데이터 표준화
            choice = response.choices[0]
            message = choice.message

            result = {
                "provider": "openai",
                "model": response.model,
                "text": message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "finish_reason": choice.finish_reason
            }

            return result

        except Exception as e:
            error_message = str(e)

            # 에러 타입에 따른 구분 처리
            if "insufficient_quota" in error_message.lower():
                raise AIQuotaExceededError("openai")
            elif "invalid_api_key" in error_message.lower():
                raise AIProviderError("openai", "API 키가 유효하지 않습니다")
            elif "model_not_found" in error_message.lower():
                raise AIRequestError("openai", f"모델 '{self.default_text_model}'을 찾을 수 없습니다", 400)
            else:
                raise AIRequestError("openai", f"텍스트 생성 실패: {error_message}", 500)

    def generate_image(self, request: ImageGenerationRequest) -> Dict[str, Any]:
        """
        이미지 생성 (DALL-E 사용)

        Args:
            request: 검증된 이미지 생성 요청

        Returns:
            Dict: 표준화된 응답 데이터
        """
        try:
            response = self.client.images.generate(
                model="dall-e-3",  # 최신 모델 사용
                prompt=request.prompt,
                size=request.size,
                quality=request.quality,
                n=1
            )

            # 응답 데이터 표준화
            image_data = response.data[0]
            result = {
                "provider": "openai",
                "model": "dall-e-3",
                "url": image_data.url,
                "revised_prompt": getattr(image_data, 'revised_prompt', None)
            }

            return result

        except Exception as e:
            error_message = str(e)

            if "insufficient_quota" in error_message.lower():
                raise AIQuotaExceededError("openai")
            else:
                raise AIRequestError("openai", f"이미지 생성 실패: {error_message}", 500)

    def generate_video(self, request: VideoGenerationRequest) -> Dict[str, Any]:
        """
        비디오 생성 (Sora 사용 - 추후 구현)

        Args:
            request: 검증된 비디오 생성 요청

        Returns:
            Dict: 표준화된 응답 데이터
        """
        # Sora API는 아직 공개되지 않았으므로 플레이스홀더
        raise AIRequestError("openai", "Sora 비디오 생성은 아직 지원되지 않습니다", 501)