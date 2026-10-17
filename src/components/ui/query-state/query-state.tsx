"use client";

import { Skeleton } from "antd";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui";
import { ErrorState } from "../error-state";
import "./query-state.scss";

interface QueryStateProps {
  children: ReactNode;
  error: Error | null;
  isEmpty?: boolean;
  isLoading: boolean;
  onRetry?: () => void;
  emptyDescription?: ReactNode;
}

function QueryState({
  children,
  error,
  isEmpty = false,
  isLoading,
  onRetry,
  emptyDescription = "Chưa có dữ liệu",
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="query-state" aria-busy="true">
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} fullScreen={false} />;
  }

  if (isEmpty) {
    return <EmptyState description={emptyDescription} />;
  }

  return <div className="query-state__content">{children}</div>;
}

export { QueryState };
export type { QueryStateProps };
