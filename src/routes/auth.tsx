import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "HeartLink — Begin the Ritual" },
      { name: "description", content: "Sign in or sign up to HeartLink." },
    ],
  }),
});

const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

const phoneSchema = z.string().trim().regex(/^\+[1-9]\d{6,14}$/, "Use international format e.g. +14155551234");
const otpSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");

type Mode = "email-signin" | "email-signup" | "phone";

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("email-signin");

  useEffect(() => {
    if (!loading && session) navigate({ to: "/app" });
  }, [session, loading, navigate]);

  return (
    <main className="min-h-dvh bg-void text-bone font-sans flex items-center justify-center px-6 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[800px] bg-ember/[0.08] blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 -right-40 size-[500px] bg-vein/40 blur-[100px] rounded-full" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-[10px] tracking-[0.3em] uppercase text-ember mb-3">— Chapter Zero —</div>
          <h1 className="font-serif text-5xl font-light tracking-tight">
            Heart<span className="text-ember">·</span>Link
          </h1>
          <p className="font-serif italic text-ash mt-3 text-lg">
            {mode === "email-signup" ? "Begin your ritual." : "Return to the thread."}
          </p>
        </div>

        <div className="border border-vein/50 bg-velvet/40 backdrop-blur-sm p-7">
          <div className="flex border-b border-vein/40 mb-6 -mx-7 -mt-7">
            <ModeTab active={mode === "email-signin"} onClick={() => setMode("email-signin")}>
              Sign in
            </ModeTab>
            <ModeTab active={mode === "email-signup"} onClick={() => setMode("email-signup")}>
              Create vow
            </ModeTab>
            <ModeTab active={mode === "phone"} onClick={() => setMode("phone")}>
              By phone
            </ModeTab>
          </div>

          {mode === "phone" ? <PhoneForm /> : <EmailForm signup={mode === "email-signup"} />}
        </div>

        <p className="text-center text-[10px] tracking-[0.25em] uppercase text-ash mt-6">
          By proceeding, you accept the silence and the reveal.
        </p>
      </div>
    </main>
  );
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 text-[10px] tracking-[0.2em] uppercase transition-colors ${
        active ? "text-ember border-b border-ember bg-ember/5" : "text-ash hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

function EmailForm({ signup }: { signup: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (signup) {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw error;
        toast.success("Welcome to the ritual.");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Email">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@somewhere.com"
          className="input-bare"
          required
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="input-bare"
          required
        />
      </Field>
      <button type="submit" disabled={busy} className="btn-ember">
        {busy ? "Sealing..." : signup ? "Create Vow" : "Enter"}
      </button>
    </form>
  );
}

function PhoneForm() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"enter" | "verify">("enter");
  const [busy, setBusy] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: parsed.data });
      if (error) throw error;
      toast.success("Code sent. Check your messages.");
      setStage("verify");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: parsed.data, type: "sms" });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  };

  if (stage === "verify") {
    return (
      <form onSubmit={verify} className="space-y-5">
        <Field label="Verification code">
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6 digits"
            className="input-bare tracking-[0.5em] text-center text-2xl"
            required
          />
        </Field>
        <button type="submit" disabled={busy} className="btn-ember">
          {busy ? "Verifying..." : "Verify"}
        </button>
        <button
          type="button"
          onClick={() => setStage("enter")}
          className="w-full text-[10px] tracking-[0.25em] uppercase text-ash hover:text-bone transition-colors"
        >
          ← Use a different number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-5">
      <Field label="Phone number">
        <input
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+14155551234"
          className="input-bare"
          required
        />
      </Field>
      <p className="text-[10px] tracking-[0.2em] uppercase text-ash/70">
        Use international format with country code.
      </p>
      <button type="submit" disabled={busy} className="btn-ember">
        {busy ? "Sending..." : "Send code"}
      </button>
    </form>
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