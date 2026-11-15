import { Outlet, useLocation } from "react-router-dom";
import { Logo, SignalRings } from "./Logo";
import { useI18n, type Lang } from "../i18n";
import { usePortalData } from "../data/PortalData";
import { readStoredParams } from "../lib/omada";

function LangToggle() {
  const { lang, setLang, t } = useI18n();
  const options: Array<{ code: Lang; label: string }> = [
    { code: "en", label: "EN" },
    { code: "sw", label: "SW" },
  ];
  return (
    <div role="group" aria-label={t.language} className="flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
      {options.map((option) => (
        <button
          key={option.code}
          type="button"
          aria-pressed={lang === option.code}
          onClick={() => setLang(option.code)}
          className={`min-h-9 min-w-11 rounded-full px-3 text-sm font-bold transition-colors ${
            lang === option.code ? "bg-white text-ink-950" : "text-white/80 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-saffron-400" fill="none" aria-hidden>
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Dark panel on the left (desktop) or across the top (phones), content on the right.
 * Inside the purchase flow the headline folds away on phones so the form stays in view.
 */
export function Shell() {
  const { t } = useI18n();
  const { config } = usePortalData();
  const { pathname } = useLocation();
  const compact = pathname !== "/" && pathname !== "/voucher";
  const ssid = readStoredParams()?.ssidName;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(24rem,32rem)_1fr]">
      <aside
        className={`relative overflow-hidden rounded-b-[2rem] bg-ink-950 px-5 pt-5 text-white lg:flex lg:min-h-dvh lg:flex-col lg:rounded-none lg:px-12 lg:py-10 ${
          compact ? "pb-5 lg:pb-10" : "pb-16"
        }`}
      >
        <SignalRings className="pointer-events-none absolute -bottom-24 -right-24 size-[26rem] lg:-bottom-32 lg:-right-32 lg:size-[36rem]" />
        <div className="relative flex items-center justify-between">
          <Logo />
          <LangToggle />
        </div>

        <div className={`relative mt-8 lg:mt-28 lg:block ${compact ? "hidden" : ""}`}>
          {ssid && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-lagoon-100">
              <span className="size-2 rounded-full bg-saffron-400" aria-hidden />
              {t.wifiNetwork(ssid)}
            </p>
          )}
          <h1 className="max-w-sm font-display text-[2.1rem] font-extrabold leading-[1.05] tracking-tight lg:text-5xl">{t.headline}</h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-lagoon-100/90">{t.subhead}</p>
        </div>

        <ul className="relative mt-auto hidden space-y-3 text-base text-lagoon-100 lg:block">
          {[t.fact1, t.fact2, t.fact3].map((fact) => (
            <li key={fact} className="flex gap-3">
              <CheckIcon />
              {fact}
            </li>
          ))}
        </ul>
      </aside>

      <main className={`relative px-4 pb-10 ${compact ? "mt-3" : "-mt-8"} lg:mt-0 lg:flex lg:items-center lg:justify-center lg:px-12 lg:py-12`}>
        <div className="mx-auto w-full max-w-md space-y-5">
          <Outlet />
          <footer className="space-y-1 pt-4 text-center text-sm text-ink-950/60">
            {config?.supportPhone && (
              <p>
                {t.needHelp}{" "}
                <a href={`tel:${config.supportPhone.replace(/\s/g, "")}`} className="font-semibold text-lagoon-800 underline underline-offset-2">
                  {config.supportPhone}
                </a>
              </p>
            )}
            <p>{t.poweredBy}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
