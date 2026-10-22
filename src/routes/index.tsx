import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Download,
  ExternalLink,
  FileText,
  Gamepad2,
  Gift,
  Coins,
  Github,
  Linkedin,
  Mail,
  Map as MapIcon,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import {
  achievements,
  certificates,
  learningTimeline,
  locations,
  profile,
  projects,
  skillGroups,
  techStack,
  type LocationId,
  type Project,
} from "@/data/portfolio";
import profilePhoto from "@/assets/Tawana_profile.jpeg";
import { useGameProgress } from "@/game/useGameProgress";
import { sounds } from "@/lib/sounds";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tawananyasha Chipata — Interactive Developer Universe" },
      {
        name: "description",
        content:
          "A game-inspired interactive portfolio for Tawananyasha Chipata, a software developer from Zimbabwe. Explore projects, skills, tech stack, certificates and contact zones.",
      },
      { property: "og:title", content: "Tawananyasha Chipata — Interactive Developer Universe" },
      {
        property: "og:description",
        content:
          "Explore a futuristic developer world: real projects, honest skills, certificates and ways to connect.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Mode = "welcome" | "map" | "browse";

const ZONE_COLORS: Record<LocationId, string> = {
  profile: "#00E5FF",
  skills: "#A78BFA",
  tech: "#38BDF8",
  projects: "#22D3EE",
  certificates: "#FACC15",
  contact: "#39FF14",
};

const ZONE_ICONS: Record<LocationId, string> = {
  profile: "ID",
  skills: "SK",
  tech: "TS",
  projects: "PR",
  certificates: "CE",
  contact: "@",
};

function Index() {
  const game = useGameProgress();
  const [mode, setMode] = useState<Mode>("welcome");
  const [openZone, setOpenZone] = useState<LocationId | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [arcadeOpen, setArcadeOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);

  const openLocation = (id: LocationId) => {
    sounds.play("open");
    setOpenZone(id);
    game.visit(id);
  };

  const downloadCv = () => {
    game.markResume();
    const a = document.createElement("a");
    a.href = "/Tawananyasha-Chipata-CV.pdf";
    a.download = "Tawananyasha-Chipata-CV.pdf";
    a.click();
  };

  const startAdventure = () => {
    sounds.play("start");
    game.markMoved();
    setMode("map");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mode === "welcome" && (
        <Welcome
          onStart={startAdventure}
          onBrowse={() => setMode("browse")}
          onProjects={() => {
            setMode("browse");
            requestAnimationFrame(() =>
              document.getElementById("sec-projects")?.scrollIntoView({ behavior: "smooth" }),
            );
          }}
          onProfile={() => {
            setMode("browse");
            requestAnimationFrame(() =>
              document.getElementById("sec-profile")?.scrollIntoView({ behavior: "smooth" }),
            );
          }}
          onCv={downloadCv}
        />
      )}

      {mode !== "welcome" && (
        <>
          <Hud
            game={game}
            onArcade={() => setArcadeOpen(true)}
            mode={mode}
            onMap={() => setMode("map")}
            onBrowse={() => setMode("browse")}
            onCv={downloadCv}
            reduceMotion={reduceMotion}
            onToggleMotion={() => setReduceMotion((v) => !v)}
          />
          {mode === "map" ? (
            <ZoneMap visited={game.visited} onOpen={openLocation} />
          ) : (
            <BrowseAll onCv={downloadCv} />
          )}
        </>
      )}

      {arcadeOpen && <Arcade game={game} onClose={() => setArcadeOpen(false)} />}

      {openZone && (
        <ZoneDialog
          zone={openZone}
          onClose={() => {
            sounds.play("close");
            setOpenZone(null);
          }}
          onCv={downloadCv}
        />
      )}

      {/* Achievement toasts */}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex w-auto max-w-72 flex-col gap-2 sm:left-auto sm:right-4"
        aria-live="polite"
      >
        {game.toasts.map((t) => (
          <div key={t.id} className="panel-frame animate-toast-in rounded-lg p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-cyber">
              <Sparkles className="h-3.5 w-3.5" /> {t.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- Optional XP Arcade ------------------------- */
type ArcadeGame = "wheel" | "chest" | "quiz";

function Arcade({
  game,
  onClose,
}: {
  game: ReturnType<typeof useGameProgress>;
  onClose: () => void;
}) {
  const [active, setActive] = useState<ArcadeGame | null>(null);
  const [result, setResult] = useState("");
  const [answer, setAnswer] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const questions = [
    {
      q: "Which section showcases Tawana's completed work?",
      a: ["Projects", "Contact", "Profile"],
      correct: 0,
    },
    {
      q: "Where can you see technologies Tawana uses?",
      a: ["Certificates", "Tech Stack", "Contact"],
      correct: 1,
    },
    {
      q: "Which section lets you reach out to Tawana?",
      a: ["Skills", "Projects", "Contact"],
      correct: 2,
    },
  ];
  const arcadeGames: { id: ArcadeGame; name: string; cost: number; description: string }[] = [
    {
      id: "wheel",
      name: "🎡 Lucky Spin",
      cost: 150,
      description: "Spin for a surprise collectible badge",
    },
    { id: "chest", name: "🎁 Mystery Chest", cost: 100, description: "Reveal a hidden surprise" },
    {
      id: "quiz",
      name: "🕹️ Portfolio Quiz",
      cost: 200,
      description: "Play a three-question mini-game",
    },
  ];
  const play = (kind: ArcadeGame, cost: number) => {
    if (!game.redeem(kind, cost)) return;
    setActive(kind);
    setResult("");
    setAnswer(null);
    setRound(0);
    if (kind === "wheel") {
      const prizes = [
        "Cosmic Explorer badge",
        "Pixel Legend badge",
        "Neon Star badge",
        "Secret achievement: Curiosity Champion",
      ];
      setResult(prizes[Math.floor(Math.random() * prizes.length)] ?? "Surprise badge");
    }
    if (kind === "chest") {
      const prizes = [
        "You found the hidden developer's treasure!",
        "Secret message: Great ideas start with curiosity.",
        "Unlocked: Digital Treasure Hunter badge!",
      ];
      setResult(prizes[Math.floor(Math.random() * prizes.length)] ?? "Surprise badge");
    }
    if (kind === "quiz") setRound(0);
  };
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Optional XP reward arcade"
        className="panel-frame max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl p-5 sm:p-7"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-pixel text-sm text-primary sm:text-lg">XP REWARD ARCADE</h2>
          <button
            onClick={onClose}
            aria-label="Close arcade"
            className="rounded p-2 hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Unlock each game once with XP, then replay it anytime for free. Exploration XP and
          achievements can only be earned once.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-gold/40 bg-secondary p-4 font-mono text-gold">
          <Coins className="h-5 w-5" /> {game.availableXp} XP available{" "}
          <span className="ml-auto text-xs text-muted-foreground">{game.xp} earned</span>
        </div>
        {!active ? (
          <div className="mt-5 grid gap-3">
            {arcadeGames.map(({ id, name, cost, description }) => {
              const isUnlocked = game.rewards.includes(id);
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3"
                >
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    <p
                      className={`mt-2 text-xs font-semibold ${isUnlocked ? "text-cyber" : "text-gold"}`}
                    >
                      {isUnlocked ? "Unlocked" : "Locked"}
                    </p>
                  </div>
                  <button
                    disabled={!isUnlocked && game.availableXp < cost}
                    onClick={() => play(id, cost)}
                    className="btn-quest shrink-0 rounded px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isUnlocked ? "Play" : `Unlock · ${cost} XP`}
                  </button>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">
              Games stay unlocked after the first redemption. Replays are free; achievements and
              exploration XP are awarded once.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-primary/40 bg-secondary/40 p-5 text-center">
            {active === "quiz" ? (
              <>
                <p className="text-xs text-gold">
                  QUESTION {round + 1} / {questions.length}
                </p>
                <h3 className="my-4 font-semibold">{questions[round]!.q}</h3>
                <div className="grid gap-2">
                  {questions[round]!.a.map((option, i) => (
                    <button
                      key={option}
                      disabled={answer !== null}
                      onClick={() => {
                        setAnswer(i);
                        if (i === questions[round]!.correct) setResult("Correct! 🎉");
                        else
                          setResult(
                            "Good try! The correct answer is " +
                              questions[round]!.a[questions[round]!.correct],
                          );
                      }}
                      className="rounded border border-border p-3 text-sm hover:border-primary disabled:opacity-75"
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {answer !== null && (
                  <>
                    <p className="mt-4 text-sm text-primary" role="status">
                      {result}
                    </p>
                    {round === questions.length - 1 ? (
                      <button
                        className="btn-quest mt-3 rounded px-4 py-2 text-xs"
                        onClick={() => play("quiz", 200)}
                      >
                        Play Again
                      </button>
                    ) : (
                      <button
                        className="btn-quest mt-3 rounded px-4 py-2 text-xs"
                        onClick={() => {
                          setRound((r) => r + 1);
                          setAnswer(null);
                          setResult("");
                        }}
                      >
                        Next question
                      </button>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <div className="mb-3 text-6xl" aria-hidden>
                  {active === "wheel" ? "🎡" : "🎁"}
                </div>
                <h3 className="text-lg font-bold text-gold">{result}</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Unlocked game — play again anytime for free.
                </p>
                <button
                  onClick={() => play(active, active === "wheel" ? 150 : 100)}
                  className="btn-quest mt-4 rounded px-4 py-2 text-xs"
                >
                  Play Again
                </button>
              </>
            )}
            <button
              onClick={() => {
                setActive(null);
                setResult("");
              }}
              className="mt-5 block w-full rounded border border-primary px-4 py-2 text-xs text-primary"
            >
              Back to arcade
            </button>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-border py-3 text-sm hover:bg-secondary"
        >
          Return to portfolio (no game required)
        </button>
      </section>
    </div>
  );
}

/* ------------------------------ Welcome ------------------------------ */

function Welcome(props: {
  onStart: () => void;
  onBrowse: () => void;
  onProjects: () => void;
  onProfile: () => void;
  onCv: () => void;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-3 py-12 sm:px-4 sm:py-16">
      {/* animated starfield */}
      <div aria-hidden className="absolute inset-0">
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            className="animate-twinkle absolute h-1 w-1 rounded-full bg-primary"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 8) * 0.4}s`,
              opacity: 0.5,
            }}
          />
        ))}
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        {/* avatar: stylised developer emblem, not a fake photo */}
        <div className="animate-float-y panel-frame mb-8 grid h-28 w-28 place-items-center rounded-2xl">
          <span className="font-pixel text-2xl text-primary text-glow-cyan">TC</span>
        </div>

        <p className="font-mono text-xs tracking-widest text-muted-foreground">
          welcome_to_my_universe
        </p>
        <h1 className="font-pixel mt-4 text-base leading-relaxed text-foreground sm:text-3xl">
          TAWANANYASHA <span className="text-primary text-glow-cyan">CHIPATA</span>
        </h1>
        <p className="mt-3 text-lg font-semibold text-accent-foreground">Software Developer</p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {profile.tagline} {profile.intro}
        </p>

        <div className="mt-8 grid w-full grid-cols-1 items-center justify-center gap-3 min-[420px]:flex min-[420px]:flex-wrap sm:mt-10">
          <button
            onClick={props.onStart}
            className="btn-quest min-h-12 rounded-lg px-4 py-3 text-xs sm:px-6 sm:py-4 sm:text-sm"
          >
            <Gamepad2 className="mr-2 inline h-4 w-4" /> Play & Earn XP
          </button>
          <button
            onClick={props.onProjects}
            className="min-h-12 rounded-lg border border-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent/20 sm:px-5 sm:py-4"
          >
            Explore My Projects
          </button>
          <button
            onClick={props.onProfile}
            className="min-h-12 rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary sm:px-5 sm:py-4"
          >
            View My Profile
          </button>
          <button
            onClick={props.onCv}
            className="min-h-12 rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary sm:px-5 sm:py-4"
          >
            <Download className="mr-2 inline h-4 w-4" /> Download My CV
          </button>
        </div>

        <button
          onClick={props.onBrowse}
          className="mt-8 text-sm text-muted-foreground underline decoration-dotted underline-offset-4 transition hover:text-primary"
        >
          No games, please — browse the portfolio normally
        </button>

        <button
          type="button"
          onClick={props.onStart}
          className="btn-quest mt-8 min-h-12 max-w-full rounded-lg px-5 py-4 font-mono text-xs font-bold tracking-wide transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:mt-10 sm:px-8 sm:py-5 sm:text-sm sm:tracking-widest"
          aria-label="Press start to explore the portfolio"
        >
          ▶ PRESS START TO EXPLORE ▼
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- HUD -------------------------------- */

function Hud(props: {
  game: ReturnType<typeof useGameProgress>;
  onArcade: () => void;
  mode: Mode;
  onMap: () => void;
  onBrowse: () => void;
  onCv: () => void;
  reduceMotion: boolean;
  onToggleMotion: () => void;
}) {
  const g = props.game;
  const explored = g.visited.length;
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-2 items-center gap-x-2 gap-y-2 px-3 py-2 sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-2 sm:px-4 sm:py-3">
        <span className="font-pixel col-span-2 text-[10px] text-primary sm:col-span-1">
          TC.UNIVERSE
        </span>

        <nav
          className="col-span-2 row-start-2 flex min-w-0 items-center gap-1 sm:order-none sm:gap-2"
          aria-label="View mode"
        >
          <button
            onClick={props.onMap}
            aria-pressed={props.mode === "map"}
            className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition sm:flex-none sm:gap-1.5 sm:px-3 sm:text-xs ${
              props.mode === "map"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <MapIcon className="h-3.5 w-3.5 shrink-0" /> World Map
          </button>
          <button
            onClick={props.onBrowse}
            aria-pressed={props.mode === "browse"}
            className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition sm:flex-none sm:gap-1.5 sm:px-3 sm:text-xs ${
              props.mode === "browse"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" /> Quick Browse
          </button>
        </nav>

        <div className="col-span-2 row-start-4 flex min-w-0 items-center gap-2 sm:order-none sm:min-w-40 sm:flex-1">
          <Zap className="h-4 w-4 shrink-0 text-gold" aria-hidden />
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={g.xp}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Experience points, level ${g.level}`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${g.levelProgress}%` }}
            />
          </div>
          <span className="font-mono min-w-0 text-right text-[9px] leading-tight text-muted-foreground sm:shrink-0 sm:text-[11px]">
            LV{g.level} · {g.xp} XP · {explored}/6 zones
          </span>
        </div>

        <div className="col-span-2 row-start-3 flex items-center justify-between gap-1 sm:order-none sm:justify-start sm:gap-1">
          <button
            onClick={props.onArcade}
            className="flex min-h-10 items-center gap-1 rounded-md border border-gold/50 px-2 text-xs font-semibold text-gold hover:bg-secondary"
            aria-label="Open optional XP rewards arcade"
          >
            <Gift className="h-4 w-4" /> Arcade · {g.availableXp} XP
          </button>
          <button
            onClick={g.toggleSound}
            aria-label={g.soundOn ? "Mute sound" : "Unmute sound"}
            className="min-h-10 min-w-10 rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            {g.soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={props.onToggleMotion}
            aria-pressed={props.reduceMotion}
            aria-label="Toggle reduced motion"
            className={`min-h-10 rounded-md px-2 text-xs font-semibold transition hover:bg-secondary sm:p-2 ${
              props.reduceMotion ? "text-cyber" : "text-muted-foreground"
            }`}
          >
            MOTION
          </button>
          <button
            onClick={g.resetProgress}
            aria-label="Reset visited zones"
            className="min-h-10 min-w-10 rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={props.onCv}
            className="ml-0.5 flex min-h-10 items-center gap-1 rounded-md border border-primary px-2 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 sm:ml-1 sm:gap-1.5 sm:px-3"
          >
            <Download className="h-3.5 w-3.5" /> CV
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ World map ----------------------------- */

function ZoneMap({ visited, onOpen }: { visited: LocationId[]; onOpen: (id: LocationId) => void }) {
  const [focus, setFocus] = useState(0);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keyboard navigation across the zone grid (arrows + Enter), plus number keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.isContentEditable || e.target.closest("input, textarea, select"))
      )
        return;

      const cols = 3;
      let next = focus;
      if (e.key === "ArrowRight") next = (focus + 1) % locations.length;
      else if (e.key === "ArrowLeft") next = (focus - 1 + locations.length) % locations.length;
      else if (e.key === "ArrowDown") next = Math.min(focus + cols, locations.length - 1);
      else if (e.key === "ArrowUp") next = Math.max(focus - cols, 0);
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen(locations[focus]!.id);
        return;
      } else if (/^[1-6]$/.test(e.key)) {
        const loc = locations[Number(e.key) - 1];
        if (loc) onOpen(loc.id);
        return;
      } else return;
      e.preventDefault();
      setFocus(next);
      btnRefs.current[next]?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, onOpen]);

  return (
    <main className="relative mx-auto max-w-5xl px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/3 top-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <h2 className="font-pixel text-center text-sm text-primary text-glow-cyan sm:text-lg">
        SELECT A ZONE
      </h2>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Click or tap a zone, or use arrow keys + Enter (keys 1–6 jump directly).
      </p>

      <div
        className="mt-8 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:mt-10 sm:grid-cols-3 sm:gap-6"
        role="list"
      >
        {locations.map((loc, i) => {
          const seen = visited.includes(loc.id);
          return (
            <button
              key={loc.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              role="listitem"
              onClick={() => onOpen(loc.id)}
              onFocus={() => setFocus(i)}
              className="panel-frame group relative flex min-w-0 flex-col items-center gap-3 rounded-xl p-4 text-center transition hover:-translate-y-1 hover:border-primary sm:p-6"
              style={{ boxShadow: seen ? `0 0 24px -6px ${ZONE_COLORS[loc.id]}55` : undefined }}
            >
              <span
                className="font-pixel grid h-14 w-14 place-items-center rounded-lg text-sm transition group-hover:scale-110"
                style={{
                  color: ZONE_COLORS[loc.id],
                  border: `2px solid ${ZONE_COLORS[loc.id]}`,
                  background: `${ZONE_COLORS[loc.id]}14`,
                }}
              >
                {ZONE_ICONS[loc.id]}
              </span>
              <span className="text-sm font-bold text-foreground">{loc.name}</span>
              <span className="text-xs text-muted-foreground">{loc.tagline}</span>
              <span
                className={`font-mono text-[10px] ${seen ? "text-cyber" : "text-muted-foreground"}`}
              >
                {seen ? "✓ EXPLORED" : `PRESS ${i + 1}`}
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

/* ---------------------------- Zone dialog ----------------------------- */

function ZoneDialog({
  zone,
  onClose,
  onCv,
}: {
  zone: LocationId;
  onClose: () => void;
  onCv: () => void;
}) {
  const loc = locations.find((l) => l.id === zone)!;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={loc.name}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="panel-frame animate-toast-in max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overscroll-contain overflow-y-auto rounded-xl p-4 sm:max-h-[85vh] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-pixel text-xs sm:text-sm" style={{ color: ZONE_COLORS[zone] }}>
              {loc.name.toUpperCase()}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">{loc.tagline}</p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ZoneContent zone={zone} onCv={onCv} />
      </div>
    </div>
  );
}

function ZoneContent({ zone, onCv }: { zone: LocationId; onCv: () => void }) {
  switch (zone) {
    case "profile":
      return <ProfileSection onCv={onCv} />;
    case "skills":
      return <SkillsSection />;
    case "tech":
      return <TechSection />;
    case "projects":
      return <ProjectsSection />;
    case "certificates":
      return <CertificatesSection />;
    case "contact":
      return <ContactSection />;
  }
}

/* ----------------------------- Sections ------------------------------- */

function ProfileSection({ onCv }: { onCv: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <img
          src={profilePhoto}
          alt={`${profile.name} working at a laptop`}
          className="panel-frame h-24 w-24 shrink-0 rounded-xl object-cover object-[center_35%]"
        />
        <div>
          <h4 className="text-xl font-bold">{profile.name}</h4>
          <p className="text-sm text-primary">
            {profile.title} · {profile.location}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.about}</p>
        </div>
      </div>
      <div>
        <h5 className="font-mono text-xs tracking-widest text-muted-foreground">INTERESTS</h5>
        <ul className="mt-2 flex flex-wrap gap-2">
          {profile.interests.map((i) => (
            <li
              key={i}
              className="rounded-full border border-border px-3 py-1 text-xs text-foreground"
            >
              {i}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onCv}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Download My CV
        </button>
        <a
          href={profile.github}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
        >
          <Github className="h-4 w-4" /> GitHub
        </a>
        <a
          href={profile.portfolio}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
        >
          <ExternalLink className="h-4 w-4" /> Previous Portfolio
        </a>
      </div>
    </div>
  );
}

const LEVEL_STYLE: Record<string, string> = {
  "Building Projects": "border-primary/50 text-primary",
  Practicing: "border-accent/60 text-accent-foreground",
  Learning: "border-border text-muted-foreground",
};

const GROUP_ACCENT: Record<string, string> = {
  cyan: "border-t-primary",
  purple: "border-t-accent",
  green: "border-t-cyber",
  gold: "border-t-gold",
};

function SkillsSection() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {skillGroups.map((g) => (
        <div
          key={g.title}
          className={`panel-frame rounded-lg border-t-2 p-4 ${GROUP_ACCENT[g.accent]}`}
        >
          <h5 className="font-mono text-xs tracking-widest text-foreground">
            {g.title.toUpperCase()}
          </h5>
          <ul className="mt-3 space-y-2">
            {g.skills.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-2 text-sm">
                <span>{s.name}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${LEVEL_STYLE[s.level]}`}
                >
                  {s.level}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TechSection() {
  return (
    <div className="space-y-6">
      {techStack.map((group) => (
        <div key={group.group}>
          <h5 className="font-mono text-xs tracking-widest text-muted-foreground">
            {group.group.toUpperCase()}
          </h5>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {group.items.map((t) => (
              <div
                key={t.name}
                className="panel-frame group rounded-lg p-3 text-center transition hover:-translate-y-0.5 hover:border-primary"
              >
                <span className="font-pixel mx-auto grid h-10 w-10 place-items-center rounded-md border border-primary/40 bg-primary/10 text-[10px] text-primary">
                  {t.mark}
                </span>
                <p className="mt-2 text-xs font-bold">{t.name}</p>
                <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsSection() {
  const [filter, setFilter] = useState<"All Projects" | "Web Development" | "Mobile Development">(
    "All Projects",
  );
  const [detail, setDetail] = useState<Project | null>(null);
  const visible = useMemo(
    () => (filter === "All Projects" ? projects : projects.filter((p) => p.category === filter)),
    [filter],
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Project filters">
        {(["All Projects", "Web Development", "Mobile Development"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No projects in this category yet — check back soon.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((p, i) => (
          <article
            key={p.title}
            className="panel-frame flex min-w-0 flex-col rounded-xl p-4 transition hover:-translate-y-1 hover:border-primary sm:p-5"
          >
            <div className="mb-3 overflow-hidden rounded-lg border border-border bg-secondary">
              <img
                src={p.thumbnail}
                alt={`${p.title} project thumbnail`}
                className="h-24 w-full object-cover object-top transition duration-300 hover:scale-[1.02]"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <h4 className="min-w-0 break-words text-base font-bold">{p.title}</h4>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.status === "Live" ? "bg-cyber/15 text-cyber" : "bg-gold/15 text-gold"}`}
              >
                {p.status}
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {p.description}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <li
                  key={t}
                  className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px] text-secondary-foreground"
                >
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.live && (
                <a
                  href={p.live}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Live Demo
                </a>
              )}
              {p.github && (
                <a
                  href={p.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-secondary"
                >
                  <Github className="h-3.5 w-3.5" /> Source
                </a>
              )}
              <button
                onClick={() => setDetail(p)}
                className="rounded-md border border-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:bg-accent/20"
              >
                Details
              </button>
            </div>
            <span className="sr-only">{`Project ${i + 1} of ${visible.length}`}</span>
          </article>
        ))}
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${detail.title} details`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div className="panel-frame max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overscroll-contain overflow-y-auto rounded-xl p-4 sm:max-h-[80vh] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-lg font-bold">{detail.title}</h4>
              <button
                onClick={() => setDetail(null)}
                aria-label="Close project details"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm">
              <span className="font-semibold text-primary">Problem: </span>
              {detail.problem}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{detail.description}</p>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-primary">My contribution: </span>
              {detail.contribution}
            </p>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-primary">Status: </span>
              {detail.status}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.live && (
                <a
                  href={detail.live}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Live Demo
                </a>
              )}
              {detail.github && (
                <a
                  href={detail.github}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
                >
                  Source Code
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CertificatesSection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {certificates.map((c) => (
          <article key={c.title} className="panel-frame rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Award
                className={`mt-0.5 h-5 w-5 shrink-0 ${c.status === "earned" ? "text-gold" : "text-muted-foreground"}`}
              />
              <div className="min-w-0">
                <h4 className="text-sm font-bold">{c.title}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[c.issuer, c.year].filter(Boolean).join(" · ") || "Details to be added"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {c.description}
                </p>
                {c.image ? (
                  <a
                    href={c.image}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 rounded-md border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    <ExternalLink className="h-3 w-3" /> View Certificate
                  </a>
                ) : (
                  <span className="mt-3 inline-block rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
                    Certificate upload coming soon
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div>
        <h5 className="font-mono text-xs tracking-widest text-muted-foreground">
          LEARNING JOURNEY
        </h5>
        <ol className="mt-4 space-y-4 border-l-2 border-border pl-5">
          {learningTimeline.map((t) => (
            <li key={t.title} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
              <p className="font-mono text-[10px] text-primary">{t.period.toUpperCase()}</p>
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ContactSection() {
  const [form, setForm] = useState<{
    name: string;
    email: string;
    subject: string;
    message: string;
  }>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "error" | "sent" | "sending" | "unconfigured">(
    "idle",
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form["name"].trim() || form["name"].trim().length > 100)
      e["name"] = "Please enter your name (max 100 characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form["email"].trim()) || form["email"].length > 255)
      e["email"] = "Please enter a valid email address.";
    if (!form["subject"].trim() || form["subject"].trim().length > 150)
      e["subject"] = "Please add a subject (max 150 characters).";
    if (!form["message"].trim() || form["message"].trim().length > 1000)
      e["message"] = "Please write a message (max 1000 characters).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (status === "sending") return;
    if (!validate()) {
      setStatus("error");
      return;
    }
    const formId = import.meta.env.VITE_FORMSPREE_FORM_ID?.trim();
    if (!formId || !/^[a-zA-Z0-9]+$/.test(formId)) {
      setStatus("unconfigured");
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          _subject: `Portfolio contact: ${form.subject.trim()}`,
        }),
      });
      if (!response.ok) throw new Error("Submission was not accepted");
      setStatus("sent");
      setErrors({});
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
      setErrors({ submit: "Message could not be sent. Please try again or use the email link." });
    }
  };

  const field =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary";

  return (
    <div className="grid min-w-0 gap-6 sm:grid-cols-2 sm:gap-8">
      <div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Have a project, opportunity, or idea? Let's connect and build something useful.
        </p>
        <ul className="mt-5 space-y-3 text-sm">
          <li>
            <a
              href={`mailto:${profile.email}`}
              className="flex min-w-0 items-start gap-2 text-foreground transition hover:text-primary"
            >
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{" "}
              <span className="min-w-0 break-all">{profile.email}</span>
            </a>
          </li>
          <li>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-start gap-2 text-foreground transition hover:text-primary"
            >
              <Github className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{" "}
              <span className="min-w-0 break-all">github.com/tawananyashachipata-lab</span>
            </a>
          </li>
          <li>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-start gap-2 text-foreground transition hover:text-primary"
            >
              <Linkedin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{" "}
              <span className="min-w-0 break-all">linkedin.com/in/tawananyasha-chipata</span>
            </a>
          </li>
          <li>
            <a
              href={profile.portfolio}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-start gap-2 text-foreground transition hover:text-primary"
            >
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{" "}
              <span className="min-w-0 break-all">magadaline.vercel.app</span>
            </a>
          </li>
        </ul>
      </div>

      <form onSubmit={submit} noValidate className="space-y-3">
        {(["name", "email", "subject"] as const).map((f) => (
          <div key={f}>
            <label htmlFor={`cf-${f}`} className="mb-1 block text-xs font-semibold capitalize">
              {f}
            </label>
            <input
              id={`cf-${f}`}
              type={f === "email" ? "email" : "text"}
              value={form[f]}
              onChange={(e) => {
                setForm((current) => ({ ...current, [f]: e.target.value }));
                if (status !== "sending") setStatus("idle");
              }}
              className={field}
              aria-invalid={Boolean(errors[f])}
              aria-describedby={errors[f] ? `cf-${f}-err` : undefined}
            />
            {errors[f] && (
              <p id={`cf-${f}-err`} role="alert" className="mt-1 text-xs text-destructive">
                {errors[f]}
              </p>
            )}
          </div>
        ))}
        <div>
          <label htmlFor="cf-message" className="mb-1 block text-xs font-semibold">
            Message
          </label>
          <textarea
            id="cf-message"
            rows={4}
            value={form["message"]}
            onChange={(e) => {
              setForm((current) => ({ ...current, message: e.target.value }));
              if (status !== "sending") setStatus("idle");
            }}
            className={field}
            aria-invalid={Boolean(errors["message"])}
            aria-describedby={errors["message"] ? "cf-message-err" : undefined}
          />
          {errors["message"] && (
            <p id="cf-message-err" role="alert" className="mt-1 text-xs text-destructive">
              {errors["message"]}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Send className="h-4 w-4" /> {status === "sending" ? "Sending…" : "Send Message"}
        </button>
        <p
          role="status"
          aria-live="polite"
          className={`text-xs ${status === "error" || status === "unconfigured" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {status === "sent"
            ? "Message sent successfully! Thank you for getting in touch."
            : status === "sending"
              ? "Sending your message securely…"
              : status === "unconfigured"
                ? "Contact form setup is incomplete. The site owner needs to add a Formspree form ID. You can use the email link instead."
                : errors.submit || "Send a message directly here without opening your email app."}
        </p>
      </form>
    </div>
  );
}

/* ----------------------------- Browse all ----------------------------- */

function BrowseAll({ onCv }: { onCv: () => void }) {
  const sections: { id: LocationId; anchor: string }[] = [
    { id: "profile", anchor: "sec-profile" },
    { id: "skills", anchor: "sec-skills" },
    { id: "tech", anchor: "sec-tech" },
    { id: "projects", anchor: "sec-projects" },
    { id: "certificates", anchor: "sec-certificates" },
    { id: "contact", anchor: "sec-contact" },
  ];
  return (
    <main className="mx-auto max-w-4xl px-4 pb-24">
      <nav
        aria-label="Section shortcuts"
        className="sticky top-[154px] z-30 -mx-3 mb-6 flex gap-1 overflow-x-auto border-b border-border bg-background/90 px-3 py-2 backdrop-blur sm:top-[57px] sm:-mx-4 sm:mb-8 sm:px-4"
      >
        {sections.map((s) => {
          const loc = locations.find((l) => l.id === s.id)!;
          return (
            <a
              key={s.id}
              href={`#${s.anchor}`}
              className="min-h-10 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {loc.name}
            </a>
          );
        })}
      </nav>
      {sections.map((s) => {
        const loc = locations.find((l) => l.id === s.id)!;
        return (
          <section
            key={s.id}
            id={s.anchor}
            aria-labelledby={`${s.anchor}-h`}
            className="scroll-mt-28 py-8"
          >
            <h3
              id={`${s.anchor}-h`}
              className="font-pixel mb-1 text-xs sm:text-sm"
              style={{ color: ZONE_COLORS[s.id] }}
            >
              {loc.name.toUpperCase()}
            </h3>
            <p className="mb-6 text-xs text-muted-foreground">{loc.tagline}</p>
            <ZoneContent zone={s.id} onCv={onCv} />
          </section>
        );
      })}
      <footer className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 {profile.name} · Built with React, TypeScript and Tailwind CSS
      </footer>
    </main>
  );
}
