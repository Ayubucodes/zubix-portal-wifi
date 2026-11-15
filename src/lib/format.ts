import type { Lang } from "../i18n";
import type { PublicPackage } from "./api";

const TIMEZONE = "Africa/Dar_es_Salaam";
const numberFormat = new Intl.NumberFormat("en-US");

export function formatTzs(amount: number): string {
  return `TSh ${numberFormat.format(amount)}`;
}

export function formatExpiry(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleString(lang === "sw" ? "sw-TZ" : "en-GB", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const HOURS_PER_UNIT: Record<PublicPackage["durationUnit"], number> = {
  MINUTE: 1 / 60,
  HOUR: 1,
  DAY: 24,
  WEEK: 168,
  MONTH: 720,
};

export function durationHours(pkg: Pick<PublicPackage, "durationValue" | "durationUnit">): number {
  return pkg.durationValue * HOURS_PER_UNIT[pkg.durationUnit];
}

/** The pass with the lowest price per hour. Only meaningful when there is something to compare it with. */
export function bestValueId(packages: PublicPackage[]): string | null {
  if (packages.length < 2) return null;
  let best: PublicPackage | null = null;
  for (const pkg of packages) {
    if (!best || pkg.priceTzs / durationHours(pkg) < best.priceTzs / durationHours(best)) best = pkg;
  }
  return best?.id ?? null;
}
