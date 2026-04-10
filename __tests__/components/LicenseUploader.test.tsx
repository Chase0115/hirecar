import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LicenseUploader from "@/components/LicenseUploader";
import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("en");

describe("LicenseUploader", () => {
  const onUploadSuccess = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    onUploadSuccess.mockReset();
  });

  it("renders Take a Photo and Upload Image buttons", () => {
    render(<LicenseUploader dict={dict} onUploadSuccess={onUploadSuccess} />);
    expect(screen.getByText("Take a Photo")).toBeInTheDocument();
    expect(screen.getByText("Upload Image")).toBeInTheDocument();
  });

  it("has a hidden camera input with capture attribute", () => {
    const { container } = render(
      <LicenseUploader dict={dict} onUploadSuccess={onUploadSuccess} />
    );
    const cameraInput = container.querySelector('input[capture="environment"]');
    expect(cameraInput).toBeTruthy();
    expect(cameraInput).toHaveAttribute("accept", "image/*");
    expect(cameraInput).toHaveAttribute("hidden");
  });

  it("has a hidden gallery input accepting jpeg and png", () => {
    const { container } = render(
      <LicenseUploader dict={dict} onUploadSuccess={onUploadSuccess} />
    );
    const galleryInput = container.querySelector('input[accept="image/jpeg,image/png"]');
    expect(galleryInput).toBeTruthy();
    expect(galleryInput).toHaveAttribute("hidden");
  });

  it("shows error for invalid file type", async () => {
    render(<LicenseUploader dict={dict} onUploadSuccess={onUploadSuccess} />);

    const galleryInput = document.querySelector(
      'input[accept="image/jpeg,image/png"]'
    ) as HTMLInputElement;

    const invalidFile = new File(["data"], "test.gif", { type: "image/gif" });
    Object.defineProperty(galleryInput, "files", { value: [invalidFile] });
    fireEvent.change(galleryInput);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(onUploadSuccess).not.toHaveBeenCalled();
  });

  it("shows error for file exceeding 10 MB", async () => {
    render(<LicenseUploader dict={dict} onUploadSuccess={onUploadSuccess} />);

    const galleryInput = document.querySelector(
      'input[accept="image/jpeg,image/png"]'
    ) as HTMLInputElement;

    const bigFile = new File(["x".repeat(100)], "big.jpg", { type: "image/jpeg" });
    Object.defineProperty(bigFile, "size", { value: 11 * 1024 * 1024 });
    Object.defineProperty(galleryInput, "files", { value: [bigFile] });
    fireEvent.change(galleryInput);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(onUploadSuccess).not.toHaveBeenCalled();
  });

  it("calls onUploadSuccess after successful upload", async () => {
    const mockUrl = "https://blob.example.com/license.jpg";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: mockUrl }),
    });
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:preview");

    render(<LicenseUploader dict={dict} onUploadSuccess={onUploadSuccess} />);

    const galleryInput = document.querySelector(
      'input[accept="image/jpeg,image/png"]'
    ) as HTMLInputElement;

    const validFile = new File(["img"], "license.jpg", { type: "image/jpeg" });
    Object.defineProperty(galleryInput, "files", { value: [validFile] });
    fireEvent.change(galleryInput);

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledWith(mockUrl);
    });
  });

  it("shows error and retry button on upload failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Upload failed. Please try again." }),
    });
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:preview");

    render(<LicenseUploader dict={dict} onUploadSuccess={onUploadSuccess} />);

    const galleryInput = document.querySelector(
      'input[accept="image/jpeg,image/png"]'
    ) as HTMLInputElement;

    const validFile = new File(["img"], "license.jpg", { type: "image/jpeg" });
    Object.defineProperty(galleryInput, "files", { value: [validFile] });
    fireEvent.change(galleryInput);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Retry Upload")).toBeInTheDocument();
    });
    expect(onUploadSuccess).not.toHaveBeenCalled();
  });

  it("shows upload buttons again after clicking retry", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Upload failed." }),
    });
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:preview");

    render(<LicenseUploader dict={dict} onUploadSuccess={onUploadSuccess} />);

    const galleryInput = document.querySelector(
      'input[accept="image/jpeg,image/png"]'
    ) as HTMLInputElement;

    const validFile = new File(["img"], "license.jpg", { type: "image/jpeg" });
    Object.defineProperty(galleryInput, "files", { value: [validFile] });
    fireEvent.change(galleryInput);

    await waitFor(() => {
      expect(screen.getByText("Retry Upload")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Retry Upload"));

    await waitFor(() => {
      expect(screen.getByText("Take a Photo")).toBeInTheDocument();
      expect(screen.getByText("Upload Image")).toBeInTheDocument();
    });
  });

  it("shows error on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:preview");

    render(<LicenseUploader dict={dict} onUploadSuccess={onUploadSuccess} />);

    const galleryInput = document.querySelector(
      'input[accept="image/jpeg,image/png"]'
    ) as HTMLInputElement;

    const validFile = new File(["img"], "license.jpg", { type: "image/jpeg" });
    Object.defineProperty(galleryInput, "files", { value: [validFile] });
    fireEvent.change(galleryInput);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(onUploadSuccess).not.toHaveBeenCalled();
  });
});
