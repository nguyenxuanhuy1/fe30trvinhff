"use client";

import { Empty, Tag } from "antd";
import { inventoryView, slotLabels, slotOrder } from "../../inventory.const";
import { SLOT_DEFAULTS } from "../../item-slots";
import type { CatalogItem } from "../../types";
import "./avatar-preview.scss";

interface AvatarPreviewProps {
  equippedItems: CatalogItem[];
}

// Xem trước vị trí đồ: mũ ở đỉnh đầu, áo ở ngực, quần ở hông. Mỗi slot một
// vùng neo, đồ vẽ đè lên nhân vật tĩnh của trang tủ đồ.
function AvatarPreview({ equippedItems }: AvatarPreviewProps) {
  return (
    <aside className="avatar-preview" aria-label={inventoryView.equippedTitle}>
      <h3 className="avatar-preview__title">{inventoryView.equippedTitle}</h3>

      {equippedItems.length === 0 ? (
        <Empty
          className="avatar-preview__empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={inventoryView.previewEmpty}
        />
      ) : (
        <div className="avatar-preview__stage">
          <div className="avatar-preview__body" aria-hidden="true" />

          {slotOrder.map((slot) => {
            const item = equippedItems.find((entry) => entry.slot === slot);
            if (!item) {
              return null;
            }

            return (
              <div
                className="avatar-preview__zone"
                key={slot}
                style={{
                  top: `${SLOT_DEFAULTS[slot].top}%`,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={`avatar-preview__item avatar-preview__item--${slot}`}
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    transform: `scale(${item.scale}) translate(${item.offsetX}px, ${item.offsetY}px)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <p className="avatar-preview__hint">{inventoryView.previewHint}</p>

      {equippedItems.length > 0 && (
        <ul className="avatar-preview__list">
          {equippedItems.map((item) => (
            <li className="avatar-preview__list-item" key={item.id}>
              <span>{item.name}</span>
              <Tag>{slotLabels[item.slot] ?? item.slot}</Tag>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export { AvatarPreview };
export type { AvatarPreviewProps };
