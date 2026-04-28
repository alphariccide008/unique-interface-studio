import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { photoUrl } from "@/lib/photo-url";
import { TabBar } from "@/components/heartlink/TabBar";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    display_name: string | null;
    bio: string | null;
    city: string | null;
    date_of_birth: string | null;
  } | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, bio, city, date_of_birth")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(data ?? null);
      const { data: ph } = await supabase
        .from("profile_photos")
        .select("storage_path")
        .eq("user_id", user.id)
        .order("position", { ascending: true })
        .limit(1);
      setPhoto(ph?.[0]?.storage_path ? photoUrl(ph[0].storage_path) : null);
    })();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("The thread is sealed.");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-dvh bg-void text-bone font-sans flex flex-col pb-24">
      <header className="px-5 pt-6 pb-3">
        <span className="text-[9px] tracking-[0.3em] uppercase text-ash">— You —</span>
      </header>

      <div className="px-5 flex flex-col items-center text-center">
        <div className="size-32 rounded-full overflow-hidden border border-vein bg-velvet mb-5">
          {photo ? (
            <img src={photo} alt="You" className="w-full h-full object-cover grayscale" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-serif italic text-4xl text-ember/50">
              {profile?.display_name?.[0] ?? "?"}
            </div>
          )}
        </div>
        <h1 className="font-serif text-3xl mb-1">{profile?.display_name ?? "Anonymous"}</h1>
        <p className="text-[10px] tracking-[0.25em] uppercase text-ash mb-5">
          {profile?.city ?? "Somewhere"}
        </p>
        {profile?.bio && (
          <p className="font-serif italic text-bone/85 max-w-sm leading-relaxed mb-8">
            "{profile.bio}"
          </p>
        )}

        <button
          onClick={() => navigate({ to: "/app/onboarding" })}
          className="w-full max-w-xs border border-vein text-ash py-3 text-[10px] tracking-[0.25em] uppercase hover:text-bone hover:border-bone transition-colors"
        >
          Edit your vow
        </button>
        <button
          onClick={handleSignOut}
          className="mt-3 w-full max-w-xs border border-ember/40 text-ember py-3 text-[10px] tracking-[0.25em] uppercase hover:bg-ember/10 transition-colors"
        >
          Leave
        </button>
      </div>

      <TabBar active="profile" />
    </div>
  );
}