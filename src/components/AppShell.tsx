import { BookOpenText } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link className="wordmark" to="/" aria-label="Thư viện SGK, về trang chủ">
            <span className="wordmark-mark"><BookOpenText size={24} weight="duotone" /></span>
            <span>Thư viện SGK</span>
          </Link>
          <nav className="header-actions" aria-label="Điều hướng chính">
            <Link className="header-link" to="/">Chọn lớp</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <p>Thư viện sách giáo khoa dành cho học sinh.</p>
          <p>Không quảng cáo, không theo dõi người dùng.</p>
        </div>
      </footer>
    </div>
  );
}
