from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Log, Block

# Register your models here.

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'risk_score', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Zero Trust Info', {'fields': ('role', 'risk_score', 'private_key')}),
    )

@admin.register(Log)
class LogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'status', 'risk_level')
    list_filter = ('status', 'risk_level', 'action')
    search_fields = ('user', 'action', 'details')

@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ('index', 'timestamp', 'hash', 'nonce')
    readonly_fields = ('hash', 'previous_hash', 'timestamp')
