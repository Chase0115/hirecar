import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock @vercel/blob before importing the route
vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}));

import { POST } from "@/app/api/upload/route";
import { put } from "@vercel/blob";

const mockedPut = vi.mocked(put);

/**
 * Build a NextRequest whose .formData() resolves to a FormData
 * containing the given File. We override .formData() directly to
 * avoid serialisation issues in the jsdom test environment.
 */
function buildRequest(file?: File | null): NextRequest {
  const req = new NextRequest("http://localhost:3000/api/upload", {
    method: "POST",
  });

  const fd = new FormData();
  if (file) {
    fd.append("file", file);
  }
  // Override formData() so the handler receives our FormData directly
  req.formData = () => Promise.resolve(fd);
  return req;
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no file is provided", async () => {
    const response = await POST(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("No file provided");
  });

  it("returns 400 for invalid MIME type", async () => {
    const file = new File(["data"], "doc.pdf", { type: "application/pdf" });
    const response = await POST(buildRequest(file));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("JPEG and PNG");
  });

  it("returns 400 for oversized file", async () => {
    // Create a file that reports > 10 MB
    const buf = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([buf], "big.jpg", { type: "image/jpeg" });
    const response = await POST(buildRequest(file));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("10 MB");
  });

  it("uploads valid JPEG and returns blob URL", async () => {
    mockedPut.mockResolvedValue({
      url: "https://blob.vercel-storage.com/licenses/test.jpg",
      downloadUrl: "https://blob.vercel-storage.com/licenses/test.jpg",
      pathname: "licenses/test.jpg",
      contentType: "image/jpeg",
      contentDisposition: 'attachment; filename="test.jpg"',
    } as any);

    const file = new File(["jpeg-data"], "license.jpg", { type: "image/jpeg" });
    const response = await POST(buildRequest(file));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe("https://blob.vercel-storage.com/licenses/test.jpg");
    expect(mockedPut).toHaveBeenCalledOnce();
    expect(mockedPut.mock.calls[0][2]).toEqual({ access: "public" });
  });

  it("uploads valid PNG and returns blob URL", async () => {
    mockedPut.mockResolvedValue({
      url: "https://blob.vercel-storage.com/licenses/test.png",
      downloadUrl: "https://blob.vercel-storage.com/licenses/test.png",
      pathname: "licenses/test.png",
      contentType: "image/png",
      contentDisposition: 'attachment; filename="test.png"',
    } as any);

    const file = new File(["png-data"], "license.png", { type: "image/png" });
    const response = await POST(buildRequest(file));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe("https://blob.vercel-storage.com/licenses/test.png");
  });

  it("returns 500 when blob upload fails", async () => {
    mockedPut.mockRejectedValue(new Error("Blob storage unavailable"));

    const file = new File(["jpeg-data"], "license.jpg", { type: "image/jpeg" });
    const response = await POST(buildRequest(file));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Upload failed. Please try again.");
  });

  it("stores file under licenses/ prefix with timestamp", async () => {
    mockedPut.mockResolvedValue({
      url: "https://blob.vercel-storage.com/licenses/123-photo.jpg",
      downloadUrl: "https://blob.vercel-storage.com/licenses/123-photo.jpg",
      pathname: "licenses/123-photo.jpg",
      contentType: "image/jpeg",
      contentDisposition: 'attachment; filename="photo.jpg"',
    } as any);

    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
    await POST(buildRequest(file));

    const pathArg = mockedPut.mock.calls[0][0] as string;
    expect(pathArg).toMatch(/^licenses\/\d+-photo\.jpg$/);
  });
});
