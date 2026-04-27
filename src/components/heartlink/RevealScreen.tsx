export function RevealScreen({
  portrait,
  revealed,
  onReveal,
}: {
  portrait: string;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <div className="h-full flex flex-col bg-void text-bone relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 bg-ember/15 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative px-5 pt-2 pb-3 flex items-center justify-between border-b border-vein/30">
        <span className="text-[9px] tracking-[0.25em] uppercase text-ash">← Spark Reveal</span>
        <span className="text-[9px] tracking-[0.25em] uppercase text-ember">00:00:00</span>
      </div>

      <div className="relative flex-1 px-5 pt-5 pb-4 flex flex-col gap-4 overflow-y-auto">
        {/* Title */}
        <div className="text-center mb-1">
          <div className="text-[9px] tracking-[0.3em] uppercase text-ember mb-2 flex items-center justify-center gap-2">
            <span className="w-6 h-px bg-ember" /> Mutual Reveal <span className="w-6 h-px bg-ember" />
          </div>
          <h3 className="font-serif italic text-lg leading-snug text-bone/90 text-balance">
            "If the world ended tomorrow, whose name would you carve into the final stone?"
          </h3>
        </div>

        {/* Your answer */}
        <div className="bg-velvet/60 border-l border-bone/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-6 rounded-full overflow-hidden bg-vein">
              <img src={portrait} alt="You" loading="lazy" width={768} height={1024} className="w-full h-full object-cover grayscale" />
            </div>
            <span className="text-[9px] tracking-widest uppercase text-ash">You · 23:14</span>
          </div>
          <p className="font-serif italic text-base text-bone leading-relaxed">
            "My grandmother's. She taught me that endings deserve attention."
          </p>
        </div>

        {/* Their answer — masked or revealed */}
        <div
          onClick={onReveal}
          className={`relative bg-gradient-to-b from-velvet to-void border-l border-ember/60 p-4 cursor-pointer transition-all duration-700 ${revealed ? "" : "hover:border-ember"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="size-6 rounded-full bg-vein flex items-center justify-center text-ember font-serif italic text-xs">
              S
            </div>
            <span className="text-[9px] tracking-widest uppercase text-ember">Silas · 23:51</span>
          </div>
          <p
            className={`font-serif italic text-base leading-relaxed transition-all duration-1000 ${
              revealed
                ? "text-bone blur-0 opacity-100"
                : "text-ember blur-md opacity-60 select-none"
            }`}
          >
            "Yours. I knew the answer the moment I read the question."
          </p>

          {!revealed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-void/85 text-ember text-[9px] tracking-[0.3em] uppercase px-4 py-2 border border-ember/40 backdrop-blur-sm">
                Tap to Unfold
              </span>
            </div>
          )}
        </div>

        {/* Compatibility */}
        <div className="mt-2 border border-vein/40 p-4 bg-velvet/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] tracking-[0.25em] uppercase text-ash">Resonance</span>
            <span className="font-serif italic text-ember text-lg">Kindred</span>
          </div>
          <div className="h-1 bg-vein/40 relative overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r from-ember-dim to-ember transition-all duration-1000 ${revealed ? "w-[87%]" : "w-0"}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-[9px] tracking-widest uppercase text-ash">
            <span>87% aligned</span>
            <span>Streak · 12</span>
          </div>
        </div>

        {/* Footer action */}
        <div className="mt-auto pt-2 flex gap-2">
          <button className="flex-1 border border-vein text-ash py-3 text-[10px] tracking-[0.25em] uppercase hover:text-bone hover:border-bone transition-colors">
            Send a Reply
          </button>
          <button className="px-4 border border-ember/40 text-ember py-3 text-[10px] tracking-[0.25em] uppercase hover:bg-ember/10 transition-colors">
            ♡
          </button>
        </div>
      </div>
    </div>
  );
}