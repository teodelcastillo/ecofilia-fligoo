import { type NextRequest, NextResponse } from "next/server"

const API_BASE = "http://3.16.150.123"
const AUTH_HEADER = "Basic " + btoa("admin@ecofilia.com:wewe3434WEWE·$·$")

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const response = await fetch(`${API_BASE}/api/document/upload/`, {
      method: "POST",
      headers: {
        Authorization: AUTH_HEADER,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
