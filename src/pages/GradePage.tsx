import { ArrowLeft, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Button, Select, TextField } from "@radix-ui/themes";
import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { EmptyState } from "../components/EmptyState";
import { getBooksByGrade, getSubjectsForGrade, searchBooks } from "../lib/catalog";
import { BOOK_TYPE_LABELS, type BookType, type Grade } from "../types";

export function GradePage() {
  const gradeNumber = Number(useParams().grade);
  const valid = Number.isInteger(gradeNumber) && gradeNumber >= 1 && gradeNumber <= 12;
  const grade = gradeNumber as Grade;
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [type, setType] = useState<BookType | "all">("all");
  const [topic, setTopic] = useState<"all" | "regular" | "special">("all");
  const source = valid ? getBooksByGrade(grade) : [];
  const subjects = valid ? getSubjectsForGrade(grade) : [];
  const hasSpecialTopics = source.some((book) => book.isSpecialTopic);
  const effectiveTopic = hasSpecialTopics ? topic : "all";
  const filtered = useMemo(() => searchBooks(source, query, subject, type, effectiveTopic), [source, query, subject, type, effectiveTopic]);
  const hasFilters = Boolean(query || subject !== "all" || type !== "all" || effectiveTopic !== "all");

  if (!valid) return <Navigate to="/404" replace />;

  return (
    <section className="catalog-page">
      <div className="container">
        <Link className="back-link" to="/"><ArrowLeft size={18} weight="bold" /> Chọn lớp khác</Link>
        <div className="catalog-heading">
          <div>
            <h1>Sách Lớp {grade}</h1>
            <p>{source.length ? `${source.length} tài liệu trong bộ Kết nối tri thức với cuộc sống.` : "Tài liệu cho lớp này đang được cập nhật."}</p>
          </div>
          {source.length > 0 && <span className="result-count">{filtered.length} kết quả</span>}
        </div>

        {source.length > 0 ? (
          <>
            <div className="filters" aria-label="Bộ lọc sách">
              <label className="search-field">
                <span>Tìm theo tên sách</span>
                <TextField.Root size="3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: Toán, Tiếng Việt">
                  <TextField.Slot><MagnifyingGlass size={19} /></TextField.Slot>
                </TextField.Root>
              </label>
              <label>
                <span>Môn học</span>
                <Select.Root value={subject} onValueChange={setSubject}>
                  <Select.Trigger aria-label="Lọc theo môn học" />
                  <Select.Content>
                    <Select.Item value="all">Tất cả môn học</Select.Item>
                    {subjects.map((item) => <Select.Item value={item} key={item}>{item}</Select.Item>)}
                  </Select.Content>
                </Select.Root>
              </label>
              <label>
                <span>Loại sách</span>
                <Select.Root value={type} onValueChange={(value) => setType(value as BookType | "all")}>
                  <Select.Trigger aria-label="Lọc theo loại sách" />
                  <Select.Content>
                    <Select.Item value="all">Tất cả loại sách</Select.Item>
                    {(Object.keys(BOOK_TYPE_LABELS) as BookType[]).map((item) => <Select.Item value={item} key={item}>{BOOK_TYPE_LABELS[item]}</Select.Item>)}
                  </Select.Content>
                </Select.Root>
              </label>
              {hasSpecialTopics && (
                <label>
                  <span>Nội dung</span>
                  <Select.Root value={topic} onValueChange={(value) => setTopic(value as "all" | "regular" | "special")}>
                    <Select.Trigger aria-label="Lọc sách chuyên đề" />
                    <Select.Content>
                      <Select.Item value="all">Tất cả nội dung</Select.Item>
                      <Select.Item value="regular">Sách thường</Select.Item>
                      <Select.Item value="special">Sách chuyên đề</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </label>
              )}
              {hasFilters && (
                <Button className="clear-filters" variant="soft" color="gray" onClick={() => { setQuery(""); setSubject("all"); setType("all"); setTopic("all"); }}>
                  <X size={17} weight="bold" /> Xóa lọc
                </Button>
              )}
            </div>
            {filtered.length ? <div className="book-grid">{filtered.map((book) => <BookCard book={book} key={book.id} />)}</div> : <EmptyState />}
          </>
        ) : <EmptyState kind="grade" />}
      </div>
    </section>
  );
}
