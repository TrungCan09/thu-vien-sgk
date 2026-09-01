import type { BookType } from "../types";

export function stripCopyPrefix(fileName: string) {
  return fileName.replace(/^Bản sao của\s+/iu, "").replace(/\.pdf$/iu, "");
}

export function slugifyVietnamese(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function detectBookType(fileName: string): BookType {
  const stem = stripCopyPrefix(fileName).toLowerCase();
  const match = stem.match(/^\d{1,2}-(sgk|sgv|sbt)-?/u);
  if (match) return match[1] as BookType;
  if (/^\d{1,2}-sgv(?=[a-z])/u.test(stem)) return "sgv";
  return "other";
}

export function detectVolume(fileName: string): 1 | 2 | undefined {
  const stem = stripCopyPrefix(fileName).toLowerCase();
  if (/-tap-mot(?:-|$)/u.test(stem)) return 1;
  if (/-tap-hai(?:-|$)/u.test(stem)) return 2;
  return undefined;
}

export function detectSpecialTopic(fileName: string) {
  return stripCopyPrefix(fileName).toLowerCase().includes("chuyen-de-hoc-tap");
}
