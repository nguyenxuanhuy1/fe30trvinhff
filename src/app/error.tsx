"use client";

import { ErrorState } from "@/components/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

function ErrorPage({ error, retry }: ErrorPageProps) {
  return <ErrorState error={error} onRetry={retry} />;
}

export default ErrorPage;
export type { ErrorPageProps };
