import { BOOK_ASSETS } from "../../_catalog.generated";

interface BookObject {
  body: BodyInit;
  size: number;
  httpEtag: string;
  range?: { offset: number; length: number } | { suffix: number };
  writeHttpMetadata(headers: Headers): void;
}

interface BookBucket {
  head(key: string): Promise<BookObject | null>;
  get(key: string, options?: { range: Headers }): Promise<BookObject | null>;
}

interface Env {
  BOOKS_BUCKET: BookBucket;
}

interface PagesContext {
  env: Env;
  params: Record<string, string | string[]>;
  request: Request;
}

type AssetId = keyof typeof BOOK_ASSETS;

function contentDisposition(fileName: string, download: boolean) {
  const ascii = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[Đđ]/g, (letter) => letter === "Đ" ? "D" : "d")
    .replace(/[^a-zA-Z0-9 ._-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function baseHeaders(asset: (typeof BOOK_ASSETS)[AssetId], download: boolean) {
  return new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": "application/pdf",
    "Content-Disposition": contentDisposition(asset.downloadFileName, download),
    "X-Content-Type-Options": "nosniff",
  });
}

export const onRequest = async ({ env, params, request }: PagesContext): Promise<Response> => {
  const id = String(params.id ?? "") as AssetId;
  const asset = BOOK_ASSETS[id];
  if (!asset) return new Response("Không tìm thấy sách.", { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  const headers = baseHeaders(asset, download);

  if (request.method === "HEAD") {
    const head = await env.BOOKS_BUCKET.head(asset.assetKey);
    if (!head) return new Response("Không tìm thấy file PDF.", { status: 404 });
    head.writeHttpMetadata(headers);
    headers.set("ETag", head.httpEtag);
    headers.set("Content-Length", String(head.size));
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== "GET") {
    headers.set("Allow", "GET, HEAD");
    return new Response("Phương thức không được hỗ trợ.", { status: 405, headers });
  }

  const object = await env.BOOKS_BUCKET.get(asset.assetKey, { range: request.headers });
  if (!object) return new Response("Không tìm thấy file PDF.", { status: 404 });
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);

  let status = 200;
  if (object.range) {
    status = 206;
    const range = object.range;
    if ("offset" in range && "length" in range && typeof range.offset === "number" && typeof range.length === "number") {
      headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
      headers.set("Content-Length", String(range.length));
    }
  } else {
    headers.set("Content-Length", String(object.size));
  }
  return new Response(object.body, { status, headers });
};
