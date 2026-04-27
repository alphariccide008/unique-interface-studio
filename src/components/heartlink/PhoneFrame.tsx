export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[320px] sm:w-[340px] mx-auto">
      {/* Outer crimson glow */}
      <div className="absolute -inset-6 bg-ember/15 blur-3xl rounded-[3rem] pointer-events-none" />

      {/* Bezel */}
      <div className="relative bg-[#0a0606] rounded-[2.75rem] p-2 shadow-[0_30px_80px_-10px_rgba(217,22,39,0.25),0_0_0_1px_rgba(217,22,39,0.15)] ring-1 ring-vein/40">
        {/* Side notch (volume) */}
        <div className="absolute -left-[3px] top-24 w-[3px] h-12 bg-vein/60 rounded-l" />
        <div className="absolute -left-[3px] top-40 w-[3px] h-8 bg-vein/60 rounded-l" />
        <div className="absolute -right-[3px] top-32 w-[3px] h-16 bg-vein/60 rounded-r" />

        {/* Screen */}
        <div className="relative bg-void rounded-[2.25rem] overflow-hidden aspect-[9/19.5]">
          {/* Dynamic island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-24 h-6 bg-black rounded-full flex items-center justify-end pr-2">
            <div className="size-2 rounded-full bg-ember/60 shadow-[0_0_6px_rgba(217,22,39,0.8)]" />
          </div>

          {/* Status bar */}
          <div className="absolute top-3 left-0 right-0 z-20 px-7 flex justify-between text-[10px] text-bone/80 font-sans tabular-nums tracking-wide">
            <span>11:47</span>
            <span className="opacity-0">·</span>
            <span className="flex items-center gap-1">
              <span>·</span><span>·</span><span>·</span><span>87</span>
            </span>
          </div>

          <div className="absolute inset-0 pt-10">{children}</div>
        </div>
      </div>
    </div>
  );
}