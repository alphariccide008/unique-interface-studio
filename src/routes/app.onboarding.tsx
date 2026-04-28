import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { photoUrl } from "@/lib/photo-url";
import { toast } from "sonner";

export const Route = createFileRoute("/app/onboarding")({
  component: Onboarding,
});

const schema = z.object({
  display_name: z.string().trim().min(2, "Name too short").max(40),
  bio: z.string().trim().min(10, "Bio must be at least 10 characters").max(280),
  city: z.string().trim().min(2).max(60),
  date_of_birth: z.string().refine((v) => {
    const d = new Date(v);
    if (isNaN(d.getTime())) return false;
    const ageMs = Date.now() - d.getTime();
    const age = ageMs / (365.25 * 24 * 3600 * 1000);
    return age >= 18 && age <= 120;
  }, "You must be 18+"),
});

const MAX_PHOTOS = 6;
const MAX_BYTES = 5 * 1024 * 1024;

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [dob, setDob] = useState("");

  const [photos, setPhotos] = useState<{ id: string; storage_path: string; url: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, bio, city, date_of_birth")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setCity(data.city ?? "");
        setDob(data.date_of_birth ?? "");
      }
      const { data: ph } = await supabase
        .from("profile_photos")
        .select("id, storage_path")
        .eq("user_id", user.id)
        .order("position", { ascending: true });
      setPhotos(
        (ph ?? []).map((p) => ({ id: p.id, storage_path: p.storage_path, url: photoUrl(p.storage_path) ?? "" }))
      );
    })();
  }, [user]);

  const saveDetails = async () => {
    const parsed = schema.safeParse({ display_name: displayName, bio, city, date_of_birth: dob });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      ...parsed.data,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else setStep(2);
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Up to ${MAX_PHOTOS} fragments only.`);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use JPG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image too large (max 5 MB).");
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, file);
    if (upErr) {
      toast.error(upErr.message);
      setBusy(false);
      return;
    }
    const { data, error: insErr } = await supabase
      .from("profile_photos")
      .insert({ user_id: user.id, storage_path: path, position: photos.length })
      .select("id, storage_path")
      .single();
    if (insErr || !data) toast.error(insErr?.message ?? "Save failed.");
    else
      setPhotos((p) => [...p, { id: data.id, storage_path: data.storage_path, url: photoUrl(data.storage_path) ?? "" }]);
    setBusy(false);
  };

  const removePhoto = async (photoId: string, path: string) => {
    setBusy(true);
    await supabase.storage.from("profile-photos").remove([path]);
    await supabase.from("profile_photos").delete().eq("id", photoId);
    setPhotos((p) => p.filter((x) => x.id !== photoId));
    setBusy(false);
  };

  const finish = async () => {
    if (photos.length === 0) {
      toast.error("Add at least one fragment.");
      return;
    }
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ is_complete: true }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("The vow is sealed.");
      navigate({ to: "/app" });
    }
  };

  return (
    <main className="min-h-dvh bg-void text-bone font-sans px-6 py-10 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-[10px] tracking-[0.3em] uppercase text-ember mb-2">— Chapter Zero, Part {step} —</div>
        <h1 className="font-serif text-3xl">{step === 1 ? "Speak your truth." : "Offer your fragments."}</h1>
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <Field label="Name they call you">
            <input className="input-bare" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              className="input-bare"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </Field>
          <Field label="City">
            <input className="input-bare" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="A line about you">
            <textarea
              className="input-bare resize-none min-h-[100px]"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
            />
            <div className="text-[9px] tracking-widest uppercase text-ash text-right mt-1">{bio.length}/280</div>
          </Field>
          <button onClick={saveDetails} disabled={busy} className="btn-ember">
            {busy ? "Sealing..." : "Continue"}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-ash text-center">
            The first becomes your <span className="text-ember">Anchor</span>. Up to {MAX_PHOTOS}.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((p, i) => (
              <div key={p.id} className="relative aspect-[3/4] bg-velvet border border-vein/50 overflow-hidden group">
                <img src={p.url} alt="" className="w-full h-full object-cover grayscale" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-ember/80 text-void text-[8px] tracking-widest uppercase px-1.5 py-0.5">
                    Anchor
                  </span>
                )}
                <button
                  onClick={() => removePhoto(p.id, p.storage_path)}
                  className="absolute top-1 right-1 size-6 bg-void/80 text-bone text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="aspect-[3/4] border border-dashed border-vein/60 flex items-center justify-center text-ash text-3xl font-serif italic cursor-pointer hover:border-ember hover:text-ember">
                +
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPhoto(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-vein text-ash py-3 text-[10px] tracking-[0.25em] uppercase hover:text-bone">
              ← Back
            </button>
            <button onClick={finish} disabled={busy} className="btn-ember flex-1">
              {busy ? "..." : "Seal"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[9px] tracking-[0.3em] uppercase text-ash mb-2 block">{label}</span>
      {children}
    </label>
  );
}