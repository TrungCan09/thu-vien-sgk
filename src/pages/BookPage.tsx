import { ArrowLeft, DownloadSimple } from "@phosphor-icons/react";
import { Badge } from "@radix-ui/themes";
import { lazy, Suspense, useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { BookCover } from "../components/BookCover";
import { formatBytes, getBookBySlug } from "../lib/catalog";
import { BOOK_TYPE_LABELS } from "../types";

const PdfViewer = lazy(() => import("../components/PdfViewer"));

export function BookPage() {
  const book = getBookBySlug(useParams().slug);
  useEffect(() => {
    if (!book) return;
    document.title = `${book.title} | Thư viện SGK`;
    return () => { document.title = "Thư viện SGK"; };
  }, [book]);
  if (!book) return <Navigate to="/404" replace />;

  return (
    <section className="book-page">
      <div className="container">
        <Link className="back-link" to={`/lop/${book.grade}`}><ArrowLeft size={18} weight="bold" /> Sách Lớp {book.grade}</Link>
        <div className="book-intro">
          <div className="book-intro-cover"><BookCover src={book.coverUrl} title={book.title} eager /></div>
          <div>
            <Badge variant="soft">{BOOK_TYPE_LABELS[book.type]}</Badge>
            <h1>{book.title}</h1>
            <dl className="book-details">
              <div><dt>Môn học</dt><dd>{book.subject}</dd></div>
              <div><dt>Bộ sách</dt><dd>{book.collection}</dd></div>
              <div><dt>Số trang</dt><dd>{book.pageCount ? `${book.pageCount} trang` : "Đang cập nhật"}</dd></div>
              <div><dt>Dung lượng</dt><dd>{formatBytes(book.sizeBytes)}</dd></div>
            </dl>
            <a className="secondary-action" href={`/api/books/${book.id}?download=1`}><DownloadSimple size={19} weight="bold" /> Tải PDF</a>
          </div>
        </div>
        <div className="reader-heading">
          <h2>Đọc trực tuyến</h2>
          <p>Dùng phím mũi tên hoặc nút điều khiển để chuyển trang.</p>
        </div>
        <Suspense fallback={<div className="viewer-loading" role="status">Đang tải trình đọc PDF...</div>}>
          <PdfViewer book={book} />
        </Suspense>
      </div>
    </section>
  );
}
