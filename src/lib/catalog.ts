import catalogJson from "../data/catalog.generated.json";
import type { Book, BookType, Grade } from "../types";

export const books = catalogJson as Book[];
export const grades = Array.from({ length: 12 }, (_, index) => (index + 1) as Grade);

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}

export function getBooksByGrade(grade: Grade) {
  return books.filter((book) => book.grade === grade);
}

export function getBookBySlug(slug?: string) {
  return books.find((book) => book.slug === slug);
}

export function getSubjectsForGrade(grade: Grade) {
  return [...new Set(getBooksByGrade(grade).map((book) => book.subject))].sort((a, b) => a.localeCompare(b, "vi"));
}

export function searchBooks(input: Book[], query: string, subject: string, type: BookType | "all", topic: "all" | "regular" | "special" = "all") {
  const needle = normalizeSearch(query);
  return input.filter((book) => {
    const searchable = normalizeSearch(`${book.title} ${book.subject} ${book.collection}`);
    const topicMatches = topic === "all" || (topic === "special" ? book.isSpecialTopic : !book.isSpecialTopic);
    return (!needle || searchable.includes(needle)) && (subject === "all" || book.subject === subject) && (type === "all" || book.type === type) && topicMatches;
  });
}

export function formatBytes(bytes: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(bytes / 1_048_576) + " MB";
}
