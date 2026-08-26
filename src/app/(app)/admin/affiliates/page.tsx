import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAffiliates } from "@/lib/data";
import { roleLabel } from "@/lib/roles";
import { formatDate } from "@/lib/format";

export default async function AdminAffiliatesPage() {
  const affiliates = await listAffiliates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Affiliates</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Profiles are created automatically the first time someone signs in with SynteraX SSO.
        </p>
      </div>
      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {affiliates.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <p>{profile.full_name || profile.username}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </TableCell>
                <TableCell className="font-mono text-xs">{profile.referral_slug}</TableCell>
                <TableCell>{roleLabel(profile.role)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{profile.status}</Badge>
                </TableCell>
                <TableCell>{formatDate((profile as { created_at?: string }).created_at)}</TableCell>
              </TableRow>
            ))}
            {!affiliates.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No SSO logins yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
