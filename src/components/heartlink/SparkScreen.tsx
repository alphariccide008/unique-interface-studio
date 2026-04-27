import { useState } from "react";

export function SparkScreen({
  time,
  portrait,
  onLockIn,
}: {
  time: { h: number; m: number; s: number };
  portrait: string;
  onLockIn: () => void;
}) {
  const [text, setText] = useState("");
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="h-full flex flex-col bg-void text-bone relative overflow-hidden">
      <div className="absolute -top-10 -right-10 size-60 bg-ember/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 -left-10 size-60 bg-vein/40 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative px-5 pt-2 pb-3 flex items-center justify-between border-b border-vein/30">
        <span className="text-[9px] tracking-[0.25em] uppercase text-ash">Spark · 894</span>
        <div className="flex items-center gap-2">
          <span className="size-1.5 bg-ember rounded-full animate-pulse" />
          <span className="text-[9px] tracking-[0.25em] uppercase text-ember">Live</span>
        </div>
      </div>

      <div className="relative flex-1 px-5 pt-4 pb-4 flex flex-col">
        {/* Match avatars */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="size-10 rounded-full overflow-hidden border border-vein bg-velvet">
            <img src={portrait} alt="You" loading="lazy" width={768} height={1024} className="w-full h-full object-cover grayscale" />
          </div>
          <div className="flex flex-col items-center text-[8px] tracking-widest uppercase text-ash">
            <span className="font-serif italic text-ember text-base normal-case tracking-normal">∞</span>
            <span>bound</span>
          </div>
          <div className="size-10 rounded-full overflow-hidden border border-ember/60 bg-velvet shadow-[0_0_15px_rgba(217,22,39,0.4)]">
            <div className="w-full h-full bg-gradient-to-br from-vein to-velvet flex items-center justify-center text-ember font-serif italic">
              S
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="text-center mb-6">
          <div className="text-[9px] tracking-[0.3em] uppercase text-ember mb-2">
            The 11th Hour
          </div>
          <div className="font-sans text-5xl font-extralight tabular-nums tracking-tighter text-bone flex items-baseline justify-center gap-1">
            {pad(time.h)}
            <span className="text-2xl text-ash/50">:</span>
            {pad(time.m)}
            <span className="text-2xl text-ash/50">:</span>
            {pad(time.s)}
          </div>
          <p className="text-[10px] text-ash mt-1 italic font-serif">
            until the thread snaps
          </p>
        </div>

        {/* The question */}
        <div className="relative bg-gradient-to-b from-velvet to-void/80 border border-vein/60 p-5 flex-1 flex flex-col">
          <div className="absolute top-0 right-0 size-5 border-t border-r border-ember/50" />
          <div className="absolute bottom-0 left-0 size-5 border-b border-l border-ember/50" />

          <div className="text-[8px] tracking-[0.3em] uppercase text-ash mb-3">
            Question No. 084
          </div>
          <h3 className="font-serif italic text-xl leading-snug text-bone text-balance mb-4">
            "If the world ended tomorrow, whose name would you carve into the final stone?"
          </h3>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Speak into the void..."
            className="flex-1 bg-transparent border-b border-vein focus:border-ember outline-none text-bone font-serif italic text-base resize-none placeholder:text-ash/40 min-h-[60px]"
          />

          <div className="mt-3 flex items-center justify-between text-[9px] tracking-widest uppercase text-ash">
            <span>{text.length}/280</span>
            <span className="italic font-serif normal-case tracking-normal text-ember/70">
              Silas is writing...
            </span>
          </div>
        </div>

        <button
          onClick={onLockIn}
          className="mt-4 w-full bg-ember/10 border border-ember text-ember py-3.5 text-[10px] tracking-[0.3em] uppercase hover:bg-ember hover:text-void transition-colors shadow-[0_0_30px_rgba(217,22,39,0.2)]"
        >
          Seal Confession
        </button>
      </div>
    </div>
  );
}