import { AIModel, Message } from "../../types";
import { VideoOptions } from "../../components/chat/VideoOptions";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import { MODELS } from "../../constants/models";

// 백엔드 API 클라이언트 사용
import { apiClient } from './apiClient';

// Google GenAI 직접 호출 제거됨 - 백엔드 Gateway 사용

// OpenAI 직접 호출 제거됨 - 백엔드 Gateway 사용

// sanitizeHistory 제거됨 - 백엔드에서 히스토리 처리


// --- Access Control ---
const checkAccess = (_modelId: string, user: any) => {
  if (!user) {
    throw new Error("로그인이 필요한 기능입니다.");
  }
  if (FEATURE_FLAGS.bypassMembership) return true;
  return true;
};

// --- Main Service Export ---
export const aiService = {
  /**
   * Plan Project Structure (백엔드 Gateway)
   */
  planProjectStructure: async (userGoal: string, user: any): Promise<{ projectName: string; steps: { title: string; modelId: string; systemInstruction: string }[] }> => {
    if (!user) throw new Error("로그인이 필요한 기능입니다.");

    const allowedModelIds = MODELS.map((m) => m.id).join(', ');
    const prompt = `
      You are an expert AI Project Manager. The user wants to achieve the following goal: "${userGoal}".
      
      Please design a project structure.
      
      **CRITICAL RULES:**
      1.  **Strict Model Selection:** You MUST ONLY use the Model IDs listed below. Do NOT invent new model IDs.
          - Allowed model IDs: ${allowedModelIds}
          
      2.  **Language:** The 'projectName' and 'title' (step names) MUST be in **Korean (한국어)**. The 'systemInstruction' should also be in Korean.
      
      3.  **Efficiency:** Create only the necessary steps to achieve the goal (Minimum 2, Maximum 5). Do NOT arbitrarily create 4 steps if 2 are enough. For simple requests (e.g., "Write a blog post"), 2 steps (Outline -> Writing) might be enough.

      Return ONLY raw JSON in the following format:
      {
        "projectName": "프로젝트 이름 (Korean)",
        "steps": [
          {
            "title": "단계 1: [작업명] (Korean)",
            "modelId": "[Exact Model ID from list above]",
            "systemInstruction": "[Persona and detailed instruction in Korean]"
          }
        ]
      }
    `;

    // 백엔드 Gateway 호출
    const result = await apiClient.post('/api/v1/chat/complete/', {
      provider: 'gemini',
      model_id: 'gemini-3-flash',
      input_text: prompt,
      system_prompt: 'You are an expert AI Project Manager. Always respond in valid JSON format only.',
      max_output_tokens: 2048
    }) as { text?: string };

    if (!result.text) throw new Error("Empty response from AI Planner");

    let text = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  },

  /**
   * Generate Video (백엔드 Jobs API — 비동기, 폴링)
   */
  generateVideo: async (model: AIModel, prompt: string, videoOptions: VideoOptions, user: any, signal?: AbortSignal): Promise<string | null> => {
    const jobData = {
      provider: model.provider || 'openai',
      model_id: model.id,
      arguments: {
        prompt,
        duration: videoOptions.duration,
        resolution: videoOptions.resolution,
        aspect_ratio: videoOptions.aspectRatio,
        style: videoOptions.style
      },
      store_result: true
    };

    const createRes = (await apiClient.post('/api/v1/jobs/', jobData)) as { id?: string };
    const jobId = createRes.id;
    if (!jobId) throw new Error('작업 ID를 받지 못했습니다.');

    const maxWaitMs = 10 * 60 * 1000;
    const startedAt = Date.now();
    const pollIntervalMs = 2000;
    while (true) {
      if (signal?.aborted) throw new Error('비디오 생성이 중단되었습니다.');
      if (Date.now() - startedAt > maxWaitMs) {
        throw new Error('비디오 생성 시간이 초과되었습니다.');
      }
      const detail = (await apiClient.get(`/api/v1/jobs/${jobId}/`, { signal })) as { status: string; result?: { url?: string; text?: string }; error?: string };
      if (detail.status === 'COMPLETED') {
        if (detail.result?.url) return detail.result.url;
        throw new Error('비디오 생성 결과를 받지 못했습니다.');
      }
      if (detail.status === 'FAILED') {
        throw new Error(detail.error || '비디오 생성에 실패했습니다.');
      }
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
  },

  // --- Helper Functions ---

  // Sora 2 직접 호출 제거됨 - generateVideo(Jobs API) 사용


  /**
   * Generate Image (백엔드 Jobs API — 비동기, 폴링)
   */
  generateImage: async (model: AIModel, prompt: string, user: any, signal?: AbortSignal): Promise<string | null> => {
    const jobData = {
      provider: model.provider || 'openai',
      model_id: model.id,
      arguments: { prompt },
      store_result: true
    };

    const createRes = (await apiClient.post('/api/v1/jobs/', jobData)) as { id?: string };
    const jobId = createRes.id;
    if (!jobId) throw new Error('작업 ID를 받지 못했습니다.');

    const maxWaitMs = 2 * 60 * 1000;
    const startedAt = Date.now();
    const pollIntervalMs = 1500;
    while (true) {
      if (signal?.aborted) throw new Error('이미지 생성이 중단되었습니다.');
      if (Date.now() - startedAt > maxWaitMs) {
        throw new Error('이미지 생성 시간이 초과되었습니다.');
      }
      const detail = (await apiClient.get(`/api/v1/jobs/${jobId}/`, { signal })) as { status: string; result?: { url?: string; text?: string }; error?: string };
      if (detail.status === 'COMPLETED') {
        if (detail.result?.url) return detail.result.url;
        throw new Error('이미지 생성 결과를 받지 못했습니다.');
      }
      if (detail.status === 'FAILED') {
        throw new Error(detail.error || '이미지 생성에 실패했습니다.');
      }
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
  },

  /**
   * Generate Text (백엔드 Gateway - 일반 POST 응답)
   * 스트리밍 없이 전체 응답을 한 번에 받아서 반환
   */
  generateTextStream: async function* (model: AIModel, prompt: string, history: Message[] = [], systemInstruction?: string, user?: any, signal?: AbortSignal) {
    try {
      checkAccess(model.id, user);
    } catch (e: any) {
      yield `\n[오류: ${e.message}]`;
      return;
    }

    try {
      // provider 결정
      let provider = 'openai';
      if (model.category === 'Gemini' || (model.id || '').toLowerCase().includes('gemini')) {
        provider = 'gemini';
      }

      // 히스토리 변환
      const historyArray = history
        .filter(msg => msg.type === 'text' && !msg.isStreaming && msg.content.trim() !== '')
        .map(msg => ({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.content
        }));

      // 백엔드 Gateway 호출
      const result = await apiClient.post('/api/v1/chat/complete/', {
        provider,
        model_id: model.id,
        input_text: prompt,
        system_prompt: systemInstruction,
        history: historyArray,
        temperature: 0.7,
        max_output_tokens: 2048
      }, { signal }) as { text?: string; error?: string };

      if (result.error) {
        yield `\n[오류: ${result.error}]`;
        return;
      }

      if (!result.text) {
        yield `\n[오류: 응답이 비어있습니다]`;
        return;
      }

      // 전체 텍스트를 한 글자씩 yield (UX 유지)
      // TODO: 향후 백엔드 SSE 스트리밍 지원 시 실제 스트리밍으로 변경
      for (const char of result.text) {
        if (signal?.aborted) break;
        yield char;
        // 약간의 딜레이로 자연스러운 타이핑 효과
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error: any) {
      if (signal?.aborted) return;
      console.error("Text Generation Error:", error);
      const message = error?.message || "API Error";
      yield `\n[오류 발생: ${message}]`;
    }
  }
};
