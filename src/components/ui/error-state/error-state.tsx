"use client";

import { Button, Result } from "antd";
import "./error-state.scss";

interface ErrorStateProps {
  error: Error & { digest?: string };
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <Result
        status="error"
        title="Đã có lỗi xảy ra"
        subTitle={error.message}
        extra={
          <Button type="primary" onClick={onRetry}>
            Thử lại
          </Button>
        }
      />
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };
