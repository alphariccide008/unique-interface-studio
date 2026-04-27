export function DiscoveryScreen({ portrait }: { portrait: string }) {
  return (
    <div className="h-full flex flex-col bg-void text-bone">
      {/* Top bar */}
      <div className="px-5 pt-2 pb-3 flex items-center justify-between">
        <span className="font-serif text-lg tracking-widest uppercase">
          Heart<span className="text-ember">·</span>Link
        </span>
        <div className="flex gap-1.5">
          <span className="size-1.5 rounded-full bg-ember" />
          <span className="size-1.5 rounded-full bg-vein" />
          <span className="size-1.5 rounded-full bg-vein" />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-4 pb-4 flex flex-col">
        <div className="text-[9px] tracking-[0.25em] uppercase text-ash mb-2 flex items-center gap-2">
          <span className="w-4 h-px bg-vein" /> Crossing Paths
        </div>

        <div className="relative flex-1 bg-velvet border border-vein/50 p-1.5 group overflow-hidden">
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={portrait}
              alt="Silas"
              loading="lazy"
              width={768}
              height={1024}
              className="w-full h-full object-cover grayscale opacity-80"
            />
            <div className="absolute inset-0 bg-ember mix-blend-multiply opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />

            {/* Top floating chip */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
              <span className="bg-void/70 backdrop-blur-sm border border-vein/50 px-2.5 py-1 text-[9px] tracking-widest uppercase text-bone">
                8 mi
              </span>
              <span className="bg-ember/20 backdrop-blur-sm border border-ember/40 px-2.5 py-1 text-[9px] tracking-widest uppercase text-ember">
                Online
              </span>
            </div>

            {/* Content */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-end justify-between mb-2">
                <h2 className="font-serif text-4xl font-light tracking-tight">Silas</h2>
                <span className="text-[10px] uppercase tracking-widest text-ash mb-1">29 · Architect</span>
              </div>
              <div className="w-full h-px bg-vein/60 my-3" />
              <p className="font-serif italic text-sm text-bone/85 leading-snug">
                "Solace in thunderstorms, brutalist architecture, and the silence right before a lie is told."
              </p>
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="mt-4 flex items-center justify-center gap-5">
          <button className="size-12 rounded-full border border-vein flex items-center justify-center text-ash hover:text-bone hover:border-bone transition-colors">
            <span className="text-xl">×</span>
          </button>
          <button className="size-14 rounded-full bg-ember/15 border border-ember/60 flex items-center justify-center text-ember shadow-[0_0_30px_rgba(217,22,39,0.3)] hover:bg-ember/25 transition-colors">
            <span className="font-serif italic text-2xl">+</span>
          </button>
          <button className="size-12 rounded-full border border-vein flex items-center justify-center text-ash hover:text-ember hover:border-ember transition-colors">
            <span className="text-sm">★</span>
          </button>
        </div>

        {/* Tab bar */}
        <div className="mt-4 flex justify-around pt-3 border-t border-vein/40 text-[9px] tracking-widest uppercase">
          <span className="text-ember">Fates</span>
          <span className="text-ash">Ritual</span>
          <span className="text-ash">Threads</span>
          <span className="text-ash">You</span>
        </div>
      </div>
    </div>
  );
}