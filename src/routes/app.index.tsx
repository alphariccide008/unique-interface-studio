import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { photoUrl } from "@/lib/photo-url";
import { toast } from "sonner";
import { TabBar } from "@/components/heartlink/TabBar";

export const Route = createFileRoute("/app/")({
  component: DiscoverPage,
});

type Candidate = {
  id: string;
  display_name: string | null;
  bio: string | null;
  city: string | null;
  date_of_birth: string | null;
  photo: string | null;
};

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function DiscoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get IDs the user already acted on
      const { data: actedOn } = await supabase
        .from("likes")
        .select("liked_id")
        .eq("liker_id", user.id);
      const excludeIds = new Set<string>([user.id, ...(actedOn ?? []).map((a) => a.liked_id)]);

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, bio, city, date_of_birth")
        .eq("is_complete", true)
        .limit(50);

      if (error) {
        toast.error("Could not load fates.");
        setLoading(false);
        return;
      }

      const filtered = (profiles ?? []).filter((p) => !excludeIds.has(p.id));
      // Get first photo for each
      const ids = filtered.map((p) => p.id);
      let photos: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: photoRows } = await supabase
          .from("profile_photos")
          .select("user_id, storage_path, position")
          .in("user_id", ids)
          .order("position", { ascending: true });
        for (const row of photoRows ?? []) {
          if (!photos[row.user_id]) {
            photos[row.user_id] = photoUrl(row.storage_path) ?? "";
          }
        }
      }

      setCandidates(
        filtered.map((p) => ({
          ...p,
          photo: photos[p.id] ?? null,
        }))
      );
      setLoading(false);
    })();
  }, [user]);

  const current = candidates[index];

  const act = async (action: "like" | "pass") => {
    if (!user || !current || acting) return;
    setActing(true);
    const { error } = await supabase
      .from("likes")
      .insert({ liker_id: user.id, liked_id: current.id, action });
    if (error) {
      toast.error(error.message);
    } else if (action === "like") {
      // Check if it created a match
      const a = user.id < current.id ? user.id : current.id;
      const b = user.id < current.id ? current.id : user.id;
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .eq("user_a", a)
        .eq("user_b", b)
        .maybeSingle();
      if (match) {
        toast.success(`Threads bound with ${current.display_name ?? "them"}.`);
      }
    }
    setIndex((i) => i + 1);
    setActing(false);
  };

  return (
    <div className="min-h-dvh bg-void text-bone font-sans flex flex-col">
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <span className="font-serif text-xl tracking-[0.2em] uppercase">
          Heart<span className="text-ember">·</span>Link
        </span>
        <Link to="/app/profile" className="text-[10px] tracking-[0.25em] uppercase text-ash hover:text-ember">
          You
        </Link>
      </header>

      <div className="flex-1 px-5 pb-20 flex flex-col">
        <div className="text-[9px] tracking-[0.25em] uppercase text-ash mb-3 flex items-center gap-2">
          <span className="w-4 h-px bg-vein" /> Crossing Paths
        </div>

        {loading ? (
          <CenterMessage text="Searching the threads..." />
        ) : !current ? (
          <CenterMessage
            text="The fates are quiet tonight."
            sub="No one new to cross paths with. Check back soon."
            action={
              <Link
                to="/app/threads"
                className="mt-6 inline-block border border-ember/40 text-ember px-5 py-2.5 text-[10px] tracking-[0.25em] uppercase hover:bg-ember/10"
              >
                View threads
              </Link>
            }
          />
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="relative flex-1 bg-velvet border border-vein/50 p-1.5 overflow-hidden max-h-[60vh]">
              <div className="relative w-full h-full overflow-hidden">
                {current.photo ? (
                  <img
                    src={current.photo}
                    alt={current.display_name ?? "candidate"}
                    className="w-full h-full object-cover grayscale opacity-90"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-velvet to-vein flex items-center justify-center font-serif italic text-6xl text-ember/40">
                    {current.display_name?.[0] ?? "?"}
                  </div>
                )}
                <div className="absolute inset-0 bg-ember mix-blend-multiply opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-end justify-between mb-2">
                    <h2 className="font-serif text-4xl font-light tracking-tight">
                      {current.display_name ?? "Unknown"}
                    </h2>
                    <span className="text-[10px] uppercase tracking-widest text-ash mb-1">
                      {ageFromDob(current.date_of_birth) ?? "?"}
                      {current.city ? ` · ${current.city}` : ""}
                    </span>
                  </div>
                  <div className="w-full h-px bg-vein/60 my-3" />
                  <p className="font-serif italic text-sm text-bone/85 leading-snug line-clamp-3">
                    {current.bio ?? "No words yet."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6">
              <button
                disabled={acting}
                onClick={() => act("pass")}
                className="size-14 rounded-full border border-vein flex items-center justify-center text-ash hover:text-bone hover:border-bone transition-colors disabled:opacity-40"
              >
                <span className="text-2xl">×</span>
              </button>
              <button
                disabled={acting}
                onClick={() => act("like")}
                className="size-16 rounded-full bg-ember/15 border border-ember/60 flex items-center justify-center text-ember shadow-[0_0_30px_rgba(217,22,39,0.3)] hover:bg-ember/25 transition-colors disabled:opacity-40"
              >
                <span className="font-serif italic text-3xl">+</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <TabBar active="discover" />
    </div>
  );
}

function CenterMessage({
  text,
  sub,
  action,
}: {
  text: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="font-serif italic text-2xl text-bone/80">{text}</div>
      {sub && <p className="text-sm text-ash mt-3 max-w-xs">{sub}</p>}
      {action}
    </div>
  );
}