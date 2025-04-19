import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = auth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const success = db.deleteFoodEntry(params.id)

    if (!success) {
      return NextResponse.json({ error: "Food entry not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete food entry error:", error)
    return NextResponse.json({ error: "An error occurred while deleting food entry" }, { status: 500 })
  }
}
