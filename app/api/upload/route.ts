import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { validateFileUpload } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const validation = validateFileUpload({
      type: file.type,
      size: file.size,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.file ?? "Invalid file" },
        { status: 400 }
      );
    }

    const filename = file.name || "upload";
    const blob = await put(`licenses/${Date.now()}-${filename}`, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
