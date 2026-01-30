"""
세션 API 테스트.
Docker 환경에서만 실행합니다.
"""
from django.test import TestCase, Client
from apps.chats.models import Session, SESSION_KIND_CHAT, SESSION_KIND_IMAGE


class SessionAPITests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_create_chat_session(self):
        response = self.client.post(
            '/api/v1/sessions/',
            data={'kind': SESSION_KIND_CHAT, 'title': '테스트 채팅'},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['kind'], SESSION_KIND_CHAT)
        self.assertEqual(data['title'], '테스트 채팅')
        self.assertIn('id', data)

    def test_create_image_session(self):
        response = self.client.post(
            '/api/v1/sessions/',
            data={'kind': SESSION_KIND_IMAGE},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['kind'], SESSION_KIND_IMAGE)

    def test_list_sessions(self):
        Session.objects.create(kind=SESSION_KIND_CHAT, title='A')
        Session.objects.create(kind=SESSION_KIND_IMAGE, title='B')
        response = self.client.get('/api/v1/sessions/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_list_sessions_filter_by_kind(self):
        Session.objects.create(kind=SESSION_KIND_CHAT, title='A')
        Session.objects.create(kind=SESSION_KIND_IMAGE, title='B')
        response = self.client.get('/api/v1/sessions/?kind=chat')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['kind'], SESSION_KIND_CHAT)
