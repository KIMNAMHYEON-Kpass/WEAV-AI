"""
WEAV AI Billing API
PortOne 일회 결제(30일권) + (옵션) Stripe 구독
"""

import hashlib
import hmac
import json
import base64
import logging
import uuid
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from users.models import User
from .models import PaymentAttempt
from .portone_client import get_payment
from .tasks import verify_and_activate_membership

logger = logging.getLogger(__name__)

# ---------- 플랜 (일회 30일권) ----------
PLANS = {
    "standard": {
        "name": "스탠다드 30일",
        "amount": 9900,
        "currency": "KRW",
        "features": [
            "모든 AI 모델 사용 가능",
            "무제한 텍스트 생성",
            "30일간 유효",
        ],
    },
    "premium": {
        "name": "프리미엄 30일",
        "amount": 19900,
        "currency": "KRW",
        "features": [
            "모든 AI 모델 사용 가능",
            "무제한 텍스트/이미지/비디오",
            "30일간 유효",
            "우선 처리",
        ],
    },
}


def _use_portone():
    return getattr(settings, "USE_PORTONE", True)


# ---------- PortOne: prepare ----------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def payment_prepare(request):
    """
    결제 준비. PaymentAttempt 생성 후 SDK용 파라미터 반환.

    Body: { "plan": "standard" | "premium" }
    Response: { "paymentId", "orderName", "totalAmount", "currency", "payMethod" }
    """
    if not _use_portone():
        return Response(
            {"error": "PortOne 결제가 비활성화되어 있습니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    plan_id = (request.data.get("plan") or "").strip().lower()
    if plan_id not in PLANS:
        return Response(
            {"error": "유효한 plan이 필요합니다. (standard | premium)"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    plan = PLANS[plan_id]
    user = request.user
    # paymentId: UUID 사용 (안전한 형식: [A-Za-z0-9-]{36})
    # PortOne은 가맹점 주문 고유 번호로 사용하며, 완료된 paymentId로 재시도 시 실패
    payment_id = str(uuid.uuid4())

    attempt = PaymentAttempt.objects.create(
        id=payment_id,
        user=user,
        plan=plan_id,
        amount=plan["amount"],
        currency=plan["currency"],
        status="pending",
    )

    order_name = f"WEAV-AI {plan['name']}"

    return Response(
        {
            "paymentId": payment_id,
            "orderName": order_name,
            "totalAmount": plan["amount"],
            "currency": plan["currency"],
            "payMethod": "CARD",
        },
        status=status.HTTP_200_OK,
    )


# ---------- PortOne: complete (서버 검증) ----------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def payment_complete(request):
    """
    결제 완료 검증. PortOne에 조회 후 금액/통화 확인, 멤버십 반영.

    Body: { "paymentId": "uuid" }
    """
    if not _use_portone():
        return Response(
            {"error": "PortOne 결제가 비활성화되어 있습니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    payment_id = (request.data.get("paymentId") or "").strip()
    if not payment_id:
        return Response(
            {"error": "paymentId가 필요합니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    api_secret = getattr(settings, "PORTONE_API_SECRET", "") or ""
    if not api_secret:
        logger.error("PORTONE_API_SECRET 미설정")
        return Response(
            {"error": "결제 설정 오류입니다."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        attempt = PaymentAttempt.objects.get(id=payment_id, user=request.user)
    except PaymentAttempt.DoesNotExist:
        return Response(
            {"error": "해당 결제 건을 찾을 수 없거나 권한이 없습니다."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if attempt.status == "paid":
        return Response(
            {"ok": True, "message": "이미 처리된 결제입니다.", "already_completed": True},
            status=status.HTTP_200_OK,
        )

    if attempt.status != "pending":
        return Response(
            {"error": f"처리할 수 없는 결제 상태입니다. (status={attempt.status})"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # PortOne 결제 조회 및 검증 (최종 판정)
    # GET /payments/{paymentId} 응답: 단건 조회는 직접 결제 객체 반환 또는 { "payment": {...} } 형식
    raw = get_payment(api_secret, payment_id)
    if not raw:
        return Response(
            {"error": "결제 확인에 실패했습니다. 잠시 후 다시 시도해 주세요."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    # 응답 구조 처리: 직접 결제 객체 또는 { "payment": {...} } 또는 { "payments": [ {...} ] }
    if isinstance(raw, dict) and "payment" in raw:
        pay = raw["payment"]
    elif isinstance(raw, dict) and "payments" in raw:
        payments_list = raw["payments"]
        if not payments_list or len(payments_list) == 0:
            return Response(
                {"error": "결제 정보를 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )
        pay = payments_list[0]
    elif isinstance(raw, dict) and ("status" in raw or "totalAmount" in raw or "amount" in raw):
        # 직접 결제 객체인 경우
        pay = raw
    else:
        logger.error(f"PortOne get_payment: unexpected response structure: {raw}")
        return Response(
            {"error": "결제 정보 형식이 올바르지 않습니다."},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    po_status = (pay.get("status") or "").upper()
    amount = int(pay.get("totalAmount") or pay.get("amount") or 0)
    currency = (pay.get("currency") or pay.get("currencyCode") or "").strip().upper() or "KRW"

    if po_status != "PAID" and po_status != "VIRTUAL_ACCOUNT_ISSUED":
        logger.warning(f"PortOne status not PAID: paymentId={payment_id}, status={po_status}")
        attempt.status = "failed"
        attempt.save(update_fields=["status", "updated_at"])
        return Response(
            {"error": "결제가 완료되지 않았습니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if amount != attempt.amount or (currency and currency != attempt.currency):
        logger.warning(f"Amount/currency mismatch: expected {attempt.amount} {attempt.currency}, got {amount} {currency}")
        return Response(
            {"error": "결제 금액이 일치하지 않습니다."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 멤버십 반영 (30일)
    expires_at = timezone.now() + timezone.timedelta(days=30)
    attempt.status = "paid"
    attempt.portone_payment_id = pay.get("id") or pay.get("paymentId") or ""
    attempt.save(update_fields=["status", "portone_payment_id", "updated_at"])

    user = attempt.user
    user.membership_type = attempt.plan
    user.membership_status = "active"
    user.membership_expires_at = expires_at
    user.save(update_fields=["membership_type", "membership_status", "membership_expires_at"])

    logger.info(f"결제 완료 및 멤버십 반영: user={user.username} plan={attempt.plan} paymentId={payment_id}")

    return Response(
        {"ok": True, "message": "결제가 완료되었습니다.", "already_completed": False},
        status=status.HTTP_200_OK,
    )


# ---------- PortOne: webhook (Standard Webhooks 규격) ----------
def _verify_portone_webhook(
    payload_raw: bytes, webhook_id: str, webhook_timestamp: str, webhook_signature: str, secret: str
) -> bool:
    """
    PortOne Standard Webhooks 서명 검증.
    
    Standard Webhooks 규격:
    - signed_payload = "{webhook_id}.{webhook_timestamp}.{payload_string}"
    - signature = HMAC-SHA256(signed_payload, secret) -> Base64
    - webhook-signature 헤더: "v1,{base64_signature}" (예: "v1,aW52...=")
    """
    if not secret or not webhook_id or not webhook_timestamp or not webhook_signature:
        return False
    
    # 타임스탬프 검증 (5분 이내)
    try:
        timestamp = int(webhook_timestamp)
        current_time = int(timezone.now().timestamp())
        if abs(current_time - timestamp) > 300:  # 5분
            logger.warning(f"PortOne webhook: timestamp too old/too new (diff={abs(current_time - timestamp)}s)")
            return False
    except (ValueError, TypeError):
        logger.warning("PortOne webhook: invalid timestamp")
        return False
    
    # 서명 검증
    payload_str = payload_raw.decode("utf-8")
    signed_payload = f"{webhook_id}.{webhook_timestamp}.{payload_str}"
    
    # webhook-signature: "v1,{base64_signature}" 형식 (Base64 문자열)
    if "," in webhook_signature:
        _, received_sig = webhook_signature.split(",", 1)
    else:
        received_sig = webhook_signature
    
    # HMAC-SHA256 -> Base64 인코딩
    expected_sig = base64.b64encode(
        hmac.new(secret.encode(), signed_payload.encode(), hashlib.sha256).digest()
    ).decode()
    
    return hmac.compare_digest(expected_sig, received_sig)


@csrf_exempt
@require_http_methods(["POST"])
def portone_webhook(request):
    """
    PortOne 웹훅 (Standard Webhooks 규격).
    서명 검증 후 이벤트 처리. 웹훅은 '신호'로만 사용하고, 최종 판정은 complete에서 조회 API로 확정.
    
    PortOne V2 웹훅: application/json만 지원 (2024-04-25 이후)
    """
    # Content-Type 검증
    content_type = request.META.get("CONTENT_TYPE", "").lower()
    if "application/json" not in content_type:
        logger.warning(f"PortOne webhook: invalid Content-Type: {content_type}")
        return HttpResponse(status=400)
    
    payload_raw = request.body
    
    # Standard Webhooks 헤더 추출
    webhook_id = (request.META.get("HTTP_WEBHOOK_ID") or "").strip()
    webhook_timestamp = (request.META.get("HTTP_WEBHOOK_TIMESTAMP") or "").strip()
    webhook_signature = (request.META.get("HTTP_WEBHOOK_SIGNATURE") or "").strip()
    secret = getattr(settings, "PORTONE_WEBHOOK_SECRET", "") or ""
    
    if not _verify_portone_webhook(payload_raw, webhook_id, webhook_timestamp, webhook_signature, secret):
        logger.error("PortOne webhook: signature verification failed")
        return HttpResponse(status=400)

    logger.info("PortOne webhook: signature verification success")

    try:
        data = json.loads(payload_raw.decode("utf-8"))
    except Exception as e:
        logger.error(f"PortOne webhook: invalid JSON {e}")
        return HttpResponse(status=400)

    # 이벤트 타입/결제 ID 등은 PortOne 웹훅 스키마에 맞게 추출
    payment_id = data.get("paymentId") or data.get("merchantOrderRef") or data.get("merchant_uid")
    if not payment_id:
        logger.warning("PortOne webhook: no paymentId/merchantOrderRef")
        return HttpResponse(status=200)  # 200으로 응답해 재전송 억제

    try:
        attempt = PaymentAttempt.objects.get(id=payment_id)
    except PaymentAttempt.DoesNotExist:
        logger.warning(f"PortOne webhook: PaymentAttempt not found paymentId={payment_id}")
        return HttpResponse(status=200)

    # 이미 paid면 멱등 (동일 이벤트 재전송 시 스킵)
    if attempt.status == "paid":
        logger.info(f"PortOne webhook: already processed (paymentId={payment_id}), skipping")
        return HttpResponse(status=200)

    # 웹훅은 '신호'로만 사용: Celery task를 enqueue하여 결제 조회 API로 최종 확정
    # (complete 누락 시 자동 복구)
    status_val = (data.get("status") or "").upper()
    if status_val in ("PAID", "VIRTUAL_ACCOUNT_ISSUED"):
        # 상태만 업데이트
        attempt.status = "paid"
        attempt.save(update_fields=["status", "updated_at"])
        # Celery task enqueue: 결제 조회 API로 최종 확정 및 멤버십 반영
        verify_and_activate_membership.delay(payment_id)
        logger.info(f"PortOne webhook: payment marked as paid, task enqueued paymentId={payment_id}")
    elif status_val in ("CANCELLED", "FAILED", "REFUNDED"):
        attempt.status = "failed" if status_val == "FAILED" else "canceled"
        attempt.save(update_fields=["status", "updated_at"])
        logger.info(f"PortOne webhook: payment {status_val.lower()} (paymentId={payment_id})")

    return HttpResponse(status=200)


# ---------- 플랜 목록 (공통) ----------
@api_view(["GET"])
@permission_classes([AllowAny])
def get_plans(request):
    """가격 플랜 목록 (30일권)."""
    plans = [
        {
            "id": k,
            "name": v["name"],
            "amount": v["amount"],
            "currency": v["currency"],
            "interval": "onetime",
            "features": v["features"],
        }
        for k, v in PLANS.items()
    ]
    return Response({"plans": plans}, status=status.HTTP_200_OK)


# ---------- Stripe (feature flag 로 비활성화) ----------
def _use_stripe():
    return getattr(settings, "USE_STRIPE", False)


if _use_stripe():
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    @api_view(["POST"])
    @permission_classes([IsAuthenticated])
    def create_checkout_session(request):
        """Stripe Checkout Session 생성 (USE_STRIPE=True 시에만 사용)."""
        try:
            price_id = request.data.get("price_id")
            if not price_id:
                return Response({"error": "price_id가 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)
            user = request.user
            if not user.stripe_customer_id:
                customer = stripe.Customer.create(email=user.email, metadata={"user_id": str(user.id)})
                user.stripe_customer_id = customer.id
                user.save(update_fields=["stripe_customer_id"])
            session = stripe.checkout.Session.create(
                customer=user.stripe_customer_id,
                payment_method_types=["card"],
                line_items=[{"price": price_id, "quantity": 1}],
                mode="subscription",
                success_url=request.data.get("success_url") or f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=request.data.get("cancel_url") or f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/pricing",
                metadata={"user_id": str(user.id)},
                subscription_data={"metadata": {"user_id": str(user.id)}},
            )
            return Response({"checkout_url": session.url, "session_id": session.id}, status=status.HTTP_200_OK)
        except stripe.error.StripeError as e:
            logger.error(f"Stripe Error: {e}")
            return Response({"error": f"Stripe 오류: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"create_checkout_session: {e}", exc_info=True)
            return Response({"error": "서버 오류가 발생했습니다."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @csrf_exempt
    @require_http_methods(["POST"])
    def stripe_webhook(request):
        """Stripe 웹훅 (USE_STRIPE=True 시에만 등록)."""
        payload = request.body
        sig = request.META.get("HTTP_STRIPE_SIGNATURE")
        if not sig:
            return HttpResponse(status=400)
        try:
            event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
        except Exception as e:
            logger.error(f"Stripe webhook verify: {e}")
            return HttpResponse(status=400)
        # 기존 핸들러 호출은 생략 (구독 로직). 필요 시 이전 handle_* 함수 복원
        return HttpResponse(status=200)
