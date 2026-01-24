# WEAV AI Payments 앱 Celery 작업
# PortOne 웹훅 수신 시 결제 조회 API로 최종 확정 (complete 누락 자동 복구)

import logging
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from .models import PaymentAttempt
from .portone_client import get_payment

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def verify_and_activate_membership(self, payment_id: str) -> None:
    """
    결제 조회 API로 최종 확정 후 멤버십 반영.
    웹훅 수신 시 enqueue되어 complete 누락을 자동 복구.
    
    Args:
        payment_id: PaymentAttempt.id (UUID)
    """
    try:
        attempt = PaymentAttempt.objects.get(id=payment_id)
    except PaymentAttempt.DoesNotExist:
        logger.warning(f"verify_and_activate_membership: PaymentAttempt not found paymentId={payment_id}")
        return
    
    # 이미 paid면 멱등
    if attempt.status == "paid":
        logger.info(f"verify_and_activate_membership: already paid paymentId={payment_id}")
        return
    
    api_secret = getattr(settings, "PORTONE_API_SECRET", "") or ""
    if not api_secret:
        logger.error("verify_and_activate_membership: PORTONE_API_SECRET not set")
        return
    
    # PortOne 결제 조회 및 검증 (complete와 동일 로직)
    raw = get_payment(api_secret, payment_id)
    if not raw:
        logger.warning(f"verify_and_activate_membership: get_payment failed paymentId={payment_id}, retrying...")
        raise self.retry(exc=Exception("PortOne API 조회 실패"))
    
    # 응답 구조 처리 (complete와 동일)
    if isinstance(raw, dict) and "payment" in raw:
        pay = raw["payment"]
    elif isinstance(raw, dict) and "payments" in raw:
        payments_list = raw["payments"]
        if not payments_list or len(payments_list) == 0:
            logger.warning(f"verify_and_activate_membership: no payment found paymentId={payment_id}")
            return
        pay = payments_list[0]
    elif isinstance(raw, dict) and ("status" in raw or "totalAmount" in raw or "amount" in raw):
        pay = raw
    else:
        logger.error(f"verify_and_activate_membership: unexpected response structure paymentId={payment_id}")
        return
    
    po_status = (pay.get("status") or "").upper()
    amount = int(pay.get("totalAmount") or pay.get("amount") or 0)
    currency = (pay.get("currency") or pay.get("currencyCode") or "").strip().upper() or "KRW"
    
    if po_status != "PAID" and po_status != "VIRTUAL_ACCOUNT_ISSUED":
        logger.info(f"verify_and_activate_membership: status not PAID paymentId={payment_id} status={po_status}")
        attempt.status = "failed"
        attempt.save(update_fields=["status", "updated_at"])
        return
    
    if amount != attempt.amount or (currency and currency != attempt.currency):
        logger.warning(
            f"verify_and_activate_membership: amount/currency mismatch "
            f"paymentId={payment_id} expected={attempt.amount} {attempt.currency} got={amount} {currency}"
        )
        return
    
    # 멤버십 반영 (30일) - complete와 동일 로직
    expires_at = timezone.now() + timezone.timedelta(days=30)
    attempt.status = "paid"
    attempt.portone_payment_id = pay.get("id") or pay.get("paymentId") or ""
    attempt.save(update_fields=["status", "portone_payment_id", "updated_at"])
    
    user = attempt.user
    user.membership_type = attempt.plan
    user.membership_status = "active"
    user.membership_expires_at = expires_at
    user.save(update_fields=["membership_type", "membership_status", "membership_expires_at"])
    
    logger.info(
        f"verify_and_activate_membership: 멤버십 활성화 완료 "
        f"user={user.username} plan={attempt.plan} paymentId={payment_id}"
    )
