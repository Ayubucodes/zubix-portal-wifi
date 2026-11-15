import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-lagoon-700 text-white hover:bg-lagoon-800 disabled:bg-lagoon-700/50",
  secondary: "bg-white text-ink-950 ring-1 ring-inset ring-ink-950/15 hover:bg-lagoon-50 disabled:text-ink-950/40",
  ghost: "text-lagoon-800 hover:bg-lagoon-50 disabled:text-ink-950/40",
};

export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} motion-safe:animate-spin`} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && <Spinner className="size-5" />}
      {children}
    </button>
  );
}

export function Alert({ tone = "danger", children }: { tone?: "danger" | "info" | "warning"; children: ReactNode }) {
  const tones = {
    danger: "bg-red-50 text-red-900 ring-red-200",
    info: "bg-lagoon-50 text-lagoon-800 ring-lagoon-200",
    warning: "bg-saffron-100 text-ink-950 ring-saffron-400/60",
  };
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm leading-relaxed ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-5 ring-1 ring-ink-950/5 ${className}`}>{children}</section>;
}

export function Field({ label, hint, error, htmlFor, children }: { label: string; hint?: string; error?: string | null; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink-950">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : (
        hint && <p id={`${htmlFor}-hint`} className="text-sm text-ink-950/60">{hint}</p>
      )}
    </div>
  );
}

export const inputClass =
  "block min-h-12 w-full rounded-xl border-0 bg-white px-4 text-lg text-ink-950 ring-1 ring-inset ring-ink-950/15 placeholder:text-ink-950/35 focus:ring-2 focus:ring-inset focus:ring-lagoon-700";
