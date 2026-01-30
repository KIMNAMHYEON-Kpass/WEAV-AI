class AIError(Exception):
    """Base for AI-related errors."""
    pass


class FALError(AIError):
    """fal.ai API error."""
    pass


class OpenAIError(AIError):
    """OpenAI API error."""
    pass
