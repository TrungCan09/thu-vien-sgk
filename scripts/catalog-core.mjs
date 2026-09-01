const TYPE_LABELS = {
  sgk: "Sách giáo khoa",
  sgv: "Sách giáo viên",
  sbt: "Sách bài tập",
  other: "Tài liệu",
};

const SUBJECTS = [
  ["giao-duc-quoc-phong-va-an-ninh", "Giáo dục quốc phòng và an ninh"],
  ["giao-duc-kinh-te-va-phap-luat", "Giáo dục kinh tế và pháp luật"],
  ["hoat-dong-trai-nghiem-huong-nghiep", "Hoạt động trải nghiệm, hướng nghiệp"],
  ["hoat-dong-trai-nghiem", "Hoạt động trải nghiệm"],
  ["lich-su-va-dia-li", "Lịch sử và Địa lí"],
  ["khoa-hoc-tu-nhien", "Khoa học tự nhiên"],
  ["tu-nhien-va-xa-hoi", "Tự nhiên và Xã hội"],
  ["giao-duc-cong-dan", "Giáo dục công dân"],
  ["giao-duc-the-chat", "Giáo dục thể chất"],
  ["tieng-trung-quoc", "Tiếng Trung Quốc"],
  ["tieng-viet", "Tiếng Việt"],
  ["tieng-anh", "Tiếng Anh"],
  ["tieng-phap", "Tiếng Pháp"],
  ["tieng-nhat", "Tiếng Nhật"],
  ["tieng-nga", "Tiếng Nga"],
  ["tieng-han", "Tiếng Hàn"],
  ["tieng-duc", "Tiếng Đức"],
  ["cong-nghe", "Công nghệ"],
  ["tin-hoc", "Tin học"],
  ["ngu-van", "Ngữ văn"],
  ["mi-thuat", "Mĩ thuật"],
  ["am-nhac", "Âm nhạc"],
  ["sinh-hoc", "Sinh học"],
  ["hoa-hoc", "Hóa học"],
  ["khoa-hoc", "Khoa học"],
  ["lich-su", "Lịch sử"],
  ["dia-li", "Địa lí"],
  ["vat-li", "Vật lí"],
  ["dao-duc", "Đạo đức"],
  ["toan", "Toán"],
];

const PHRASES = new Map([
  ["global-success", "Global Success"],
  ["global-sucess", "Global Success"],
  ["cong-nghe-trong-trot", "Công nghệ trồng trọt"],
  ["thiet-ke-va-cong-nghe", "Thiết kế và công nghệ"],
  ["dinh-huong-khoa-hoc-may-tinh", "Định hướng khoa học máy tính"],
  ["dinh-huong-tin-hoc-ung-dung", "Định hướng tin học ứng dụng"],
  ["cong-nghe-dien-dien-tu", "Công nghệ điện, điện tử"],
  ["lam-nghiep-thuy-san", "Lâm nghiệp, thủy sản"],
  ["cong-nghe-chan-nuoi", "Công nghệ chăn nuôi"],
  ["cong-nghe-co-khi", "Công nghệ cơ khí"],
  ["li-luan-va-lich-su-mi-thuat", "Lí luận và lịch sử mĩ thuật"],
  ["thiet-ke-mi-thuat-da-phuong-tien", "Thiết kế mĩ thuật đa phương tiện"],
  ["thiet-ke-mi-thuat-san-khau-dien-anh", "Thiết kế mĩ thuật sân khấu, điện ảnh"],
  ["thiet-ke-cong-nghiep", "Thiết kế công nghiệp"],
  ["thiet-ke-do-hoa", "Thiết kế đồ họa"],
  ["thiet-ke-thoi-trang", "Thiết kế thời trang"],
  ["do-hoa-tranh-in", "Đồ họa tranh in"],
  ["bong-chuyen", "Bóng chuyền"],
  ["bong-da", "Bóng đá"],
  ["bong-ro", "Bóng rổ"],
  ["cau-long", "Cầu lông"],
  ["dieu-khac", "Điêu khắc"],
  ["hoi-hoa", "Hội họa"],
  ["kien-truc", "Kiến trúc"],
  ["bai-mau", "Bài mẫu"],
]);

export function stripCopyPrefix(fileName) {
  return fileName.replace(/^Bản sao của\s+/iu, "").replace(/\.pdf$/iu, "");
}

export function slugifyVietnamese(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function typeFromStem(stem) {
  const match = stem.match(/^\d{1,2}-(sgk|sgv|sbt)-?/u);
  if (match) return match[1];
  if (/^\d{1,2}-sgv(?=[a-z])/u.test(stem)) return "sgv";
  return "other";
}

function prettifyDetail(detail) {
  if (!detail) return "";
  if (PHRASES.has(detail)) return PHRASES.get(detail);
  return detail
    .split("-")
    .filter(Boolean)
    .map((word, index) => {
      const known = { va: "và", dien: "điện", tu: "tử", mot: "một", hai: "hai" }[word];
      const value = known ?? word;
      return index === 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
    })
    .join(" ");
}

export function parseBookFile(file) {
  const cleanStem = stripCopyPrefix(file.originalName)
    .toLowerCase()
    .replace(/^(\d{1,2})-sgv(?=[a-z])/u, "$1-sgv-");
  const grade = Number(file.grade || cleanStem.match(/^0?(\d{1,2})-/u)?.[1]);
  const type = typeFromStem(cleanStem);
  const volume = /-tap-mot(?:-|$)/u.test(cleanStem) ? 1 : /-tap-hai(?:-|$)/u.test(cleanStem) ? 2 : undefined;
  const isSpecialTopic = cleanStem.includes("chuyen-de-hoc-tap");
  const subjectEntry = SUBJECTS.find(([key]) => cleanStem.includes(`-${key}`));
  const subject = subjectEntry?.[1] ?? "Chưa phân loại";
  let detail = "";
  if (subjectEntry) {
    const marker = `-${subjectEntry[0]}-${grade}`;
    const index = cleanStem.indexOf(marker);
    if (index >= 0) detail = cleanStem.slice(index + marker.length);
  }
  detail = detail.replace(/^-+/u, "").replace(/(?:^|-)tap-(mot|hai)$/u, "");
  const titleParts = [TYPE_LABELS[type]];
  if (isSpecialTopic) titleParts.push("Chuyên đề học tập");
  titleParts.push(subject, String(grade));
  if (detail) titleParts.push(`- ${prettifyDetail(detail)}`);
  if (volume) titleParts.push(`- Tập ${volume === 1 ? "một" : "hai"}`);
  const title = titleParts.join(" ").replace(/\s+/g, " ").trim();
  const downloadFileName = `${title}.pdf`;
  return {
    id: file.id,
    slug: `${slugifyVietnamese(title)}-${file.id.slice(0, 8).toLowerCase()}`,
    title,
    grade,
    subject,
    type,
    isSpecialTopic,
    ...(volume ? { volume } : {}),
    collection: "Kết nối tri thức với cuộc sống",
    sizeBytes: Number(file.sizeBytes),
    pageCount: Number(file.pageCount || 0),
    coverUrl: `/covers/${file.id}.webp`,
    downloadFileName,
    assetKey: `books/${grade}/${file.id}.pdf`,
  };
}

export const bookTypeLabels = TYPE_LABELS;
