/**
 * 백엔드 API 클라이언트
 * JWT 토큰 관리 및 API 요청 처리
 */

const API_BASE_URL = import.meta.env.DEV 
    ? 'http://localhost:8080' 
    : (import.meta.env.VITE_API_BASE_URL || 'https://weavai.hub');

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
    
    /**
     * 401 에러 처리 (토큰 갱신 후 재시도)
     */
    private async handle401Error<T>(
        url: string,
        options: RequestInit,
        retry: boolean = true
    ): Promise<T> {
        // 토큰 갱신 시도
        const newToken = await tokenManager.refreshAccessToken();
        
        if (newToken && retry) {
            // 갱신된 토큰으로 재시도
            const newHeaders = await this.getAuthHeaders();
            const newOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    ...newHeaders,
                },
            };
            
            const response = await fetch(url, newOptions);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return response.json();
        }
        
        // 갱신 실패 시 에러
        tokenManager.clearTokens();
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }
    
    /**
     * GET 요청
     */
    async get<T>(endpoint: string): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const headers = await this.getAuthHeaders();
        
        const response = await fetch(url, {
            method: 'GET',
            headers,
        });
        
        if (response.status === 401) {
            return this.handle401Error<T>(url, { method: 'GET', headers });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        return response.json();
    }
    
    /**
     * POST 요청
     */
    async post<T>(endpoint: string, data?: any): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const headers = await this.getAuthHeaders();
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: data ? JSON.stringify(data) : undefined,
        });
        
        if (response.status === 401) {
            return this.handle401Error<T>(url, { method: 'POST', headers, body: data ? JSON.stringify(data) : undefined });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        return response.json();
    }
    
    /**
     * PUT 요청
     */
    async put<T>(endpoint: string, data?: any): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const headers = await this.getAuthHeaders();
        
        const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: data ? JSON.stringify(data) : undefined,
        });
        
        if (response.status === 401) {
            return this.handle401Error<T>(url, { method: 'PUT', headers, body: data ? JSON.stringify(data) : undefined });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        return response.json();
    }
    
    /**
     * DELETE 요청
     */
    async delete<T>(endpoint: string): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const headers = await this.getAuthHeaders();
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers,
        });
        
        if (response.status === 401) {
            return this.handle401Error<T>(url, { method: 'DELETE', headers });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        return response.json();
    }
}

export const apiClient = new APIClient(API_BASE_URL);
