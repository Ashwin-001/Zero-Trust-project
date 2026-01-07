from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register', views.RegisterView.as_view(), name='register'),
    path('auth/login', views.LoginView.as_view(), name='login'),
    
    # Secure
    path('secure/public-resource', views.public_resource, name='public-resource'),
    path('secure/confidential-resource', views.confidential_resource, name='confidential-resource'),
    path('secure/admin-panel', views.admin_panel, name='admin-panel'),
    path('secure/logs', views.get_logs, name='get-logs'),
    
    # Ledger
    path('ledger/chain', views.get_chain, name='get-chain'),
    path('ledger/verify', views.verify_chain, name='verify-chain'),
]
