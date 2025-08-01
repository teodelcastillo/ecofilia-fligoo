import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.document.models import Document, SmartChunk
from apps.document.utils.chunker import chunk_text_and_embed
from apps.document.utils.parser import parse_file
import os
logger = logging.getLogger(__name__)


@receiver(post_save, sender=Document)
def handle_document_post_save(sender, instance, created, **kwargs):
    pass
    logger.info(f"Document post_save signal triggered: ")
    if not created or instance.chunking_done:
        return
    logger.info(f"Document {instance}, created: {created}")

    try:
        file_path = instance.file.path
        text = parse_file(file_path)
        chunks = chunk_text_and_embed(text, instance.id)
        SmartChunk.objects.bulk_create(chunks)
        instance.chunking_done = True
        instance.chunking_status = "done"
        instance.extracted_text = text
        instance.save(update_fields=["chunking_done", "chunking_status", "extracted_text"])
    except Exception as e:
        logger.error(f"Failed to chunk document {instance.id}: {str(e)}")
        instance.last_error = str(e)
        instance.chunking_status = "error"
        instance.save(update_fields=["last_error", "chunking_status"])
