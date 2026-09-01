import { ArrowsOut, CaretLeft, CaretRight, DownloadSimple, Minus, Plus, WarningCircle } from "@phosphor-icons/react";
import { Button, IconButton, Skeleton, Tooltip } from "@radix-ui/themes";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy, type RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useRef, useState } from "react";
import type { Book } from "../types";

GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfViewer({ book }: { book: Book }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [total, setTotal] = useState(book.pageCount);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(720);
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const task = getDocument({ url: `/api/books/${book.id}`, rangeChunkSize: 262_144 });
    task.promise.then((pdf) => {
      setDocument(pdf);
      setTotal(pdf.numPages);
      setError("");
    }).catch(() => setError("Không thể mở PDF. Bạn vẫn có thể tải file về thiết bị."));
    return () => { task.destroy(); };
  }, [book.id]);

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width - 32)));
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!document || !canvasRef.current) return;
    let renderTask: RenderTask | undefined;
    let active = true;
    setRendering(true);
    document.getPage(page).then((pdfPage) => {
      if (!active || !canvasRef.current) return;
      const natural = pdfPage.getViewport({ scale: 1 });
      const scale = Math.min(2.4, (width / natural.width) * zoom);
      const viewport = pdfPage.getViewport({ scale });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = canvasRef.current;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");
      renderTask = pdfPage.render({ canvas, canvasContext: context, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] });
      return renderTask.promise;
    }).then(() => {
      if (active) setRendering(false);
      if (page < document.numPages) void document.getPage(page + 1);
    }).catch((reason) => {
      if (active && reason?.name !== "RenderingCancelledException") setError("Trang PDF không thể hiển thị.");
    });
    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [document, page, width, zoom]);

  function goTo(nextPage: number) {
    const safe = Math.min(Math.max(nextPage, 1), total || 1);
    setPage(safe);
    setPageInput(String(safe));
  }

  function requestFullscreen() {
    void viewerRef.current?.requestFullscreen();
  }

  if (error) {
    return (
      <div className="viewer-error" role="alert">
        <WarningCircle size={38} weight="duotone" />
        <h2>Không mở được sách</h2>
        <p>{error}</p>
        <a className="primary-action" href={`/api/books/${book.id}?download=1`}><DownloadSimple size={19} weight="bold" /> Tải PDF</a>
      </div>
    );
  }

  return (
    <div className="pdf-viewer" ref={viewerRef} tabIndex={0} onKeyDown={(event) => {
      if (event.key === "ArrowLeft") goTo(page - 1);
      if (event.key === "ArrowRight") goTo(page + 1);
    }}>
      <div className="viewer-toolbar" aria-label="Điều khiển đọc sách">
        <div className="toolbar-group">
          <Tooltip content="Trang trước"><IconButton aria-label="Trang trước" variant="soft" disabled={page <= 1} onClick={() => goTo(page - 1)}><CaretLeft size={20} weight="bold" /></IconButton></Tooltip>
          <form className="page-control" onSubmit={(event) => { event.preventDefault(); goTo(Number(pageInput)); }}>
            <label htmlFor="page-number">Trang</label>
            <input id="page-number" inputMode="numeric" value={pageInput} onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ""))} />
            <span>/ {total || "..."}</span>
          </form>
          <Tooltip content="Trang sau"><IconButton aria-label="Trang sau" variant="soft" disabled={!total || page >= total} onClick={() => goTo(page + 1)}><CaretRight size={20} weight="bold" /></IconButton></Tooltip>
        </div>
        <div className="toolbar-group">
          <Tooltip content="Thu nhỏ"><IconButton aria-label="Thu nhỏ" variant="soft" disabled={zoom <= 0.7} onClick={() => setZoom((value) => Math.max(0.7, value - 0.15))}><Minus size={19} weight="bold" /></IconButton></Tooltip>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <Tooltip content="Phóng to"><IconButton aria-label="Phóng to" variant="soft" disabled={zoom >= 1.75} onClick={() => setZoom((value) => Math.min(1.75, value + 0.15))}><Plus size={19} weight="bold" /></IconButton></Tooltip>
          <Tooltip content="Toàn màn hình"><IconButton aria-label="Toàn màn hình" variant="soft" onClick={requestFullscreen}><ArrowsOut size={19} weight="bold" /></IconButton></Tooltip>
          <Button asChild><a href={`/api/books/${book.id}?download=1`}><DownloadSimple size={18} weight="bold" /> Tải PDF</a></Button>
        </div>
      </div>
      <div className="pdf-stage" ref={stageRef} aria-busy={rendering}>
        {!document && <div className="page-skeleton"><Skeleton width="100%" height="100%" /></div>}
        <canvas ref={canvasRef} aria-label={`Trang ${page} của ${book.title}`} className={rendering ? "is-rendering" : ""} />
      </div>
    </div>
  );
}
