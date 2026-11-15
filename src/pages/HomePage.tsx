import { TabBar } from "../components/TabBar";
import { Ticket } from "../components/Ticket";
import { Alert, Button, Panel } from "../components/ui";
import { usePortalData } from "../data/PortalData";
import { useI18n } from "../i18n";
import { bestValueId } from "../lib/format";

function TicketSkeleton() {
  return (
    <div aria-hidden className="relative flex h-36 overflow-hidden rounded-2xl bg-white ring-1 ring-ink-950/5">
      <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 bg-lagoon-50 px-2">
        <span className="skeleton-shimmer h-12 w-12 rounded-lg" />
        <span className="skeleton-shimmer h-4 w-16 rounded-full" />
      </div>

      <div aria-hidden className="relative w-0 border-l-2 border-dashed border-lagoon-600/30">
        <span className="absolute -left-[11px] -top-[11px] size-[22px] rounded-full bg-paper" />
        <span className="absolute -bottom-[11px] -left-[11px] size-[22px] rounded-full bg-paper" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 pt-5">
        <div className="space-y-2">
          <span className="skeleton-shimmer block h-4 w-3/5 rounded-full" />
          <span className="skeleton-shimmer block h-3 w-4/5 rounded-full" />
          <span className="skeleton-shimmer block h-3 w-2/3 rounded-full" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="skeleton-shimmer h-6 w-24 rounded-full" />
          <span className="skeleton-shimmer h-10 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
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
