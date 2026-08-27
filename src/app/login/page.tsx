import Link from "next/link";
import { BrandWordmark } from "@/components/brand";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { devLoginEnabled } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const showDev = devLoginEnabled();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
      <div className="grid w-full gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <BrandWordmark size="lg" />
          <h1 className="mt-8 font-heading text-4xl font-semibold leading-tight">
            Build. Earn. Grow.
            <br />
            Your Future Starts Here.
          </h1>
          <p className="mt-4 text-muted-foreground">
            The affiliate portal uses SynteraX SSO. There is no second password. Admins and affiliates keep the same
            roles they already have on synterax.io.
          </p>
        </div>
        <Card className="bg-card/90 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Welcome back</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">Sign in to Affiliates</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Continue with your SynteraX account. Role claims (`admin` / `company` vs `distributor`) control what you
            can manage.
          </p>
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button asChild className="mt-6 w-full" size="lg">
            <a href="/api/auth/login">Continue with SynteraX</a>
          </Button>
          {showDev ? (
            <div className="mt-6 space-y-2 rounded-lg border border-dashed border-border p-3">
              <p className="text-xs text-muted-foreground">Development sign-in (non-production only)</p>
              <div className="flex gap-2">
                <form action="/api/auth/dev" method="post" className="flex-1">
                  <input type="hidden" name="role" value="distributor" />
                  <Button variant="outline" className="w-full" type="submit">
                    Demo affiliate
                  </Button>
                </form>
                <form action="/api/auth/dev" method="post" className="flex-1">
                  <input type="hidden" name="role" value="admin" />
                  <Button variant="outline" className="w-full" type="submit">
                    Demo admin
                  </Button>
                </form>
              </div>
            </div>
          ) : null}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need a SynteraX account?{" "}
            <Link href="https://synterax.io/signup" className="text-primary">
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
