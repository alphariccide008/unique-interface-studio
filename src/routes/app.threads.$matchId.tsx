import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { photoUrl } from "@/lib/photo-url";
import { toast } from "sonner";

export const Route = createFileRoute("/app/threads/$matchId")({
  component: ChatPage,
});

type Message = { id: string; sender_id: string; body: string; created_at: string };
type Partner = { id: string; name: string; photo: string | null };
type SparkAnswer = { user_id: string; answer: string; created_at: string };

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function ChatPage() {
  const { matchId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // Spark of the day
  const [question, setQuestion] = useState<{ id: string; question: string } | null>(null);
  const [myAnswer, setMyAnswer] = useState<string>("");
  const [submittedAnswer, setSubmittedAnswer] = useState<SparkAnswer | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<SparkAnswer | null>(null);
  const [view, setView] = useState<"chat" | "spark">("chat");

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load partner + match
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: match, error } = await supabase
        .from("matches")
        .select("user_a, user_b")
        .eq("id", matchId)
        .maybeSingle();
      if (error || !match) {
        toast.error("Thread not found.");
        navigate({ to: "/app/threads" });
        return;
      }
      const partnerId = match.user_a === user.id ? match.user_b : match.user_a;
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", partnerId)
        .maybeSingle();
      const { data: ph } = await supabase
        .from("profile_photos")
        .select("storage_path")
        .eq("user_id", partnerId)
        .order("position", { ascending: true })
        .limit(1);
      setPartner({
        id: partnerId,
        name: prof?.display_name ?? "Unknown",
        photo: ph?.[0]?.storage_path ? photoUrl(ph[0].storage_path) : null,
      });
    })();
  }, [user, matchId, navigate]);

  // Load messages + realtime
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      setMessages(data ?? []);
    })();

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Message).id) ? prev : [...prev, payload.new as Message]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, matchId]);

  // Load today's spark question + answers
  useEffect(() => {
    if (!user) return;
    (async () => {
      // Pick question deterministically by date+match
      const { data: questions } = await supabase.from("daily_questions").select("id, question");
      if (!questions || questions.length === 0) return;
      const today = todayUTC();
      const seed = today + matchId;
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      const q = questions[h % questions.length];
      setQuestion(q);

      const { data: answers } = await supabase
        .from("spark_answers")
        .select("user_id, answer, created_at")
        .eq("match_id", matchId)
        .eq("spark_date", today);
      const mine = answers?.find((a) => a.user_id === user.id) ?? null;
      const theirs = answers?.find((a) => a.user_id !== user.id) ?? null;
      setSubmittedAnswer(mine);
      setPartnerAnswer(theirs);
    })();

    const channel = supabase
      .channel(`sparks:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "spark_answers", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const ans = payload.new as SparkAnswer & { spark_date: string };
          if (ans.spark_date !== todayUTC()) return;
          if (ans.user_id === user.id) setSubmittedAnswer(ans);
          else setPartnerAnswer(ans);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, matchId]);

  // Auto-scroll
  useEffect(() => {
    if (view === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !user || sending) return;
    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: user.id, body });
    setSending(false);
    if (error) toast.error(error.message);
    else setDraft("");
  };

  const submitSpark = async () => {
    const text = myAnswer.trim();
    if (!text || !user || !question) return;
    if (text.length > 280) {
      toast.error("280 characters max.");
      return;
    }
    const { error } = await supabase.from("spark_answers").insert({
      match_id: matchId,
      user_id: user.id,
      question_id: question.id,
      answer: text,
      spark_date: todayUTC(),
    });
    if (error) toast.error(error.message);
    else toast.success("Confession sealed.");
  };

  const bothAnswered = !!submittedAnswer && !!partnerAnswer;

  return (
    <div className="min-h-dvh bg-void text-bone font-sans flex flex-col">
      <header className="px-4 pt-4 pb-3 border-b border-vein/30 flex items-center gap-3">
        <Link to="/app/threads" className="text-ash hover:text-bone text-sm">
          ←
        </Link>
        <div className="size-9 rounded-full overflow-hidden bg-velvet border border-vein">
          {partner?.photo ? (
            <img src={partner.photo} alt="" className="w-full h-full object-cover grayscale" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-serif italic text-ember text-sm">
              {partner?.name[0] ?? "?"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-lg truncate">{partner?.name ?? "..."}</div>
        </div>
        <div className="flex gap-1 text-[9px] tracking-[0.2em] uppercase">
          <button
            onClick={() => setView("chat")}
            className={view === "chat" ? "px-3 py-1.5 bg-ember/10 text-ember border border-ember/40" : "px-3 py-1.5 text-ash border border-vein/40"}
          >
            Chat
          </button>
          <button
            onClick={() => setView("spark")}
            className={view === "spark" ? "px-3 py-1.5 bg-ember/10 text-ember border border-ember/40" : "px-3 py-1.5 text-ash border border-vein/40"}
          >
            Spark
          </button>
        </div>
      </header>

      {view === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center font-serif italic text-ash mt-10">
                The thread is silent. Speak first.
              </p>
            )}
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] px-4 py-2.5 font-serif text-base leading-snug ${
                      mine
                        ? "bg-ember/15 border-l border-ember/60 text-bone"
                        : "bg-velvet border-l border-vein text-bone"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="border-t border-vein/40 p-3 flex gap-2 bg-void">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Speak..."
              maxLength={500}
              className="flex-1 bg-velvet/60 border border-vein/50 px-4 py-2.5 text-bone font-serif italic outline-none focus:border-ember"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="px-5 bg-ember/15 border border-ember text-ember text-[10px] tracking-[0.25em] uppercase hover:bg-ember hover:text-void disabled:opacity-40 transition-colors"
            >
              Send
            </button>
          </form>
        </>
      ) : (
        <SparkView
          question={question}
          myAnswer={myAnswer}
          setMyAnswer={setMyAnswer}
          submittedAnswer={submittedAnswer}
          partnerAnswer={partnerAnswer}
          partnerName={partner?.name ?? "Them"}
          onSubmit={submitSpark}
          bothAnswered={bothAnswered}
        />
      )}
    </div>
  );
}

function SparkView({
  question,
  myAnswer,
  setMyAnswer,
  submittedAnswer,
  partnerAnswer,
  partnerName,
  onSubmit,
  bothAnswered,
}: {
  question: { id: string; question: string } | null;
  myAnswer: string;
  setMyAnswer: (v: string) => void;
  submittedAnswer: SparkAnswer | null;
  partnerAnswer: SparkAnswer | null;
  partnerName: string;
  onSubmit: () => void;
  bothAnswered: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  if (!question) {
    return <p className="text-center font-serif italic text-ash mt-20">No spark today.</p>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 size-72 bg-ember/10 blur-3xl rounded-full pointer-events-none" />
      <div className="relative max-w-md mx-auto">
        <div className="text-center mb-5">
          <div className="text-[9px] tracking-[0.3em] uppercase text-ember mb-3 flex items-center justify-center gap-2">
            <span className="w-6 h-px bg-ember" /> Today's Spark <span className="w-6 h-px bg-ember" />
          </div>
          <h3 className="font-serif italic text-xl leading-snug text-bone text-balance">
            "{question.question}"
          </h3>
        </div>

        {!submittedAnswer ? (
          <div className="bg-velvet/60 border border-vein/50 p-4">
            <textarea
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              placeholder="Speak into the void..."
              maxLength={280}
              className="w-full bg-transparent outline-none font-serif italic text-base text-bone resize-none min-h-[120px] placeholder:text-ash/40"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[9px] tracking-widest uppercase text-ash">{myAnswer.length}/280</span>
              <button
                onClick={onSubmit}
                disabled={!myAnswer.trim()}
                className="px-4 py-2 bg-ember/15 border border-ember text-ember text-[10px] tracking-[0.25em] uppercase hover:bg-ember hover:text-void disabled:opacity-40 transition-colors"
              >
                Seal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-velvet/60 border-l border-bone/30 p-4">
              <div className="text-[9px] tracking-widest uppercase text-ash mb-2">You</div>
              <p className="font-serif italic text-base text-bone">"{submittedAnswer.answer}"</p>
            </div>

            <div
              onClick={() => bothAnswered && setRevealed(true)}
              className={`relative bg-gradient-to-b from-velvet to-void border-l border-ember/60 p-4 ${bothAnswered ? "cursor-pointer" : ""}`}
            >
              <div className="text-[9px] tracking-widest uppercase text-ember mb-2">{partnerName}</div>
              {!partnerAnswer ? (
                <p className="font-serif italic text-ash">Awaiting their confession...</p>
              ) : (
                <p
                  className={`font-serif italic text-base leading-relaxed transition-all duration-1000 ${
                    revealed ? "text-bone blur-0 opacity-100" : "text-ember blur-md opacity-60 select-none"
                  }`}
                >
                  "{partnerAnswer.answer}"
                </p>
              )}
              {bothAnswered && !revealed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-void/85 text-ember text-[9px] tracking-[0.3em] uppercase px-4 py-2 border border-ember/40 backdrop-blur-sm">
                    Tap to Unfold
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}