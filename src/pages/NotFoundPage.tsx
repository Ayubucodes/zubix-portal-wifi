import { Link } from "react-router-dom";
import { Panel } from "../components/ui";
import { useI18n } from "../i18n";

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <Panel className="space-y-4 text-center">
      <h2 className="font-display text-2xl font-extrabold tracking-tight">{t.notFoundTitle}</h2>
      <Link to="/" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-lagoon-700 px-5 font-semibold text-white hover:bg-lagoon-800">
        {t.backHome}
      </Link>
    </Panel>
  );
}
