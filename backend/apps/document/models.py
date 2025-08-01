import uuid
from django.db import models
from django.db.models import QuerySet
from django.utils.text import slugify

from pgvector.django import VectorField, CosineDistance
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth import get_user_model
from apps.document.utils.client_openia import embed_text
import os
User = get_user_model()

class ChunkingStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    DONE = "done", "Done"
    ERROR = "error", "Error"


class Document(models.Model):
    owner = models.ForeignKey(User, related_name="document_owner", on_delete=models.CASCADE)
    name = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(unique=True, blank=True)
    category =  models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='documents/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    extracted_text = models.TextField(blank=True)
    chunking_status = models.CharField(
        max_length=20,
        choices=ChunkingStatus.choices,
        default=ChunkingStatus.PENDING,
    )
    chunking_offset = models.IntegerField(default=0)
    chunking_done = models.BooleanField(default=False)
    last_error = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    is_public = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.name and not self.slug:
            name = os.path.basename(self.file.name)
            name = os.path.splitext(name)[0] 
            self.name = name
            base_slug = slugify(name)
            slug = base_slug
            counter = 1
            while Document.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.id}-{self.name}'

class SmartChunkQuerySet(QuerySet):
    def top_similar(self, text: str, top_n=5):
        if not text:
            return self.none()

        query_embedding = embed_text(text)  # Your embedding function
        if not query_embedding:
            return self.none()

        return self.annotate(
            distance=CosineDistance("embedding", query_embedding)
        ).order_by("distance")[:top_n]

class SmartChunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.IntegerField()
    content = models.TextField()
    token_count = models.IntegerField()
    title = models.CharField(max_length=255, blank=True, null=True)
    summary = models.TextField(blank=True)
    keywords = ArrayField(models.TextField(), blank=True, default=list)
    embedding = VectorField(dimensions=1536, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)



    class SmartChunkManager(models.Manager):
        def get_queryset(self):
            return SmartChunkQuerySet(self.model, using=self._db)

        # Optional shortcut to call on manager directly
        def top_similar(self, *args, **kwargs):
            return self.get_queryset().top_similar(*args, **kwargs)

    # class SmartChunkManager(models.Manager):
    #     #  def get_queryset(self):
    #     #     return super().get_queryset()
         
    #      def get_queryset(self, text, top_n=5):
    #         qs = self.get_queryset()
    #         if not text:<
    #             return qs.none()
    #         query_embedding = embed_text(text)
    #         if not query_embedding:
    #             return qs.none()
    #         return qs.annotate(
    #             distance=CosineDistance("embedding", query_embedding)
    #         ).order_by("distance")[:top_n]

    objects = SmartChunkManager()
    def __str__(self):
        return f"{self.id}-{self.document.name}"
