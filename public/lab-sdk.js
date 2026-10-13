/*
 * lab-sdk.js - SDK dùng chung cho mọi bài học thí nghiệm.
 *
 * Bài học là 1 file HTML độc lập trong public/lab-lessons/<slug>/index.html, chỉ
 * cần:
 *   <script src="/lab-sdk.js"></script>
 *   LabSDK.onReady(function (equipped) { ... khởi tạo camera / MediaPipe ... });
 *
 * SDK tự lo phần chuẩn bị: nhận INIT từ trang chủ, hiện màn loading, tải trước
 * ảnh đồ đang mặc, xong mới gọi onReady. Nhờ vậy bài học không bao giờ bật camera
 * khi đồ chưa sẵn sàng vẽ lên mặt/tay.
 *
 * Không phụ thuộc bundler, không import: chạy thẳng trong iframe.
 */
(function () {
  "use strict";

  var CATALOG_URL = "/items/catalog.json";
  var SLOT_GAP = 8; // khoảng cách tối thiểu giữa các món cùng nhóm khi chồng lên nhau

  // Đảm bảo sân khấu bài học và camera/canvas luôn lấp đầy 100% cả chiều rộng và chiều cao
  (function injectFullscreenFix() {
    function applyStyle() {
      if (document.getElementById("lab-sdk-fullscreen-fix")) return;
      var style = document.createElement("style");
      style.id = "lab-sdk-fullscreen-fix";
      style.textContent = [
        "html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }",
        "#stage, .stage { width: 100% !important; height: 100% !important; max-width: none !important; }",
      ].join("\n");
      var target = document.head || document.documentElement;
      if (target) {
        target.appendChild(style);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyStyle);
    } else {
      applyStyle();
    }
  })();

  // Quy ước đồ giống hệt backend/src/config/itemSlots.js và
  // src/modules/inventory/item-slots.ts. Slot suy ra từ chữ trước dấu gạch
  // dưới đầu tiên của tên ảnh: "hat_circle" -> "hat". catalog.json không
  // ghi slot nên phải tự suy ra ở đây.
  var SLOT_DEFAULTS = {
    hat: { anchor: "HEAD", top: 6, scale: 1, offsetX: 0, offsetY: 0 },
    glasses: { anchor: "HEAD", top: 20, scale: 1, offsetX: 0, offsetY: 0 },
    mask: { anchor: "HEAD", top: 0, scale: 1, offsetX: 0, offsetY: 0 },
    shirt: { anchor: "BODY", top: 42, scale: 1, offsetX: 0, offsetY: 0 },
    trousers: { anchor: "BODY", top: 66, scale: 1, offsetX: 0, offsetY: 0 },
  };

  function slotFromSlug(slug) {
    var slot = String(slug).split("_")[0];
    return Object.prototype.hasOwnProperty.call(SLOT_DEFAULTS, slot) ? slot : null;
  }

  var state = {
    ready: false,
    equipped: [],
    images: {},
    readyCallbacks: [],
    failed: false,
  };

  // ---------------------------------------------------------------- overlay

  var overlay = null;

  function ensureOverlay() {
    if (overlay) {
      return overlay;
    }

    var root = document.createElement("div");
    root.setAttribute("data-lab-sdk", "loading");
    root.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "justify-content:center",
      "gap:16px",
      "background:#0b1020",
      "color:#e5e7eb",
      "font-family:system-ui,-apple-system,'Segoe UI',sans-serif",
      "text-align:center",
      "padding:24px",
    ].join(";");

    var title = document.createElement("p");
    title.style.cssText = "margin:0;font-size:18px;font-weight:600;";
    title.textContent = "Đang chuẩn bị đồ thí nghiệm...";

    var barWrap = document.createElement("div");
    barWrap.style.cssText =
      "width:min(420px,80vw);height:10px;border-radius:999px;background:#1f2937;overflow:hidden;";

    var bar = document.createElement("div");
    bar.style.cssText =
      "height:100%;width:0%;background:linear-gradient(90deg,#3b82f6,#22c55e);transition:width .2s ease;";

    var hint = document.createElement("p");
    hint.style.cssText = "margin:0;font-size:14px;color:#9ca3af;";
    hint.textContent = "Đang tải trang bị của bạn";

    var retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Tải lại";
    retry.style.cssText = [
      "display:none",
      "padding:10px 22px",
      "border-radius:8px",
      "border:0",
      "background:#3b82f6",
      "color:#fff",
      "font-size:14px",
      "cursor:pointer",
    ].join(";");
    retry.addEventListener("click", function () {
      window.location.reload();
    });

    barWrap.appendChild(bar);
    root.appendChild(title);
    root.appendChild(barWrap);
    root.appendChild(hint);
    root.appendChild(retry);
    document.body.appendChild(root);

    overlay = {
      setProgress: function (percent, text) {
        bar.style.width = Math.max(0, Math.min(100, Math.round(percent))) + "%";
        if (text) {
          hint.textContent = text;
        }
      },
      close: function () {
        if (root.parentNode) {
          root.parentNode.removeChild(root);
        }
        overlay = null;
      },
      fail: function (text) {
        state.failed = true;
        title.textContent = "Không chuẩn bị được đồ";
        hint.textContent = text;
        barWrap.style.display = "none";
        retry.style.display = "inline-block";
      },
    };

    return overlay;
  }

  // --------------------------------------------------------------- preload

  var croppedCache = {};

  function cropTransparent(img) {
    var src = img.src;
    if (croppedCache[src]) {
      return Promise.resolve(croppedCache[src]);
    }

    try {
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      if (!w || !h) return Promise.resolve(img);

      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return Promise.resolve(img);

      ctx.drawImage(img, 0, 0);
      var data = ctx.getImageData(0, 0, w, h);
      var minX = w, minY = h, maxX = 0, maxY = 0;

      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var alpha = data.data[(y * w + x) * 4 + 3];
          if (alpha > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (minX > maxX || minY > maxY || (minX === 0 && minY === 0 && maxX === w - 1 && maxY === h - 1)) {
        croppedCache[src] = img;
        return Promise.resolve(img);
      }

      var cropW = maxX - minX + 1;
      var cropH = maxY - minY + 1;
      var cCanvas = document.createElement("canvas");
      cCanvas.width = cropW;
      cCanvas.height = cropH;
      var cCtx = cCanvas.getContext("2d");
      if (!cCtx) return Promise.resolve(img);

      cCtx.putImageData(ctx.getImageData(minX, minY, cropW, cropH), 0, 0);

      var cImg = new Image();
      return new Promise(function (resolve) {
        cImg.onload = function () {
          croppedCache[src] = cImg;
          resolve(cImg);
        };
        cImg.onerror = function () {
          resolve(img);
        };
        cImg.src = cCanvas.toDataURL("image/png");
      });
    } catch (e) {
      return Promise.resolve(img);
    }
  }

  function loadImage(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        cropTransparent(img).then(function (finalImg) {
          resolve(finalImg);
        }).catch(function () {
          resolve(img);
        });
      };
      // Ảnh lỗi thì bỏ qua, không được làm treo cả màn loading
      img.onerror = function () {
        resolve(null);
      };
      img.decoding = "async";
      img.src = url;
    });
  }

  function preloadImages(items, onProgress) {
    if (items.length === 0) {
      onProgress(100, "Không có đồ nào cần tải");
      return Promise.resolve();
    }

    var done = 0;

    return Promise.all(
      items.map(function (item) {
        return loadImage(item.imageUrl).then(function (img) {
          if (img) {
            state.images[item.id] = img;
          }
          done += 1;
          onProgress(
            (done / items.length) * 100,
            "Đã tải " + done + "/" + items.length + " món đồ",
          );
        });
      }),
    );
  }

  // ------------------------------------------------------------ khởi tạo

  function buildEquipped(ids, catalog) {
    return ids
      .map(function (id) {
        var slug = String(id);
        var meta = catalog[slug] || { name: slug };
        var slot = slotFromSlug(slug) || (slug.startsWith("mask") ? "mask" : (slug.startsWith("glasses") ? "glasses" : "hat"));

        var defaults = SLOT_DEFAULTS[slot] || { anchor: "HEAD", top: 0, scale: 1, offsetX: 0, offsetY: 0 };
        var ext = (meta && meta.ext) ? meta.ext : (slug.startsWith("mask_") || slug.startsWith("glasses_") ? "png" : "webp");

        return {
          id: slug,
          name: meta.name || slug,
          slot: slot,
          anchor: defaults.anchor,
          top: defaults.top,
          scale: typeof meta.scale === "number" ? meta.scale : defaults.scale,
          offsetX: typeof meta.offsetX === "number" ? meta.offsetX : defaults.offsetX,
          offsetY: typeof meta.offsetY === "number" ? meta.offsetY : defaults.offsetY,
          imageUrl: "/items/" + slug + "." + ext,
        };
      })
      .filter(Boolean);
  }

  function init(ids) {
    if (state.ready || state.failed) {
      return;
    }

    var ui = ensureOverlay();
    ui.setProgress(5, "Đang tải danh mục đồ");

    window
      .fetch(CATALOG_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }
        return res.json();
      })
      .then(function (catalog) {
        var items = buildEquipped(Array.isArray(ids) ? ids : [], catalog);
        state.equipped = items;

        if (items.length === 0) {
          ui.setProgress(100, "Không có đồ nào đang mặc");
        }

        return preloadImages(items, function (percent, text) {
          ui.setProgress(percent, text);
        });
      })
      .then(function () {
        if (overlay) {
          overlay.close();
        }
        state.ready = true;

        var callbacks = state.readyCallbacks.splice(0, state.readyCallbacks.length);
        for (var i = 0; i < callbacks.length; i += 1) {
          try {
            callbacks[i](state.equipped);
          } catch (err) {
            console.error("[LabSDK] onReady lỗi", err);
          }
        }
      })
      .catch(function (err) {
        console.error("[LabSDK] chuẩn bị đồ thất bại", err);
        ensureOverlay().fail(
          "Không tải được danh mục đồ (" +
            (err && err.message ? err.message : "lỗi mạng") +
            "). Bạn có thể thử tải lại trang.",
        );
      });
  }

  // Tự động khởi tạo sau 250ms nếu trang mẹ không gửi INIT hoặc bài chạy độc lập
  var autoInitTimer = setTimeout(function () {
    if (!state.ready && !state.failed) {
      var fallbackEquipped = [];
      try {
        var retro = JSON.parse(window.localStorage.getItem("retro_equipped_items") || "{}");
        if (retro && typeof retro === "object") {
          fallbackEquipped = Object.values(retro).filter(Boolean);
        }
      } catch (e) {}
      if (!fallbackEquipped.length) {
        try {
          var simple = JSON.parse(window.localStorage.getItem("equipped_items") || "[]");
          if (Array.isArray(simple)) fallbackEquipped = simple;
        } catch (e) {}
      }
      init(fallbackEquipped);
    }
  }, 250);

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.type !== "INIT") {
      return;
    }

    clearTimeout(autoInitTimer);

    var ids = data.equipped;
    if (!Array.isArray(ids) || ids.length === 0) {
      try {
        var retro = JSON.parse(window.localStorage.getItem("retro_equipped_items") || "{}");
        if (retro && typeof retro === "object") {
          ids = Object.values(retro).filter(Boolean);
        }
      } catch (e) {}
      if (!ids || !ids.length) {
        try {
          var simple = JSON.parse(window.localStorage.getItem("equipped_items") || "[]");
          if (Array.isArray(simple)) ids = simple;
        } catch (e) {}
      }
    }

    if (data.avatarUrl) {
      state.avatarUrl = data.avatarUrl;
    }

    init(ids);
  });

  // ------------------------------------------------------------ vẽ đồ lên mặt/tay

  function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function angleBetween(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  // Landmark chuẩn của MediaPipe face mesh
  var FACE = { foreheadTop: 10, cheekA: 234, cheekB: 454, chin: 152, eyeA: 33, eyeB: 263, noseBridge: 168 };
  // Landmark chuẩn của MediaPipe hand landmarker
  var HAND = { wrist: 0, middleBase: 9 };

  var currentPose = null;
  var lastFaceTime = 0;

  function calculatePose(face) {
    var p10 = face[10];
    var p152 = face[152];
    var p234 = face[234];
    var p454 = face[454];
    var p1 = face[1];
    var p33 = face[33];
    var p263 = face[263];

    if (!p10 || !p152 || !p234 || !p454) {
      return null;
    }

    var faceVec = { x: p10.x - p152.x, y: p10.y - p152.y };
    var faceHeight = Math.hypot(faceVec.x, faceVec.y);
    if (!faceHeight) return null;

    var up = { x: faceVec.x / faceHeight, y: faceVec.y / faceHeight };
    var right = { x: -up.y, y: up.x };
    var rollHead = Math.atan2(up.x, -up.y);

    var headWidth = Math.hypot(p454.x - p234.x, p454.y - p234.y);
    if (!headWidth) return null;

    var yawSqueeze = 1;
    if (p1) {
      var dL = Math.hypot(p1.x - p234.x, p1.y - p234.y);
      var dR = Math.hypot(p1.x - p454.x, p1.y - p454.y);
      var yaw = (dL - dR) / (dL + dR || 1);
      yawSqueeze = Math.max(0.55, Math.min(1, 1 - Math.abs(yaw) * 1.2));
    }

    // Mắt
    var eyeMid = { x: (p10.x + p152.x) / 2, y: (p10.y + p152.y) / 2 };
    var eyeDist = headWidth * 0.5;
    var rollEyes = rollHead;
    if (p33 && p263) {
      eyeDist = Math.hypot(p33.x - p263.x, p33.y - p263.y);
      var eL = p33.x < p263.x ? p33 : p263;
      var eR = p33.x < p263.x ? p263 : p33;
      eyeMid = { x: (eL.x + eR.x) / 2, y: (eL.y + eR.y) / 2 };
      rollEyes = Math.atan2(eR.y - eL.y, eR.x - eL.x);
    }

    var midX = (p10.x + p152.x) / 2;
    var midY = (p10.y + p152.y) / 2;

    var hairLift = 0.12;
    var hatX = p10.x + up.x * faceHeight * hairLift;
    var hatY = p10.y + up.y * faceHeight * hairLift;

    var target = {
      p10: p10,
      p152: p152,
      midX: midX,
      midY: midY,
      headWidth: headWidth,
      faceHeight: faceHeight,
      rollHead: rollHead,
      yawSqueeze: yawSqueeze,
      eyeMid: eyeMid,
      eyeDist: eyeDist,
      rollEyes: rollEyes,
      hatX: hatX,
      hatY: hatY,
      up: up,
      right: right,
    };

    var now = performance.now();
    if (!currentPose || now - lastFaceTime > 300) {
      currentPose = target;
    } else {
      var t = 0.45;
      function lerp(a, b) { return a + (b - a) * t; }
      currentPose.midX = lerp(currentPose.midX, target.midX);
      currentPose.midY = lerp(currentPose.midY, target.midY);
      currentPose.headWidth = lerp(currentPose.headWidth, target.headWidth);
      currentPose.faceHeight = lerp(currentPose.faceHeight, target.faceHeight);
      currentPose.rollHead = lerp(currentPose.rollHead, target.rollHead);
      currentPose.yawSqueeze = lerp(currentPose.yawSqueeze, target.yawSqueeze);
      currentPose.eyeMid.x = lerp(currentPose.eyeMid.x, target.eyeMid.x);
      currentPose.eyeMid.y = lerp(currentPose.eyeMid.y, target.eyeMid.y);
      currentPose.eyeDist = lerp(currentPose.eyeDist, target.eyeDist);
      currentPose.rollEyes = lerp(currentPose.rollEyes, target.rollEyes);
      currentPose.hatX = lerp(currentPose.hatX, target.hatX);
      currentPose.hatY = lerp(currentPose.hatY, target.hatY);
    }
    lastFaceTime = now;
    return currentPose;
  }

  function computeHandBox(hand) {
    var wrist = hand[HAND.wrist];
    var middleBase = hand[HAND.middleBase];

    if (!wrist || !middleBase) {
      return null;
    }

    var span = distance(wrist, middleBase);
    if (!span) {
      return null;
    }

    return {
      centerX: (wrist.x + middleBase.x) / 2,
      centerY: (wrist.y + middleBase.y) / 2,
      size: span * 2.6,
      angle: angleBetween(wrist, middleBase) - Math.PI / 2,
    };
  }

  function drawItem(ctx, img, box, item) {
    var size = box.size * (item.scale || 1);
    var offsetX = (item.offsetX || 0) * size * 0.1;
    var offsetY = (item.offsetY || 0) * size * 0.1;

    ctx.save();
    ctx.translate(box.centerX + offsetX, box.centerY + offsetY);
    ctx.rotate(box.angle || 0);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  /**
   * Vẽ đồ đang mặc lên khung hình chuẩn xác theo tỷ lệ khuôn mặt.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {{face?: Array<{x:number,y:number}>, hands?: Array<Array<{x:number,y:number}>>, scale?: number}} data
   */
  function drawAvatar(ctx, data) {
    if (!ctx || !state.equipped.length) {
      return;
    }

    var face = data && data.face ? data.face : null;
    var hands = (data && data.hands) || [];
    var frameScale = data && typeof data.scale === "number" ? data.scale : 1;

    var cw = ctx.canvas ? ctx.canvas.width : 1;
    var ch = ctx.canvas ? ctx.canvas.height : 1;

    // Tự động nhận diện toạ độ normalized [0..1] của MediaPipe để nhân với kích thước canvas
    if (face && face.length && face[0] && face[0].x <= 2.0 && cw > 2) {
      face = face.map(function (p) {
        return { x: p.x * cw, y: p.y * ch };
      });
    }

    if (hands && hands.length && hands[0] && hands[0][0] && hands[0][0].x <= 2.0 && cw > 2) {
      hands = hands.map(function (h) {
        return h.map(function (p) {
          return { x: p.x * cw, y: p.y * ch };
        });
      });
    }

    var pose = face && face.length ? calculatePose(face) : null;

    for (var i = 0; i < state.equipped.length; i += 1) {
      var item = state.equipped[i];
      var img = state.images[item.id];

      if (!img || !img.naturalWidth) {
        continue;
      }

      if (item.slot === "mask" && pose) {
        var scaleX = 1.05 * (item.scale || 1);
        var scaleY = 1.2 * (item.scale || 1);
        var maskW = pose.headWidth * scaleX;
        var maskH = pose.faceHeight * scaleY;
        var offX = (item.offsetX || 0) * maskW * 0.01;
        var offY = (item.offsetY || 0) * maskH * 0.01;

        var cx = pose.midX + pose.up.x * pose.faceHeight * offY + pose.right.x * pose.headWidth * offX;
        var cy = pose.midY + pose.up.y * pose.faceHeight * offY + pose.right.y * pose.headWidth * offX;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(pose.rollHead);
        ctx.scale(pose.yawSqueeze, 1);
        ctx.drawImage(img, -maskW * 0.5, -maskH * 0.5, maskW, maskH);
        ctx.restore();
        continue;
      }

      if (item.slot === "glasses" && pose) {
        var gScale = 1.6 * (item.scale || 1);
        var gW = pose.eyeDist * gScale;
        var gH = gW * (img.naturalHeight / img.naturalWidth || 0.45);
        var gOffX = (item.offsetX || 0) * gW * 0.01;
        var gOffY = (item.offsetY || 0) * gH * 0.01;

        var gcx = pose.eyeMid.x + pose.up.x * pose.eyeDist * gOffY + pose.right.x * pose.eyeDist * gOffX;
        var gcy = pose.eyeMid.y + pose.up.y * pose.eyeDist * gOffY + pose.right.y * pose.eyeDist * gOffX;

        ctx.save();
        ctx.translate(gcx, gcy);
        ctx.rotate(pose.rollEyes);
        ctx.scale(pose.yawSqueeze, 1);
        ctx.drawImage(img, -gW * 0.5, -gH * 0.5, gW, gH);
        ctx.restore();
        continue;
      }

      if ((item.slot === "hat" || item.anchor === "HEAD") && pose) {
        var hatW = pose.headWidth * 1.3 * (item.scale || 1);
        var hatH = hatW * (img.naturalHeight / img.naturalWidth || 1);
        var hOffX = (item.offsetX || 0) * hatW * 0.01;
        var hOffY = (item.offsetY || 0) * hatH * 0.01;

        ctx.save();
        ctx.translate(pose.hatX + hOffX, pose.hatY + hOffY);
        ctx.rotate(pose.rollHead);
        ctx.scale(1, 1);
        ctx.drawImage(img, -hatW * 0.5, -hatH, hatW, hatH);
        ctx.restore();
        continue;
      }

      // BODY items (áo, quần)
      if (pose) {
        var personHeight = pose.headWidth * 5.2;
        var shoulderY = pose.midY + pose.faceHeight * 0.35;
        var slotTop = (SLOT_DEFAULTS[item.slot] && SLOT_DEFAULTS[item.slot].top) || 42;
        var bW = pose.headWidth * (item.slot === "trousers" ? 2.1 : 1.9) * (item.scale || 1);
        var bH = bW * (img.naturalHeight / img.naturalWidth || 1);

        ctx.save();
        ctx.translate(pose.midX, shoulderY + personHeight * (slotTop / 100));
        ctx.rotate(pose.rollHead);
        ctx.drawImage(img, -bW * 0.5, -bH * 0.5, bW, bH);
        ctx.restore();
        continue;
      }

      // Hands fallback
      for (var h = 0; h < hands.length; h += 1) {
        var handBox = computeHandBox(hands[h]);
        if (!handBox) continue;
        drawItem(ctx, img, {
          centerX: handBox.centerX * frameScale,
          centerY: handBox.centerY * frameScale,
          size: handBox.size * frameScale,
          angle: handBox.angle,
        }, item);
      }
    }
  }

  // ------------------------------------------------------------------ API

  function onReady(callback) {
    if (typeof callback !== "function") {
      return;
    }
    if (state.ready) {
      callback(state.equipped);
      return;
    }
    state.readyCallbacks.push(callback);
  }

  function getEquipped() {
    return state.equipped;
  }

  function isReady() {
    return state.ready;
  }

  /** Báo kết quả lên trang chủ. Trang chủ kiểm tra origin + source rồi mới lưu. */
  function complete(result) {
    if (window.parent === window) {
      console.warn("[LabSDK] complete() được gọi nhưng bài không nằm trong iframe");
      return;
    }
    try {
      window.parent.postMessage(
        { type: "COMPLETE", result: result || {} },
        "*",
      );
      window.parent.postMessage(
        { type: "LESSON_COMPLETE", score: (result && result.score) || 100, result: result || {} },
        "*",
      );
    } catch (e) {
      console.error("[LabSDK] postMessage thất bại", e);
    }
  }

  window.LabSDK = {
    onReady: onReady,
    getEquipped: getEquipped,
    getAvatarUrl: function () {
      return state.avatarUrl;
    },
    isReady: isReady,
    complete: complete,
    drawAvatar: drawAvatar,
    catalogUrl: CATALOG_URL,
  };
})();
