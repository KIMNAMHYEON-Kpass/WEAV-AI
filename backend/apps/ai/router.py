from .fal_client import chat_completion, image_generation_fal, image_generation_openai
from .errors import AIError, OpenAIError

CHAT_MODELS = [
    'google/gemini-2.5-flash',
    'google/gemini-2.5-pro',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'openai/gpt-5-chat',
]

IMAGE_MODEL_GOOGLE = 'fal-ai/imagen4/preview'
IMAGE_MODEL_OPENAI = 'openai/dall-e-3'
IMAGE_MODEL_FLUX = 'fal-ai/flux-pro/v1.1-ultra'


def run_chat(prompt: str, model: str = 'google/gemini-2.5-flash', system_prompt: str | None = None, temperature: float = 0.7, max_tokens: int | None = None) -> str:
    return chat_completion(prompt, model=model, system_prompt=system_prompt, temperature=temperature, max_tokens=max_tokens)


def run_image(prompt: str, model: str = IMAGE_MODEL_GOOGLE, aspect_ratio: str = '1:1', num_images: int = 1) -> list[dict]:
    if model == IMAGE_MODEL_OPENAI or 'dall-e' in model.lower():
        return image_generation_openai(prompt, size='1024x1024', num_images=num_images)
    return image_generation_fal(prompt, model=model, aspect_ratio=aspect_ratio, num_images=num_images)
