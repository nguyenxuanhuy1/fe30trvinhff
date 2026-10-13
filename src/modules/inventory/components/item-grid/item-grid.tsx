"use client";

import { Button, Modal, Progress, Tag } from "antd";
import { useEffect, useState } from "react";
import { useEquip } from "../../hooks/use-equip";
import { anchorLabels, inventoryPage, inventoryView, slotLabels } from "../../inventory.const";
import type { CatalogItem } from "../../types";
import "./item-grid.scss";

interface ItemGridProps {
  items: CatalogItem[];
  owned: string[];
  equipped: string[];
  onError: (text: string) => void;
}

// Lọc theo trạng thái: null = tất cả, true = đang mặc, false = chưa mặc
type Filter = "all" | "equipped" | "notEquipped";

function ItemGrid({ items, owned, equipped, onError }: ItemGridProps) {
  const { equip, unequip, isEquipping, isUnequipping } = useEquip(items);
  const ownedSet = new Set(owned);
  const equippedSet = new Set(equipped);

  // Chỉ hiển thị các đồ mình đang có
  const visible = items.filter((item) => ownedSet.has(item.id));

  useEffect(() => {
    if (equip.isError) {
      const detail = (equip.error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      onError(detail || inventoryView.equipFailed);
    }
  }, [equip.error, equip.isError, onError]);

  useEffect(() => {
    if (unequip.isError) {
      const detail = (unequip.error as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      onError(detail || inventoryView.unequipFailed);
    }
  }, [onError, unequip.error, unequip.isError]);

  function handleClick(item: CatalogItem) {
    if (equippedSet.has(item.id)) {
      unequip.mutate(item.id);
    } else {
      equip.mutate(item.id);
    }
  }

  return (
    <div className="item-grid">
      <p className="item-grid__hint">{inventoryView.ownedHint}</p>

      <ul className="item-grid__list">
        {visible.map((item) => {
          const isEquipped = equippedSet.has(item.id);
          const pending = isEquipping || isUnequipping;

          return (
            <li className="item-grid__cell" key={item.id}>
              <button
                type="button"
                className={[
                  "item-grid__item",
                  isEquipped ? "item-grid__item--equipped" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleClick(item)}
                disabled={pending}
                aria-pressed={isEquipped}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="item-grid__image"
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                />

                <span className="item-grid__name">{item.name}</span>

                <span className="item-grid__tags">
                  <Tag color={isEquipped ? "green" : "blue"}>{slotLabels[item.slot] ?? item.slot}</Tag>
                  <Tag>{anchorLabels[item.anchor] ?? item.anchor}</Tag>
                </span>

                {isEquipped && <span className="item-grid__badge">Đang mặc</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className="item-grid__empty">
          {inventoryPage.empty}
        </p>
      )}
    </div>
  );
}

export { ItemGrid };
export type { ItemGridProps };
