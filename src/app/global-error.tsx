"use client";

import { ErrorState } from "@/components/ui";
import "@/styles/globals.scss";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="vi">
      <body>
        <ErrorState error={error} onRetry={reset} />
      </body>
    </html>
  );
}

export default GlobalError;
export type { GlobalErrorProps };
