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
            unoptimized={imageUrl.startsWith("data:")} // Nếu ảnh là base64 thì không nén qua API Next.js để tránh lỗi/quá tải
          />
        ) : (
          <div className="image-card__placeholder">Chưa có ảnh</div>
        )}
      </Link>
    </li>
  );
}
