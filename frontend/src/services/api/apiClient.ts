/**
 * 백엔드 API 클라이언트
 * JWT 토큰 관리 및 API 요청 처리
 */

const API_BASE_URL = import.meta.env.DEV
    ? (import.meta.env.VITE_API_BASE_URL || '')
    : '';

// JWT 토큰 저장 키
const TOKEN_KEY = 'weav_jwt_access_token';
const REFRESH_TOKEN_KEY = 'weav_jwt_refresh_token';

/**
 * JWT 토큰 관리
 */
export const tokenManager = {
    getAccessToken: (): string | null => {
        return localStorage.getItem(TOKEN_KEY);
    },
    
    setAccessToken: (token: string): void => {
        localStorage.setItem(TOKEN_KEY, token);
    },
    
    getRefreshToken: (): string | null => {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },
    
    setRefreshToken: (token: string): void => {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    },
    
    clearTokens: (): void => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
    
    /**
     * 토큰 갱신
     */
    async refreshAccessToken(): Promise<string | null> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return null;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });
            
            if (!response.ok) {
                this.clearTokens();
                return null;
            }
            
            const data = await response.json();
            this.setAccessToken(data.access);
            if (data.refresh) {
                this.setRefreshToken(data.refresh);
            }
            
            return data.access;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearTokens();
            return null;
        }
    }
};

export class APIError extends Error {
    status: number;
    data?: unknown;
    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

/**
 * API 요청 클라이언트
 */
class APIClient {
    private baseURL: string;
    
    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }
    
    /**
     * 인증 헤더 가져오기
     */
    private async getAuthHeaders(): Promise<HeadersInit> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        let accessToken = tokenManager.getAccessToken();
        
        // 토큰이 없으면 갱신 시도
        if (!accessToken) {
            accessToken = await tokenManager.refreshAccessToken();
        }
        
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        return headers;
    }

    private async parseError(response: Response): Promise<{ message: string; data?: unknown }> {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                const data = await response.json();
                const message =
                    (data && (data.detail || data.error || data.message)) ||
                    `API Error: ${response.status}`;
                return { message, data };
            } catch (e) {
                return { message: `API Error: ${response.status}` };
            }
        }
        const text = await response.text().catch(() => '');
        return { message: text || `API Error: ${response.status}` };
    }
    
    private async request<T>(
        method: string,
        endpoint: string,
        data?: any,
        options?: RequestInit,
        retry: boolean = true
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const headers = await this.getAuthHeaders();
        const mergedOptions: RequestInit = {
            method,
            headers: {
                ...headers,
                ...(options?.headers || {}),
            },
            body: data ? JSON.stringify(data) : undefined,
            signal: options?.signal,
        };
        
        const response = await fetch(url, mergedOptions);
        
        if (response.status === 401 && retry) {
            const newToken = await tokenManager.refreshAccessToken();
            if (newToken) {
                const newHeaders = await this.getAuthHeaders();
                const retryOptions: RequestInit = {
                    ...mergedOptions,
                    headers: {
                        ...(mergedOptions.headers || {}),
                        ...newHeaders,
                    },
                };
                const retryResponse = await fetch(url, retryOptions);
                if (!retryResponse.ok) {
                    const { message, data } = await this.parseError(retryResponse);
                    throw new APIError(message, retryResponse.status, data);
                }
                return retryResponse.json();
            }
            tokenManager.clearTokens();
            throw new APIError('인증이 만료되었습니다. 다시 로그인해주세요.', 401);
        }
        
        if (!response.ok) {
            const { message, data } = await this.parseError(response);
            throw new APIError(message, response.status, data);
        }
        
        return response.json();
    }
    
    /**
     * GET 요청
     */
    async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return this.request<T>('GET', endpoint, undefined, options);
    }
    
    /**
     * POST 요청
     */
    async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
        return this.request<T>('POST', endpoint, data, options);
    }
    
    /**
     * PUT 요청
     */
    async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
        return this.request<T>('PUT', endpoint, data, options);
    }
    
    /**
     * DELETE 요청
     */
    async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return this.request<T>('DELETE', endpoint, undefined, options);
    }
}

export { API_BASE_URL };
export const apiClient = new APIClient(API_BASE_URL);
