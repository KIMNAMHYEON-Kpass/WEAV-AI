import { AIModel } from '../types';

export const MODELS: AIModel[] = [
  // GPT Series
  { id: 'gpt-5.2-instant', name: 'ChatGPT-5.2 Instant', category: 'GPT', apiModelName: 'openai/gpt-5-mini', provider: 'fal' },

  // Gemini Series
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash Preview', category: 'Gemini', apiModelName: 'google/gemini-2.5-flash-lite', provider: 'fal' },

  // Image Series
  { id: 'gpt-image-1.5', name: 'GPT Image 1.5', category: 'Image', apiModelName: 'fal-ai/flux-2', provider: 'fal', isImage: true },
  { id: 'nano-banana', name: 'Nano Banana (Gemini)', category: 'Image', apiModelName: 'fal-ai/nano-banana-pro', provider: 'fal', isImage: true },

  // Video Series
  { id: 'sora', name: 'Sora 2 (Beta)', category: 'Video', apiModelName: 'fal-ai/sora-2', provider: 'fal', isVideo: true },
];
