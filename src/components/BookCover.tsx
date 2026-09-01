import { BookOpen } from "@phosphor-icons/react";
import { useState } from "react";

export function BookCover({ src, title, eager = false }: { src: string; title: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="cover-frame">
      {!failed ? (
        <img src={src} alt={`Bìa ${title}`} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />
      ) : (
        <div className="cover-fallback" role="img" aria-label={`Chưa có ảnh bìa cho ${title}`}>
          <BookOpen size={42} weight="duotone" />
          <span>Thư viện SGK</span>
        </div>
      )}
    </div>
  );
}
