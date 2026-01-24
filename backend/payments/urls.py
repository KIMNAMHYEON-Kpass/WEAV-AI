"""
WEAV AI Billing URLs
PortOne: prepare / complete / webhook
"""

from django.urls import path
from django.conf import settings
from . import views

app_name = "payments"

urlpatterns = [
    path("plans/", views.get_plans, name="get_plans"),
    path("payment/prepare/", views.payment_prepare, name="payment_prepare"),
    path("payment/complete/", views.payment_complete, name="payment_complete"),
    path("webhook/", views.portone_webhook, name="portone_webhook"),
]

if getattr(settings, "USE_STRIPE", False):
    urlpatterns += [
        path("checkout-session/", views.create_checkout_session, name="create_checkout_session"),
        path("webhook/stripe/", views.stripe_webhook, name="stripe_webhook"),
    ]
