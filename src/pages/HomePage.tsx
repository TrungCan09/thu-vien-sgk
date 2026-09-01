import { ArrowRight, Books, ChalkboardTeacher, GraduationCap } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { BookCover } from "../components/BookCover";
import { books, getBooksByGrade, grades } from "../lib/catalog";

const featured = [books.find((book) => book.grade === 1 && book.subject === "Tiếng Việt"), books.find((book) => book.grade === 6 && book.subject === "Toán"), books.find((book) => book.grade === 12 && book.subject === "Ngữ văn")].filter(Boolean);

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Kết nối tri thức với cuộc sống</p>
            <h1>Sách học, mở ngay khi cần.</h1>
            <p className="hero-lead">Chọn lớp, tìm đúng sách và đọc trực tiếp ở mọi nơi.</p>
            <a className="primary-action" href="#chon-lop">Chọn lớp <ArrowRight size={19} weight="bold" /></a>
          </div>
          <div className="cover-showcase" aria-label="Một số sách trong thư viện">
            {featured.map((book, index) => book && (
              <div className={`showcase-cover showcase-cover-${index + 1}`} key={book.id}>
                <BookCover src={book.coverUrl} title={book.title} eager />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="library-summary" aria-label="Thông tin thư viện">
        <div className="container summary-grid">
          <div><Books size={26} weight="duotone" /><strong>{books.length}</strong><span>tài liệu PDF</span></div>
          <div><GraduationCap size={26} weight="duotone" /><strong>12</strong><span>khối lớp</span></div>
          <div><ChalkboardTeacher size={26} weight="duotone" /><strong>4</strong><span>nhóm tài liệu</span></div>
        </div>
      </section>

      <section className="grade-section" id="chon-lop">
        <div className="container">
          <div className="section-heading">
            <h2>Em đang học lớp mấy?</h2>
            <p>Chọn lớp để xem sách giáo khoa, sách giáo viên và tài liệu đi kèm.</p>
          </div>
          <div className="grade-grid">
            {grades.map((grade) => {
              const count = getBooksByGrade(grade).length;
              return count ? (
                <Link className="grade-tile" to={`/lop/${grade}`} key={grade}>
                  <span>Lớp</span>
                  <strong>{grade}</strong>
                  <small>{count} tài liệu</small>
                  <ArrowRight size={22} weight="bold" />
                </Link>
              ) : (
                <div className="grade-tile grade-tile-empty" key={grade} aria-label={`Lớp ${grade}, đang cập nhật`}>
                  <span>Lớp</span>
                  <strong>{grade}</strong>
                  <small>Đang cập nhật</small>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
