import type { ChatModel, ImageModel } from '@/types';

export const CHAT_MODELS: ChatModel[] = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-5-chat', name: 'GPT-5 Chat', provider: 'OpenAI' },
];

export const IMAGE_MODELS: ImageModel[] = [
  { id: 'fal-ai/imagen4/preview', name: 'Imagen 4 (Google)', provider: 'Google' },
  { id: 'openai/dall-e-3', name: 'DALL-E 3 (OpenAI)', provider: 'OpenAI' },
  { id: 'fal-ai/flux-pro/v1.1-ultra', name: 'FLUX Pro v1.1 Ultra', provider: 'fal.ai' },
];
