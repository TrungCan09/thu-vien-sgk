import { Books, MagnifyingGlass } from "@phosphor-icons/react";

export function EmptyState({ kind = "search" }: { kind?: "search" | "grade" }) {
  return (
    <div className="empty-state" role="status">
      {kind === "search" ? <MagnifyingGlass size={38} weight="duotone" /> : <Books size={38} weight="duotone" />}
      <h2>{kind === "search" ? "Không tìm thấy sách" : "Sách đang được cập nhật"}</h2>
      <p>{kind === "search" ? "Hãy thử từ khóa ngắn hơn hoặc thay đổi bộ lọc." : "Lớp này chưa có tài liệu. Bạn có thể chọn lớp khác."}</p>
    </div>
  );
}
