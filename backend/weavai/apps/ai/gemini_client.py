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
        이미지 생성 (Gemini 2.5 Flash Image - Nano Banana)

        Args:
            request: 검증된 이미지 생성 요청

        Returns:
            Dict: 표준화된 응답 데이터 (url 포함)
        """
        try:
            import io
            from PIL import Image
            from weavai.apps.storage.s3 import S3Storage

            # 모델 ID 매핑 (프론트 모델 ID → Gemini API 모델명)
            model_mapping = {
                'nano-banana': 'gemini-2.5-flash-image',
                'gemini-2.5-flash-image': 'gemini-2.5-flash-image',
            }
            model_id = getattr(request, 'model_id', None) if hasattr(request, 'model_id') else None
            model_name = model_mapping.get(model_id, 'gemini-2.5-flash-image')

            # Gemini 이미지 생성 API 호출
            response = self.client.models.generate_content(
                model=model_name,
                contents=[request.prompt],
            )

            # 응답에서 이미지 데이터 추출
            image_data = None
            import base64
            
            for part in response.parts:
                if hasattr(part, 'inline_data') and part.inline_data is not None:
                    # inline_data에서 직접 바이트 데이터 추출
                    if hasattr(part.inline_data, 'data'):
                        data = part.inline_data.data
                        # Base64 인코딩된 문자열인 경우
                        if isinstance(data, str):
                            try:
                                image_data = base64.b64decode(data)
                            except Exception:
                                # 이미 바이트인 경우 그대로 사용
                                image_data = data.encode('utf-8') if isinstance(data, str) else data
                        # 이미 바이트인 경우
                        elif isinstance(data, bytes):
                            image_data = data
                        else:
                            # 다른 형식인 경우 PIL로 변환 시도
                            try:
                                from PIL import Image
                                pil_image = part.as_image()
                                img_buffer = io.BytesIO()
                                pil_image.save(img_buffer, format='PNG')
                                image_data = img_buffer.getvalue()
                            except (ImportError, AttributeError):
                                raise AIRequestError("gemini", "이미지 데이터를 파싱할 수 없습니다. Pillow가 필요할 수 있습니다.", 500)
                    # as_image() 메서드가 있는 경우 (Pillow 사용)
                    elif hasattr(part, 'as_image'):
                        try:
                            from PIL import Image
                            pil_image = part.as_image()
                            img_buffer = io.BytesIO()
                            pil_image.save(img_buffer, format='PNG')
                            image_data = img_buffer.getvalue()
                        except ImportError:
                            raise AIRequestError("gemini", "Pillow가 설치되지 않았습니다. 이미지 처리를 위해 Pillow가 필요합니다.", 500)
                    break

            if not image_data:
                raise AIRequestError("gemini", "이미지 데이터를 받지 못했습니다. 응답에 이미지가 포함되어 있지 않습니다.", 500)

            # MinIO에 업로드
            storage = S3Storage()
            import uuid
            s3_key = f"jobs/gemini-images/{uuid.uuid4()}.png"
            
            storage.upload_file(
                file_content=image_data,
                key=s3_key,
                content_type='image/png'
            )

            # Presigned URL 생성
            presigned_url = storage.generate_presigned_url(s3_key)

            result = {
                "provider": "gemini",
                "model": model_name,
                "url": presigned_url,
                "mime_type": "image/png",
                "size_bytes": len(image_data),
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
                raise AIRequestError("gemini", f"모델 '{model_name}'을 찾을 수 없습니다", 400)
            elif isinstance(e, (AIProviderError, AIRequestError, AIQuotaExceededError)):
                raise  # 이미 커스텀 에러인 경우 그대로 전파
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