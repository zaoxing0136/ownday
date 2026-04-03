export function getHomeHref() {
  const base = import.meta.env.BASE_URL || "/";
  return import.meta.env.VITE_ROUTER_MODE === "hash" ? `${base}#/` : base;
}
