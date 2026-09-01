import { createReadStream, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

interface LocalBook {
  id: string;
  downloadFileName: string;
}

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const localBooks = new Map<string, LocalBook>(
  (JSON.parse(readFileSync(path.join(projectRoot, "src", "data", "catalog.generated.json"), "utf8")) as LocalBook[])
    .map((book) => [book.id, book]),
);

function disposition(fileName: string, download: boolean) {
  const ascii = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[Đđ]/g, (letter) => letter === "Đ" ? "D" : "d")
    .replace(/[^a-zA-Z0-9 ._-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function serveLocalBook(request: IncomingMessage, response: ServerResponse, next: () => void) {
  if (!request.url) return next();
  const url = new URL(request.url, "http://localhost");
  const prefix = "/api/books/";
  if (!url.pathname.startsWith(prefix)) return next();

  const id = decodeURIComponent(url.pathname.slice(prefix.length));
  const book = localBooks.get(id);
  if (!book) {
    response.statusCode = 404;
    response.end("Không tìm thấy sách.");
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.statusCode = 405;
    response.setHeader("Allow", "GET, HEAD");
    response.end("Phương thức không được hỗ trợ.");
    return;
  }

  const pdfPath = path.join(projectRoot, "staging", "pdfs", `${id}.pdf`);
  let file;
  try {
    file = statSync(pdfPath);
  } catch {
    response.statusCode = 404;
    response.end("PDF chưa có trong thư mục staging.");
    return;
  }

  response.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/pdf");
  response.setHeader("Content-Disposition", disposition(book.downloadFileName, url.searchParams.get("download") === "1"));
  response.setHeader("ETag", `W/\"${file.size}-${Math.trunc(file.mtimeMs)}\"`);

  let start = 0;
  let end = file.size - 1;
  const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/u);
  if (request.headers.range && !range) {
    response.statusCode = 416;
    response.setHeader("Content-Range", `bytes */${file.size}`);
    response.end();
    return;
  }
  if (range) {
    if (!range[1] && range[2]) {
      const suffix = Number(range[2]);
      start = Math.max(file.size - suffix, 0);
    } else {
      start = Number(range[1]);
      if (range[2]) end = Math.min(Number(range[2]), end);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= file.size) {
      response.statusCode = 416;
      response.setHeader("Content-Range", `bytes */${file.size}`);
      response.end();
      return;
    }
    response.statusCode = 206;
    response.setHeader("Content-Range", `bytes ${start}-${end}/${file.size}`);
  } else {
    response.statusCode = 200;
  }
  response.setHeader("Content-Length", String(end - start + 1));
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(pdfPath, { start, end }).pipe(response);
}

function localBooksPlugin(): Plugin {
  const attach = (middlewares: { use: (handler: typeof serveLocalBook) => void }) => middlewares.use(serveLocalBook);
  return {
    name: "local-books-api",
    apply: "serve",
    configureServer(server) { attach(server.middlewares); },
    configurePreviewServer(server) { attach(server.middlewares); },
  };
}

export default defineConfig({
  plugins: [localBooksPlugin(), react()],
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
