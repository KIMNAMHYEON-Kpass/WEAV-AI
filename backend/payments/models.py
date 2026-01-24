# WEAV AI Payments 앱 모델
# PortOne 일회 결제(30일권)용 결제 시도 레코드

import uuid
from django.db import models
from django.conf import settings


class PaymentAttempt(models.Model):
    """결제 시도 레코드 (중복 결제 방지 + 완료 검증용)"""

    STATUS_CHOICES = [
        ('pending', '대기'),
        ('paid', '결제완료'),
        ('failed', '실패'),
        ('canceled', '취소'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_attempts',
    )
    plan = models.CharField(max_length=20)  # standard | premium
    amount = models.PositiveIntegerField()  # 원 단위
    currency = models.CharField(max_length=10, default='KRW')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
    )
    portone_payment_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text='PortOne 결제 ID (조회/검증용)',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments_paymentattempt'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.id} {self.user_id} {self.plan} {self.status}"
