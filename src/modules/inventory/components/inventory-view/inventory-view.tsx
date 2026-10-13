"use client";

/* eslint-disable @next/next/no-img-element --
   Đồ trang bị là pixel-art nhỏ nằm ở public/items, cần giữ nguyên file gốc và
   image-rendering: pixelated. next/image sẽ tối ưu lại ảnh và làm nhoè sprite. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/modules/auth";
import { useRetroEquipStore } from "@/stores/retro-equip-store";
import { Modal, Slider } from "antd";
import Cropper from "react-easy-crop";
import { HeadAccessory } from "../HeadAccessory";
import { StaticSvgAccessory } from "../static-svg-accessory";
import { preloadFaceLandmarker } from "../../hooks/useHeadTracking";
import { GameButton, GameModal, toast } from "@/components/ui";
import { LoadingState } from "@/components/ui/loading-state";
import { useCatalog } from "../../hooks/use-catalog";
import { useEquip } from "../../hooks/use-equip";
import getCroppedImg from "@/utils/cropImage";
import { useInventory } from "../../hooks/use-inventory";
import { slotOrder } from "../../inventory.const";
import type { CatalogItem, ItemSlot } from "../../types";
import "./inventory-view.scss";

/**
 * Dưới mốc này camera chiếm trọn phần bên phải, danh sách trang bị dồn hết
 * vào cột trái. Phải khớp với @media trong SCSS.
 */
const NARROW_QUERY = "(max-width: 640px)";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);

    function update() {
      setMatches(mql.matches);
    }

    update();
    mql.addEventListener("change", update);

    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export interface InventoryViewProps {
  mode?: "default" | "pre-lesson";
  onEnterGame?: () => void;
  enterGameText?: string;
  onBack?: () => void;
}

function InventoryView({
  mode = "default",
  onEnterGame,
  enterGameText = "Vào chơi",
  onBack,
}: InventoryViewProps = {}) {
  const { user, updateUser, isLoading } = useAuth();
  const router = useRouter();
  const catalogQuery = useCatalog();
  const inventoryQuery = useInventory();

  const isPreLesson = mode === "pre-lesson";

  const equippedMap = useRetroEquipStore((state) => state.equippedMap);
  const hydrateEquipped = useRetroEquipStore((state) => state.hydrate);
  const toggleEquipped = useRetroEquipStore((state) => state.toggle);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(user?.inventoryAvatarUrl || null);
  
  // Crop state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleEnterGame = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    onEnterGame?.();
  }, [onEnterGame]);

  const handleBack = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (onBack) {
      onBack();
    } else {
      router.push("/lessons");
    }
  }, [onBack, router]);

  // Sync with user's inventory avatar when it loads or updates
  useEffect(() => {
    const av = user?.inventoryAvatarUrl || null;
    setUploadedImage(av);
    if (av) {
      try {
        localStorage.setItem("inventory_avatar_custom_url", av);
      } catch {}
    }
  }, [user?.inventoryAvatarUrl]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const owned = useMemo(
    () => new Set(inventoryQuery.inventory?.owned ?? []),
    [inventoryQuery.inventory],
  );

  // localStorage là nguồn cho panel này, nhưng sảnh chờ bài thí nghiệm đọc đồ
  // đang mặc từ server qua enterLab. Nếu chỉ ghi localStorage thì vào lab sẽ
  // thấy nhân vật trần, nên mỗi thay đổi đồ đồng thời gọi API cho khớp.
  const { equip, unequip } = useEquip(items);

  // Phải đợi cả catalog và tủ đồ tải xong mới lọc localStorage, nếu không sẽ xoá
  // oan đồ chỉ vì danh sách lúc đó còn rỗng.
  const isReady = items.length > 0 && inventoryQuery.isSuccess;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const slotById = new Map(items.map((item) => [item.id, item.slot]));

    hydrateEquipped((stored) => {
      const kept: Record<string, string> = {};

      for (const [slot, id] of Object.entries(stored)) {
        // Bỏ id không còn trong danh mục, không thuộc tủ đồ, hoặc không khớp slot
        if (slotById.get(id) === slot && owned.has(id)) {
          kept[slot] = id;
        }
      }

      return kept;
    });
  }, [hydrateEquipped, isReady, items, owned]);


  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("inventory_camera_mode");
    if (stored === "off") {
      setIsCameraOn(false);
    }
    setIsMounted(true);
  }, []);

  // Camera thật, lật gương. Tắt track khi unmount để đèn camera không đứng sáng.
  useEffect(() => {
    if (!isMounted) return;

    if (!user || !isCameraOn) {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }
      setCameraError(null);
      setIsTransitioning(false);
      return;
    }

    let stream: MediaStream | null = null;
    let disposed = false;
    const video = videoRef.current;
    
    setCameraError(null);
    setIsTransitioning(true);

    async function startCamera() {
      preloadFaceLandmarker();
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Trình duyệt chỉ cho phép bật Camera qua HTTPS hoặc localhost.");
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          return;
        }

        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
      } catch {
        if (!disposed) {
          setCameraError("Không mở được camera. Hãy cấp quyền camera hoặc tải ảnh lên.");
          setIsCameraOn(false);
        }
      } finally {
        setIsTransitioning(false);
      }
    }

    void startCamera();

    return () => {
      disposed = true;
      stream?.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (video) {
        video.srcObject = null;
      }
      setIsTransitioning(false);
    };
  }, [user, isCameraOn, isMounted]);

  const toggleCamera = () => {
    if (isTransitioning) return;
    setIsCameraOn((prev) => {
      const next = !prev;
      localStorage.setItem("inventory_camera_mode", next ? "on" : "off");
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setCropImageSrc(base64);
        setIsCropModalOpen(true);
        // Reset crop state
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setIsCameraOn(false);
        localStorage.setItem("inventory_camera_mode", "off");
      };
      reader.readAsDataURL(file);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    
    try {
      toast.loading({ content: "Đang lưu ảnh...", key: "upload_avatar" });
      const croppedImage = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      
      setUploadedImage(croppedImage);
      try {
        localStorage.setItem("inventory_avatar_custom_url", croppedImage);
      } catch {}
      await updateUser({ inventoryAvatarUrl: croppedImage });
      
      toast.success({ content: "Đã lưu ảnh thành công!", key: "upload_avatar" });
      setIsCropModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi lưu ảnh:", error);
      toast.error({ content: "Lưu ảnh thất bại, vui lòng thử lại!", key: "upload_avatar" });
    }
  };

  const handleItemClick = useCallback(
    (item: CatalogItem) => {
      if (!owned.has(item.id)) {
        toast.error("Bạn chưa sở hữu món đồ này. Hãy mua tại Cửa hàng để trang bị!");
        return;
      }

      const wasEquipped = equippedMap[item.slot] === item.id;

      if (!wasEquipped && (item.id === 'chuotuser-hole' || item.id === 'chuotuser')) {
        Object.entries(equippedMap).forEach(([slot, id]) => {
          if (slot !== item.slot) {
            toggleEquipped(slot, id);
            unequip.mutate(id);
          }
        });
      }

      toggleEquipped(item.slot, item.id);

      // Server giữ đồ các slot khác: equip món mới chỉ thay trong slot của nó,
      // unequip chỉ gỡ đúng món đó. Xem backend/src/services/inventory.service.js
      if (wasEquipped) {
        unequip.mutate(item.id);
      } else {
        equip.mutate(item.id);
      }
    },
    [equippedMap, equip, toggleEquipped, unequip, owned],
  );

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const equippedHatItem = equippedMap["hat"] ? itemById.get(equippedMap["hat"]) : null;
  const equippedGlassesItem = equippedMap["glasses"] ? itemById.get(equippedMap["glasses"]) : null;
  const equippedMaskItem = equippedMap["mask"] ? itemById.get(equippedMap["mask"]) : null;

  const isNarrow = useMediaQuery(NARROW_QUERY);

  const leftColRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLButtonElement>(null);

  // Chỉ hiện đồ người chơi ĐÃ MUA / SỞ HỮU trong DB (bảng userItem)
  const ownedItems = useMemo(() => {
    const order = new Map<string, number>(
      slotOrder.map((slot, index) => [slot, index]),
    );

    return items
      .filter((item) => owned.has(item.id))
      .sort(
        (a, b) =>
          (order.get(a.slot) ?? 99) - (order.get(b.slot) ?? 99) ||
          a.name.localeCompare(b.name, "vi"),
      );
  }, [items, owned]);

  /**
   * Số ô đồ vừa khít chiều cao một cột. Cột trái đưa đồ vào tới khi đầy rồi mới
   * tràn sang cột phải, nên phải đo chiều cao thật thay vì chia đều số lượng —
   * chia đều sẽ để cột trái hở trên khi đồ ít và đẩy ô xuống dưới màn hình.
   *
   * Ô đo là chính ô đồ đầu tiên, cao đúng bằng --slot-size sau khi CSS chạy,
   * nên không phải tự tính lại clamp() bằng tay.
   */
  const [perColumn, setPerColumn] = useState<number | null>(null);

  useEffect(() => {
    const column = leftColRef.current;
    const probe = probeRef.current;

    if (!column || !probe) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const gap = Number.parseFloat(getComputedStyle(column).rowGap) || 0;
      const square = probe.getBoundingClientRect().height;

      if (square === 0) {
        return;
      }

      setPerColumn(
        Math.max(1, Math.floor((column.clientHeight + gap) / (square + gap))),
      );
    });

    observer.observe(column);
    observer.observe(probe);

    return () => observer.disconnect();
  }, [ownedItems.length]);

  // Màn hẹp thì camera chiếm trọn bên phải, toàn bộ danh sách nằm ở cột trái.
  // Lần đo đầu tiên chưa có perColumn thì xếp tạm hết vào cột trái rồi đo lại.
  const leftItems =
    isNarrow || perColumn === null
      ? ownedItems
      : ownedItems.slice(0, perColumn);
  const rightItems =
    isNarrow || perColumn === null ? [] : ownedItems.slice(perColumn);

  if (isLoading || catalogQuery.isLoading || (Boolean(user) && inventoryQuery.isLoading)) {
    return (
      <div className="inventory-retro">
        <LoadingState />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="inventory-retro">
        <header className="inventory-retro__header">
          <div className="inventory-retro__header-left">
            <button
              type="button"
              className="inventory-header__btn inventory-header__btn--back"
              onClick={handleBack}
              title="Quay lại"
            >
              <svg
                className="inventory-header__btn-svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Quay lại</span>
            </button>
          </div>
          <div className="inventory-retro__header-actions">
            {isPreLesson && (
              <button
                type="button"
                className="inventory-header__btn inventory-header__btn--enter"
                onClick={handleEnterGame}
                title={enterGameText}
              >
                <span className="inventory-header__btn-icon">🎮</span>
                <span>{enterGameText}</span>
              </button>
            )}
          </div>
        </header>
        <main className="inventory-retro__body inventory-retro__body--guest">
          <p className="inventory-retro__guest-text">Đăng nhập để xem tủ đồ.</p>
          <Link
            className="inventory-retro__guest-link"
            href="/login?next=/inventory"
          >
            Đăng nhập
          </Link>
        </main>
      </div>
    );
  }

  const renderItem = (item: CatalogItem, index: number) => {
    const isEquipped = equippedMap[item.slot] === item.id;

    return (
      <button
        className={`inventory-retro__gear${isEquipped ? " inventory-retro__gear--on" : ""
          }`}
        key={item.id}
        type="button"
        aria-label={isEquipped ? `Bỏ ${item.name}` : `Mặc ${item.name}`}
        aria-pressed={isEquipped}
        title={item.name}
        onClick={() => handleItemClick(item)}
        ref={index === 0 ? probeRef : undefined}
      >
        <img
          className="inventory-retro__gear-img"
          src={item.imageUrl}
          alt={item.name}
        />
      </button>
    );
  };

  return (
    <div className="inventory-retro">
      <header className="inventory-retro__header">
        <div className="inventory-retro__header-left">
          <button
            type="button"
            className="inventory-header__btn inventory-header__btn--back"
            onClick={handleBack}
            title="Quay lại"
          >
            <svg
              className="inventory-header__btn-svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Quay lại</span>
          </button>
        </div>

        <div className="inventory-retro__header-actions">
          <button 
            type="button"
            className={`inventory-header__btn ${isCameraOn ? "inventory-header__btn--camera-off" : "inventory-header__btn--camera-on"}`}
            onClick={toggleCamera} 
            disabled={isTransitioning}
            title={isCameraOn ? "Tắt Camera" : "Bật Camera"}
          >
            <span className="inventory-header__btn-icon">{isCameraOn ? "📷" : "📸"}</span>
            <span>{isCameraOn ? "Tắt Camera" : "Bật Camera"}</span>
          </button>
          
          {!isCameraOn && (
            <button 
              type="button"
              className="inventory-header__btn inventory-header__btn--upload"
              onClick={() => fileInputRef.current?.click()}
              title={uploadedImage ? "Sửa ảnh đại diện" : "Thêm ảnh đại diện"}
            >
              <span className="inventory-header__btn-icon">✏️</span>
              <span>{uploadedImage ? "Sửa ảnh" : "Thêm ảnh"}</span>
            </button>
          )}

          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          {isPreLesson && (
            <button
              type="button"
              className="inventory-header__btn inventory-header__btn--enter"
              onClick={handleEnterGame}
              title={enterGameText}
            >
              <span className="inventory-header__btn-icon">🎮</span>
              <span>{enterGameText}</span>
            </button>
          )}
        </div>
      </header>

      <main className="inventory-retro__body">
        <div
          className="inventory-retro__col inventory-retro__col--left"
          ref={leftColRef}
        >
          {leftItems.map((item, index) => renderItem(item, index))}
        </div>

        <div className="inventory-retro__camera-wrapper" ref={wrapperRef}>
          {!isCameraOn && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
              <svg viewBox="0 0 1024 1024" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <clipPath id="avatar-clip">
                    <circle cx="512" cy="397" r="175" />
                  </clipPath>
                </defs>
                
                {/* Lớp vỏ chuột ở dưới */}
                <image href="/images/chuotuser.png" x="0" y="0" width="1024" height="1024" />

                {/* Mặt người lồng lên trên, bị cắt tròn chính xác vừa lỗ */}
                {uploadedImage && (
                  <image 
                    href={uploadedImage} 
                    x="337" y="222" 
                    width="350" height="350" 
                    clipPath="url(#avatar-clip)" 
                    preserveAspectRatio="xMidYMid slice"
                  />
                )}

                {/* Mặt nạ (nằm trên mặt) */}
                {equippedMaskItem && (
                  <StaticSvgAccessory slot="mask" item={equippedMaskItem} />
                )}

                {/* Kính: tâm (512, 382), bề rộng ~300, nằm trên mặt user, chỉ để vừa trong lỗ */}
                {equippedGlassesItem && (
                  <StaticSvgAccessory slot="glasses" item={equippedGlassesItem} />
                )}

                {/* Mũ: đáy mũ tại (512, 245), bề rộng ~320, đè lên mép trên lỗ ~25px, che túm lông đỉnh đầu */}
                {equippedHatItem && (
                  <StaticSvgAccessory slot="hat" item={equippedHatItem} />
                )}
              </svg>
            </div>
          )}

          {/* Video không có phụ đề nên không dùng next/image, cũng không cần track */}
          <video
            className="inventory-retro__camera"
            playsInline
            muted
            ref={videoRef}
            style={{ 
              display: isCameraOn ? 'block' : 'none',
              transform: 'scaleX(-1)' // Gương
            }}
          />

          {cameraError !== null && (
            <p className="inventory-retro__camera-error">{cameraError}</p>
          )}

          {/* Đồ chồng lên camera, toạ độ % nên co giãn theo khung khi bật camera */}
          {isCameraOn &&
            Object.entries(equippedMap).map(([slot, id]) => {
              const item = itemById.get(id);

              if (!item) {
                return null;
              }

              return (
                <HeadAccessory
                  key={slot}
                  accessoryId={item.id}
                  containerRef={wrapperRef}
                  videoRef={videoRef}
                  // @ts-ignore
                  isCameraOn={isCameraOn}
                  uploadedImage={uploadedImage}
                />
              );
            })}

          {ownedItems.length === 0 && (
            <div className="inventory-retro__empty" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 12px", textAlign: "center" }}>
              <span>🎒 Tủ đồ của bạn đang trống. Bạn chưa sở hữu trang bị nào!</span>
              <Link
                href="/gio-hang"
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  background: "linear-gradient(180deg, #22c55e 0%, #15803d 100%)",
                  color: "#ffffff",
                  borderRadius: 6,
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                }}
              >
                🛒 Ghé Cửa Hàng
              </Link>
            </div>
          )}
        </div>

        <div className="inventory-retro__col inventory-retro__col--right">
          {rightItems.map((item, index) => renderItem(item, index))}
        </div>
      </main>

      <GameModal
        title="Chỉnh sửa ảnh"
        open={isCropModalOpen}
        onCancel={() => setIsCropModalOpen(false)}
        width={500}
        footer={[
          <button 
            key="cancel" 
            onClick={() => setIsCropModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8a4b08',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              padding: '8px 16px',
              transition: 'opacity 0.15s ease'
            }}
          >
            Hủy
          </button>,
          <GameButton key="save" onClick={handleSaveCrop}>
            Lưu
          </GameButton>
        ]}
      >
        {cropImageSrc && (
          <>
            <div 
              style={{ 
                position: "relative", 
                width: "100%", 
                height: 380, 
                background: "#150d08",
                overflow: "hidden",
                boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.6)"
              }}
            >
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ whiteSpace: "nowrap", color: "#8a4b08", fontWeight: 700, textTransform: "uppercase", fontSize: "0.875rem", letterSpacing: "0.05em" }}>Thu phóng:</span>
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(value) => setZoom(value)}
                style={{ flex: 1 }}
              />
            </div>
          </>
        )}
      </GameModal>
    </div>
  );
}

export { InventoryView };
