from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"fees", views.FeeScheduleViewSet)
router.register(r"invoices", views.InvoiceViewSet)
router.register(r"payments", views.PaymentViewSet)
router.register(r"payment-plans", views.PaymentPlanViewSet)

urlpatterns = [
    path("summary/",                views.finance_summary,     name="finance-summary"),
    path("payments/<int:pk>/receipt/", views.payment_receipt_pdf, name="finance-receipt-pdf"),
    path("paystack/init/",          views.paystack_init,       name="finance-paystack-init"),
    path("paystack/verify/",        views.paystack_verify,     name="finance-paystack-verify"),
    path("paystack/webhook/",       views.paystack_webhook,    name="finance-paystack-webhook"),
    path("", include(router.urls)),
]
