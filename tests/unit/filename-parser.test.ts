import { describe, expect, it } from "vitest";
import { detectBookType, detectSpecialTopic, detectVolume, slugifyVietnamese, stripCopyPrefix } from "../../src/lib/filename-parser";

describe("filename parser", () => {
  it("removes the Drive copy prefix and extension", () => {
    expect(stripCopyPrefix("Bản sao của 01-sgk-toan-1.pdf")).toBe("01-sgk-toan-1");
  });

  it.each([
    ["01-sgk-toan-1.pdf", "sgk"],
    ["03-sgv-toan-3.pdf", "sgv"],
    ["08-sbt-tieng-anh-8-global-success.pdf", "sbt"],
    ["01-sgvtieng-viet-1-tap-hai.pdf", "sgv"],
    ["07-tieng-nga-7-tap-mot.pdf", "other"],
  ] as const)("detects %s as %s", (fileName, type) => {
    expect(detectBookType(fileName)).toBe(type);
  });

  it("detects both volume labels", () => {
    expect(detectVolume("01-sgk-toan-1-tap-mot.pdf")).toBe(1);
    expect(detectVolume("01-sgk-toan-1-tap-hai.pdf")).toBe(2);
  });

  it("creates accent-free URL slugs", () => {
    expect(slugifyVietnamese("Sách giáo khoa Tiếng Việt 1")).toBe("sach-giao-khoa-tieng-viet-1");
  });

  it("detects special-topic books independently from SGK or SGV type", () => {
    expect(detectSpecialTopic("10-sgk-chuyen-de-hoc-tap-toan-10.pdf")).toBe(true);
    expect(detectSpecialTopic("10-sgv-chuyen-de-hoc-tap-am-nhac-10.pdf")).toBe(true);
    expect(detectSpecialTopic("10-sgk-toan-10.pdf")).toBe(false);
  });
});
