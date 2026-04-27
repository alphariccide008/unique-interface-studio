import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import portrait1 from "@/assets/portrait-1.jpg";
import portrait2 from "@/assets/portrait-2.jpg";
import portrait3 from "@/assets/portrait-3.jpg";
import { PhoneFrame } from "./PhoneFrame";
import { DiscoveryScreen } from "./DiscoveryScreen";
import { SparkScreen } from "./SparkScreen";
import { RevealScreen } from "./RevealScreen";

export function HeartLinkApp() {
  const [activeScreen, setActiveScreen] = useState<"discover" | "spark" | "reveal">("spark");
  const [revealed, setRevealed] = useState(false);

  // Live countdown
  const [time, setTime] = useState({ h: 4, m: 12, s: 47 });
  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t;
        s -= 1;
        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) h = 23;
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-dvh bg-void text-bone font-sans relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[1100px] bg-ember/[0.07] blur-[160px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 -right-40 size-[700px] bg-vein/40 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-1/2 -left-40 size-[500px] bg-ember-dim/15 blur-[120px] rounded-full" />

      {/* Grain texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Header */}
      <header className="relative z-10 max-w-[1480px] mx-auto px-6 md:px-12 pt-8 md:pt-10 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-2xl md:text-3xl tracking-[0.15em] uppercase text-bone">
            Heart<span className="text-ember">·</span>Link
          </span>
        </div>
        <nav className="hidden md:flex gap-10 text-[10px] tracking-[0.25em] uppercase text-ash">
          <span className="hover:text-bone transition-colors cursor-pointer">Manifesto</span>
          <span className="hover:text-bone transition-colors cursor-pointer">Sparks</span>
          <span className="hover:text-bone transition-colors cursor-pointer">Plus</span>
        </nav>
        <Link
          to="/auth"
          className="text-[10px] tracking-[0.25em] uppercase text-ember border border-ember/30 px-4 py-2 hover:bg-ember/10 transition-colors"
        >
          Begin Ritual
        </Link>
      </header>

      {/* Hero copy */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-10 md:pb-16 grid md:grid-cols-12 gap-10 items-end">
        <div className="md:col-span-7">
          <div className="text-[10px] tracking-[0.3em] uppercase text-ember mb-6 flex items-center gap-3">
            <span className="size-1.5 bg-ember rounded-full animate-pulse" />
            Chapter I — The Daily Ritual
          </div>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light leading-[0.95] tracking-tight text-balance">
            One question.<br />
            <span className="italic text-ember">Until midnight.</span><br />
            Then the reveal.
          </h1>
          <p className="mt-8 max-w-[52ch] font-serif italic text-xl md:text-2xl text-ash leading-relaxed">
            Every match receives the same prompt. You both answer in private. At the
            stroke of midnight — your words appear together, or vanish forever.
          </p>
        </div>

        <div className="md:col-span-5 flex md:justify-end">
          <div className="flex flex-col gap-3 text-xs md:text-sm font-sans">
            <Stat label="Active matches tonight" value="4,892" />
            <Stat label="Sparks revealed today" value="61,204" />
            <Stat label="Average streak" value="17 days" />
          </div>
        </div>
      </section>

      {/* Three-phone display */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-6 md:px-12 pb-20 md:pb-32">
        <div className="hidden lg:grid grid-cols-3 gap-12 items-end">
          <PhoneShowcase
            number="01"
            title="Crossing"
            caption="A passing glance, anchored by distance."
          >
            <DiscoveryScreen portrait={portrait2} />
          </PhoneShowcase>

          <PhoneShowcase
            number="02"
            title="The 11th Hour"
            caption="A vow sealed before the thread snaps."
            elevated
          >
            <SparkScreen
              time={time}
              portrait={portrait1}
              onLockIn={() => setActiveScreen("reveal")}
            />
          </PhoneShowcase>

          <PhoneShowcase
            number="03"
            title="The Reveal"
            caption="Two truths, surfaced at the same instant."
          >
            <RevealScreen
              portrait={portrait3}
              revealed={revealed}
              onReveal={() => setRevealed(true)}
            />
          </PhoneShowcase>
        </div>

        {/* Mobile / tablet single phone with tab switcher */}
        <div className="lg:hidden flex flex-col items-center gap-8">
          <div className="flex gap-1 p-1 border border-vein/50 bg-velvet/50 backdrop-blur-sm">
            {(
              [
                { id: "discover", label: "Crossing" },
                { id: "spark", label: "The Hour" },
                { id: "reveal", label: "Reveal" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveScreen(t.id)}
                className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors ${
                  activeScreen === t.id
                    ? "bg-ember text-void"
                    : "text-ash hover:text-bone"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <PhoneFrame>
            {activeScreen === "discover" && <DiscoveryScreen portrait={portrait2} />}
            {activeScreen === "spark" && (
              <SparkScreen
                time={time}
                portrait={portrait1}
                onLockIn={() => {
                  setActiveScreen("reveal");
                  setRevealed(false);
                }}
              />
            )}
            {activeScreen === "reveal" && (
              <RevealScreen
                portrait={portrait3}
                revealed={revealed}
                onReveal={() => setRevealed(true)}
              />
            )}
          </PhoneFrame>
        </div>
      </section>

      {/* Footer manifesto */}
      <section className="relative z-10 border-t border-vein/40">
        <div className="max-w-[1480px] mx-auto px-6 md:px-12 py-16 grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="text-[10px] tracking-[0.3em] uppercase text-ash mb-4">
              — A Manifesto
            </div>
            <p className="font-serif italic text-2xl md:text-3xl leading-snug text-bone/90 text-balance">
              "Other apps reward the swipe. We reward the answer."
            </p>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-3 gap-8 text-sm text-ash">
            <Pillar title="Proximity" body="The first faces you see are within fifty miles. Real, meetable, here." />
            <Pillar title="Patience" body="One Spark a day. No infinite scroll. Connection earns its weight." />
            <Pillar title="Privacy" body="Your answers are encrypted until the mutual reveal. Nothing leaks." />
          </div>
        </div>
        <div className="border-t border-vein/30 px-6 md:px-12 py-6 max-w-[1480px] mx-auto flex justify-between items-center text-[10px] tracking-[0.25em] uppercase text-ash">
          <span>HeartLink · MMXXVI</span>
          <span className="text-ember">Cycle 0894 · Sealed</span>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-vein/40 pb-2">
      <span className="text-[10px] tracking-[0.2em] uppercase text-ash">{label}</span>
      <span className="font-serif text-xl text-bone tabular-nums">{value}</span>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-ember font-serif italic text-lg mb-2">{title}</div>
      <p className="leading-relaxed">{body}</p>
    </div>
  );
}

function PhoneShowcase({
  number,
  title,
  caption,
  elevated,
  children,
}: {
  number: string;
  title: string;
  caption: string;
  elevated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col items-center ${elevated ? "lg:-translate-y-12" : ""}`}>
      <div className="mb-8 text-center">
        <div className="text-[10px] tracking-[0.3em] uppercase text-ash mb-3">
          — Phase {number} —
        </div>
        <h3 className="font-serif text-3xl text-bone mb-2">{title}</h3>
        <p className="font-serif italic text-ash text-sm max-w-[28ch] mx-auto">
          {caption}
        </p>
      </div>
      <PhoneFrame>{children}</PhoneFrame>
    </div>
  );
}