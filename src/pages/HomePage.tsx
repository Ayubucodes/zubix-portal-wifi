import { TabBar } from "../components/TabBar";
import { Ticket } from "../components/Ticket";
import { Alert, Button, Panel } from "../components/ui";
import { usePortalData } from "../data/PortalData";
import { useI18n } from "../i18n";
import { bestValueId } from "../lib/format";

function TicketSkeleton() {
  return <div aria-hidden className="h-36 rounded-2xl bg-white ring-1 ring-ink-950/5 motion-safe:animate-pulse" />;
}

export function HomePage() {
  const { t } = useI18n();
  const { status, packages, reload } = usePortalData();
  const best = bestValueId(packages);

  return (
    <>
      <TabBar />
      {status === "loading" && (
        <div role="status" aria-label={t.loading} className="space-y-3">
          <TicketSkeleton />
          <TicketSkeleton />
          <TicketSkeleton />
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <Alert>{t.passesError}</Alert>
          <Button variant="secondary" onClick={reload}>
            {t.retry}
          </Button>
        </div>
      )}

      {status === "ready" && packages.length === 0 && (
        <Panel className="text-center">
          <p className="font-display text-lg font-extrabold">{t.noPassesTitle}</p>
          <p className="mt-1 text-ink-950/65">{t.noPassesBody}</p>
        </Panel>
      )}

      {status === "ready" && packages.length > 0 && (
        <ul className="space-y-3">
          {packages.map((pkg) => (
            <li key={pkg.id}>
              <Ticket pkg={pkg} best={pkg.id === best} to={`/buy/${pkg.id}`} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
