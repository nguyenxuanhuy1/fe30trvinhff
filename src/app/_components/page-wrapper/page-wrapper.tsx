"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { DESIGN_WIDTH } from "@/modules/landing/constants";
import { usePageScale } from "@/modules/landing/hooks";
import "./page-wrapper.scss";

interface PageWrapperProps {
  children: ReactNode;
}

function PageWrapper({ children }: PageWrapperProps) {
  const { isMobile, scale } = usePageScale();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    const updateHeight = () => {
      setContentHeight(wrapper.scrollHeight);
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateHeight);
    observer?.observe(wrapper);

    return () => {
      window.removeEventListener("resize", updateHeight);
      observer?.disconnect();
    };
  }, []);

  const wrapperStyle = {
    "--page-design-width": `${DESIGN_WIDTH}px`,
    transform: `scale(${scale})`,
  } as CSSProperties;

  // Mobile dùng layout 1:1 nên không cần hack chiều cao theo scale.
  const stageStyle: CSSProperties | undefined =
    isMobile || contentHeight === null
      ? undefined
      : { height: `${contentHeight * scale}px` };

  return (
    <div className="page-scale" style={stageStyle}>
      <div ref={wrapperRef} className="page-wrapper" style={wrapperStyle}>
        {children}
      </div>
    </div>
  );
}

export { PageWrapper };
export type { PageWrapperProps };
