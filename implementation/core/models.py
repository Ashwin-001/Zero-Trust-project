from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    risk_score = models.IntegerField(default=0)
    # Storing private_key as a unique identifier for login. 
    # In a real app, this should be hashed, but for this "key" based login simulation we can treat it like a unique token.
    # We'll use a CharField. It must be unique.
    private_key = models.CharField(max_length=255, unique=True, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['private_key']),
        ]

    def __str__(self):
        return self.username

class Log(models.Model):
    STATUS_CHOICES = (
        ('Granted', 'Granted'),
        ('Denied', 'Denied'),
    )
    
    user = models.CharField(max_length=150)
    action = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    risk_level = models.CharField(max_length=20)
    device_health = models.JSONField(default=dict)
    timestamp = models.DateTimeField(default=timezone.now)
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.timestamp} - {self.user} - {self.action}"

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['status']),
        ]

class Block(models.Model):
    index = models.IntegerField()
    timestamp = models.DateTimeField(default=timezone.now)
    data = models.JSONField()
    previous_hash = models.CharField(max_length=256)
    hash = models.CharField(max_length=256)
    nonce = models.BigIntegerField(default=0)

    class Meta:
        ordering = ['index'] # Sort by index

    def __str__(self):
        return f"Block {self.index} - {self.hash[:10]}..."
