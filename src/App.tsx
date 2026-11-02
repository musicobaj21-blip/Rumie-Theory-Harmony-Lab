import { useEffect, useState } from "react";
import * as Tone from "tone";
import { Sparkles, Piano, Guitar, BookOpen, Sliders } from "lucide-react";
import JazzStandards from "./components/JazzStandards";
import HarmonyTheory, { ChapterLabProgressionPayload } from "./components/HarmonyTheory";
import LanguageSwitch from "./components/LanguageSwitch";
import { useInstrument } from "./contexts/InstrumentContext";
import { useLanguage } from "./contexts/LanguageContext";
import { getAudioContext } from "./utils/audio";
import { interactiveAnalysisAudio } from "./utils/interactiveAnalysisAudio";
import { academiaAudio } from "./utils/academiaAudio";
import { dictionaryAudio } from "./utils/dictionaryAudio";
import { initBrowserShield, AppErrorBoundary } from "./utils/browserShield";

initBrowserShield();

export default function App() {
  const [activeMode, setActiveMode] = useState<"academy" | "lab">("academy");
  const { instrument, setInstrument } = useInstrument();
  const { language } = useLanguage();
  const isEs = language !== "en";

  const unlockTabletAudioSync = () => {
    try {
      const nav = navigator as any;
      if (nav && nav.audioSession) {
        nav.audioSession.type = "playback";
      }
    } catch (_) {}

    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    } catch (_) {}

    try {
      const bandCtx = interactiveAnalysisAudio.getAudioContext();
      if (bandCtx && bandCtx.state === "suspended") {
        bandCtx.resume();
      }
    } catch (_) {}

    try {
      const acadCtx = academiaAudio.getContext();
      if (acadCtx && acadCtx.state === "suspended") {
        acadCtx.resume();
      }
    } catch (_) {}

    try {
      const dictCtx = dictionaryAudio.getContext();
      if (dictCtx && dictCtx.state === "suspended") {
        dictCtx.resume();
      }
    } catch (_) {}

    try {
      const toneRaw = Tone.getContext()?.rawContext as AudioContext | undefined;
      if (toneRaw && toneRaw.state === "suspended") {
        toneRaw.resume();
      }
      Tone.start().catch(() => {});
    } catch (_) {}
  };

  useEffect(() => {
    const handleGesture = () => {
      unlockTabletAudioSync();
    };

    window.addEventListener("pointerdown", handleGesture, { passive: true });
    window.addEventListener("touchstart", handleGesture, { passive: true });
    window.addEventListener("click", handleGesture, { passive: true });
    window.addEventListener("keydown", handleGesture, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
    };
  }, []);

  useEffect(() => {
    const handleNavigateTab = (evt: Event) => {
      const customEvt = evt as CustomEvent<string>;
      const target = customEvt.detail;
      if (target === "lab" || target === "standards") {
        setActiveMode("lab");
      } else if (target === "academy" || target === "theory") {
        setActiveMode("academy");
      }
    };

    window.addEventListener("navigateTab", handleNavigateTab);
    return () => {
      window.removeEventListener("navigateTab", handleNavigateTab);
    };
  }, []);

  const handleOpenInLabFromChapter = (_payload: ChapterLabProgressionPayload) => {
    setActiveMode("lab");
  };

  return (
    <AppErrorBoundary>
      <div
        id="main-app"
        translate="no"
        className="notranslate min-h-screen bg-[#090a0d] text-neutral-200 font-sans antialiased selection:bg-[#f25100] selection:text-white flex flex-col print:bg-white print:text-black"
      >
        {/* CABECERA PRINCIPAL UNIFICADA: RUMIE THEORY & HARMONY LAB */}
        <header className="w-full bg-[#0c0e14] border-b border-[#1c1f2b] px-4 sm:px-6 py-3 flex flex-col xl:flex-row items-center justify-between gap-3.5 print:hidden shrink-0 z-30">
          {/* Branding y Subtítulo */}
          <div className="flex items-center gap-3.5 w-full xl:w-auto justify-between xl:justify-start">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f25100] flex items-center justify-center shadow-[0_0_18px_rgba(242,81,0,0.45)] shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-baseline gap-1.5 leading-tight truncate">
                  <span>Rumie Theory & Harmony Lab</span>
                </h1>
                <p className="text-[11px] sm:text-xs font-medium text-zinc-400 mt-0.5 leading-snug">
                  Curso Interactivo de Armonía Popular Moderna
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Modo Principal Muy Visible y Elegante + Controles Rápidos */}
          <div className="flex flex-wrap items-center justify-center xl:justify-end gap-2.5 w-full xl:w-auto">
            <div
              role="tablist"
              aria-label="Selector de modo principal"
              className="flex items-center bg-[#141722] p-1.5 rounded-xl border border-[#262a3b] shadow-inner gap-1.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === "academy"}
                onClick={() => setActiveMode("academy")}
                className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeMode === "academy"
                    ? "bg-gradient-to-r from-[#f25100] to-amber-600 text-white shadow-[0_0_15px_rgba(242,81,0,0.4)]"
                    : "text-zinc-300 hover:text-white hover:bg-[#1c2030]"
                }`}
              >
                <BookOpen size={16} className="shrink-0" />
                <span>Curso Interactivo (14 Capítulos)</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeMode === "lab"}
                onClick={() => setActiveMode("lab")}
                className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeMode === "lab"
                    ? "bg-gradient-to-r from-[#f25100] to-amber-600 text-white shadow-[0_0_15px_rgba(242,81,0,0.4)]"
                    : "text-zinc-300 hover:text-white hover:bg-[#1c2030]"
                }`}
              >
                <Sliders size={16} className="shrink-0" />
                <span>Laboratorio Harmonic Pro</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label="Selector de instrumento global"
                className="flex items-center bg-[#141722] p-1 rounded-xl border border-[#262a3b] h-10 shrink-0 gap-1"
              >
                <button
                  type="button"
                  aria-pressed={instrument === "piano"}
                  onClick={() => {
                    unlockTabletAudioSync();
                    setInstrument("piano");
                  }}
                  className={`h-8 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    instrument === "piano"
                      ? "bg-[#f25100] text-white border border-[#f25100] shadow-[0_0_12px_rgba(242,81,0,0.45)]"
                      : "text-zinc-400 hover:text-white hover:bg-[#1c2030] border border-transparent"
                  }`}
                >
                  <Piano
                    size={15}
                    className={
                      instrument === "piano" ? "text-white" : "text-[#f25100]"
                    }
                  />
                  <span>Piano</span>
                </button>
                <button
                  type="button"
                  aria-pressed={instrument === "guitar"}
                  onClick={() => {
                    unlockTabletAudioSync();
                    setInstrument("guitar");
                  }}
                  className={`h-8 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    instrument === "guitar"
                      ? "bg-[#f25100] text-white border border-[#f25100] shadow-[0_0_12px_rgba(242,81,0,0.45)]"
                      : "text-zinc-400 hover:text-white hover:bg-[#1c2030] border border-transparent"
                  }`}
                >
                  <Guitar
                    size={15}
                    className={
                      instrument === "guitar" ? "text-white" : "text-[#f25100]"
                    }
                  />
                  <span>{isEs ? "Guitarra" : "Guitar"}</span>
                </button>
              </div>

              <LanguageSwitch />
            </div>
          </div>
        </header>

        {/* CONTENEDOR DE VISTAS PERSISTENTES (Sin desmontar para conservar estado) */}
        <main className="flex-1 flex flex-col w-full">
          <div
            className={
              activeMode === "academy"
                ? "block w-full px-4 sm:px-6 py-6"
                : "hidden"
            }
          >
            <HarmonyTheory
              isVisible={activeMode === "academy"}
              onOpenInLab={handleOpenInLabFromChapter}
            />
          </div>

          <div className={activeMode === "lab" ? "block w-full" : "hidden"}>
            <JazzStandards isVisible={activeMode === "lab"} />
          </div>
        </main>
      </div>
    </AppErrorBoundary>
  );
}