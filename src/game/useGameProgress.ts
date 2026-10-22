import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { achievements, LEVEL_XP, VISIT_XP, type LocationId } from "@/data/portfolio";
import { sounds } from "@/lib/sounds";

const SAVE_KEY = "tawa-pixel-portfolio-save-v1";

type Save = {
  xp: number;
  visited: LocationId[];
  earnedVisits: LocationId[];
  unlocked: string[];
  soundOn: boolean;
  spentXp: number;
  rewards: string[];
};

function loadSave(): Save {
  // Sound is OFF by default; the visitor opts in via the HUD toggle.
  const fallback: Save = {
    xp: 0,
    visited: [],
    earnedVisits: [],
    unlocked: [],
    soundOn: false,
    spentXp: 0,
    rewards: [],
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Save>;
    return {
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      visited: Array.isArray(parsed.visited) ? (parsed.visited as LocationId[]) : [],
      earnedVisits: Array.isArray(parsed.earnedVisits)
        ? (parsed.earnedVisits as LocationId[])
        : Array.isArray(parsed.visited)
          ? (parsed.visited as LocationId[])
          : [],
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : [],
      soundOn: parsed.soundOn === true,
      spentXp: typeof parsed.spentXp === "number" ? Math.max(0, parsed.spentXp) : 0,
      rewards: Array.isArray(parsed.rewards) ? parsed.rewards : [],
    };
  } catch {
    return fallback;
  }
}

export type Toast = { id: number; title: string; body: string };

export function useGameProgress() {
  const [save, setSave] = useState<Save>(loadSave);
  const unlockedRewards = useRef(new Set(save.rewards));
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    sounds.muted = !save.soundOn;
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // storage unavailable — game still works for the session
    }
  }, [save]);

  const pushToast = useCallback((title: string, body: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, body }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const unlock = useCallback(
    (id: string) => {
      const ach = achievements.find((a) => a.id === id);
      if (!ach) return;
      if (save.unlocked.includes(id)) return;
      sounds.play("achievement");
      pushToast(`Achievement unlocked: ${ach.name}`, `${ach.description} · +${ach.xp} XP`);
      setSave((s) => {
        if (s.unlocked.includes(id)) return s;
        return { ...s, xp: s.xp + ach.xp, unlocked: [...s.unlocked, id] };
      });
    },
    [save.unlocked, pushToast],
  );

  const visit = useCallback(
    (loc: LocationId) => {
      const nextVisited = save.visited.includes(loc) ? save.visited : [...save.visited, loc];

      setSave((s) => {
        const isNewVisit = !s.earnedVisits.includes(loc);
        const isNewlyVisited = !s.visited.includes(loc);
        if (!isNewVisit && !isNewlyVisited) return s;
        return {
          ...s,
          xp: s.xp + (isNewVisit ? VISIT_XP : 0),
          visited: isNewlyVisited ? [...s.visited, loc] : s.visited,
          earnedVisits: isNewVisit ? [...s.earnedVisits, loc] : s.earnedVisits,
        };
      });

      const locAch: Record<LocationId, string> = {
        profile: "profile-viewer",
        skills: "skill-seeker",
        tech: "gear-check",
        projects: "project-inspector",
        certificates: "certified",
        contact: "networker",
      };
      unlock("curious");
      unlock(locAch[loc]);

      if (nextVisited.length >= 6 && !save.unlocked.includes("explorer")) {
        const ach = achievements.find((a) => a.id === "explorer");
        if (ach) {
          sounds.play("levelup");
          pushToast(`Achievement unlocked: ${ach.name}`, `${ach.description} · +${ach.xp} XP`);
          setSave((s) => ({
            ...s,
            xp: s.xp + ach.xp,
            unlocked: s.unlocked.includes("explorer") ? s.unlocked : [...s.unlocked, "explorer"],
          }));
        }
      }
    },
    [save.visited, save.unlocked, unlock, pushToast],
  );

  const markMoved = useCallback(() => unlock("first-steps"), [unlock]);
  const markResume = useCallback(() => unlock("resume-hunter"), [unlock]);

  const redeem = useCallback(
    (id: string, cost: number) => {
      if (!Number.isInteger(cost) || cost <= 0) return false;
      if (unlockedRewards.current.has(id)) return true;
      if (save.xp - save.spentXp < cost) return false;
      unlockedRewards.current.add(id);
      setSave((s) => ({ ...s, spentXp: s.spentXp + cost, rewards: [...s.rewards, id] }));
      pushToast("Arcade reward unlocked!", `${cost} XP exchanged for ${id}.`);
      return true;
    },
    [save.xp, save.spentXp, pushToast],
  );

  const toggleSound = useCallback(() => {
    setSave((s) => ({ ...s, soundOn: !s.soundOn }));
  }, []);

  const resetProgress = useCallback(() => {
    setSave((s) => ({ ...s, visited: [] }));
    pushToast(
      "Exploration reset",
      "Visited zones cleared. Earned XP, games and achievements were kept.",
    );
  }, [pushToast]);

  const level = Math.floor(save.xp / LEVEL_XP) + 1;
  const levelProgress = ((save.xp % LEVEL_XP) / LEVEL_XP) * 100;

  return useMemo(
    () => ({
      xp: save.xp,
      availableXp: Math.max(0, save.xp - save.spentXp),
      rewards: save.rewards,
      redeem,
      level,
      levelProgress,
      visited: save.visited,
      unlocked: save.unlocked,
      soundOn: save.soundOn,
      toasts,
      visit,
      unlock,
      markMoved,
      markResume,
      toggleSound,
      resetProgress,
    }),
    [
      save,
      level,
      levelProgress,
      toasts,
      visit,
      redeem,
      unlock,
      markMoved,
      markResume,
      toggleSound,
      resetProgress,
    ],
  );
}
