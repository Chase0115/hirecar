import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { validateFileUpload } from "@/lib/validation";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials not configured");
  }
  return createClient(url, key);
}

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

    const supabase = getSupabase();
    const filename = file.name || "upload";
    const path = `licenses/${Date.now()}-${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("license-photos")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Upload failed. Please try again." },
        { status: 500 }
      );
    }

    // Store the path — images are served via /api/image proxy for admin only
    return NextResponse.json({ url: `/api/image?path=${encodeURIComponent(path)}` });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
