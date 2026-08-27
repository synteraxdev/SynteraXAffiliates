import { markNotificationsRead } from "@/app/actions/affiliate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { notificationLabel } from "@/lib/copy";
import { listNotifications } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) return null;
  const notifications = await listNotifications(session.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Alerts</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We will tell you here when a signup is approved, a payout is sent, or something needs a look.
          </p>
        </div>
        <form action={markNotificationsRead}>
          <Button type="submit" variant="outline">
            Mark all read
          </Button>
        </form>
      </div>
      <div className="space-y-3">
        {notifications.map((note) => (
          <Card key={note.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{note.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{note.body}</p>
              </div>
              <Badge variant={note.read_at ? "outline" : "secondary"}>{notificationLabel(note.kind)}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(note.created_at)}</p>
          </Card>
        ))}
        {!notifications.length ? (
          <Card className="p-5 text-sm text-muted-foreground">
            Nothing yet. We will post here when a signup is approved or a cash-out is sent.
          </Card>
        ) : null}
      </div>
    </div>
  );
}
