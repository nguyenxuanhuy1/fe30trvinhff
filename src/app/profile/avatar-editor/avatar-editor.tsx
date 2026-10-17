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

      {/* Modal chỉnh sửa ảnh đồng bộ với hệ thống GameModal */}
      <GameModal
        title="Chỉnh sửa ảnh đại diện"
        open={isCropModalOpen}
        onCancel={() => setIsCropModalOpen(false)}
        width={480}
        footer={[
          <button
            key="cancel"
            type="button"
            className="game-modal__btn-cancel"
            onClick={() => setIsCropModalOpen(false)}
          >
            Hủy
          </button>,
          <button
            key="save"
            type="button"
            className="game-modal__btn-primary"
            onClick={handleSaveCrop}
          >
            Lưu ảnh
          </button>,
        ]}
      >
        {cropImageSrc && (
          <div className="game-modal-crop">
            <div className="game-modal-crop__container">
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
            <div className="game-modal-crop__controls">
              <span className="game-modal-crop__label">Thu phóng:</span>
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(value) => setZoom(value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
}

export { AvatarEditor };
export type { AvatarEditorProps };
