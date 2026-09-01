import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { BookPage } from "./pages/BookPage";
import { GradePage } from "./pages/GradePage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lop/:grade" element={<GradePage />} />
        <Route path="/sach/:slug" element={<BookPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
