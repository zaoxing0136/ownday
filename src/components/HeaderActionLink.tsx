import { Link } from "react-router-dom";

interface HeaderActionLinkProps {
  to?: string;
  label?: string;
}

export default function HeaderActionLink({
  to = "/settings",
  label = "设置",
}: HeaderActionLinkProps) {
  return (
    <Link
      to={to}
      className="glass-chip shrink-0 gap-2 px-3.5 py-2 text-[11px] tracking-[0.08em] text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary/75" />
      {label}
    </Link>
  );
}
