"use client";

import { ErrorState } from "@/components/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function ErrorPage({ error, reset }: ErrorPageProps) {
  return <ErrorState error={error} onRetry={reset} />;
}

export default ErrorPage;
export type { ErrorPageProps };
