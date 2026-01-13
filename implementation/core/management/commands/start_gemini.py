import time
from django.core.management.base import BaseCommand
from core.ai_service import ai_service
from core.models import Block, AIInsight
from core.blockchain_service import blockchain_service

class Command(BaseCommand):
    help = 'Starts the Gemini AI background analysis service'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Gemini Background Analysis Service Started...'))
        
        while True:
            try:
                # 1. Get recent data from Blockchain
                blocks = Block.objects.all().order_by('-index')[:30]
                recent_logs = []
                for block in blocks:
                    payload = block.data.get('payload')
                    if payload:
                        try:
                            data = blockchain_service.decrypt_data(payload)
                            if 'user' in data:
                                recent_logs.append(data)
                        except: pass
                    if len(recent_logs) >= 20: break

                if not recent_logs:
                     self.stdout.write("No logs found in blockchain yet. Waiting...")
                     time.sleep(5)
                     continue

                # 2. Update Posture Insight
                summary = "\n".join([f"User: {l.get('user')}, Action: {l.get('action')}, Result: {l.get('status')}, Risk: {l.get('risk_level', l.get('riskLevel'))}" for l in recent_logs])
                
                self.stdout.write("Generating Posture Insight using Zero Trust RAG Formulas...")
                posture_content = ai_service.generate_posture_insight(summary)
                AIInsight.objects.update_or_create(
                    insight_type='posture',
                    defaults={'content': {'insight': posture_content}}
                )
                
                # 3. Update Intelligence (Realtime)
                self.stdout.write("Generating Realtime Intelligence...")
                decrypted_context = recent_logs[:10]
                intel_content = ai_service.get_realtime_intelligence(decrypted_context)
                AIInsight.objects.update_or_create(
                    insight_type='intelligence',
                    defaults={'content': intel_content}
                )
                
                self.stdout.write(self.style.SUCCESS(f"AI Insights successfully updated at {time.strftime('%H:%M:%S')}"))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error in Gemini Loop: {e}"))
            
            # Wait 30 seconds to avoid rate limiting
            time.sleep(30)
