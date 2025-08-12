import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("document") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read file content
    const fileContent = await file.text()

    // Simple chunking strategy - split by paragraphs and limit size
    const paragraphs = fileContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    const chunks = []

    let chunkId = 1
    for (const paragraph of paragraphs) {
      // Split large paragraphs into smaller chunks (max 500 chars)
      if (paragraph.length > 500) {
        const sentences = paragraph.split(/[.!?]+/).filter((s) => s.trim().length > 0)
        let currentChunk = ""

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > 500 && currentChunk.length > 0) {
            chunks.push({
              id: `chunk_${chunkId++}`,
              content: currentChunk.trim() + ".",
              metadata: {
                filename: file.name,
                chunkIndex: chunks.length,
                estimatedTokens: Math.ceil(currentChunk.length / 4),
              },
            })
            currentChunk = sentence.trim()
          } else {
            currentChunk += (currentChunk ? ". " : "") + sentence.trim()
          }
        }

        if (currentChunk.trim()) {
          chunks.push({
            id: `chunk_${chunkId++}`,
            content: currentChunk.trim() + ".",
            metadata: {
              filename: file.name,
              chunkIndex: chunks.length,
              estimatedTokens: Math.ceil(currentChunk.length / 4),
            },
          })
        }
      } else {
        chunks.push({
          id: `chunk_${chunkId++}`,
          content: paragraph.trim(),
          metadata: {
            filename: file.name,
            chunkIndex: chunks.length,
            estimatedTokens: Math.ceil(paragraph.length / 4),
          },
        })
      }
    }

    // Simulate processing delay for demo purposes
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      filename: file.name,
      chunks: chunks,
      totalChunks: chunks.length,
    })
  } catch (error) {
    console.error("Document processing error:", error)
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 })
  }
}
