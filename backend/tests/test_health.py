"""
헬스체크 API 테스트.
Docker 환경에서만 실행: docker compose run --rm api python manage.py test
"""
from django.test import TestCase, Client


class HealthViewTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_health_returns_ok(self):
        response = self.client.get('/api/v1/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok'})
