import { api } from './apiClient';
import type { JobStatus } from '@/types';

export const chatApi = {
  completeChat: (sessionId: number, prompt: string, model: string, systemPrompt?: string) =>
    api.post<{ task_id: string; job_id: number; message_id: number }>('/api/v1/chat/complete/', {
      session_id: sessionId,
      prompt,
      model,
      system_prompt: systemPrompt,
    }),
  completeImage: (sessionId: number, prompt: string, model: string, aspectRatio?: string) =>
    api.post<{ task_id: string; job_id: number }>('/api/v1/chat/image/', {
      session_id: sessionId,
      prompt,
      model,
      aspect_ratio: aspectRatio || '1:1',
    }),
  jobStatus: (taskId: string) => api.get<JobStatus>(`/api/v1/chat/job/${taskId}/`),
};
