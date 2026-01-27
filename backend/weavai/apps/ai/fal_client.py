# WEAV AI FAL.ai 클라이언트
# fal.run HTTP API 기반 텍스트/이미지/비디오 생성

import os
from typing import Dict, Any
import requests
from .schemas import TextGenerationRequest, ImageGenerationRequest, VideoGenerationRequest
from .errors import AIProviderError, AIRequestError, AIQuotaExceededError


class FalClient:
    """FAL.ai API 클라이언트"""

    def __init__(self):
        api_key = os.getenv('FAL_KEY')
        if not api_key:
            raise AIProviderError('fal', 'FAL_KEY 환경변수가 설정되지 않았습니다')

        self.api_key = api_key
        self.base_url = os.getenv('FAL_BASE_URL', 'https://fal.run').rstrip('/')
        self.text_endpoint = os.getenv('FAL_TEXT_ENDPOINT', 'fal-ai/any-llm').lstrip('/')
        self.default_text_model = os.getenv('FAL_TEXT_DEFAULT_MODEL', 'google/gemini-2.5-flash-lite')

        self.text_model_map = {
            'gpt-5.2-instant': 'openai/gpt-5-mini',
            'gpt-5-mini': 'openai/gpt-5-mini',
            'gpt-5-nano': 'openai/gpt-5-nano',
            'gpt-5-chat': 'openai/gpt-5-chat',
            'gpt-4o-mini': 'openai/gpt-4o-mini',
            'gpt-4o': 'openai/gpt-4o',
            'gemini-3-flash': 'google/gemini-2.5-flash-lite',
            'gemini-2.5-flash': 'google/gemini-2.5-flash',
            'gemini-2.5-pro': 'google/gemini-2.5-pro',
        }

        self.image_model_map = {
            'gpt-image-1.5': os.getenv('FAL_IMAGE_MODEL_GPT_IMAGE_15', 'fal-ai/flux-2'),
            'nano-banana': os.getenv('FAL_IMAGE_MODEL_NANO_BANANA', 'fal-ai/nano-banana-pro'),
        }

        self.video_model_map = {
            'sora': os.getenv('FAL_VIDEO_MODEL_SORA', 'fal-ai/sora-2'),
        }

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Key {self.api_key}",
            "Content-Type": "application/json",
        }

    def _post(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = requests.post(url, headers=self._headers(), json=payload, timeout=60)

        if response.status_code == 401:
            raise AIProviderError('fal', 'FAL API 키가 유효하지 않습니다', status_code=401)
        if response.status_code == 429:
            raise AIQuotaExceededError('fal')
        if response.status_code >= 400:
            raise AIRequestError('fal', f'FAL 요청 실패: {response.text}', response.status_code)

        try:
            return response.json()
        except Exception:
            raise AIRequestError('fal', 'FAL 응답을 JSON으로 파싱할 수 없습니다', 500)

    def _extract_image_url(self, data: Dict[str, Any]) -> str:
        if isinstance(data, dict):
            if isinstance(data.get('images'), list) and data['images']:
                first = data['images'][0]
                if isinstance(first, dict) and first.get('url'):
                    return first['url']
                if isinstance(first, str):
                    return first
            if isinstance(data.get('image'), dict) and data['image'].get('url'):
                return data['image']['url']
            if isinstance(data.get('urls'), list) and data['urls']:
                return data['urls'][0]
            if isinstance(data.get('output'), str) and data['output'].startswith('http'):
                return data['output']
        raise AIRequestError('fal', '이미지 URL을 찾을 수 없습니다', 500)

    def _extract_video_url(self, data: Dict[str, Any]) -> str:
        if isinstance(data, dict):
            if isinstance(data.get('videos'), list) and data['videos']:
                first = data['videos'][0]
                if isinstance(first, dict) and first.get('url'):
                    return first['url']
                if isinstance(first, str):
                    return first
            if isinstance(data.get('video'), dict) and data['video'].get('url'):
                return data['video']['url']
            if isinstance(data.get('urls'), list) and data['urls']:
                return data['urls'][0]
            if isinstance(data.get('output'), str) and data['output'].startswith('http'):
                return data['output']
        raise AIRequestError('fal', '비디오 URL을 찾을 수 없습니다', 500)

    def generate_text(self, request: TextGenerationRequest) -> Dict[str, Any]:
        model_id = (request.model_id or '').lower()
        fal_model = self.text_model_map.get(model_id, self.default_text_model)

        payload = {
            "prompt": request.input_text,
            "system_prompt": request.system_prompt,
            "temperature": request.temperature,
            "max_tokens": request.max_output_tokens,
            "model": fal_model,
        }
        # 불필요한 None 제거
        payload = {k: v for k, v in payload.items() if v is not None}

        data = self._post(self.text_endpoint, payload)
        output = data.get('output') or data.get('text')
        if not output:
            raise AIRequestError('fal', '텍스트 응답이 비어있습니다', 500)

        return {
            "provider": "fal",
            "model": fal_model,
            "text": output,
            "usage": data.get('usage'),
            "finish_reason": data.get('finish_reason'),
        }

    def generate_image(self, request: ImageGenerationRequest) -> Dict[str, Any]:
        model_id = (request.model_id or '').lower()
        endpoint = self.image_model_map.get(model_id)
        if not endpoint:
            raise AIRequestError('fal', f'지원하지 않는 이미지 모델: {request.model_id}', 400)

        payload = {
            "prompt": request.prompt,
        }
        data = self._post(endpoint, payload)
        url = self._extract_image_url(data)

        return {
            "provider": "fal",
            "model": endpoint,
            "url": url,
        }

    def generate_video(self, request: VideoGenerationRequest) -> Dict[str, Any]:
        model_id = (request.model_id or '').lower()
        endpoint = self.video_model_map.get(model_id)
        if not endpoint:
            raise AIRequestError('fal', f'지원하지 않는 비디오 모델: {request.model_id}', 400)

        payload = {
            "prompt": request.prompt,
        }
        data = self._post(endpoint, payload)
        url = self._extract_video_url(data)

        return {
            "provider": "fal",
            "model": endpoint,
            "url": url,
        }
