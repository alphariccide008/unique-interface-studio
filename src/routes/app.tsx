import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [session, loading, navigate]);

  // Onboarding gate: if profile incomplete, force onboarding
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_complete")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      const complete = data?.is_complete ?? false;
      const onOnboarding = location.pathname.startsWith("/app/onboarding");
      if (!complete && !onOnboarding) {
        navigate({ to: "/app/onboarding" });
      } else if (complete && onOnboarding) {
        navigate({ to: "/app" });
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, location.pathname, navigate]);

  if (loading || !session || checking) {
    return (
      <div className="min-h-dvh bg-void text-ash flex items-center justify-center">
        <span className="font-serif italic text-lg">Lighting the candle...</span>
      </div>
    );
  }

  return <Outlet />;
}