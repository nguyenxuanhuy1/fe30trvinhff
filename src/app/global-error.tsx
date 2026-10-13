"use client";

import { ErrorState } from "@/components/ui";
import "@/styles/globals.scss";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

function GlobalError({ error, retry }: GlobalErrorProps) {
  return (
    <html lang="vi">
      <body>
        <ErrorState error={error} onRetry={retry} />
      </body>
    </html>
  );
}

export default GlobalError;
export type { GlobalErrorProps };
