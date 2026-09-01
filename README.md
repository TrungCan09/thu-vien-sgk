# Thư viện SGK

Website React tĩnh để tra cứu 441 sách thuộc bộ **Kết nối tri thức với cuộc sống**. Frontend chạy trên Cloudflare Pages, PDF nằm trong R2 riêng tư và được phục vụ qua Pages Function có kiểm soát danh mục.

## Hiện trạng dữ liệu

- 441 PDF, tổng cộng 9.384.716.272 byte.
- 299 sách giáo khoa, 133 sách giáo viên, 3 sách bài tập và 6 tài liệu khác.
- Lớp 10 có 50 tài liệu; bộ lọc sách chuyên đề xuất hiện ở Lớp 10, 11 và 12.
- PDF, staging và tệp kiểm tra R2 đều bị loại khỏi Git.
- `catalog:build` cảnh báo khi tổng dung lượng vượt 9,50 GB.

## Chạy cục bộ

Yêu cầu Node.js 22 trở lên. Bản nhập sách còn cần Poppler (`pdfinfo`, `pdftoppm`) và tài khoản Cloudflare đã đăng nhập trong Wrangler.

```powershell
npm install
npm run dev
```

Các lệnh kiểm tra chính:

```powershell
npm run typecheck
npm test
npm run build
npm run assets:validate
npm run test:e2e
```

Firefox trong Playwright cần runtime Microsoft Visual C++ hợp lệ trên Windows. Nếu Firefox báo lỗi side-by-side configuration, cài hoặc sửa Microsoft Visual C++ Redistributable rồi chạy lại project `firefox`.

## Nhập PDF từ Drive vào R2

1. Tệp kê khai Drive chuẩn nằm ở `data/drive-inventory.json`.
2. Tải PDF từ các ID đã quét bằng connector Drive. Trình tải tự retry, giữ tệp lỗi riêng và chỉ chấp nhận PDF có đúng kích thước:

```powershell
npm run drive:download
```

Tệp được lưu tại `staging/pdfs/<drive-file-id>.pdf`. Không đổi ID vì đây là khóa liên kết với catalog.
3. Tạo bucket và đăng nhập:

```powershell
npx wrangler login
npx wrangler r2 bucket create thu-vien-sgk
```

4. Chạy thử một tệp trước:

```powershell
node scripts/ingest-books.mjs --id=<drive-file-id> --upload --keep-staging
```

5. Khi tệp thử đạt yêu cầu, nhập toàn bộ:

```powershell
npm run ingest -- --upload
npm run catalog:build
```

Mỗi PDF được kiểm tra kích thước, đọc số trang bằng `pdfinfo`, lấy trang đầu làm bìa WebP 640 px, upload R2, tải lại object và đối chiếu SHA-256. Bản staging chỉ bị xóa sau khi đối chiếu thành công. Dùng `--keep-staging` nếu muốn giữ bản tạm.

## Triển khai Pages

`wrangler.toml` đã khai báo binding `BOOKS_BUCKET`. Sau khi toàn bộ object có trên R2:

```powershell
npm run deploy
```

Nếu `thu-vien-sgk.pages.dev` đã có chủ sở hữu, đổi tên project trong `package.json` và `wrangler.toml` thành `thu-vien-sgk-kt`.

Sau triển khai, kiểm tra `HEAD`, tải toàn phần, Range `206`, chế độ inline và `?download=1` trên `/api/books/:id`. Thiết lập cảnh báo dung lượng trong Cloudflare khi bucket vượt 9,5 GB.

## Triển khai Vercel

Vercel phù hợp để host frontend React/Vite. PDF vẫn nên nằm ở Cloudflare R2 bucket `thu-vien-sgk` hoặc một API khác vì kho sách hiện lớn gần 9,4 GB.

Trong Vercel, chọn repo `thu-vien-sgk` và dùng các giá trị:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Nếu API đọc PDF nằm ở domain khác, thêm biến môi trường:

```text
VITE_BOOKS_API_BASE_URL=https://ten-domain-api-cua-ban
```

Không thêm dấu `/` cuối URL. Khi không đặt biến này, app sẽ gọi `/api/books/:id`, phù hợp cho chạy local hoặc Cloudflare Pages Function cùng domain.

## Cấu trúc quan trọng

- `src/pages`: trang chủ, trang lớp và trang sách.
- `src/components/PdfViewer.tsx`: trình đọc chỉ render trang hiện tại và trang kế tiếp.
- `functions/api/books/[id].ts`: API stream PDF từ R2, hỗ trợ Range, ETag và tải xuống.
- `scripts/catalog-core.mjs`: chuẩn hóa tên, môn, lớp, tập và loại tài liệu.
- `scripts/ingest-books.mjs`: kiểm tra PDF, sinh bìa, upload và xác minh R2.
- `data/drive-inventory.json`: danh mục nguồn đã quét từ Google Drive.

Không có analytics, quảng cáo, cookie theo dõi hoặc thu thập dữ liệu học sinh.
