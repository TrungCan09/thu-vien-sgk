import { describe, expect, it } from "vitest";
import { books, getBooksByGrade, normalizeSearch, searchBooks } from "../../src/lib/catalog";

describe("generated catalog", () => {
  it("contains the complete Drive inventory with unique identifiers", () => {
    expect(books).toHaveLength(441);
    expect(new Set(books.map((book) => book.id))).toHaveLength(441);
    expect(new Set(books.map((book) => book.slug))).toHaveLength(441);
    expect(books.reduce((sum, book) => sum + book.sizeBytes, 0)).toBe(9_384_716_272);
  });

  it("includes the complete grade 10 collection", () => {
    expect(getBooksByGrade(10)).toHaveLength(50);
  });

  it("normalizes Vietnamese search text", () => {
    expect(normalizeSearch("Tiếng Việt")).toBe("tieng viet");
    const result = searchBooks(getBooksByGrade(1), "tieng viet", "all", "all");
    expect(result.some((book) => book.subject === "Tiếng Việt")).toBe(true);
  });

  it("classifies every book into a supported type", () => {
    const counts = books.reduce<Record<string, number>>((result, book) => {
      result[book.type] = (result[book.type] ?? 0) + 1;
      return result;
    }, {});
    expect(counts).toEqual({ other: 6, sbt: 3, sgk: 299, sgv: 133 });
  });

  it("exposes special-topic metadata for only the grades that contain it", () => {
    const special = books.filter((book) => book.isSpecialTopic);
    expect(special).toHaveLength(52);
    expect([...new Set(special.map((book) => book.grade))]).toEqual([10, 11, 12]);
    expect(searchBooks(getBooksByGrade(10), "", "all", "all", "special")).toHaveLength(17);
    expect(searchBooks(getBooksByGrade(10), "", "all", "all", "regular")).toHaveLength(33);
  });

  it("recognizes subjects in legacy filenames without a separator after SGV", () => {
    expect(books.some((book) => book.subject === "Chưa phân loại")).toBe(false);
    expect(books.some((book) => book.title === "Sách giáo viên Tiếng Việt 1 - Tập hai")).toBe(true);
  });

  it("sorts each grade by SGK, SGV, SBT, then other", () => {
    const order = { sgk: 0, sgv: 1, sbt: 2, other: 3 };
    for (let index = 1; index < books.length; index += 1) {
      if (books[index].grade === books[index - 1].grade) {
        expect(order[books[index].type]).toBeGreaterThanOrEqual(order[books[index - 1].type]);
      }
    }
  });
});
