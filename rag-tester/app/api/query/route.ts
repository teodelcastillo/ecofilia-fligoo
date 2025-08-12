import { type NextRequest, NextResponse } from "next/server"

const API_BASE = "http://3.16.150.123"
const AUTH_HEADER = "Basic " + btoa("admin@ecofilia.com:wewe3434WEWE·$·$")

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const response = await fetch(`${API_BASE}/api/document/rag/?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        Authorization: AUTH_HEADER,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Query processing error:", error)
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Proxy to external API
    const response = await fetch(`${API_BASE}/api/document/rag/?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        Authorization: AUTH_HEADER,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Query processing error:", error)
    return NextResponse.json({ error: "Failed to process query" }, { status: 500 })
  }
}
