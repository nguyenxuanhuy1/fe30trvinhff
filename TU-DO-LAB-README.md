# Tủ đồ + Cổng vào phòng thí nghiệm + Bài học hand tracking dạng plugin

Hệ thống gồm 3 phần: người chơi nhận đồ vào tủ, trang bị đồ theo slot, và chỉ
vào được bài học thí nghiệm khi đã mặc đủ đồ bài đó yêu cầu. Bài học là **file
HTML độc lập**, thêm bài mới không phải sửa code khung.

## Nguyên tắc bắt buộc

1. **Mọi kiểm tra quyền nằm ở server.** Frontend chỉ lo UX. localStorage không
   bao giờ là nguồn sự thật: sửa tay localStorage không vào được bài học, vì
   `POST /api/lab/enter/:slug` luôn đọc `equipped` trong DB.
2. **DB chỉ lưu id.** Không có `imageUrl`/metadata của đồ trong DB. Tên, slot,
   anchor, scale, ảnh đều lấy từ `public/items/catalog.json` +
   `public/items/<id>.webp`.
3. **Không tin client.** `itemId`, `slug`, path bài học đều validate ở server.
   Path bài học lấy từ cột `lessons.path`, client không tự gửi path lên.
4. **API trả gọn.** `GET /api/inventory` trả đúng `{ owned, equipped }` là hai
   mảng số.

## Thêm món đồ mới (không sửa code)

1. Thêm ảnh `public/items/<id>.webp` (nền trong suốt, cạnh vuông).
2. Thêm 1 mục trong `public/items/catalog.json`:

```json
"6": {
  "name": "Khẩu trang",
  "slot": "TOP",
  "anchor": "BODY",
  "scale": 1,
  "offsetX": 0,
  "offsetY": 0,
  "unlockedBy": "level-demo-2"
}
```

- `slot`: `HAT` | `TOP` | `GLOVES` | `GLASSES`. Mỗi slot chỉ mặc được 1 món.
- `anchor`: `HEAD` | `HAND` | `BODY` — quyết định đồ vẽ ở đâu.
- `unlockedBy`: id bài học mở khoá món đồ này (xem mục "Hoàn thành màn").

Server đọc `catalog.json` và cache lại, tự làm mới khi file đổi (theo mtime) nên
thêm đồ không cần restart server. Catalog sai cấu trúc thì server báo lỗi rõ
tên field.

## Thêm bài học mới (chỉ 1 file + 1 dòng DB)

1. Tạo `public/lab-lessons/<slug>/index.html`.
2. Thêm 1 dòng vào bảng `lessons`:

```sql
INSERT INTO lessons (id, "roomId", name, slug, path, "requiredSlots", "updatedAt")
VALUES (
  'lab-nghien-cuu-1',
  (SELECT id FROM rooms LIMIT 1),
  'Bài mới',
  'nghien-cuu-1',
  '/lab-lessons/nghien-cuu-1/index.html',
  '["HAT","GLOVES"]'::jsonb,
  now()
);
```

`path` phải bắt đầu bằng `/lab-lessons/`. Không dùng `public/lessons/` vì sẽ
đụng route `/lessons` của app.

Bài học tự nạp SDK:

```html
<script src="/lab-sdk.js"></script>
<script type="module">
  LabSDK.onReady(function (equipped) {
    // equipped = [{ id, name, slot, anchor, scale, offsetX, offsetY, imageUrl }]
    // CHỉ khởi tạo camera / MediaPipe ở đây
  });

  function onFrame(ctx, face, hands) {
    LabSDK.drawAvatar(ctx, { face, hands });  // vẽ đồ đang mặc lên mặt/tay
  }

  function xong() {
    LabSDK.complete({ score: 100 });  // trang chủ kiểm tra origin rồi lưu
  }
</script>
```

`onReady` chỉ chạy **sau khi** SDK tải xong ảnh đồ đang mặc. Trước đó bài học
hiện màn loading tối với thanh tiến độ và chữ "Đang chuẩn bị đồ thí nghiệm...".
Ảnh lỗi bị bỏ qua, không làm treo.

### API SDK

| Hàm | Công dụng |
| --- | --- |
| `LabSDK.onReady(cb)` | Chạy khi đồ đã tải xong. Nhận mảng `equipped`. |
| `LabSDK.getEquipped()` | Đồ đang mặc (mảng đã gộp metadata). |
| `LabSDK.isReady()` | Đã sẵn sàng chưa. |
| `LabSDK.drawAvatar(ctx, { face, hands })` | Vẽ đồ lên khung hình. |
| `LabSDK.complete(result)` | Báo kết quả về trang chủ. |

### Landmark dùng để vẽ đồ

- **HEAD**: đỉnh trán (10), hai má (234/454) để tính kích thước và góc xoay đầu.
  Mũ đặt trên đỉnh trán, kính đặt ở mắt — cùng anchor `HEAD` nhưng khác vị trí
  theo `slot`.
- **HAND**: cổ tay (0) và gốc ngón giữa (9) cho từng bàn tay, vẽ lên cả hai tay.
- **BODY**: đặt từ cằm (152) trở xuống.
- `scale` / `offsetX` / `offsetY` trong catalog được áp lên mọi món.

## Hoàn thành màn, nhận đồ

```http
POST /api/levels/:id/complete
```

Trả `{ rewards: number[] }`. Mọi món đồ có `unlockedBy` trùng `:id` được cấp,
`createMany skipDuplicates` nên gọi lại nhiều lần **không nhân đôi**.

Logic chấm "đã qua màn" nằm riêng trong
`backend/src/services/levelCompletion.service.js`, hàm `verifyLevelCompletion()`.
Hiện là bản tối giản: bài học phải tồn tại, đang published và không phải bài thí
nghiệm. **Khi game có logic chấm điểm thật thì chỉ sửa đúng hàm này**, phần trao
đồ không phải đụng tới.

Trong repo này id bài học là UUID dạng chuỗi (không phải số), nên `unlockedBy`
trong catalog cũng là chuỗi, ví dụ `"level-demo-1"`.

### Báo hoàn thành màn từ bài học HTML

API trên **không có nút bấm cho người học**: bấm nút thì chỉ cần bấm là có đồ,
không chứng minh gì. Bài học phải tự báo khi đã chơi xong.

Bài học HTML chạy trong iframe của trang
`/phong/[roomId]/[lessonId]`. Từ trong bài, gọi:

```js
parent.postMessage({ type: "LESSON_COMPLETE", score: 100 }, "*");
```

Player nghe thấy thì gọi `POST /api/levels/:id/complete` với `id` của bài và hiện
kết quả ngay dưới khung bài học.

Hai lưu ý kỹ thuật:

- **Phải dùng `"*"` chứ không dùng `location.origin`.** Bài học nằm trong iframe
  `srcdoc` bị sandbox nên `location.origin` trả về chuỗi `"null"`; truyền nó vào
  `postMessage` sẽ ném lỗi `Invalid target origin 'null'` và tín hiệu không bao
  giờ tới. Dùng `"*"` ở đây vẫn an toàn vì phía trang chủ kiểm tra cả
  `event.origin` lẫn `event.source` trước khi gọi API.
- Bài chạy `<script type="module">` thì biến cấp module **không** truy cập được
  từ bên ngoài, kể cả từ console hay công cụ kiểm thử. Không dựa vào việc sửa
  biến nội bộ để ép trạng thái; hãy để bài tự chạy tới điểm hoàn thành thật.

Mẫu tham chiếu: `backend/prisma/assets/level-demo-1.html` (rót đầy bình) và
`level-demo-2.html` (làm đủ 3 bước). Hai file này được `npm run prisma:seed` nạp
vào DB, nên database trống cũng có bài để chơi. Sửa nội dung trong admin sẽ bị
ghi đè khi chạy lại seed.

Bài thí nghiệm dạng plugin (`/lab/[slug]`) dùng đường khác: `LabSDK.complete()`
trong `public/lab-sdk.js`, trang chủ nhận rồi `POST /api/lab/result` để lưu kết
quả. Bài plugin không cấp đồ, đồ chỉ đến từ `unlockedBy`.

## Bảo mật

- `postMessage` hai chiều đều kiểm tra origin; phía trang chủ còn kiểm tra
  `event.source === iframe.contentWindow`.
- `labToken` là JWT ký bằng `LAB_SECRET`, payload `{ sub, lesson }`, hạn 2 giờ,
  tách khỏi JWT đăng nhập. Nộp kết quả bằng token của tài khoản khác sẽ bị 403.
- `result` giới hạn 10KB, rate limit 30 lần/phút.
  `/api/levels/:id/complete` rate limit 20 lần/phút.
- Rate limit đang in-memory theo tiến trình. Khi chạy nhiều instance PM2 thì mỗi
  instance một bộ đếm riêng; muốn chặt hơn thì thêm Redis.
- **Bài học là HTML do chủ project tự viết và chạy cùng origin**, nên được tin
  cậy như mã của chính dự án. Nếu sau này cho người khác upload bài học thì bắt
  buộc phải: tách subdomain riêng cho bài học, thêm `sandbox` iframe, và chỉ
  cho phép origin đó trong CSP. Không làm vậy thì người đó chạy được script
  trong tài khoản người chơi.
- Server backend dùng `helmet()`, nhưng header đó chỉ áp cho response của API.
  Trang bài học do Next phục vụ nên không bị ảnh hưởng; xem mục nginx bên dưới.

## Cache

Khai báo **một chỗ duy nhất** là `next.config.ts`. Không khai báo Cache-Control ở
nginx, vì nginx nằm ngoài sẽ ghi đè header của Next và hai bên dễ lệch nhau.

| Đường dẫn | Cache-Control |
| --- | --- |
| `/items/<id>.webp` | `public, max-age=31536000, immutable` |
| `/items/catalog.json` | `no-cache, must-revalidate` |
| `/models/*` | `public, max-age=31536000, immutable` |
| `/vendor/tasks-vision/*` | `public, max-age=31536000, immutable` |
| `/lab-lessons/*`, `/lab-sdk.js` | `no-cache, must-revalidate` |

Ảnh đồ đặt tên theo id nên đổi ảnh phải đổi luôn tên file, cache mới đúng.
Bài học và SDK không cache để sửa file là ăn ngay.

Trong `nginx.snippet.conf` chỉ khai báo proxy và header bảo mật. Lưu ý khi sửa
file đó: `add_header` bên trong `location` sẽ **thay thế** toàn bộ `add_header` ở
server block chứ không gộp vào, nên HSTS / X-Frame-Options / Permissions-Policy sẽ
mất ở các đường dẫn đó. Vì vậy snippet không khai báo `add_header` trong
`location` nào.

### Không phụ thuộc CDN

Thư viện MediaPipe nằm sẵn trong `public/vendor/tasks-vision/` (bundle + wasm,
khoảng 19MB) và model nằm ở `public/models/*.task`. Bài học dùng đường dẫn
tương đối `/vendor/...` và `/models/...` nên chạy được khi máy chủ hoặc VPS bị
chặn mạng ra ngoài. File của bên thứ ba này đã bị loại khỏi ESLint trong
`eslint.config.mjs`, không sửa tay. Khi dùng `output: "standalone"` nhớ copy
`public/` sang, nếu không sẽ mất luôn bài học.

## Deploy

Xem `nginx.snippet.conf`. Ba điểm bắt buộc:

1. **HTTPS bắt buộc** — camera (`getUserMedia`) chỉ chạy trên secure context.
2. `X-Frame-Options: SAMEORIGIN` và `Permissions-Policy: camera=(self)` để
   iframe bài học + camera chạy được. Không dùng `frame-ancestors 'none'`.
3. Nếu chuyển Next sang `output: 'standalone'`, **phải copy `public/`** sang
   `.next/standalone/`, nếu không sẽ mất `/items`, `/models`, `/lab-sdk.js`,
   `/lab-lessons` và bài học sẽ trắng trang. Hướng dẫn cụ thể có trong
   `nginx.snippet.conf`.
