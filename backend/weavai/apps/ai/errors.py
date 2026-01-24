# WEAV AI AI 서비스 에러 클래스
# AI API 호출 시 발생하는 예외들

from typing import Optional


class AIServiceError(Exception):
    """AI 서비스 기본 에러"""

    def __init__(self, message: str, provider: str = None, status_code: int = 500, details: dict = None):
        super().__init__(message)
        self.provider = provider
        self.status_code = status_code
        self.details = details or {}


class AIProviderError(AIServiceError):
    """AI 제공자 관련 에러 (API 키 없음, 잘못된 설정 등)"""

    def __init__(self, provider: str, message: str):
        super().__init__(
            f"{provider.upper()} API 오류: {message}",
            provider=provider,
            status_code=503  # Service Unavailable
        )


class AIRequestError(AIServiceError):
    """AI API 요청 에러 (잘못된 파라미터, 타임아웃 등)"""

    def __init__(self, provider: str, message: str, status_code: int = 400):
        super().__init__(
            f"{provider.upper()} 요청 오류: {message}",
            provider=provider,
            status_code=status_code
        )


class AIQuotaExceededError(AIServiceError):
    """AI API 할당량 초과 에러"""

    def __init__(self, provider: str):
        super().__init__(
            f"{provider.upper()} API 할당량이 초과되었습니다",
            provider=provider,
            status_code=429  # Too Many Requests
        )


class AIModelNotAvailableError(AIServiceError):
    """AI 모델 사용 불가 에러"""

    def __init__(self, provider: str, model: str):
        super().__init__(
            f"{provider.upper()} 모델 '{model}'을 사용할 수 없습니다",
            provider=provider,
            status_code=400
        )