import { useInstrument } from "../contexts/InstrumentContext";
import { useState, useEffect, useRef, useMemo } from "react";
import { dictionaryAudio } from "../utils/dictionaryAudio";
import { Play, Volume2 } from "lucide-react";
import { RootNote } from "../types";
import { ROOT_MIDI_OFFSET_MAP } from "../data/chords";
import { useLanguage } from "../contexts/LanguageContext";

export interface ScaleFretCoordinate {
  stringIdx: number; // 0 = High e (1ra cuerda), 1 = B, 2 = G, 3 = D, 4 = A, 5 = Low E (6ta cuerda)
  fretIdx: number;
  midi: number;
}

// Genera el camino ergonómico y ascendente de coordenadas { stringIdx, fretIdx } para 1 octava de la escala
function getScaleFretboardCoordinates(
  rootOffset: number,
  scaleOffsets: number[],
  numFrets: number = 15
): ScaleFretCoordinate[] {
  // tuningReversed: index 0 = 64 (High e), 1 = 59 (B), 2 = 55 (G), 3 = 50 (D), 4 = 45 (A), 5 = 40 (Low E)
  const tuningReversed = [64, 59, 55, 50, 45, 40];

  // 1. Encontrar la posición raíz inicial (priorizando Cuerda 5 o 6 en traste cómodo)
  const fretString5 = (rootOffset - 9 + 12) % 12;
  const fretString6 = (rootOffset - 4 + 12) % 12;

  let startStringIdx = 4;
  let startFretIdx = fretString5;

  if (fretString5 <= 5 && fretString5 >= 1) {
    startStringIdx = 4;
    startFretIdx = fretString5;
  } else if (fretString6 <= 5 && fretString6 >= 1) {
    startStringIdx = 5;
    startFretIdx = fretString6;
  } else if (fretString5 <= 8) {
    startStringIdx = 4;
    startFretIdx = fretString5;
  } else {
    startStringIdx = 5;
    startFretIdx = fretString6;
  }

  const baseFret = startFretIdx;
  const minFret = Math.max(0, baseFret - 1);
  const maxFret = Math.min(numFrets - 1, baseFret + 4);

  const startMidi = tuningReversed[startStringIdx] + startFretIdx;

  // 2. Secuencia de notas MIDI en la escala (1 octava completa)
  const targetMidis: number[] = [];
  let currentOctave = Math.floor(startMidi / 12);
  let prevOffset = -1;

  for (let i = 0; i < scaleOffsets.length; i++) {
    const offset = scaleOffsets[i];
    // Lógica de frontera (Si/B a Do/C): si el índice cromático de la nota actual es menor
    // que el de la anterior, cruzamos la frontera de octava y sumamos +1 a la octava actual
    if (i > 0 && offset < prevOffset) {
      currentOctave++;
    }
    const midi = currentOctave * 12 + offset;
    targetMidis.push(midi);
    prevOffset = offset;
  }

  // Tónica de la siguiente octava (exactamente 1 octava completa = +12 semitonos sobre startMidi)
  targetMidis.push(startMidi + 12);

  // 3. Mapear cada nota a la coordenada { stringIdx, fretIdx } ascendente óptima
  const coords: ScaleFretCoordinate[] = [];
  let lastStringIdx = startStringIdx;
  let lastFretIdx = startFretIdx;

  for (let i = 0; i < targetMidis.length; i++) {
    const midi = targetMidis[i];
    if (i === 0) {
      coords.push({ stringIdx: startStringIdx, fretIdx: startFretIdx, midi });
      continue;
    }

    const candidates: { stringIdx: number; fretIdx: number; score: number }[] = [];
    for (let s = 0; s < 6; s++) {
      const f = midi - tuningReversed[s];
      if (f >= 1 && f <= numFrets) {
        let score = 0;
        if (f >= minFret && f <= maxFret) {
          score += 100;
        } else {
          score -= Math.abs(f - baseFret) * 15;
        }

        // Favorecer avanzar en la misma cuerda o pasar a la cuerda inmediatamente más aguda
        if (s === lastStringIdx && f > lastFretIdx) {
          score += 60;
        } else if (s === lastStringIdx - 1) {
          score += 55;
        } else if (s < lastStringIdx) {
          score += 30 - (lastStringIdx - s) * 10;
        } else {
          score -= 100;
        }

        // Penalizar estiramiento lejos de baseFret
        score -= Math.abs(f - baseFret) * 15;

        candidates.push({ stringIdx: s, fretIdx: f, score });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];
      coords.push({ stringIdx: best.stringIdx, fretIdx: best.fretIdx, midi });
      lastStringIdx = best.stringIdx;
      lastFretIdx = best.fretIdx;
    } else {
      for (let s = 0; s < 6; s++) {
        const f = midi - tuningReversed[s];
        if (f >= 1 && f <= numFrets) {
          coords.push({ stringIdx: s, fretIdx: f, midi });
          lastStringIdx = s;
          lastFretIdx = f;
          break;
        }
      }
    }
  }

  return coords;
}

interface ScaleFretboardProps {
  scaleName: string;
  notes: string[];
  root: RootNote;
  isArpeggio?: boolean;
  intervals?: number[];
  isolatedShape?: {
    stringIdx: number;
    fretIdx: number;
    label: string;
    isRoot?: boolean;
  }[];
  autoPlayTrigger?: number;
  onPlay?: () => void;
  playLabel?: string;
  chordString?: string;
  playingNote?: number | string | null;
  activeNote?: number | string | null;
  activeStepIndex?: number | null;
  playingIndex?: number | null;
  playingNotes?: number[];
  isExpanded?: boolean;
}

// Convert MIDI number to note name
function getNoteNameForMidi(midi: number): string {
  const scale = [
    "C",
    "C#",
    "D",
    "Eb",
    "E",
    "F",
    "F#",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];
  return scale[midi % 12];
}

// Convert MIDI number to note name with scientific octave (e.g. 48 -> "C3", 60 -> "C4")
function getNoteNameWithOctave(midi: number): string {
  const noteName = getNoteNameForMidi(midi);
  const octave = Math.floor(midi / 12) - 1;
  return `${noteName}${octave}`;
}

// Parse note with octave string to MIDI (e.g. "C3" -> 48, "C4" -> 60)
function parseNoteToMidi(noteStr: string): number | null {
  const match = noteStr.trim().match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return null;
  const name = match[1];
  const oct = parseInt(match[2], 10);
  const semitones: Record<string, number> = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  };
  const offset = semitones[name];
  if (offset === undefined) return null;
  return (oct + 1) * 12 + offset;
}

// Standard tuning: [Low E, A, D, G, B, High e]
const tuningNotes = [40, 45, 50, 55, 59, 64];

export default function ScaleFretboard({
  scaleName,
  notes,
  root,
  isArpeggio,
  intervals,
  isolatedShape,
  autoPlayTrigger,
  onPlay,
  playLabel,
  chordString,
  playingNote,
  activeNote,
  activeStepIndex,
  playingIndex,
  playingNotes,
  isExpanded = false,
}: ScaleFretboardProps) {
  const { instrument } = useInstrument();
  const { t, translateNote } = useLanguage();
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCoordinate, setActiveCoordinate] = useState<{ stringIdx: number; fretIdx: number } | null>(null);
  const [activeSequenceIndex, setActiveSequenceIndex] = useState<number | null>(null);
  const [activeScaleIndex, setActiveScaleIndex] = useState<number | null>(null);
  const [activeMidiNote, setActiveMidiNote] = useState<number | null>(null);
  const [activeNoteWithOctave, setActiveNoteWithOctave] = useState<string | null>(null);

  const stopPlayback = () => {
    isPlayingRef.current = false;
    setActiveCoordinate(null);
    setActiveSequenceIndex(null);
    setActiveScaleIndex(null);
    setActiveMidiNote(null);
    setActiveNoteWithOctave(null);
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  useEffect(() => {
    stopPlayback();
  }, [scaleName, root]);

  // Normalize note arrays for comparison (remove flat/sharp differences mathematically)
  // But since both use our music utils, we can just compare the midi offset
  const getNoteOffset = (note: string) => {
    // Basic mapping for scale notes including enharmonics (Cb, E#, B#, Fb)
    const map: Record<string, number> = {
      C: 0,
      "C#": 1,
      Db: 1,
      D: 2,
      "D#": 3,
      Eb: 3,
      E: 4,
      Fb: 4,
      "E#": 5,
      F: 5,
      "F#": 6,
      Gb: 6,
      G: 7,
      "G#": 8,
      Ab: 8,
      A: 9,
      "A#": 10,
      Bb: 10,
      B: 11,
      Cb: 11,
      "B#": 0,
    };
    const cleanNote = note.replace(/[0-9]/g, "");
    return map[cleanNote] !== undefined ? map[cleanNote] : -1;
  };

  const scaleOffsets = notes.map(getNoteOffset);
  const rootOffset = getNoteOffset(root);

  const maxFretboardFrets = 15;

  // Arreglo de coordenadas exactas para la escala en orden ascendente
  const scaleCoordinates = useMemo(() => {
    return getScaleFretboardCoordinates(rootOffset, scaleOffsets, maxFretboardFrets);
  }, [rootOffset, scaleOffsets]);

  // Calcular minFret y maxFret de las notas activas para el auto-desplazamiento (Auto Fret Offset)
  const activeShapePoints =
    isolatedShape && isolatedShape.length > 0 ? isolatedShape : scaleCoordinates;
  const activeFretNums = activeShapePoints
    .map((p) => p.fretIdx)
    .filter((f) => f > 0);
  const minFret = activeFretNums.length > 0 ? Math.min(...activeFretNums) : 1;
  const maxFret = activeFretNums.length > 0 ? Math.max(...activeFretNums) : 5;

  // Si maxFret > 5 (ej. La Menor en traste 5 que llega al traste 8), desplazar startFret automáticamente
  const startFret = maxFret > 5 ? Math.max(1, minFret) : 1;
  const requiredSpan = Math.max(5, maxFret - startFret + 1);
  const numVisibleFrets = isExpanded
    ? Math.max(8, requiredSpan + 2)
    : Math.max(5, requiredSpan);
  const endFret = startFret + numVisibleFrets - 1;

  const padLeft = 24;
  const padRight = 20;
  const topY = startFret > 1 ? 30 : 20;
  const stringSpacing = isExpanded ? 42 : 34;
  const fretSpacing = isExpanded ? 62 : 52;

  const width = padLeft + numVisibleFrets * fretSpacing + padRight;
  const height = topY + 5 * stringSpacing + 36;

  const toRomanFret = (num: number): string => {
    const romans: Record<number, string> = {
      1: "I",
      2: "II",
      3: "III",
      4: "IV",
      5: "V",
      6: "VI",
      7: "VII",
      8: "VIII",
      9: "IX",
      10: "X",
      11: "XI",
      12: "XII",
      13: "XIII",
      14: "XIV",
      15: "XV",
    };
    return romans[num] || String(num);
  };

  // Secuenciador sincronizado basado en coordenadas exactas de cuerda y traste
  const playScale = async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    dictionaryAudio.getContext();

    const coordinates = isolatedShape && isolatedShape.length > 0
      ? isolatedShape.map(p => ({
          stringIdx: p.stringIdx,
          fretIdx: p.fretIdx,
          midi: tuningNotes.slice().reverse()[p.stringIdx] + p.fretIdx,
        }))
      : scaleCoordinates;

    for (let i = 0; i < coordinates.length; i++) {
      if (!isPlayingRef.current) break;
      const coord = coordinates[i];

      // Apagado inmediato de la posición anterior y encendido exclusivo de las coordenadas actuales
      setActiveCoordinate({ stringIdx: coord.stringIdx, fretIdx: coord.fretIdx });
      setActiveSequenceIndex(i);
      setActiveScaleIndex(i);
      setActiveMidiNote(coord.midi);
      setActiveNoteWithOctave(getNoteNameWithOctave(coord.midi));

      const freq = 440 * Math.pow(2, (coord.midi - 69) / 12);
      dictionaryAudio.playSingleNote(freq, "guitar");
      await new Promise((r) => setTimeout(r, 400));
    }

    // Apagado inmediato de todas las luces al finalizar
    stopPlayback();
  };

  useEffect(() => {
    if (autoPlayTrigger) {
      setTimeout(playScale, 100);
    }
  }, [autoPlayTrigger]);

  const handlePlayStringFret = async (midi: number) => {
    dictionaryAudio.getContext();
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    dictionaryAudio.playSingleNote(freq, 'guitar');
  };

  // 1. Extracción Dinámica de la Raíz DIRECTAMENTE del scaleName o del string original del acorde
  const scaleRootMatch = scaleName ? scaleName.trim().match(/^([A-G][#b]?)\s+/) : null;
  const rawRootMatch = chordString ? chordString.trim().match(/^([A-G][#b]?)/) : null;
  const originalChordRoot = scaleRootMatch ? scaleRootMatch[1] : rawRootMatch ? rawRootMatch[1] : null;

  // 2. Sincronización Enarmónica: Si el acorde/escala tiene bemol (b), usar bemol; si tiene (#), usar sostenido
  let effectiveRoot = root;
  if (originalChordRoot) {
    if (originalChordRoot.includes('b')) {
      const flatMap: Record<string, string> = {
        'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
      };
      effectiveRoot = (flatMap[root] || originalChordRoot) as RootNote;
    } else if (originalChordRoot.includes('#')) {
      const sharpMap: Record<string, string> = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
      };
      effectiveRoot = (sharpMap[root] || originalChordRoot) as RootNote;
    } else {
      effectiveRoot = originalChordRoot as RootNote;
    }
  }

  // 3. Formateo limpio del título (evitando "La Arpegio A Menor" -> "Arpegio de A Menor (La Menor)")
  const isArpTitle = Boolean(isArpeggio || /^Arpegio\b/i.test(scaleName));
  const escapedRoot = effectiveRoot.replace("#", "\\#");
  const cleanArpQuality = scaleName
    .replace(/^Arpegio\s+(de\s+)?/i, "")
    .replace(new RegExp(`^${escapedRoot}\\s*`, "i"), "")
    .replace(/^[A-G][#b]?\s+/i, "")
    .trim();
  const modeName = scaleName.replace(/^[A-G][#b]?\s+/, "").trim();
  const hasExplicitLetterRoot = Boolean(scaleRootMatch);
  const translatedRoot = translateNote(effectiveRoot);
  const modeAlreadyStartsWithTranslatedRoot = modeName.toLowerCase().startsWith(translatedRoot.toLowerCase() + ' ');
  const hasSolfege =
    translatedRoot.toLowerCase() !== effectiveRoot.toLowerCase();
  const isWordQuality =
    /^(Mayor|Menor|Disminuido|Aumentado|Major|Minor|Diminished|Augmented)$/i.test(
      cleanArpQuality
    );
  const arpSep = isWordQuality ? " " : "";

  // Coordenada efectiva activa (del secuenciador interno o de props externas)
  const effectiveCoordinate = activeCoordinate ?? (
    (playingIndex !== null && playingIndex !== undefined && scaleCoordinates[playingIndex])
      ? { stringIdx: scaleCoordinates[playingIndex].stringIdx, fretIdx: scaleCoordinates[playingIndex].fretIdx }
      : (activeStepIndex !== null && activeStepIndex !== undefined && scaleCoordinates[activeStepIndex])
        ? { stringIdx: scaleCoordinates[activeStepIndex].stringIdx, fretIdx: scaleCoordinates[activeStepIndex].fretIdx }
        : null
  );

  // Comparación Estricta de Nota Activa (Coordenada física exacta o Nota + Octava estricta):
  // Asegura que SOLO se encienda un único punto en todo el diapasón por cada paso de la secuencia.
  const isNoteActive = (scaleIndex: number, noteOffset: number, noteMidi: number, stringIdx: number, fretIdx: number) => {
    // 1. Si hay coordenadas físicas activas (del secuenciador playScale o de playingIndex), la comprobación es 100% estricta por cuerda y traste:
    if (effectiveCoordinate !== null) {
      return effectiveCoordinate.stringIdx === stringIdx && effectiveCoordinate.fretIdx === fretIdx;
    }

    // 2. Si hay un índice de secuencia/escala activo, resolver su coordenada física única en la escala:
    const effectiveIndex = activeSequenceIndex ?? activeScaleIndex ?? playingIndex ?? activeStepIndex;
    if (effectiveIndex !== null && effectiveIndex !== undefined) {
      const targetCoord = isolatedShape ? isolatedShape[effectiveIndex] : scaleCoordinates[effectiveIndex];
      if (targetCoord) {
        return targetCoord.stringIdx === stringIdx && targetCoord.fretIdx === fretIdx;
      }
    }

    // 3. Si se recibe un activeNote o playingNote externo (ej. emitido por Tone.js como "C3" o MIDI exacto):
    const externalActive = playingNote ?? activeNote;
    if (externalActive !== null && externalActive !== undefined) {
      if (typeof externalActive === "number") {
        if (noteMidi !== externalActive) return false;
        const found = scaleCoordinates.find(c => c.midi === externalActive);
        if (found) {
          return found.stringIdx === stringIdx && found.fretIdx === fretIdx;
        }
        return true;
      }

      if (typeof externalActive === "string") {
        const parsedMidi = parseNoteToMidi(externalActive);
        const stdNoteWithOctave = getNoteNameWithOctave(noteMidi);

        if (parsedMidi !== null) {
          if (noteMidi !== parsedMidi) return false;
          const found = scaleCoordinates.find(c => c.midi === parsedMidi);
          if (found) {
            return found.stringIdx === stringIdx && found.fretIdx === fretIdx;
          }
          return true;
        }

        // Comparación estricta NOTA + OCTAVA (ej. "C3" === "C3")
        if (externalActive.match(/[0-9]$/)) {
          if (stdNoteWithOctave.toLowerCase() !== externalActive.trim().toLowerCase()) {
            return false;
          }
          const found = scaleCoordinates.find(c => getNoteNameWithOctave(c.midi).toLowerCase() === externalActive.trim().toLowerCase());
          if (found) {
            return found.stringIdx === stringIdx && found.fretIdx === fretIdx;
          }
          return true;
        }

        return false;
      }
    }

    // 4. Props externas de arreglo de notas activas
    if (playingNotes && playingNotes.length > 0) {
      return playingNotes.includes(noteMidi);
    }

    return false;
  };

  const isIsolatedPointActive = (pointIdx: number, pointMidi: number, pointOffset: number) => {
    if (effectiveCoordinate !== null && isolatedShape && isolatedShape[pointIdx]) {
      const p = isolatedShape[pointIdx];
      return effectiveCoordinate.stringIdx === p.stringIdx && effectiveCoordinate.fretIdx === p.fretIdx;
    }
    const effectiveIndex = activeSequenceIndex ?? activeScaleIndex ?? playingIndex ?? activeStepIndex;
    if (effectiveIndex !== null && effectiveIndex !== undefined) {
      return pointIdx === effectiveIndex;
    }
    const p = isolatedShape?.[pointIdx];
    if (p) {
      return isNoteActive(pointIdx, pointOffset, pointMidi, p.stringIdx, p.fretIdx);
    }
    return false;
  };

  const visibleFretsList = Array.from(
    { length: numVisibleFrets },
    (_, idx) => startFret + idx
  );

  // Rango de trastes donde se dibujan las notas de la posición activa
  const minDrawFret = isExpanded ? startFret : Math.min(startFret, minFret);
  const maxDrawFret = isExpanded ? endFret : Math.max(maxFret, Math.min(endFret, minFret + 4));

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-none relative overflow-visible flex flex-col mt-1">
      {/* Encabezado Apilado Verticalmente: 1. Título y Subtítulo al 100%, 2. Botón TOCAR a ancho completo */}
      <div className="flex flex-col gap-2.5 mb-3.5 w-full overflow-visible">
        <div className="w-full min-w-0 overflow-visible">
          <h3 className={`${isExpanded ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'} font-bold text-neutral-100 tracking-tight flex items-baseline flex-wrap gap-1.5 w-full overflow-visible whitespace-normal break-words`}>
            {isolatedShape && !scaleName ? (
              notes.map(translateNote).join(" y ")
            ) : isArpTitle ? (
              <>
                <span className="text-neutral-100 font-bold">Arpegio de</span>{" "}
                <span className="text-orange-400 font-extrabold">
                  {effectiveRoot}
                  {arpSep}
                  {cleanArpQuality}
                </span>
                {hasSolfege && (
                  <span className="text-neutral-300 font-semibold text-base sm:text-lg">
                    ({translatedRoot}
                    {arpSep}
                    {cleanArpQuality})
                  </span>
                )}
              </>
            ) : hasExplicitLetterRoot ? (
              <>
                <span className="text-orange-400 font-extrabold">{effectiveRoot}</span>{" "}
                <span className={`${isExpanded ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-mono text-neutral-200`}>{modeName}</span>
                {hasSolfege && (
                  <span className="text-neutral-400 font-normal text-sm sm:text-base font-mono">
                    ({translatedRoot} {modeName})
                  </span>
                )}
              </>
            ) : (
              <>
                {!modeAlreadyStartsWithTranslatedRoot && (
                  <>
                    <span className="text-orange-400 font-extrabold">{translatedRoot}</span>{" "}
                  </>
                )}
                <span className={`${isExpanded ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-mono text-neutral-200`}>{modeName}</span>
              </>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 font-mono tracking-wider mt-0.5 w-full overflow-visible whitespace-normal break-words">
             {isolatedShape
               ? t('academy.isolatedInterval')
               : startFret > 1
                 ? `${t('academy.fretboardSequence')} • ${toRomanFret(startFret)} traste (${startFret}fr)`
                 : t('academy.fretboardSequence')}
          </p>
        </div>
        
        <button 
          onClick={onPlay || playScale}
          disabled={isPlaying}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white transition-all py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold tracking-wider uppercase shadow-md shadow-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          <span>{playLabel || (isPlaying ? t("academy.playing") : (isArpeggio ? t("academy.playArpeggio") : t("academy.playScale")))}</span>
        </button>
      </div>

      {/* Diagrama Diapasón con Auto Fret Offset Inteligente (sin recorte horizontal) */}
      <div className="w-full overflow-x-auto pb-1 mt-1 custom-scrollbar">
        <div className={`w-full h-auto ${isExpanded ? 'min-h-[300px] sm:min-h-[330px] p-4' : 'min-h-[235px] sm:min-h-[250px] p-2.5 sm:p-3'} relative bg-neutral-950/70 rounded-xl flex justify-center items-center border border-neutral-800`}>
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="select-none w-full h-auto"
          >
            {/* Indicador Superior de Posición (cuando startFret > 1, ocultando cejuela) */}
            {startFret > 1 && (
              <text
                x={padLeft + fretSpacing / 2}
                y={15}
                fill="#f97316"
                fontSize={isExpanded ? "12.5" : "11"}
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {toRomanFret(startFret)} ({startFret}fr)
              </text>
            )}

            {/* Líneas Verticales de Trastes (Oculta la línea gruesa naranja de cejuela si startFret > 1) */}
            {Array.from({ length: numVisibleFrets + 1 }).map((_, i) => {
              const isNutLine = i === 0 && startFret === 1;
              const xPos = padLeft + i * fretSpacing;
              return (
                <line
                  key={`fret-${i}`}
                  x1={xPos}
                  y1={topY}
                  x2={xPos}
                  y2={topY + 5 * stringSpacing}
                  stroke={isNutLine ? "#EA580B" : "#404040"}
                  strokeWidth={isNutLine ? 4 : 1.75}
                />
              );
            })}

            {/* Números de Traste Inferiores Dinámicos según ventana visible */}
            {visibleFretsList.map((fretNum, colIdx) => {
              const isLandmarkFret = [3, 5, 7, 9, 12, 15].includes(fretNum) || fretNum === startFret;
              const centerX = padLeft + colIdx * fretSpacing + fretSpacing / 2;
              return (
                <text
                  key={`fret-num-${fretNum}`}
                  x={centerX}
                  y={height - 6}
                  fill={fretNum === startFret && startFret > 1 ? "#f97316" : isLandmarkFret ? "#a3a3a3" : "#525252"}
                  fontSize={isExpanded ? "12" : "11"}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {fretNum}
                </text>
              );
            })}

            {/* Cuerdas (Líneas Horizontales) */}
            {tuningNotes
              .slice()
              .reverse()
              .map((_, i) => {
                // i=0 is High E, i=5 is Low E
                const y = topY + i * stringSpacing;
                const stringThickness = 1 + i * 0.35;
                return (
                  <line
                    key={`string-${i}`}
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + numVisibleFrets * fretSpacing}
                    y2={y}
                    stroke="#525252"
                    strokeWidth={stringThickness}
                  />
                );
              })}

            {/* Notas Activas en la Ventana Visible del Diapasón */}
            {isolatedShape
              ? isolatedShape.map((point, i) => {
                  if (point.fretIdx < startFret || point.fretIdx > endFret) return null;

                  const colIdx = point.fretIdx - startFret;
                  const x = padLeft + colIdx * fretSpacing + fretSpacing / 2;
                  const y = topY + point.stringIdx * stringSpacing;
                  const pointMidi =
                    tuningNotes.slice().reverse()[point.stringIdx] + point.fretIdx;
                  const isPlayingThisNote = isIsolatedPointActive(i, pointMidi, pointMidi % 12);
                  const isRoot = !!point.isRoot;

                  return (
                    <g
                      key={`iso-${i}`}
                      className={`cursor-pointer origin-center ${
                        isPlayingThisNote
                          ? "scale-110 z-10 transition-transform duration-75"
                          : "hover:scale-110 transition-transform duration-150"
                      }`}
                      onClick={() => handlePlayStringFret(pointMidi)}
                      style={{ transformOrigin: `${x}px ${y}px` }}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isPlayingThisNote ? (isExpanded ? "13.5" : "12.5") : (isRoot ? (isExpanded ? "13" : "12") : (isExpanded ? "12" : "11"))}
                        fill={isPlayingThisNote ? "#ffffff" : (isRoot ? "#EA580B" : "#404040")}
                        className={`transition-all ${
                          isPlayingThisNote
                            ? "fill-white bg-white duration-75"
                            : isRoot
                              ? "fill-orange-500 bg-orange-500 duration-150"
                              : "fill-neutral-700 bg-neutral-700 duration-150"
                        }`}
                      />
                      <text
                        x={x}
                        y={y + 3.5}
                        fill={isPlayingThisNote ? "#171717" : (isRoot ? "#ffffff" : "#d4d4d4")}
                        fontSize={isPlayingThisNote ? (isExpanded ? "12" : "11") : (isExpanded ? "11.5" : "10.5")}
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        className={`select-none font-bold ${
                          isPlayingThisNote
                            ? "fill-neutral-900 text-neutral-900"
                            : isRoot
                              ? "fill-white text-white"
                              : "fill-neutral-300 text-neutral-300"
                        }`}
                      >
                        {point.label}
                      </text>
                    </g>
                  );
                })
              : tuningNotes
                  .slice()
                  .reverse()
                  .map((baseMidi, stringIdx) => {
                    // stringIdx 0 = High e... 5 = Low E
                    return visibleFretsList.map((fretIdx, colIdx) => {
                      if (fretIdx < minDrawFret || fretIdx > maxDrawFret) return null;

                      // Si es arpegio en vista compacta, mostrar limpiamente las notas dentro del rango [minFret..maxFret]
                      if (isArpeggio && !isExpanded && (fretIdx < minFret || fretIdx > maxFret)) {
                        return null;
                      }

                      const midi = baseMidi + fretIdx;
                      const offset = midi % 12;

                      if (scaleOffsets.includes(offset)) {
                        const isRoot = offset === rootOffset;
                        const x = padLeft + colIdx * fretSpacing + fretSpacing / 2;
                        const y = topY + stringIdx * stringSpacing;

                        const scaleIndex = scaleOffsets.indexOf(offset);
                        const noteName = notes[scaleIndex];
                        let label = translateNote(noteName);

                        if (isArpeggio && intervals) {
                          const intervalValue = intervals[scaleOffsets.indexOf(offset)];
                          if (intervalValue === 0) label = "1";
                          if (intervalValue === 3) label = "b3";
                          if (intervalValue === 4) label = "3";
                          if (intervalValue === 6) label = "b5";
                          if (intervalValue === 7) label = "5";
                          if (intervalValue === 8) label = "#5";
                          if (intervalValue === 9) label = "bb7";
                          if (intervalValue === 10) label = "b7";
                          if (intervalValue === 11) label = "7";
                        }

                        // Comprobación de estado activo en tiempo real: exactamente un único punto activo por paso
                        const isPlayingThisNote = isNoteActive(scaleIndex, offset, midi, stringIdx, fretIdx);

                        return (
                          <g
                            key={`note-${stringIdx}-${fretIdx}`}
                            className={`cursor-pointer origin-center ${
                              isPlayingThisNote
                                ? "scale-110 z-10 transition-transform duration-75"
                                : "hover:scale-110 transition-transform duration-150"
                            }`}
                            onClick={() => handlePlayStringFret(midi)}
                            style={{ transformOrigin: `${x}px ${y}px` }}
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r={isPlayingThisNote ? (isExpanded ? "13.5" : "12.5") : (isRoot ? (isExpanded ? "13" : "12") : (isExpanded ? "12" : "11"))}
                              fill={
                                isPlayingThisNote
                                  ? "#ffffff"
                                  : isRoot
                                    ? "#EA580B"
                                    : "#404040"
                              }
                              className={`transition-all ${
                                isPlayingThisNote
                                  ? "fill-white bg-white duration-75"
                                  : isRoot
                                    ? "fill-orange-500 bg-orange-500 duration-150"
                                    : "fill-neutral-700 bg-neutral-700 duration-150"
                              }`}
                            />
                            <text
                              x={x}
                              y={y + 3.5}
                              fill={
                                isPlayingThisNote
                                  ? "#171717"
                                  : isRoot
                                    ? "#ffffff"
                                    : "#d4d4d4"
                              }
                              fontSize={isPlayingThisNote ? (isExpanded ? "12" : "11") : (isExpanded ? "11.5" : "10.5")}
                              fontWeight="bold"
                              fontFamily="sans-serif"
                              textAnchor="middle"
                              className={`select-none font-bold ${
                                isPlayingThisNote
                                  ? "fill-neutral-900 text-neutral-900"
                                  : isRoot
                                    ? "fill-white text-white"
                                    : "fill-neutral-300 text-neutral-300"
                              }`}
                            >
                              {label}
                            </text>
                          </g>
                        );
                      }
                      return null;
                    });
                  })}
          </svg>
        </div>
        <div className="flex justify-end text-[10px] text-neutral-400 mt-2 font-mono flex items-center gap-1">
          <Volume2 size={12} />
          <span>{t("common.clickToHear")}</span>
        </div>
      </div>
    </div>
  );
}
