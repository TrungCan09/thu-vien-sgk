import { describe, expect, it } from "vitest";
import { onRequest } from "../../functions/api/books/[id]";

const id = "10n59TbCjg-pVeX_qGzWCoKq5hO9pyPk1";
const bytes = new TextEncoder().encode("%PDF-test-content");

function context(method: "GET" | "HEAD", range?: string, download = true) {
  const headers = new Headers();
  if (range) headers.set("Range", range);
  const object = {
    body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }),
    size: bytes.length,
    httpEtag: '"test-etag"',
    range: range ? { offset: 0, length: 4 } : undefined,
    writeHttpMetadata(target: Headers) { target.set("Content-Type", "application/pdf"); },
  };
  return {
    env: {
      BOOKS_BUCKET: {
        head: async () => object,
        get: async () => object,
      },
    },
    params: { id },
    request: new Request(`https://example.test/api/books/${id}${download ? "?download=1" : ""}`, { method, headers }),
  };
}

describe("book R2 API", () => {
  it("returns metadata for HEAD", async () => {
    const response = await onRequest(context("HEAD") as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(response.headers.get("Content-Length")).toBe(String(bytes.length));
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(response.headers.get("Content-Disposition")).toContain("filename*=UTF-8''");
    expect(response.headers.get("Content-Disposition")).toContain("%C3");
  });

  it("returns partial content for Range requests", async () => {
    const response = await onRequest(context("GET", "bytes=0-3") as never);
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe(`bytes 0-3/${bytes.length}`);
  });

  it("streams the full PDF inline by default", async () => {
    const response = await onRequest(context("GET", undefined, false) as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Length")).toBe(String(bytes.length));
    expect(response.headers.get("Content-Disposition")).toContain("inline");
    expect(await response.text()).toBe("%PDF-test-content");
  });

  it("rejects unknown identifiers", async () => {
    const value = context("GET");
    value.params = { id: "unknown" };
    const response = await onRequest(value as never);
    expect(response.status).toBe(404);
  });
});
