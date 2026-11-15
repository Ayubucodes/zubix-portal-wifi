import { NavLink } from "react-router-dom";
import { useI18n } from "../i18n";

export function TabBar() {
  const { t } = useI18n();
  const base = "flex min-h-11 flex-1 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors";
  return (
    <nav aria-label="Portal" className="flex gap-1 rounded-2xl bg-white p-1 ring-1 ring-ink-950/5">
      <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? "bg-ink-950 text-white" : "text-ink-950/70 hover:bg-lagoon-50"}`}>
        {t.tabBuy}
      </NavLink>
      <NavLink to="/voucher" className={({ isActive }) => `${base} ${isActive ? "bg-ink-950 text-white" : "text-ink-950/70 hover:bg-lagoon-50"}`}>
        {t.tabVoucher}
      </NavLink>
    </nav>
  );
}
