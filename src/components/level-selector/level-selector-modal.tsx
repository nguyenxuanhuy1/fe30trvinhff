"use client";

import { Modal } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LevelSelector } from "./level-selector";
import { levelSelectorTexts } from "./level-selector.const";
import type { LevelSelectorModalProps, PlayLevel } from "./level-selector.types";

export function LevelSelectorModal({
  open,
  onClose,
  onEnterLab,
}: LevelSelectorModalProps) {
  const router = useRouter();

  const handleEnterLab = (level: PlayLevel) => {
    onClose();
    if (onEnterLab) {
      onEnterLab(level);
    } else {
      router.push(level.targetPath);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={1120}
      centered
      destroyOnClose
      wrapClassName="level-select-modal"
    >
      <div className="level-select-modal__wrapper">
        <button
          type="button"
          className="level-select-modal__close-btn"
          onClick={onClose}
          aria-label={levelSelectorTexts.close}
          title={levelSelectorTexts.close}
        >
          ✕
        </button>

        <LevelSelector onEnterLab={handleEnterLab} />

        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <Link
            href="/lessons"
            onClick={onClose}
            style={{
              color: "#94a3b8",
              fontSize: "0.875rem",
              textDecoration: "underline",
            }}
          >
            {levelSelectorTexts.fullPageCta} ↗
          </Link>
        </div>
      </div>
    </Modal>
  );
}
