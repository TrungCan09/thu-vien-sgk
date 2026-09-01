export type BookType = "sgk" | "sgv" | "sbt" | "other";
export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface Book {
  id: string;
  slug: string;
  title: string;
  grade: Grade;
  subject: string;
  type: BookType;
  isSpecialTopic: boolean;
  volume?: 1 | 2;
  collection: "Kết nối tri thức với cuộc sống";
  sizeBytes: number;
  pageCount: number;
  coverUrl: string;
  downloadFileName: string;
}

export const BOOK_TYPE_LABELS: Record<BookType, string> = {
  sgk: "Sách giáo khoa",
  sgv: "Sách giáo viên",
  sbt: "Sách bài tập",
  other: "Tài liệu khác",
};
