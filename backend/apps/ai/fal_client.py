"""
fal.ai HTTP API: any-llm (chat), imagen4 (Google), flux-pro v1.1-ultra (FLUX).
참고: 00_docs/imagen4-preview.txt, 00_docs/flux-pro_v1.1-ultra.txt
OpenAI API: DALL-E 3 (image).
"""
import os
import requests
from .errors import FALError, OpenAIError

FAL_BASE = 'https://fal.run'
FAL_ANY_LLM = 'fal-ai/any-llm'
# Imagen 4 (Google): aspect_ratio "1:1"|"16:9"|"9:16"|"4:3"|"3:4", resolution "1K"|"2K", output_format png|jpeg|webp
FAL_IMAGEN4 = 'fal-ai/imagen4/preview'
# FLUX Pro v1.1 Ultra: aspect_ratio "21:9"|"16:9"|"4:3"|"3:2"|"1:1"|"2:3"|"3:4"|"9:16"|"9:21", output_format jpeg|png
FAL_FLUX_ULTRA = 'fal-ai/flux-pro/v1.1-ultra'


def _fal_headers():
    key = os.environ.get('FAL_KEY', '')
    if not key:
        raise FALError('FAL_KEY not set')
    return {'Authorization': f'Key {key}', 'Content-Type': 'application/json'}


def chat_completion(prompt: str, model: str = 'google/gemini-2.5-flash', system_prompt: str | None = None, temperature: float = 0.7, max_tokens: int | None = None) -> str:
    payload = {'prompt': prompt, 'model': model, 'temperature': temperature}
    if system_prompt:
        payload['system_prompt'] = system_prompt
    if max_tokens is not None:
        payload['max_tokens'] = max_tokens
    r = requests.post(f'{FAL_BASE}/{FAL_ANY_LLM}', headers=_fal_headers(), json=payload, timeout=120)
    r.raise_for_status()
    data = r.json()
    if 'output' not in data:
        raise FALError(data.get('error', 'No output'))
    return data['output']


def image_generation_fal(prompt: str, model: str = FAL_IMAGEN4, aspect_ratio: str = '1:1', num_images: int = 1) -> list[dict]:
    """
    fal.ai 이미지 생성.
    - Imagen 4: aspect_ratio "1:1"|"16:9"|"9:16"|"4:3"|"3:4", num_images 1~4
    - FLUX Pro v1.1 Ultra: aspect_ratio "21:9"|"16:9"|"4:3"|"3:2"|"1:1"|"2:3"|"3:4"|"9:16"|"9:21"
    """
    num_images = max(1, min(4, num_images))
    if 'imagen' in model.lower():
        # Imagen4 Preview: prompt, num_images, aspect_ratio, resolution(1K|2K), output_format(png|jpeg|webp)
        endpoint = FAL_IMAGEN4
        allowed_ratio = ('1:1', '16:9', '9:16', '4:3', '3:4')
        payload = {
            'prompt': prompt,
            'num_images': num_images,
            'aspect_ratio': aspect_ratio if aspect_ratio in allowed_ratio else '1:1',
            'resolution': '1K',
            'output_format': 'png',
        }
    else:
        # FLUX Pro v1.1 Ultra: prompt, num_images, aspect_ratio, output_format(jpeg|png)
        endpoint = FAL_FLUX_ULTRA
        allowed_ratio = ('21:9', '16:9', '4:3', '3:2', '1:1', '2:3', '3:4', '9:16', '9:21')
        payload = {
            'prompt': prompt,
            'num_images': num_images,
            'aspect_ratio': aspect_ratio if aspect_ratio in allowed_ratio else '16:9',
            'output_format': 'jpeg',
        }
    r = requests.post(f'{FAL_BASE}/{endpoint}', headers=_fal_headers(), json=payload, timeout=180)
    r.raise_for_status()
    data = r.json()
    images = data.get('images') or []
    return [{'url': img.get('url'), 'content_type': img.get('content_type'), 'file_name': img.get('file_name')} for img in images if img.get('url')]


def image_generation_openai(prompt: str, size: str = '1024x1024', num_images: int = 1) -> list[dict]:
    try:
        from openai import OpenAI
    except ImportError:
        raise OpenAIError('openai package not installed')
    key = os.environ.get('OPENAI_API_KEY', '')
    if not key:
        raise OpenAIError('OPENAI_API_KEY not set')
    client = OpenAI(api_key=key)
    resp = client.images.generate(model='dall-e-3', prompt=prompt, size=size, n=min(num_images, 1), response_format='url', quality='standard')
    return [{'url': img.url} for img in resp.data if getattr(img, 'url', None)]
