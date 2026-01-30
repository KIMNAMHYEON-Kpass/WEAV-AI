from celery import shared_task
from django.db import transaction
from apps.chats.models import Message, ImageRecord, Job
from .router import run_chat, run_image
from .errors import AIError


@shared_task(bind=True, max_retries=2)
def task_chat(self, job_id: int, prompt: str, model: str, system_prompt: str | None = None):
    job = Job.objects.get(pk=job_id)
    job.status = 'running'
    job.save(update_fields=['status', 'updated_at'])
    try:
        reply = run_chat(prompt, model=model, system_prompt=system_prompt)
        with transaction.atomic():
            msg = Message.objects.create(session=job.session, role='assistant', content=reply)
            job.message = msg
            job.status = 'success'
            job.error_message = ''
            job.save(update_fields=['message_id', 'status', 'error_message', 'updated_at'])
        return {'message_id': msg.id, 'content': reply}
    except AIError as e:
        job.status = 'failure'
        job.error_message = str(e)
        job.save(update_fields=['status', 'error_message', 'updated_at'])
        raise
    except Exception as e:
        job.status = 'failure'
        job.error_message = str(e)
        job.save(update_fields=['status', 'error_message', 'updated_at'])
        raise


@shared_task(bind=True, max_retries=2)
def task_image(self, job_id: int, prompt: str, model: str, aspect_ratio: str = '1:1', num_images: int = 1):
    job = Job.objects.get(pk=job_id)
    job.status = 'running'
    job.save(update_fields=['status', 'updated_at'])
    try:
        images = run_image(prompt, model=model, aspect_ratio=aspect_ratio, num_images=num_images)
        if not images:
            raise AIError('No image URL returned')
        with transaction.atomic():
            for img in images:
                url = img.get('url')
                if url:
                    rec = ImageRecord.objects.create(session=job.session, prompt=prompt, image_url=url, model=model)
                    job.image_record = rec
                    break
            job.status = 'success'
            job.error_message = ''
            job.save(update_fields=['image_record_id', 'status', 'error_message', 'updated_at'])
        return {'image_record_id': job.image_record_id, 'url': job.image_record.image_url}
    except AIError as e:
        job.status = 'failure'
        job.error_message = str(e)
        job.save(update_fields=['status', 'error_message', 'updated_at'])
        raise
    except Exception as e:
        job.status = 'failure'
        job.error_message = str(e)
        job.save(update_fields=['status', 'error_message', 'updated_at'])
        raise
