interface PilotBadgeProps {
  className?: string;
}

export default function PilotBadge({ className = "" }: PilotBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] text-primary shadow-[0_12px_30px_-20px_hsl(var(--primary)/0.55)] backdrop-blur-xl ${className}`.trim()}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary/80 shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]" />
      Pilot v0.3
    </span>
  );
}
