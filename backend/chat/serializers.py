from rest_framework import serializers
from .models import ChatSession, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'content', 'is_user', 'created_at']

class ChatSessionSerializer(serializers.ModelSerializer):
    # We will format the date nicely for the frontend
    formatted_time = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'formatted_time']

    def get_formatted_time(self, obj):
        return obj.created_at.strftime("%b %d, %H:%M") 