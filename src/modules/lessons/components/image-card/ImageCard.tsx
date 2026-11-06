import React from "react";
import Image from "next/image";
import Link from "next/link";
import "./image-card.scss";

interface ImageCardProps {
  href: string;
  imageUrl?: string | null;
  altText: string;
  priority?: boolean;
}

export function ImageCard({ href, imageUrl, altText, priority = false }: ImageCardProps) {
  return (
    <li className="image-card">
      <Link href={href} className="image-card__link">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={altText}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
            priority={priority}
            className="image-card__image"
            // Ảnh đã được nén sẵn khi tải lên và phục vụ qua /api/images (có cache 1 năm),
            // nén thêm lần nữa qua bộ tối ưu ảnh của Next chỉ tốn CPU máy chủ.
            // 3 ảnh đầu tải ngay (priority), các ảnh sau tự lazy load khi cuộn tới.
            unoptimized
          />
        ) : (
          <div className="image-card__placeholder">Chưa có ảnh</div>
        )}
      </Link>
    </li>
  );
}
