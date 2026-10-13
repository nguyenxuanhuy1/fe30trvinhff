"use client";

import React from "react";
import { Modal } from "antd";
import type { ModalProps } from "antd";
import clsx from "clsx";
import "./GameModal.scss";

export interface GameModalProps extends ModalProps {
  /**
   * Tùy chọn icon đóng modal. Nếu không truyền, mặc định sẽ dùng huy hiệu tròn 3D retro phong cách game.
   */
  customCloseIcon?: React.ReactNode;
}

export const GameModal: React.FC<GameModalProps> = ({
  children,
  rootClassName,
  className,
  rootStyle,
  styles,
  centered = true,
  destroyOnClose = true,
  closeIcon,
  customCloseIcon,
  ...props
}) => {
  // Render icon đóng 3D retro nếu không có closeIcon tùy biến khác
  const resolvedCloseIcon =
    closeIcon !== undefined ? (
      closeIcon
    ) : customCloseIcon ? (
      customCloseIcon
    ) : (
      <span className="game-modal__close-badge" aria-hidden="true">
        ✕
      </span>
    );

  const mergedStyles = React.useMemo(() => {
    if (typeof styles === "function") {
      return (info: any) => {
        const computed = styles(info);
        return {
          ...computed,
          container: {
            padding: 0,
            ...computed?.container,
          },
          body: {
            padding: 0,
            ...computed?.body,
          },
        };
      };
    }
    return {
      ...styles,
      container: {
        padding: 0,
        ...styles?.container,
      },
      body: {
        padding: 0,
        ...styles?.body,
      },
    };
  }, [styles]);

  return (
    <Modal
      centered={centered}
      destroyOnClose={destroyOnClose}
      rootClassName={clsx("game-modal-root", rootClassName)}
      className={clsx("game-modal-dialog", className)}
      rootStyle={
        {
          "--ant-modal-content-padding": "0px",
          ...rootStyle,
        } as React.CSSProperties
      }
      styles={mergedStyles}
      closeIcon={resolvedCloseIcon}
      {...props}
    >
      {children}
    </Modal>
  );
};
