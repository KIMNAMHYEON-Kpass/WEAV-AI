from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Session, Message, ImageRecord, SESSION_KIND_CHAT, SESSION_KIND_IMAGE
from .serializers import SessionListSerializer, SessionDetailSerializer, MessageSerializer, ImageRecordSerializer


@api_view(['GET', 'POST'])
def session_list(request):
    if request.method == 'GET':
        kind = request.query_params.get('kind')
        qs = Session.objects.all()
        if kind in (SESSION_KIND_CHAT, SESSION_KIND_IMAGE):
            qs = qs.filter(kind=kind)
        serializer = SessionListSerializer(qs, many=True)
        return Response(serializer.data)
    kind = request.data.get('kind', SESSION_KIND_CHAT)
    title = request.data.get('title', '')[:255]
    if kind not in (SESSION_KIND_CHAT, SESSION_KIND_IMAGE):
        kind = SESSION_KIND_CHAT
    session = Session.objects.create(kind=kind, title=title or f'{kind} session')
    return Response(SessionListSerializer(session).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
def session_detail(request, session_id):
    try:
        session = Session.objects.get(pk=session_id)
    except Session.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(SessionDetailSerializer(session).data)
    if request.method == 'PATCH':
        title = request.data.get('title')
        if title is not None:
            session.title = str(title)[:255]
            session.save(update_fields=['title', 'updated_at'])
        return Response(SessionListSerializer(session).data)
    if request.method == 'DELETE':
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['GET'])
def session_messages(request, session_id):
    try:
        session = Session.objects.get(pk=session_id)
    except Session.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    if session.kind != SESSION_KIND_CHAT:
        return Response({'detail': 'Not a chat session'}, status=status.HTTP_400_BAD_REQUEST)
    serializer = MessageSerializer(session.messages.all(), many=True)
    return Response(serializer.data)


@api_view(['GET'])
def session_images(request, session_id):
    try:
        session = Session.objects.get(pk=session_id)
    except Session.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    if session.kind != SESSION_KIND_IMAGE:
        return Response({'detail': 'Not an image session'}, status=status.HTTP_400_BAD_REQUEST)
    serializer = ImageRecordSerializer(session.image_records.all(), many=True)
    return Response(serializer.data)
