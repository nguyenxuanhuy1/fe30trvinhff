"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/modules/auth";
import { EditOutlined } from "@ant-design/icons";
import { Slider } from "antd";
import Cropper from "react-easy-crop";
import { GameButton, GameModal, toast } from "@/components/ui";
import getCroppedImg from "@/utils/cropImage";
import { avatarEditor } from "./avatar-editor.const";
import "./avatar-editor.scss";

const FALLBACK = "/images/chuotuser.webp";

interface AvatarEditorProps {
  username: string;
  currentAvatarUrl: string | null;
}

function AvatarEditor({ username, currentAvatarUrl }: AvatarEditorProps) {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal crop state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Always prefer user.avatarUrl from AuthContext, then prop from SSR, then mascot fallback
  const displayAvatar = user?.avatarUrl || currentAvatarUrl || FALLBACK;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setCropImageSrc(reader.result?.toString() || "");
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(file);
      e.target.value = "";
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

      await updateUser({ avatarUrl: croppedImage });

      toast.success({ content: "Đã lưu ảnh thành công!", key: "upload_avatar" });
      setIsCropModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi lưu ảnh:", error);
      toast.error({ content: "Lưu ảnh thất bại, vui lòng thử lại!", key: "upload_avatar" });
    }
  };

  return (
    <div className="avatar-editor">
      <div
        className="avatar-editor__avatar-container"
        onClick={() => fileInputRef.current?.click()}
        title="Bấm để thay đổi ảnh đại diện"
      >
        <span className="avatar-editor__avatar">
          <Image
            className="avatar-editor__image"
            src={displayAvatar}
            alt={`${avatarEditor.alt} của ${username}`}
            width={88}
            height={88}
            unoptimized
          />
        </span>

        {/* Icon edit của Ant Design góc dưới trong khung tròn */}
        <div className="avatar-editor__edit-badge" title="Thay đổi ảnh đại diện">
          <EditOutlined className="avatar-editor__edit-icon" />
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {/* 3D Modal chỉnh sửa ảnh đồng bộ với /inventory */}
      <GameModal
        title="Chỉnh sửa ảnh đại diện"
        open={isCropModalOpen}
        onCancel={() => setIsCropModalOpen(false)}
        width={500}
        footer={[
          <button
            key="cancel"
            onClick={() => setIsCropModalOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#8a4b08",
              fontWeight: "bold",
              cursor: "pointer",
              textTransform: "uppercase",
              fontSize: "0.875rem",
              letterSpacing: "0.05em",
              padding: "8px 16px",
              transition: "opacity 0.15s ease",
            }}
          >
            Hủy
          </button>,
          <GameButton key="save" onClick={handleSaveCrop}>
            Lưu
          </GameButton>,
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
                boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.6)",
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
            <div
              style={{
                padding: "18px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  color: "#8a4b08",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontSize: "0.875rem",
                  letterSpacing: "0.05em",
                }}
              >
                Thu phóng:
              </span>
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

export { AvatarEditor };
export type { AvatarEditorProps };
