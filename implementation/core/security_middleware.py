from django.middleware.security import SecurityMiddleware

class CustomSecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # X-Content-Type-Options: nosniff
        # Prevents browsers from MIME-sniffing a response away from the declared content-type.
        response['X-Content-Type-Options'] = 'nosniff'

        # Referrer-Policy: strict-origin-when-cross-origin
        # Controls how much referrer information is included with requests.
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Permissions-Policy (formerly Feature-Policy)
        # Allows or blocks the use of browser features in its own frame, and in iframes it embeds.
        # Customize this based on your application's needs.
        # Example: disable geolocation, microphone, camera for all origins.
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

        # X-XSS-Protection: 1; mode=block (older, CSP is better, but still useful for older browsers)
        response['X-XSS-Protection'] = '1; mode=block'

        return response
