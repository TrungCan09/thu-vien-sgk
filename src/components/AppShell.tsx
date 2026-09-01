import { BookOpenText, FacebookLogo, GithubLogo, LinkedinLogo } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  function scrollToGrades() {
    document.getElementById("chon-lop")?.scrollIntoView({ block: "start" });
  }

  function handleChooseGrade(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (location.pathname !== "/") navigate("/");
    window.setTimeout(scrollToGrades, location.pathname === "/" ? 0 : 80);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link className="wordmark" to="/" aria-label="Thư viện SGK, về trang chủ">
            <span className="wordmark-mark"><BookOpenText size={24} weight="duotone" /></span>
            <span>Thư viện SGK</span>
          </Link>
          <nav className="header-actions" aria-label="Điều hướng chính">
            <a className="header-link" href="/#chon-lop" onClick={handleChooseGrade}>Chọn lớp</a>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-copy">
            <p>Thư viện sách giáo khoa dành cho học sinh.</p>
            <p>Không quảng cáo, không theo dõi người dùng.</p>
          </div>
          <div className="footer-credit">
            <div className="credit-primary">
              <span className="credit-label">Thực hiện bởi </span>
              <span className="credit-name">Bùi Trung Can</span>
              <span className="social-links" aria-label="Liên kết của Bùi Trung Can">
                <a href="https://github.com/TrungCan09" target="_blank" rel="noreferrer" aria-label="Mở GitHub của Bùi Trung Can">
                  <GithubLogo size={19} weight="bold" />
                </a>
                <a href="https://www.facebook.com/bui.trung.can.2024/" target="_blank" rel="noreferrer" aria-label="Mở Facebook của Bùi Trung Can">
                  <FacebookLogo size={19} weight="bold" />
                </a>
                <a href="https://www.linkedin.com/in/buitrungcan/" target="_blank" rel="noreferrer" aria-label="Mở LinkedIn của Bùi Trung Can">
                  <LinkedinLogo size={19} weight="bold" />
                </a>
              </span>
            </div>
            <p>Chuyên Tin 2024 - 2027, Trường THPT chuyên Bến Tre</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
