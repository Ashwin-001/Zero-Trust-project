from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register', views.RegisterView.as_view(), name='register'),
    path('auth/login', views.LoginView.as_view(), name='login'),
    path('auth/google', views.GoogleLoginView.as_view(), name='google-login'),
    
    # Secure
    path('secure/public-resource', views.public_resource, name='public-resource'),
    path('secure/confidential-resource', views.confidential_resource, name='confidential-resource'),
    path('secure/admin-panel', views.admin_panel, name='admin-panel'),
    path('secure/logs', views.get_logs, name='get-logs'),
    
    # Ledger
    path('ledger/chain', views.get_chain, name='get-chain'),
    path('ledger/verify', views.verify_chain, name='verify-chain'),

    # ML & AI
    path('ml/train', views.train_ml_model, name='train-ml'),
    path('ml/status', views.get_ml_status, name='ml-status'),
    path('ai/insight', views.get_ai_insight, name='ai-insight'),
    path('ai/posture', views.get_posture_insight, name='ai-posture'),
    path('ai/intelligence', views.get_intelligence, name='ai-intelligence'),
    path('ai/rag-chat', views.RAGChatView.as_view(), name='rag-chat'),
]
