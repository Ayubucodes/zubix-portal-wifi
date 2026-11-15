export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#f6b21a" />
      <g fill="none" stroke="#062c33" strokeWidth="5" strokeLinecap="round">
        <path d="M14 27a26 26 0 0 1 36 0" />
        <path d="M21 35a16 16 0 0 1 22 0" />
      </g>
      <circle cx="32" cy="45" r="4" fill="#062c33" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-tight">Zubix</span>
    </div>
  );
}

/** Decorative signal rings that bleed off the corner of the dark panel. */
export function SignalRings({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden fill="none">
      {[60, 120, 180, 240, 300, 360].map((r, i) => (
        <circle key={r} cx="400" cy="400" r={r} stroke="#9bd3d0" strokeOpacity={0.22 - i * 0.025} strokeWidth="2" />
      ))}
    </svg>
  );
}
