import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { photoUrl } from "@/lib/photo-url";
import { TabBar } from "@/components/heartlink/TabBar";

export const Route = createFileRoute("/app/threads")({
  component: ThreadsPage,
});

type Thread = {
  matchId: string;
  partnerId: string;
  partnerName: string;
  photo: string | null;
  lastMessage: string | null;
  lastAt: string;
};

function ThreadsPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select("id, user_a, user_b, created_at")
        .order("created_at", { ascending: false });

      if (!matches || matches.length === 0) {
        setThreads([]);
        setLoading(false);
        return;
      }

      const partnerIds = matches.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", partnerIds);

      const { data: photos } = await supabase
        .from("profile_photos")
        .select("user_id, storage_path, position")
        .in("user_id", partnerIds)
        .order("position", { ascending: true });

      const photoMap: Record<string, string> = {};
      for (const p of photos ?? []) {
        if (!photoMap[p.user_id]) photoMap[p.user_id] = photoUrl(p.storage_path) ?? "";
      }

      const matchIds = matches.map((m) => m.id);
      const { data: lastMsgs } = await supabase
        .from("messages")
        .select("match_id, body, created_at")
        .in("match_id", matchIds)
        .order("created_at", { ascending: false });
      const lastMap: Record<string, { body: string; at: string }> = {};
      for (const m of lastMsgs ?? []) {
        if (!lastMap[m.match_id]) lastMap[m.match_id] = { body: m.body, at: m.created_at };
      }

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.display_name ?? "Unknown"]));

      setThreads(
        matches.map((m) => {
          const partnerId = m.user_a === user.id ? m.user_b : m.user_a;
          return {
            matchId: m.id,
            partnerId,
            partnerName: profileMap[partnerId] ?? "Unknown",
            photo: photoMap[partnerId] ?? null,
            lastMessage: lastMap[m.id]?.body ?? null,
            lastAt: lastMap[m.id]?.at ?? m.created_at,
          };
        })
      );
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-dvh bg-void text-bone font-sans pb-24">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-vein/30">
        <h1 className="font-serif text-2xl">Threads</h1>
        <span className="text-[9px] tracking-[0.25em] uppercase text-ash">{threads.length} bound</span>
      </header>

      {loading ? (
        <p className="text-center font-serif italic text-ash mt-20">Gathering threads...</p>
      ) : threads.length === 0 ? (
        <div className="text-center mt-20 px-6">
          <p className="font-serif italic text-xl text-bone/80">No threads yet.</p>
          <p className="text-sm text-ash mt-2">Cross paths to bind your first.</p>
          <Link to="/app" className="mt-6 inline-block border border-ember/40 text-ember px-5 py-2.5 text-[10px] tracking-[0.25em] uppercase hover:bg-ember/10">
            To the fates
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-vein/30">
          {threads.map((t) => (
            <li key={t.matchId}>
              <Link
                to="/app/threads/$matchId"
                params={{ matchId: t.matchId }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-velvet/40 transition-colors"
              >
                <div className="size-12 rounded-full overflow-hidden bg-velvet border border-vein flex-shrink-0">
                  {t.photo ? (
                    <img src={t.photo} alt="" className="w-full h-full object-cover grayscale" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif italic text-ember">
                      {t.partnerName[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-lg truncate">{t.partnerName}</div>
                  <div className="text-sm text-ash truncate font-serif italic">
                    {t.lastMessage ?? "Today's Spark awaits..."}
                  </div>
                </div>
                <span className="text-[9px] tracking-widest uppercase text-ember">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <TabBar active="threads" />
    </div>
  );
}