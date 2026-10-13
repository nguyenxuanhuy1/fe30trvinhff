"use client";

import { useEffect, useState } from "react";
import { DESIGN_WIDTH, MOBILE_MAX_WIDTH } from "@/modules/landing/constants";

function isMobileViewport(viewportWidth: number) {
  return viewportWidth <= MOBILE_MAX_WIDTH;
}

function getPageScale(viewportWidth: number) {
  if (isMobileViewport(viewportWidth)) {
    return 1;
  }

  return Math.min(viewportWidth / DESIGN_WIDTH, 1);
}

function usePageScale() {
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth = window.innerWidth;

      setIsMobile(isMobileViewport(viewportWidth));
      setScale(getPageScale(viewportWidth));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", updateScale);

    return () => {
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("orientationchange", updateScale);
    };
  }, []);

  return { isMobile, scale };
}

export { getPageScale, isMobileViewport, usePageScale };
