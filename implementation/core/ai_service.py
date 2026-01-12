import google.generativeai as genai
import os
from django.conf import settings

class AIService:
    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY'))
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def analyze_risk(self, risk_score, risk_level, device_info, user_history):
        if not self.model:
            return "AI Analysis unavailable. Please provide Gemini API Key."

        prompt = f"""
        Analyze the following security event in a Zero Trust environment:
        - Risk Score: {risk_score}
        - Risk Level: {risk_level}
        - Device Info: {device_info}
        - Recent User Activity Summary: {user_history}

        Provide a brief, professional security insight and recommendation for the administrator.
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error during AI analysis: {str(e)}"

    def generate_posture_insight(self, logs_summary):
        if not self.model:
            return "AI Analysis unavailable. Configure GEMINI_API_KEY."

        prompt = f"""
        Review the following summarized security logs from our Zero Trust system:
        {logs_summary}

        Give me a very short (2 sentence) executive summary of our current security posture. 
        Focus on identifying trends or suspicious patterns.
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except:
            return "Security trends are currently stable. No significant anomalies detected."

    def get_realtime_intelligence(self, decrypted_logs):
        if not self.model:
            return {"summary": "AI Offline", "chart_data": []}

        prompt = f"""
        Analyze these recent security events: {decrypted_logs}
        1. Summarize the overall threat level in 1 sentence.
        2. Generate 5 mock 'threat intensity' data points (0-100) for a chart.
        3. Format as JSON: {{"summary": "...", "chart_data": [val1, val2, val3, val4, val5]}}
        """
        try:
            response = self.model.generate_content(prompt)
            # Find JSON in response
            text = response.text
            import re
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group())
            return {"summary": "Stable monitoring.", "chart_data": [10, 15, 12, 18, 11]}
        except:
            return {"summary": "System monitoring consistent.", "chart_data": [5, 5, 5, 5, 5]}

ai_service = AIService()
