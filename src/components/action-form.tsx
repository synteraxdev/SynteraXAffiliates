"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ActionForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className={className}
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setPending(true);
        const formData = new FormData(event.currentTarget);
        try {
          await action(formData);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <fieldset disabled={pending} className="contents">
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>We could not finish that</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {children}
      </fieldset>
    </form>
  );
}
