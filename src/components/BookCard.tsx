import { ArrowRight, DownloadSimple } from "@phosphor-icons/react";
import { Badge } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { formatBytes } from "../lib/catalog";
import { BOOK_TYPE_LABELS, type Book } from "../types";
import { BookCover } from "./BookCover";

export function BookCard({ book }: { book: Book }) {
  return (
    <article className="book-card">
      <Link className="book-cover-link" to={`/sach/${book.slug}`} aria-label={`Đọc ${book.title}`}>
        <BookCover src={book.coverUrl} title={book.title} />
      </Link>
      <div className="book-card-body">
        <div className="book-meta">
          <Badge variant="soft">
            {BOOK_TYPE_LABELS[book.type]}
          </Badge>
          <span>{formatBytes(book.sizeBytes)}</span>
        </div>
        <h2><Link to={`/sach/${book.slug}`}>{book.title}</Link></h2>
        <p>{book.subject}</p>
        <div className="book-card-actions">
          <Link className="text-action" to={`/sach/${book.slug}`}>
            Đọc sách <ArrowRight size={17} weight="bold" />
          </Link>
          <a className="icon-action" href={`/api/books/${book.id}?download=1`} aria-label={`Tải ${book.title}`} title="Tải PDF">
            <DownloadSimple size={19} weight="bold" />
          </a>
        </div>
      </div>
    </article>
  );
}
