interface PilotBadgeProps {
  className?: string;
}

export default function PilotBadge({ className = "" }: PilotBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-primary/18 bg-[linear-gradient(180deg,hsl(0_0%_100%_/_0.84),hsl(40_42%_96%_/_0.94))] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-primary shadow-[0_10px_24px_-18px_hsl(var(--primary)/0.22)] ${className}`.trim()}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
      Pilot v0.5
    </span>
  );
}
