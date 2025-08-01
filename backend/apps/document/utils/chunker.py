from apps.document.models import SmartChunk
from apps.document.utils.client_openia import embed_text
from apps.document.utils.client_tiktoken import encode_text, decode_text, token_count
import uuid


def chunk_text(text: str, max_tokens: int = 500, overlap: int = 50)-> list[str]:
    tokens = encode_text(text)
    chunks = []
    i = 0

    while i < len(tokens):
        chunk_tokens = tokens[i:i+max_tokens]
        chunk_text = decode_text(chunk_tokens)
        chunks.append(chunk_text)
        i += max_tokens - overlap

    return chunks

# def chunk_text(text: str, chunk_size: int = 500) -> list[str]:
#     """
#     Splits the input text into smaller chunks of specified size.
#     If a paragraph is larger than the chunk size, it will be split further."""
#     paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
#     result = []
#     for p in paragraphs:
#         if len(p) <= chunk_size:
#             result.append(p)
#         else:
#             result.extend([p[i:i + chunk_size] for i in range(0, len(p), chunk_size)])
    
#     return result

def chunk_text_and_embed(text: str, document_id: uuid.UUID) -> list[SmartChunk]:
    raw_chunks = chunk_text(text)
    result = [
        SmartChunk(
            document_id=document_id,
            chunk_index=i,
            content=chunk,
            token_count=token_count(chunk),
            embedding=embed_text(chunk),
        )
        for i, chunk in enumerate(raw_chunks)
    ]
    return result

def chunk_text_and_embed_origin(text: str, document_id: uuid.UUID) -> list[SmartChunk]:
    raw_chunks = chunk_text(text)
    result = [
        SmartChunk(
            document_id=document_id,
            chunk_index=i,
            content=chunk,
            token_count=len(chunk.split()),
            embedding=embed_text(chunk),
        )
        for i, chunk in enumerate(raw_chunks)
    ]
    return result
