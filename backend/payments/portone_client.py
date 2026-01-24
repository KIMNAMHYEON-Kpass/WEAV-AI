# PortOne REST API 클라이언트
# 결제 조회/검증용 (서버 전용)

import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

PORTONE_API_BASE = "https://api.portone.io"


def get_payment(api_secret: str, payment_id: str) -> dict | None:
    """
    결제 단건 조회 (검증용).
    PortOne V2: GET /payments/{paymentId}
    
    Args:
        api_secret: PortOne API Secret
        payment_id: 결제 건 ID (우리가 부여한 UUID)
    
    Returns:
        결제 정보 dict 또는 None (실패 시)
    """
    url = f"{PORTONE_API_BASE}/payments/{payment_id}"
    req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "Authorization": f"PortOne {api_secret}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read().decode())
            return data
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if hasattr(e, 'read') else str(e)
        logger.warning(f"PortOne get_payment HTTP error: {e.code} {error_body}")
        return None
    except Exception as e:
        logger.error(f"PortOne get_payment error: {e}", exc_info=True)
        return None
