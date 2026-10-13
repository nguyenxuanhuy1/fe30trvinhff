# PROMPT NHỜ AI TẠO BÀI HỌC HTML (theo quy ước dự án)

Dùng cái này khi muốn tạo bài mới.

## Prompt chọn loại

### Biến thể 1: BÀI TRONG PHÒNG (Level) — loại 1
```text
Viết bài học HTML cho dự án Steam Game Center (quy ước "bài trong phòng").

LOẠI BÀI: 1 - bài trong phòng (/phong/[roomId]/[lessonId])
ID BÀI: [vd: level-demo-3]
TÊN BÀI: [vd: Màn 3: Cân bằng mẫu]
MÔ TẢ: [vd: mô tả ngắn mục tiêu bài]
CẦN CAMERA: [có | không]
ĐỒ CẦN MẶC: không cần (requiredSlots = [])

YÊU CẦU TUÂN THỦ NGHIÊM NGẶT:
- 1 file HTML ĐỘC LẬP, tự chứa toàn bộ CSS/JS, KHÔNG import CSS ngoài, KHÔNG dùng CDN.
- Tiếng Việt. Giao diện tối (#0e0f12), nhấn (#5ec8ff), chữ dễ đọc.
- <meta charset="UTF-8">
- <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
- Iframe có sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups", bài chạy cùng origin trang chủ → dùng location.origin.
- Báo hoàn thành: parent.postMessage({ type: "LESSON_COMPLETE", score: 100 }, location.origin)
- Phải có CỜ CHỐNG BÁO 2 LẦN (vd. let reported = false; if (reported) return; reported = true)
- Bọc postMessage trong try/catch
- KHÔNG có nút "Hoàn thành" cho người dùng bấm (bài tự báo khi hoàn thành)
- Vòng lặp (nếu có requestAnimationFrame) phải có try/catch, vẫn gọi requestAnimationFrame tiếp ở nhánh lỗi

NẾU CẦN CAMERA + MEDIAPIPE:
- Import: import { FilesetResolver, HandLandmarker, FaceLandmarker } from "/vendor/tasks-vision/vision_bundle.mjs";
- FilesetResolver.forVisionTasks("/vendor/tasks-vision/wasm")
- modelAssetPath: "/models/hand_landmarker.task" (chỉ dùng file local trong public/models/, KHÔNG tải CDN)
- runningMode: "VIDEO", xử lý mỗi frame an toàn, không leak
- Vô hiệu hoá UI khởi động cho tới khi model sẵn sàng

KẾT QUẢ TRẢ VỀ: CHỈ nội dung file HTML hoàn chỉnh (backend/prisma/assets/<ID>.html). KHÔNG giải thích, KHÔNG markdown code block ngoài nội dung file.
```

### Biến thể 2: BÀI THÍ NGHIỆM (Lab Plugin) — loại 2
```text
Viết bài học HTML cho dự án Steam Game Center (quy ước "bài thí nghiệm").

LOẠI BÀI: 2 - bài thí nghiệm (chạy trong /lab/[slug])
SLUG: [vd: demo-moi]
TÊN BÀI: [vd: Thí nghiệm: đo lực bóp]
MÔ TẢ: [vd: mục tiêu, điều kiện hoàn thành]
ĐỒ CẦN MẶC: [vd: hat, shirt | hat, shirt, trousers | không]
CẦN CAMERA: [có | không]

YÊU CẦU TUÂN THỦ NGHIÊM NGẶT:
- File: frontend/public/lab-lessons/<SLUG>/index.html (1 file HTML độc lập)
- Tự chứa toàn bộ CSS/JS. KHÔNG import CSS ngoài.
- Tiếng Việt. Giao diện tối (#0e0f12), nhấn (#5ec8ff).
- <meta charset="UTF-8">
- <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
- BẮT BUỘC: <script src="/lab-sdk.js"></script> TRƯỚC script module
- MỌI khởi tạo camera/model/UI phải nằm trong LabSDK.onReady(function (equipped) { ... }) — KHÔNG chạy ngoài
- Mỗi frame (nếu có render): gọi LabSDK.drawAvatar(ctx, { face, hands })
- Báo hoàn thành: LabSDK.complete(result) với result là object thuần JS, ≤ 10KB
- Cờ chống báo 2 lần: let finished = false; if (finished) return; finished = true
- Xử lý lỗi trong vòng lặp (try/catch), vẫn tiếp tục requestAnimationFrame

NẾU CẦN CAMERA + MEDIAPIPE:
- Import module: import { FilesetResolver, HandLandmarker, FaceLandmarker } from "/vendor/tasks-vision/vision_bundle.mjs";
- FilesetResolver.forVisionTasks("/vendor/tasks-vision/wasm")
- modelAssetPath: "/models/hand_landmarker.task" (file local, KHÔNG CDN)
- runningMode: "VIDEO"
- Chỉ khởi tạo model SAU khi LabSDK.onReady gọi (đã tải xong ảnh đồ)

KẾT QUẢ TRẢ VỀ: CHỈ nội dung file HTML hoàn chỉnh. KHÔNG giải thích thêm.
```

## Hướng dẫn dùng sau khi AI trả kết quả

### Với loại 1 (bài trong phòng)
1. Lưu nội dung vào `backend/prisma/assets/<ID>.html`
2. Thêm/sửa mục trong `backend/prisma/seed.js` (hoặc DB): `{ id: "<ID>", htmlAsset: "<ID>.html", requiredSlots: [], slug: null, path: null, ... }`
3. Chạy seed: `cd backend && npx prisma db seed` (hoặc `npm run prisma:seed`)
4. Kiểm tra `/phong/<roomId>/<lessonId>`

### Với loại 2 (bài thí nghiệm)
1. Tạo thư mục `frontend/public/lab-lessons/<SLUG>/`
2. Lưu file `index.html` vào thư mục đó
3. Thêm/sửa lesson trong DB/seed: `slug: "<SLUG>", path: "/lab-lessons/<SLUG>/index.html", requiredSlots: ["hat","shirt",...]`
4. Chạy seed backend nếu sửa DB: `cd backend && npx prisma db seed`
5. Kiểm tra qua `/lessons` → mặc đủ đồ → vào `/lab/<SLUG>`

## LƯU Ý QUAN TRỌNG
- **Chỉ dùng file local**: `/vendor/tasks-vision/*`, `/models/*.task`. Tuyệt đối KHÔNG dùng CDN.
- **Bảo mật postMessage**: loại 1 dùng `location.origin`, loại 2 dùng `LabSDK.complete()` (host tự kiểm tra origin+source).
- **Không bypass server**: `requiredSlots` kiểm tra ở backend (`/api/lab/enter/:slug`). localStorage chỉ cache.
- **Chống double submit**: luôn có cờ `reported/finished`.
- **LabSDK** đã sửa để đọc slug (chuỗi), không dùng Number(id) nữa. đảm bảo dùng cấu trúc mới.
