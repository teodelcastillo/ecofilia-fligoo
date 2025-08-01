from django.contrib import admin

from .models import Document, SmartChunk

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "chunking_done",
        "preview_extracted_text",
        "owner_email",
        "created",
        "file",
    )
    search_fields = ("name", "extracted_text", "extracted_text")
    list_filter = ("chunking_status", "chunking_done", "created_at")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "chunking_status", "chunking_done", "last_error", "retry_count")

    def created(self, obj):
        return obj.created_at.strftime("%Y/%m/%d %H:%M:%S")

    def file(self, obj):
        if obj.file:
            return obj.file.url
        return "No File"

    def owner_email(self, obj):
        return obj.owner.email if obj.owner else "No Owner"


    def preview_extracted_text(self, obj):
        return (obj.extracted_text[:50] + "...") if obj.extracted_text and len(obj.extracted_text) > 50 else obj.extracted_text
    preview_extracted_text.short_extracted_text = "extracted_text"


@admin.register(SmartChunk)
class SmartChunkAdmin(admin.ModelAdmin):
    list_display = ("id", "document", "chunk_index", "preview_content", "token_count", "created_at")
    search_fields = ("content","chunk_index")
    list_filter = ("document",)
    ordering = ("document", "chunk_index")

    def preview_content(self, obj):
        return (obj.content[:100] + "...") if obj.content and len(obj.content) > 100 else obj.content
    preview_content.short_extracted_text = "Content Preview"
