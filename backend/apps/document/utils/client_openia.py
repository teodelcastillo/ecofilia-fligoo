import os
from openai import OpenAI


MODEL_EMBEDDING=os.environ.get("MODEL_EMBEDDING", "text-embedding-3-small")

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def embed_text(text: str) -> list[float]:
    response = client.embeddings.create(
        input=text,
        model=MODEL_EMBEDDING
    )
    return response.data[0].embedding