"use client";

import { useEffect, useState } from "react";
import { useAILoadingState } from "../hooks/useHeadTracking";
import { LoadingState } from "@/components/ui/loading-state";

export default function AILoadingOverlay() {
  const { isTracking, isLoaded } = useAILoadingState();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isTracking && !isLoaded) {
      const timer = setTimeout(() => {
        setTimedOut(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setTimedOut(false);
    }
  }, [isTracking, isLoaded]);

  // Chỉ hiện khi có trang nào đó đang dùng AI (isTracking) nhưng AI chưa tải xong (!isLoaded)
  if (!isTracking || isLoaded || timedOut) {
    return null;
  }

  return <LoadingState />;
}
