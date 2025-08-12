"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Search, Loader2, Database, Code, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProcessedDocument {
  id: string
  name: string
  slug: string
  category: string
  description: string
  file: string
  extracted_text: string
  chunking_offset: number
  is_public: boolean
  created_at: string
  chunking_status: string
  chunking_done: boolean
  last_error: string | null
  retry_count: number
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
  const { toast } = useToast()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setIsLoadingDocuments(true)
    try {
      const response = await fetch("/api/documents", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || result.details || "Failed to load documents")
      }

      if (!Array.isArray(result)) {
        throw new Error("Invalid response format: expected array of documents")
      }

      const transformedDocs: ProcessedDocument[] = result.map((doc: any) => ({
        id: doc.id || Date.now().toString(),
        name: doc.name || "Unknown Document",
        slug: doc.slug || "",
        category: doc.category || "Uncategorized",
        description: doc.description || "",
        file: doc.file || "",
        extracted_text: doc.extracted_text || "",
        chunking_offset: doc.chunking_offset || 0,
        is_public: doc.is_public || false,
        created_at: doc.created_at || new Date().toISOString(),
        chunking_status: doc.chunking_status || "Unknown",
        chunking_done: doc.chunking_done || false,
        last_error: doc.last_error || null,
        retry_count: doc.retry_count || 0,
      }))

      setDocuments(transformedDocs)
    } catch (error) {
      console.error("Error loading documents:", error)
      toast({
        title: "Failed to load documents",
        description:
          error instanceof Error ? error.message : "Could not connect to the API. Please check your connection.",
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
      const fileInput = document.getElementById("file-input") as HTMLInputElement
      if (fileInput) fileInput.value = ""

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">RAG API Tester</h1>
          <p className="text-lg text-gray-600">Test your Retrieval-Augmented Generation API</p>
        </div>

        <Tabs defaultValue="test" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Upload & Query
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              API Documentation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Document
                  </CardTitle>
                  <CardDescription>Upload a document to process and extract chunks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      id="file-input"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      accept=".pdf,.txt,.doc,.docx"
                    />
                    <label htmlFor="file-input" className="cursor-pointer">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : "Click to select a file"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Supports PDF, TXT, DOC, DOCX</p>
                    </label>
                  </div>
                  <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload & Process
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Query Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Query Documents
                  </CardTitle>
                  <CardDescription>Search for relevant chunks in your processed documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter your query here..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button onClick={handleQuery} disabled={!query.trim() || isQuerying} className="w-full">
                    {isQuerying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Query Results */}
            {hasQueried && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-green-600" />
                    Query Results
                    <Badge variant="secondary">{queryResults.length} chunks found</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {queryResults.length > 0 ? (
                    <div className="space-y-4">
                      {queryResults.map((result) => (
                        <div key={result.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              Score: {(result.score * 100).toFixed(1)}%
                            </Badge>
                            <span className="text-sm text-gray-600">{result.source}</span>
                          </div>
                          <p className="text-gray-800 leading-relaxed">{result.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No relevant chunks found for your query.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Processed Documents
                  <Button onClick={loadDocuments} disabled={isLoadingDocuments} variant="outline" size="sm">
                    {isLoadingDocuments ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                  </Button>
                </CardTitle>
                <CardDescription>View all documents that have been processed and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{doc.name}</h3>
                            {doc.description && <p className="text-sm text-gray-600 mt-1">{doc.description}</p>}
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant={
                                doc.chunking_done
                                  ? "default"
                                  : doc.chunking_status === "Pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {doc.chunking_status}
                            </Badge>
                            {doc.is_public && <Badge variant="outline">Public</Badge>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium text-gray-700">Category:</span>
                            <p className="text-gray-600">{doc.category || "N/A"}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Slug:</span>
                            <p className="text-gray-600 font-mono text-xs">{doc.slug || "N/A"}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>
                            <p className="text-gray-600">{new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Chunking Offset:</span>
                            <p className="text-gray-600">{doc.chunking_offset}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Retry Count:</span>
                            <p className="text-gray-600">{doc.retry_count}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">File:</span>
                            <p className="text-gray-600 text-xs">{doc.file || "No file"}</p>
                          </div>
                        </div>

                        {doc.last_error && (
                          <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                            <span className="font-medium text-red-700">Last Error:</span>
                            <p className="text-red-600 text-sm mt-1">{doc.last_error}</p>
                          </div>
                        )}

                        {doc.extracted_text && (
                          <div className="mt-3">
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Extracted Text Preview:</h4>
                            <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                              <p className="text-sm text-gray-800">
                                {doc.extracted_text.length > 300
                                  ? `${doc.extracted_text.substring(0, 300)}...`
                                  : doc.extracted_text}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    {isLoadingDocuments
                      ? "Loading documents..."
                      : "No documents found. Upload some documents to get started."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  API Documentation
                </CardTitle>
                <CardDescription>Instructions for connecting your RAG API to this tester</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Current API Configuration</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>Base URL:</strong> http://3.16.150.123
                    </p>
                    <p>
                      <strong>Authentication:</strong> Basic Auth
                    </p>
                    <p>
                      <strong>Username:</strong> admin@ecofilia.com
                    </p>
                    <p>
                      <strong>Password:</strong> wewe3434WEWE·$·$
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Required Endpoints</h3>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-green-600">GET /api/document/list/</h4>
                      <p className="text-sm text-gray-600 mb-2">Returns a list of all processed documents</p>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        {`Response format:
[
  {
    "id": "doc_123",
    "name": "document.pdf",
    "slug": "document-slug",
    "category": "category",
    "description": "description",
    "file": "file.pdf",
    "extracted_text": "extracted text",
    "chunking_offset": 0,
    "is_public": true,
    "created_at": "2024-01-01T00:00:00Z",
    "chunking_status": "Completed",
    "chunking_done": true,
    "last_error": null,
    "retry_count": 0
  }
]`}
                      </pre>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-blue-600">GET /api/document/rag/?query=[query]</h4>
                      <p className="text-sm text-gray-600 mb-2">Performs RAG query and returns relevant chunks</p>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        {`Response format:
{
  "chunks": [
    {
      "id": "chunk_123",
      "content": "Relevant text content...",
      "score": 0.85,
      "source": "document.pdf",
      "metadata": {}
    }
  ]
}`}
                      </pre>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-purple-600">POST /api/document/upload/</h4>
                      <p className="text-sm text-gray-600 mb-2">Uploads and processes a new document</p>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        {`Request: multipart/form-data
- document: [file]

Response format:
{
  "success": true,
  "document_id": "doc_123",
  "message": "Document processed successfully"
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Testing Checklist</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">API server is running and accessible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Authentication credentials are correct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Document list endpoint returns valid JSON</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Query endpoint accepts URL parameters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Upload endpoint accepts multipart form data</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Page
