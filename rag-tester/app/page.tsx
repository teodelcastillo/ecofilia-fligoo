"use client"

import { useState } from "react"
import { toast } from "@/components/ui/use-toast"


interface ProcessedDocument {
  id: string
  filename: string
  chunks: any[]
  status: string
  uploadedAt: string
}

interface QueryResult {
  id: string
  content: string
  score: number
  source: string
  metadata: any
}

const Page = () => {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [query, setQuery] = useState("")
  const [queryResults, setQueryResults] = useState<QueryResult[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isQuerying, setIsQuerying] = useState(false)
  const [hasQueried, setHasQueried] = useState(false)

  const loadDocuments = async () => {
    setIsLoadingDocuments(true)
    try {
      // Updated to use local API route instead of external API
      const response = await fetch("/api/documents", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load documents")
      }

      const result = await response.json()

      // Transform API response to match our interface
      const transformedDocs: ProcessedDocument[] = result.map((doc: any) => ({
        id: doc.id || doc.document_id || Date.now().toString(),
        filename: doc.filename || doc.name || "Unknown Document",
        chunks: doc.chunks || [],
        status: "completed",
        uploadedAt: doc.created_at || doc.uploaded_at || new Date().toISOString(),
      }))

      setDocuments(transformedDocs)
    } catch (error) {
      console.error("Error loading documents:", error)
      toast({
        title: "Failed to load documents",
        description: "Could not connect to the API. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a document to upload.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("document", selectedFile)

      // Updated to use local API route instead of external API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload document")
      }

      const result = await response.json()

      toast({
        title: "Document uploaded!",
        description: `Successfully uploaded ${selectedFile.name}`,
      })

      setSelectedFile(null)
      // Reset file input
      const fileInput = document.getElementById("file-input") as HTMLInputElement
      if (fileInput) fileInput.value = ""

      // Reload documents list
      await loadDocuments()
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "No query entered",
        description: "Please enter a query to search for relevant chunks.",
        variant: "destructive",
      })
      return
    }

    setIsQuerying(true)
    setHasQueried(true)

    try {
      // Updated to use local API route instead of external API
      const response = await fetch(`/api/query?query=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to query documents")
      }

      const result = await response.json()

      // Transform API response to match our interface
      const transformedResults: QueryResult[] =
        result.chunks?.map((chunk: any, index: number) => ({
          id: chunk.id || index.toString(),
          content: chunk.content || chunk.text || "",
          score: chunk.score || chunk.similarity || 0.8,
          source: chunk.source || chunk.document || "Unknown",
          metadata: chunk.metadata || {},
        })) || []

      setQueryResults(transformedResults)

      toast({
        title: "Query completed!",
        description: `Found ${transformedResults.length} relevant chunks`,
      })
    } catch (error) {
      console.error("Query error:", error)
      toast({
        title: "Query failed",
        description: "There was an error processing your query. Please try again.",
        variant: "destructive",
      })
      setQueryResults([])
    } finally {
      setIsQuerying(false)
    }
  }

  return <div>{/* UI components here */}</div>
}

export default Page
