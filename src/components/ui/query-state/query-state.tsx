"use client";

import { Alert, Button, Skeleton } from "antd";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui";
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
    return (
      <div className="query-state">
        <Alert
          type="error"
          showIcon
          message="Không thể tải dữ liệu"
          description={error.message}
          action={
            onRetry ? (
              <Button size="small" onClick={onRetry}>
                Thử lại
              </Button>
            ) : null
          }
        />
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState description={emptyDescription} />;
  }

  return <div className="query-state__content">{children}</div>;
}

export { QueryState };
export type { QueryStateProps };
