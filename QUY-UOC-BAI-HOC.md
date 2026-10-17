# Quy ước HTML bài học

Có **2 loại bài học**, khác nhau về chỗ chứa và cách báo hoàn thành.

---

## Loại 1 — Bài trong phòng (`/phong/[roomId]/[lessonId]`)

**Chứa ở:** `backend/prisma/assets/<id>.html` (seed đọc file này nhúng vào DB)

**Ví dụ:** `level-demo-1.html` (pha trộn, có camera), `level-demo-2.html` (quan sát, chỉ bấm)

**Yêu cầu:**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>/* tự chứa toàn bộ, không được import CSS ngoài */</style>
</head>
<body>
  <!-- nội dung + UI -->

  <script>
    // BÁO HOÀN THÀNH
    parent.postMessage({ type: "LESSON_COMPLETE", score: 100 }, location.origin);
  </script>
</body>
</html>
```

**Bắt buộc:**

| Việc | Cách làm |
|---|---|
| Báo hoàn thành | `parent.postMessage({ type: "LESSON_COMPLETE", score }, location.origin)` (score từ 0 - 100, trên 70% mới qua màn) |
| Chống báo 2 lần | cờ `reported = true` ở đầu hàm `report()` |
| Không lỗi thì vẫn chạy | bọc `postMessage` trong `try/catch` |
| Tự báo, không có nút | **không** đặt nút hay popup "Hoàn thành" riêng trong HTML, hệ thống web sẽ tự hiện card thông báo |

**Vì sao `location.origin` dùng được:** iframe được mount bằng `srcDoc` với `sandbox="allow-scripts allow-same-origin ..."`, nên bài chạy cùng origin với trang chủ. Trang chủ kiểm tra cả `event.origin` lẫn `event.source` trước khi gọi API, nên không cần mở `"*"` — truyền `"*"` chỉ là lỏng tay thừa.

**Camera / MediaPipe** (nếu bài cần):

```js
// 1. khởi tạo model ĐẦU TIÊN, disable nút cho tới khi xong
handLandmarker = await HandLandmarker.createFromOptions(
  await FilesetResolver.forVisionTasks("/vendor/tasks-vision/wasm"),
  {
    baseOptions: {
      modelAssetPath: "/models/hand_landmarker.task",  // file local, KHÔNG tải CDN
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  }
);
btnStart.disabled = false;
```

- Model phải nằm trong `public/models/`, wasm trong `public/vendor/tasks-vision/`
- **Không** dùng import từ `cdn.jsdelivr.net`
- Vòng lặp `loop()` phải `try/catch` và `return` vẫn gọi `requestAnimationFrame(loop)` ở nhánh lỗi — không thì một frame hỏng giết cả bài

**Cấu hình seed:**

```js
{ id: "level-demo-3", name: "Màn 3: ...", order: 3, htmlAsset: "level-demo-3.html",
  requiredSlots: [], slug: null, path: null }
```

`requiredSlots` rỗng — bài này không cần đồ. Cấp đồ qua `catalog.json` (`unlockedBy: "level-demo-3"`).

---

## Loại 2 — Bài thí nghiệm (`/lessons` → `/lab/[slug]`)

**Chứa ở:** `frontend/public/lab-lessons/<slug>/index.html`

**Ví dụ:** `demo/index.html` (nhỏ giọt bằng cử chỉ tay)

**Khác loại 1:** chạy thật trong iframe `src=`, nên `location.origin` **không null** → `postMessage` truyền origin thật. Có `LabSDK` lo phần đồ.

**Cấu trúc:**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>/* tự chứa */</style>
</head>
<body>
  <canvas id="overlay"></canvas>
  <video id="video" playsinline></video>

  <script src="/lab-sdk.js"></script>
  <script type="module">
    import { FilesetResolver, HandLandmarker } from "/vendor/tasks-vision/vision_bundle.mjs";

    // BẮT BUỘC: mọi việc khởi tạo nằm trong onReady
    LabSDK.onReady(async function (equipped) {
      // equipped = [{ id, name, slot, anchor, top, scale, imageUrl }]
      await startCamera();
      requestAnimationFrame(loop);
    });

    function loop() {
      // ... xử lý khung hình ...
      LabSDK.drawAvatar(ctx, { face, hands });
    }

    function finish() {
      if (finished) return;          // chống báo 2 lần
      finished = true;
      LabSDK.complete({ score, drops });   // host tự gọi API, giới hạn 10KB
    }
  </script>
</body>
</html>
```

**Bắt buộc:**

| Việc | Cách làm |
|---|---|
| Nạp SDK | `<script src="/lab-sdk.js"></script>` — không bundler, không import |
| Chờ đồ sẵn sàng | mọi khởi tạo trong `LabSDK.onReady(cb)`; SDK tự tải ảnh đồ rồi mới gọi cb |
| Vẽ đồ lên người | `LabSDK.drawAvatar(ctx, { face, hands })` mỗi frame |
| Báo hoàn thành | `LabSDK.complete(result)` — object ≤ 10KB |
| Chống báo 2 lần | cờ `finished` ở đầu `finish()` |

**Cấu hình seed:**

```js
{ id: "lab-demo-2", name: "Thí nghiệm: ...", order: 4,
  requiredSlots: ["hat", "shirt"],        // slot đúng tên trong catalog.json
  slug: "ten-bai", path: "/lab-lessons/ten-bai/index.html" }
```

`requiredSlots` dùng đúng 3 giá trị: `hat`, `shirt`, `trousers`. Thiếu đồ thì server chặn 403, client đá về tủ đồ.

---

## Quy ước đồ (cả 2 loại)

```
public/items/
  catalog.json          ← name + unlockedBy, KHÔNG ghi slot
  hat_circle.webp       ← slot = "hat" (chữ trước dấu _ đầu tiên)
  shirt_labcoat.webp    ← slot = "shirt"
  trousers_navy.webp    ← slot = "trousers"
```

Thêm đồ mới: thả ảnh + thêm 1 dòng JSON. Không sửa code.

```json
{
  "hat_circle": { "name": "Mũ bảo hộ tròn", "unlockedBy": "level-demo-1" }
}
```

---

## Bảng chọn nhanh

| | Loại 1 (phòng) | Loại 2 (thí nghiệm) |
|---|---|---|
| Chỗ chứa | `backend/prisma/assets/` | `frontend/public/lab-lessons/<slug>/` |
| Nạp vào | iframe `srcDoc` | iframe `src` |
| Báo hoàn thành | `parent.postMessage(..., "*")` | `LabSDK.complete()` |
| Cần đồ | không | có (`requiredSlots`) |
| Vẽ đồ lên người | tự vẽ | `LabSDK.drawAvatar()` |
| `origin` trong bài | origin trang chủ | origin trang chủ |
| Cấp đồ khi xong | qua `unlockedBy` | không cấp |

---

## Prompt để nhờ AI viết bài học mới

```
Viết bài học HTML cho dự án Steam Game Center, tuân thủ đúng quy ước đã định.

LOẠI BÀI: [loại 1 - bài trong phòng | loại 2 - bài thí nghiệm]
TÊN BÀI: ...
MÔ TẢ: ...
ĐỒ CẦN MẶC: [hat, shirt, trousers | không cần]
CẦN CAMERA: [có | không]

Bắt buộc:
- 1 file HTML độc lập, tự chứa CSS, không import gì ngoài
- Tiếng Việt, giao diện tối, nền #0e0f12, nhấn #5ec8ff
- <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

Nếu loại 1:
- Báo hoàn thành: parent.postMessage({ type: "LESSON_COMPLETE", score: Math.round((correct / total) * 100) }, location.origin)
- score tính từ 0 đến 100 (yêu cầu trên 70% mới đạt).
- Cờ reported chống báo 2 lần, try/catch quanh postMessage
- KHÔNG tạo popup hay nút "Hoàn thành" riêng trong bài, hệ thống web sẽ tự hiện card thông báo
- Nếu cần camera: import từ /vendor/tasks-vision/vision_bundle.mjs,
  modelAssetPath: "/models/hand_landmarker.task" (file local, không CDN)
- Vòng lặp loop() try/catch và vẫn requestAnimationFrame(loop) ở nhánh lỗi

Nếu loại 2:
- <script src="/lab-sdk.js"></script>
- Mọi khởi tạo nằm trong LabSDK.onReady(function (equipped) { ... })
- Mỗi frame gọi LabSDK.drawAvatar(ctx, { face, hands })
- Báo hoàn thành: LabSDK.complete({ score: correct, maxScore: total }), cờ finished chống 2 lần
- result không quá 10KB

Trả về: nội dung file HTML hoàn chỉnh, không giải thích thêm.
```

---

## File tham chiếu

| File | Vai trò |
|---|---|
| `frontend/public/lab-sdk.js` | SDK dùng chung cho bài loại 2 |
| `backend/prisma/seed.js` | khai báo bài + đọc file assets |
| `frontend/public/items/catalog.json` | danh mục đồ, slot suy ra từ tên ảnh |
| `backend/src/config/itemSlots.js` | quy ước slot phía server |
| `frontend/src/modules/inventory/item-slots.ts` | quy ước slot phía client |
| `frontend/src/app/phong/[roomId]/[lessonId]/lesson-complete-bridge.tsx` | nhận `LESSON_COMPLETE` |
| `frontend/src/app/lab/[slug]/lab-host.tsx` | nhận `COMPLETE` |
