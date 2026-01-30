from rest_framework import serializers
from .models import Session, Message, ImageRecord


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('id', 'role', 'content', 'created_at')


class ImageRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageRecord
        fields = ('id', 'prompt', 'image_url', 'model', 'created_at')


class SessionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ('id', 'kind', 'title', 'created_at', 'updated_at')


class SessionDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    image_records = ImageRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = ('id', 'kind', 'title', 'created_at', 'updated_at', 'messages', 'image_records')
