# Generated manually for PaymentAttempt (PortOne 일회 결제)

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PaymentAttempt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('plan', models.CharField(max_length=20)),
                ('amount', models.PositiveIntegerField()),
                ('currency', models.CharField(default='KRW', max_length=10)),
                ('status', models.CharField(choices=[('pending', '대기'), ('paid', '결제완료'), ('failed', '실패'), ('canceled', '취소')], db_index=True, default='pending', max_length=20)),
                ('portone_payment_id', models.CharField(blank=True, help_text='PortOne 결제 ID (조회/검증용)', max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_attempts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'payments_paymentattempt',
                'ordering': ['-created_at'],
            },
        ),
    ]
