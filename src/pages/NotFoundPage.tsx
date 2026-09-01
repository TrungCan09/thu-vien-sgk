import { ArrowLeft, Compass } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="not-found">
      <Compass size={48} weight="duotone" />
      <h1>Không tìm thấy trang</h1>
      <p>Địa chỉ này không tồn tại hoặc sách đã được chuyển.</p>
      <Link className="primary-action" to="/"><ArrowLeft size={19} weight="bold" /> Về trang chủ</Link>
    </section>
  );
}
