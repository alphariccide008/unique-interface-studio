import { Link } from "@tanstack/react-router";

const tabs = [
  { id: "discover", label: "Fates", to: "/app" as const },
  { id: "threads", label: "Threads", to: "/app/threads" as const },
  { id: "profile", label: "You", to: "/app/profile" as const },
];

export function TabBar({ active }: { active: "discover" | "threads" | "profile" }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-void/90 backdrop-blur-md border-t border-vein/40 z-50">
      <div className="max-w-md mx-auto flex justify-around py-3 text-[10px] tracking-[0.25em] uppercase">
        {tabs.map((t) => (
          <Link
            key={t.id}
            to={t.to}
            className={active === t.id ? "text-ember" : "text-ash hover:text-bone"}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}