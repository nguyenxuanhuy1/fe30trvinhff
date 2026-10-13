"use client";

import { Empty } from "antd";
import type { ReactNode } from "react";
import "./empty-state.scss";

interface EmptyStateProps {
  description?: ReactNode;
  action?: ReactNode;
}

function EmptyState({ description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
