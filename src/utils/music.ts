import { RootNote, ChordTypeOptions } from "../types";
import { ROOT_MIDI_OFFSET_MAP, CHORD_DEFINITIONS } from "../data/chords";
import { EXPLORER_CATEGORIES } from "../data/scales";

// Dos arreglos cromáticos: uno con sostenidos y otro con bemoles para ortografía armónica estricta
export const CHROMATIC_SHARPS: RootNote[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

export const CHROMATIC_FLATS: RootNote[] = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"
];

// Compatibilidad hacia atrás
export const CHROMATIC_PREFERENCE_SHARPS = CHROMATIC_SHARPS;
export const CHROMATIC_PREFERENCE_FLATS = CHROMATIC_FLATS;

/**
 * Detecta si una tonalidad o raíz pertenece a la familia de los bemoles
 * (F, Bb, Eb, Ab, Db, Gb o sus relativas menores: Dm, Gm, Cm, Fm, Bbm, Ebm).
 * IMPORTANTE: Evaluamos la familia armónica del centro tonal (`keyCenter`), NO el intervalo cromático destino,
 * para no convertir erróneamente notas sostenidas como G# (en E7, Am armónica, Cmaj7(#5), Am(maj7), G#dim7) en Ab (Lab).
 */
export function isFlatKeyFamily(keyCenter: RootNote | string = "C", _semitones: number = 0): boolean {
  if (!keyCenter) return false;

  const keyStr = String(keyCenter).trim();
  if (keyStr.includes("#")) return false;
  if (keyStr.length > 1 && keyStr[1] === "b") return true;

  const isMinor = /m|-|min/i.test(keyStr);
  const cleanKey = keyStr.replace(/m|-|min/ig, "").trim();

  const flatMajorKeys = ["F", "Bb", "Eb", "Ab", "Db", "Gb"];
  const flatMinorKeys = ["D", "G", "C", "F", "Bb", "Eb"]; // Dm, Gm, Cm, Fm, Bbm, Ebm

  return isMinor ? flatMinorKeys.includes(cleanKey) : flatMajorKeys.includes(cleanKey);
}

const DIATONIC_LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_PITCH_CLASS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/**
 * Ortografía estricta de una nota a partir de la raíz, el desplazamiento en semitonos y la fórmula del grado.
 * Resuelve con precisión teórica casos como:
 * - Cmaj7(#5) -> C, E, G#, B (el grado #5 sobre C es G#, nunca Ab)
 * - Am(maj7)  -> A, C, E, G# (el grado 7 sobre A es G#, nunca Ab)
 * - E7        -> E, G#, B, D (el grado 3 sobre E es G#, nunca Ab)
 * - G#dim7    -> G#, B, D, F (el grado 1 es G#, b3 es B, b5 es D, bb7 es F)
 * - Bm7b5     -> B, D, F, A
 */
export function spellNoteFromDegree(
  root: RootNote | string,
  semitoneOffset: number,
  degreeLabel?: string,
  chordType: string = ""
): RootNote {
  const rootStr = String(root).trim();
  const rootLetter = rootStr.charAt(0).toUpperCase();
  const rootLetterIdx = DIATONIC_LETTERS.indexOf(rootLetter as any);
  const rootPc = ROOT_MIDI_OFFSET_MAP[rootStr as RootNote] ?? 0;
  const targetPc = (((rootPc + semitoneOffset) % 12) + 12) % 12;

  if (((semitoneOffset % 12) + 12) % 12 === 0 && (rootStr in ROOT_MIDI_OFFSET_MAP)) {
    return rootStr as RootNote;
  }

  // Si tenemos la etiqueta del grado (ej. "1", "b3", "3", "b5", "#5", "b7", "7", "bb7", "#11", "b9", "#9", "b13")
  if (degreeLabel && rootLetterIdx !== -1) {
    const cleanDeg = degreeLabel.trim();
    const numMatch = cleanDeg.match(/(\d+)/);
    if (numMatch) {
      const degNum = parseInt(numMatch[1], 10);
      const stepMap: Record<number, number> = {
        1: 0,
        2: 1,
        3: 2,
        4: 3,
        5: 4,
        6: 5,
        7: 6,
        9: 1,
        11: 3,
        13: 5,
      };
      const letterStep = stepMap[degNum];
      if (letterStep !== undefined) {
        const targetLetter = DIATONIC_LETTERS[(rootLetterIdx + letterStep) % 7];
        const naturalPc = LETTER_PITCH_CLASS[targetLetter];
        const diff = (targetPc - naturalPc + 12) % 12;

        if (diff === 0) {
          return targetLetter as RootNote;
        }
        if (diff === 1) {
          const sharpCandidate = `${targetLetter}#`;
          if (sharpCandidate in ROOT_MIDI_OFFSET_MAP) {
            return sharpCandidate as RootNote;
          }
        }
        if (diff === 11) {
          const flatCandidate = `${targetLetter}b`;
          if (flatCandidate in ROOT_MIDI_OFFSET_MAP) {
            return flatCandidate as RootNote;
          }
        }
      }
    }

    // Si el grado pide explícitamente sostenido (#4, #5, #9, #11)
    if (cleanDeg.includes("#")) {
      return CHROMATIC_SHARPS[targetPc];
    }
    // Si el grado pide explícitamente bemol (b2, b3, b5, b6, b7, b9, b13, bb7) y la raíz no es con '#'
    if (cleanDeg.includes("b") && !rootStr.includes("#")) {
      return CHROMATIC_FLATS[targetPc];
    }
  }

  // Preferencia según la naturaleza de la raíz y del acorde
  if (rootStr.includes("#")) {
    return CHROMATIC_SHARPS[targetPc];
  }
  if (rootStr.includes("b")) {
    return CHROMATIC_FLATS[targetPc];
  }
  if (chordType.includes("#5") || chordType.includes("#11") || chordType.includes("#9") || chordType === "aug") {
    return CHROMATIC_SHARPS[targetPc];
  }

  // Para raíces naturales: C, D, E, G, A, B usan sostenidos para 3M y 7M; F usa bemoles
  const useFlats = isFlatKeyFamily(rootStr);
  return useFlats ? CHROMATIC_FLATS[targetPc] : CHROMATIC_SHARPS[targetPc];
}

/**
 * Ortografía estricta para escalas de 7 notas (y escalas modales/armónicas/melódicas).
 * Garantiza una letra por grado diatónico siempre que exista representación estándar en RootNote,
 * de modo que A Menor Armónica (y sus 7 modos) siempre escriba G# (Sol#) y nunca Ab (Lab).
 */
export function spellScaleNotes(
  root: RootNote | string,
  intervals: number[],
  scaleName: string = ""
): RootNote[] {
  const rootStr = String(root).trim();
  const rootPc = ROOT_MIDI_OFFSET_MAP[rootStr as RootNote] ?? 0;
  const rootLetter = rootStr.charAt(0).toUpperCase();
  const rootLetterIdx = DIATONIC_LETTERS.indexOf(rootLetter as any);

  const lowerName = scaleName.toLowerCase();

  // Regla dedicada para Superlocria / Alterada (1 - b2 - b3/#9 - b4/3 - b5 - b6 - b7: [0, 1, 3, 4, 6, 8, 10])
  // Evita que la coexistencia de #9 (3 st) y 3ra mayor (4 st) rompa la ortografía de bemoles en G7alt -> G, Ab, Bb, B, Db, Eb, F
  const isAlteredScale =
    (lowerName.includes("superlocri") || lowerName.includes("alterad")) &&
    !lowerName.includes("bb7") &&
    !lowerName.includes("ultralocri") &&
    intervals.length === 7 &&
    intervals[1] === 1 &&
    intervals[2] === 3 &&
    intervals[3] === 4 &&
    intervals[4] === 6 &&
    intervals[5] === 8 &&
    intervals[6] === 10;

  if (isAlteredScale) {
    const preferSharps = rootStr.includes("#");
    return intervals.map((iv, idx) => {
      const targetPc = (((rootPc + iv) % 12) + 12) % 12;
      if (idx === 0 && rootStr in ROOT_MIDI_OFFSET_MAP) {
        return rootStr as RootNote;
      }
      if (iv === 4) {
        // 3ra mayor (o b4) del dominante alterado: B en G7alt, G# en E7alt
        return spellNoteFromDegree(rootStr, 4, "3");
      }
      return preferSharps ? CHROMATIC_SHARPS[targetPc] : CHROMATIC_FLATS[targetPc];
    });
  }

  // Detectar si es uno de los 7 modos de la Escala Menor Armónica para heredar la ortografía exacta de su escala madre
  // (ej. En La Menor Armónica y sus 7 modos: A - B - C - D - E - F - G#, SIEMPRE Sol# y NUNCA Lab)
  const harmonicMinorModeOffset: { offsetSemis: number; degreeShift: number } | null = (() => {
    if (lowerName.includes("armónica") || lowerName.includes("armonica") || lowerName.includes("harmonic minor")) {
      return { offsetSemis: 0, degreeShift: 0 };
    }
    if (lowerName.includes("locria 6") || lowerName.includes("locrio 6") || lowerName.includes("locria ♮6") || lowerName.includes("locrio ♮6")) {
      return { offsetSemis: 2, degreeShift: 1 };
    }
    if (lowerName.includes("jónica #5") || lowerName.includes("jonica #5") || lowerName.includes("jónico #5") || lowerName.includes("jónico aumentado") || lowerName.includes("jonico aumentado")) {
      return { offsetSemis: 3, degreeShift: 2 };
    }
    if (lowerName.includes("dórica #4") || lowerName.includes("dorica #4") || lowerName.includes("dórico #4") || lowerName.includes("dorico #4")) {
      return { offsetSemis: 5, degreeShift: 3 };
    }
    if (lowerName.includes("frigia dominante") || lowerName.includes("frigio dominante") || lowerName.includes("mixolidia b9 b13") || lowerName.includes("mixolidio b9 b13")) {
      return { offsetSemis: 7, degreeShift: 4 };
    }
    if (lowerName.includes("lidia #2") || lowerName.includes("lidio #2")) {
      return { offsetSemis: 8, degreeShift: 5 };
    }
    if (lowerName.includes("ultralocri") || lowerName.includes("bb7")) {
      return { offsetSemis: 11, degreeShift: 6 };
    }
    return null;
  })();

  if (harmonicMinorModeOffset && intervals.length === 7 && rootLetterIdx !== -1) {
    const parentLetterIdx = (rootLetterIdx - harmonicMinorModeOffset.degreeShift + 7) % 7;
    const parentLetter = DIATONIC_LETTERS[parentLetterIdx];
    const parentTargetPc = (((rootPc - harmonicMinorModeOffset.offsetSemis) % 12) + 12) % 12;
    const parentNaturalPc = LETTER_PITCH_CLASS[parentLetter];
    const parentDiff = (parentTargetPc - parentNaturalPc + 12) % 12;
    let parentRoot: RootNote | null = null;
    if (parentDiff === 0) parentRoot = parentLetter as RootNote;
    else if (parentDiff === 1 && `${parentLetter}#` in ROOT_MIDI_OFFSET_MAP) parentRoot = `${parentLetter}#` as RootNote;
    else if (parentDiff === 11 && `${parentLetter}b` in ROOT_MIDI_OFFSET_MAP) parentRoot = `${parentLetter}b` as RootNote;

    if (parentRoot) {
      const hmIntervals = [0, 2, 3, 5, 7, 8, 11];
      const parentPc = ROOT_MIDI_OFFSET_MAP[parentRoot];
      const parentSpelled: RootNote[] = [];
      let parentValid = true;
      for (let i = 0; i < 7; i++) {
        const tPc = (((parentPc + hmIntervals[i]) % 12) + 12) % 12;
        if (i === 0) {
          parentSpelled.push(parentRoot);
          continue;
        }
        const tLetter = DIATONIC_LETTERS[(parentLetterIdx + i) % 7];
        const natPc = LETTER_PITCH_CLASS[tLetter];
        const d = (tPc - natPc + 12) % 12;
        if (d === 0) parentSpelled.push(tLetter as RootNote);
        else if (d === 1 && `${tLetter}#` in ROOT_MIDI_OFFSET_MAP) parentSpelled.push(`${tLetter}#` as RootNote);
        else if (d === 11 && `${tLetter}b` in ROOT_MIDI_OFFSET_MAP) parentSpelled.push(`${tLetter}b` as RootNote);
        else {
          parentValid = false;
          break;
        }
      }
      if (parentValid && parentSpelled.length === 7) {
        const shift = harmonicMinorModeOffset.degreeShift;
        return [
          ...parentSpelled.slice(shift),
          ...parentSpelled.slice(0, shift),
        ];
      }
    }
  }

  const isHarmonicMinorFamily = Boolean(harmonicMinorModeOffset);

  if (intervals.length === 7 && rootLetterIdx !== -1) {
    const spelled: RootNote[] = [];
    let allValid = true;

    for (let i = 0; i < 7; i++) {
      const targetPc = (((rootPc + intervals[i]) % 12) + 12) % 12;
      if (i === 0 && (rootStr in ROOT_MIDI_OFFSET_MAP)) {
        spelled.push(rootStr as RootNote);
        continue;
      }
      const targetLetter = DIATONIC_LETTERS[(rootLetterIdx + i) % 7];
      const naturalPc = LETTER_PITCH_CLASS[targetLetter];
      const diff = (targetPc - naturalPc + 12) % 12;

      if (diff === 0) {
        spelled.push(targetLetter as RootNote);
      } else if (diff === 1 && `${targetLetter}#` in ROOT_MIDI_OFFSET_MAP) {
        spelled.push(`${targetLetter}#` as RootNote);
      } else if (diff === 11 && `${targetLetter}b` in ROOT_MIDI_OFFSET_MAP) {
        spelled.push(`${targetLetter}b` as RootNote);
      } else {
        allValid = false;
        break;
      }
    }

    if (allValid) {
      return spelled;
    }
  }

  // Fallback inteligente si la escala no es heptatónica diatónica estricta
  const forceSharps =
    rootStr.includes("#") ||
    (isHarmonicMinorFamily && !rootStr.includes("b") && !["C", "F", "D", "G"].includes(rootStr)) ||
    (isHarmonicMinorFamily && ["A", "B", "C", "D", "E", "F", "G#"].includes(rootStr) && intervals.some((iv) => (rootPc + iv) % 12 === 8));

  return intervals.map((iv, idx) => {
    const targetPc = (((rootPc + iv) % 12) + 12) % 12;
    if (idx === 0 && (rootStr in ROOT_MIDI_OFFSET_MAP)) {
      return rootStr as RootNote;
    }
    if (forceSharps && targetPc === 8) {
      return "G#";
    }
    if (rootLetterIdx !== -1 && intervals.length === 7) {
      const targetLetter = DIATONIC_LETTERS[(rootLetterIdx + idx) % 7];
      const naturalPc = LETTER_PITCH_CLASS[targetLetter];
      const diff = (targetPc - naturalPc + 12) % 12;
      if (diff === 0) return targetLetter as RootNote;
      if (diff === 1 && `${targetLetter}#` in ROOT_MIDI_OFFSET_MAP) return `${targetLetter}#` as RootNote;
      if (diff === 11 && `${targetLetter}b` in ROOT_MIDI_OFFSET_MAP) return `${targetLetter}b` as RootNote;
    }
    const useFlats = rootStr.includes("b") || (!rootStr.includes("#") && !forceSharps && isFlatKeyFamily(rootStr));
    return useFlats ? CHROMATIC_FLATS[targetPc] : CHROMATIC_SHARPS[targetPc];
  });
}

/**
 * Diccionario maestro y generador de notas para etiquetas `customScale` del Curso Interactivo.
 * Soporta los 7 modos de la Escala Menor Armónica, los 7 modos de la Escala Menor Melódica,
 * los 7 modos griegos, escalas pentatónicas, blues y simétricas con ortografía enarmónica exacta.
 */
export function resolveCustomScaleData(
  customScaleStr: string | undefined | null,
  fallbackRoot: RootNote,
  transposition: number = 0,
  keyContext: RootNote = "C"
): { name: string; notes: RootNote[]; intervals: number[]; root: RootNote } | null {
  if (!customScaleStr || !customScaleStr.trim()) return null;

  const trimmed = customScaleStr.trim();
  const rootMatch = trimmed.match(/^([A-G][#b]?)\s+(.+)$/);

  let rawRoot: RootNote = fallbackRoot;
  let modeLabel = trimmed;

  if (rootMatch) {
    const candidateRoot = rootMatch[1] as RootNote;
    if (candidateRoot in ROOT_MIDI_OFFSET_MAP) {
      rawRoot =
        transposition !== 0
          ? transposeRoot(candidateRoot, transposition, keyContext)
          : candidateRoot;
      modeLabel = rootMatch[2].trim();
    }
  } else if (transposition !== 0) {
    rawRoot = transposeRoot(fallbackRoot, transposition, keyContext);
  }

  const lower = modeLabel.toLowerCase();
  let intervals: number[] = [0, 2, 4, 5, 7, 9, 11];

  // 1. MODOS DE LA ESCALA MENOR ARMÓNICA
  if (lower.includes("armónica") || lower.includes("armonica") || lower.includes("harmonic minor")) {
    intervals = [0, 2, 3, 5, 7, 8, 11]; // 1 - 2 - b3 - 4 - 5 - b6 - 7
  } else if (lower.includes("locria 6") || lower.includes("locrio 6") || lower.includes("locria ♮6") || lower.includes("locrio ♮6")) {
    intervals = [0, 1, 3, 5, 6, 9, 10]; // 1 - b2 - b3 - 4 - b5 - 6 - b7
  } else if (lower.includes("jónica #5") || lower.includes("jonica #5") || lower.includes("jónico #5") || lower.includes("jónico aumentado") || lower.includes("jonico aumentado")) {
    intervals = [0, 2, 4, 5, 8, 9, 11]; // 1 - 2 - 3 - 4 - #5 - 6 - 7
  } else if (lower.includes("dórica #4") || lower.includes("dorica #4") || lower.includes("dórico #4") || lower.includes("dorico #4")) {
    intervals = [0, 2, 3, 6, 7, 9, 10]; // 1 - 2 - b3 - #4 - 5 - 6 - b7
  } else if (lower.includes("frigia dominante") || lower.includes("frigio dominante") || lower.includes("mixolidia b9 b13") || lower.includes("mixolidio b9 b13")) {
    intervals = [0, 1, 4, 5, 7, 8, 10]; // 1 - b2 - 3 - 4 - 5 - b6 - b7
  } else if (lower.includes("lidia #2") || lower.includes("lidio #2")) {
    intervals = [0, 3, 4, 6, 7, 9, 11]; // 1 - #2 - 3 - #4 - 5 - 6 - 7
  } else if (lower.includes("ultralocri") || lower.includes("bb7")) {
    intervals = [0, 1, 3, 4, 6, 8, 9]; // 1 - b2 - b3 - b4 - b5 - b6 - bb7
  }
  // 2. MODOS DE LA ESCALA MENOR MELÓDICA
  else if (lower.includes("melódica") || lower.includes("melodica") || lower.includes("melodic minor")) {
    intervals = [0, 2, 3, 5, 7, 9, 11]; // 1 - 2 - b3 - 4 - 5 - 6 - 7
  } else if (lower.includes("dórica b2") || lower.includes("dorica b2") || lower.includes("dórico b2") || lower.includes("dorico b2") || lower.includes("frigia ♮6") || lower.includes("frigio ♮6")) {
    intervals = [0, 1, 3, 5, 7, 9, 10]; // 1 - b2 - b3 - 4 - 5 - 6 - b7
  } else if (lower.includes("lidia aumentada") || lower.includes("lidio aumentado") || lower.includes("lidia #5") || lower.includes("lidio #5")) {
    intervals = [0, 2, 4, 6, 8, 9, 11]; // 1 - 2 - 3 - #4 - #5 - 6 - 7
  } else if (lower.includes("lidia dominante") || lower.includes("lidio dominante") || lower.includes("lidia b7") || lower.includes("lidio b7")) {
    intervals = [0, 2, 4, 6, 7, 9, 10]; // 1 - 2 - 3 - #4 - 5 - 6 - b7
  } else if (lower.includes("mixolidia b6") || lower.includes("mixolidio b6") || lower.includes("mixolidia b13") || lower.includes("mixolidio b13")) {
    intervals = [0, 2, 4, 5, 7, 8, 10]; // 1 - 2 - 3 - 4 - 5 - b6 - b7
  } else if (lower.includes("locria ♮2") || lower.includes("locrio ♮2") || lower.includes("locria #2") || lower.includes("locrio #2") || lower.includes("locria 2") || lower.includes("locrio 2")) {
    intervals = [0, 2, 3, 5, 6, 8, 10]; // 1 - 2 - b3 - 4 - b5 - b6 - b7
  } else if (lower.includes("superlocri") || lower.includes("alterad")) {
    intervals = [0, 1, 3, 4, 6, 8, 10]; // 1 - b2 - b3 - b4/3 - b5 - b6 - b7
  }
  // 3. MODOS GRIEGOS Y OTRAS ESCALAS
  else if (lower.includes("disminuida") && (lower.includes("t-st") || lower.includes("tono-semitono"))) {
    intervals = [0, 2, 3, 5, 6, 8, 9, 11];
  } else if (lower.includes("disminuida") && (lower.includes("st-t") || lower.includes("semitono-tono"))) {
    intervals = [0, 1, 3, 4, 6, 7, 9, 10];
  } else if (lower.includes("tonos enteros") || lower.includes("whole tone") || lower.includes("hexatónica") || lower.includes("hexatonica")) {
    intervals = [0, 2, 4, 6, 8, 10];
  } else if (lower.includes("pentatónica menor") || lower.includes("pentatonica menor")) {
    intervals = [0, 3, 5, 7, 10];
  } else if (lower.includes("pentatónica mayor") || lower.includes("pentatonica mayor")) {
    intervals = [0, 2, 4, 7, 9];
  } else if (lower.includes("blues")) {
    intervals = [0, 3, 5, 6, 7, 10];
  } else if (lower.includes("dórica") || lower.includes("dorica") || lower.includes("dórico") || lower.includes("dorico")) {
    intervals = [0, 2, 3, 5, 7, 9, 10];
  } else if (lower.includes("frigia") || lower.includes("frigio")) {
    intervals = [0, 1, 3, 5, 7, 8, 10];
  } else if (lower.includes("lidia") || lower.includes("lidio")) {
    intervals = [0, 2, 4, 6, 7, 9, 11];
  } else if (lower.includes("mixolidia") || lower.includes("mixolidio")) {
    intervals = [0, 2, 4, 5, 7, 9, 10];
  } else if (lower.includes("eólica") || lower.includes("eolica") || lower.includes("eólico") || lower.includes("eolico") || lower.includes("menor natural")) {
    intervals = [0, 2, 3, 5, 7, 8, 10];
  } else if (lower.includes("locria") || lower.includes("locrio")) {
    intervals = [0, 1, 3, 5, 6, 8, 10];
  } else {
    intervals = [0, 2, 4, 5, 7, 9, 11];
  }

  const fullName = `${rawRoot} ${modeLabel}`;
  const notes = spellScaleNotes(rawRoot, intervals, fullName);

  return {
    name: fullName,
    notes,
    intervals,
    root: rawRoot,
  };
}

/**
 * Transpone cualquier RootNote por un número de semitonos (positivo o negativo)
 * respetando la ortografía enarmónica según la raíz/tonalidad.
 */
export function transposeRoot(root: RootNote, semitones: number, keyCenter: RootNote | string = "C"): RootNote {
  const currentOffset = ROOT_MIDI_OFFSET_MAP[root];
  if (currentOffset === undefined) return root;

  const normSemis = ((semitones % 12) + 12) % 12;
  if (normSemis === 0) return root;

  const transposedOffset = (currentOffset + normSemis) % 12;

  // Si keyCenter coincide con root, usar la ortografía basada en grados comunes del acorde/escala
  const keyStr = String(keyCenter || root).trim();
  if (keyStr.includes("#") || root.includes("#")) {
    return CHROMATIC_SHARPS[transposedOffset];
  }
  if (keyStr.includes("b") || root.includes("b")) {
    return CHROMATIC_FLATS[transposedOffset];
  }

  // En raíces naturales: si es el 3er grado mayor (4 semitonos) o 7mo grado mayor (11 semitonos),
  // siempre se escribe con sostenido o natural sobre C, D, E, F, G, A, B (ej. E + 4 = G#, A + 11 = G#)
  if (normSemis === 4 || normSemis === 11 || normSemis === 6 || normSemis === 2 || normSemis === 9) {
    return spellNoteFromDegree(root, normSemis);
  }

  const useFlats = isFlatKeyFamily(keyCenter, semitones);
  const scale = useFlats ? CHROMATIC_FLATS : CHROMATIC_SHARPS;
  return scale[transposedOffset];
}

export interface SuggestedScale {
  name: string;
  notes: string[];
  intervals?: number[];
}

export interface ScaleMapping {
  name: string;
  intervals: number[];
}

/**
 * Diccionario global de mapeo de escalas sugeridas para el análisis armónico
 */
export const scaleMappings: Record<string, ScaleMapping> = {
  minorTonic: {
    name: "Eólica",
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  minorDefault: {
    name: "Dórica",
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },
  major: {
    name: "Jónica",
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
  lydian: {
    name: "Lidia",
    intervals: [0, 2, 4, 6, 7, 9, 11],
  },
  tritoneSubstitute: {
    name: "Lidia Dominante",
    intervals: [0, 2, 4, 6, 7, 9, 10],
  },
  lydianDominant: {
    name: "Lidia Dominante",
    intervals: [0, 2, 4, 6, 7, 9, 10],
  },
  dominantMinorResolution: {
    name: "Frigia Dominante",
    intervals: [0, 1, 4, 5, 7, 8, 10],
  },
  dominantDefault: {
    name: "Mixolidia",
    intervals: [0, 2, 4, 5, 7, 9, 10],
  },
  altered: {
    name: "Alterada",
    intervals: [0, 1, 3, 4, 6, 8, 10],
  },
  phrygian: {
    name: "Frigia",
    intervals: [0, 1, 3, 5, 7, 8, 10],
  },
  dorian: {
    name: "Dórica",
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },
  aeolian: {
    name: "Eólica",
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  ionian: {
    name: "Jónica",
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
  mixolydian: {
    name: "Mixolidia",
    intervals: [0, 2, 4, 5, 7, 9, 10],
  },
  locrian: {
    name: "Locria",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
  phrygianDominant: {
    name: "Frigia Dominante",
    intervals: [0, 1, 4, 5, 7, 8, 10],
  },
  halfDiminished: {
    name: "Locria",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
  diminished: {
    name: "Disminuida",
    intervals: [0, 2, 3, 5, 6, 8, 9, 11],
  },
  augmented: {
    name: "Tonos Enteros",
    intervals: [0, 2, 4, 6, 8, 10],
  },
};

export function isMinorQuality(type: string): boolean {
  if (!type) return false;
  if (type === "Menor" || type.startsWith("m(maj7)") || type.startsWith("min(maj7)")) return true;
  if (type.startsWith("maj") || type === "Mayor" || type.startsWith("M")) return false;
  return (
    [
      "m7", "m9", "m11", "m13", "m6", "m(maj7)", "m7b5", "dim7", "m-add9",
      "m11b5", "mb13b5", "m9b5"
    ].includes(type) ||
    type.startsWith("m") ||
    type.includes("min") ||
    type.includes("-") ||
    /menor/i.test(type)
  );
}

export function isDominantQuality(type: string): boolean {
  if (!type) return false;
  return (
    [
      "7", "9", "13", "7sus4", "9sus4", "13sus4", 
      "alt", "7b9", "7#9", "7#11", "7b13", "7#5#9", "7b9b13", "7#9b13", "7b9#11"
    ].includes(type) ||
    (type.startsWith("7") && !type.startsWith("7M") && !type.startsWith("7maj"))
  );
}

export function isExplicitMajorChord(type: string): boolean {
  if (!type) return true;
  const s = type.trim();
  if (s === "Menor" || s.startsWith("m(maj") || s.startsWith("min(maj")) return false;
  if (s.includes("maj")) return true;
  if (s === "Mayor" || s === "M" || s.startsWith("M7") || s.startsWith("M9") || s === "6" || s === "6(9)" || s === "add9") return true;
  if (!s.includes("m") && !s.includes("min") && !s.includes("-") && !isMinorQuality(s)) {
    return true;
  }
  return false;
}

function isTargetMinorQuality(typeOrQuality?: string | null): boolean {
  if (!typeOrQuality) return false;
  const s = typeOrQuality.trim();
  if (/^m.*maj/i.test(s) || /min.*maj/i.test(s) || /-.*maj/i.test(s)) return true;
  if (/^(?:i|ii|iii|iv|v|vi|vii)(?:ø|°|m|min|-|\b)/.test(s) && !/^(?:I|II|III|IV|V|VI|VII)/.test(s)) return true;
  if (/menor/i.test(s)) return true;
  if (/maj|mayor/i.test(s) || /\bM\b|^M[0-9]*/.test(s)) return false;
  if (["6", "6(9)", "add9", "7", "9", "13", "7#11", "alt", "sus4", "7sus4", "aug"].includes(s)) return false;
  if (/min|-/i.test(s) || /m/i.test(s)) return true;
  return false;
}

function isTargetMajorQuality(typeOrQuality?: string | null): boolean {
  if (!typeOrQuality) return false;
  const s = typeOrQuality.trim();
  if (isTargetMinorQuality(s)) return false;
  if (/maj|mayor/i.test(s) || /\bM\b|^M[0-9]*/.test(s) || s === "Mayor") return true;
  if (["6", "6(9)", "add9", "7", "9", "13", "alt", "7#11", "7sus4"].includes(s)) return true;
  if (/^(?:I|IV|V|bIII|bVI|bVII)/.test(s)) return true;
  return true;
}

export const DIATONIC_DEGREE_SCALE_MAP: Record<string, ScaleMapping> = {
  I: {
    name: "Jónica",
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
  i: {
    name: "Eólica",
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  ii: {
    name: "Dórica",
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },
  iii: {
    name: "Frigia",
    intervals: [0, 1, 3, 5, 7, 8, 10],
  },
  bIII: {
    name: "Jónica",
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
  IV: {
    name: "Lidia",
    intervals: [0, 2, 4, 6, 7, 9, 11],
  },
  iv: {
    name: "Dórica",
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },
  v: {
    name: "Eólica",
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  vi: {
    name: "Eólica",
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  bVI: {
    name: "Lidia",
    intervals: [0, 2, 4, 6, 7, 9, 11],
  },
  bVII: {
    name: "Mixolidia",
    intervals: [0, 2, 4, 5, 7, 9, 10],
  },
  "vii°": {
    name: "Locria",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
  "viiº": {
    name: "Locria",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
  "viiø": {
    name: "Locria",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
  vii: {
    name: "Locria",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
  "ii°": {
    name: "Locria",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
  "iiº": {
    name: "Locria",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
  "iiø": {
    name: "Locria",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
};

export function extractDegreeFromRomanNumeral(romanNumeral?: string): string | null {
  if (!romanNumeral) return null;
  const clean = romanNumeral.replace(/\s*\(IM\)/gi, "").replace(/\.+$/, "").trim();
  if (!clean || clean === "-") return null;

  if (/^ii[ø°º]/i.test(clean)) return "iiº";
  if (/^vii[ø°º]/i.test(clean)) return "viiº";
  if (/^subv/i.test(clean)) return "subV7";

  if (/^v(?!i|ii)[0-9]*$/.test(clean) && clean.startsWith("v")) {
    return "v";
  }

  if (/^V(?!I|II|i|ii)[0-9\/]*/.test(clean) || clean === "V" || clean.startsWith("V7")) {
    return "V7";
  }

  if (/^vii(?![iv])/i.test(clean)) return "viiº";
  if (/^vi(?![iv])/i.test(clean)) return "vi";
  if (/^biii/i.test(clean)) return "bIII";
  if (/^bvi/i.test(clean)) return "bVI";
  if (/^bvii/i.test(clean)) return "bVII";
  if (/^iv(?![iv])/i.test(clean)) {
    return clean.startsWith("iv") ? "iv" : "IV";
  }
  if (/^iii(?![iv])/i.test(clean)) return "iii";
  if (/^ii(?![iv])/i.test(clean)) return "ii";
  if (/^i(?![iv])/i.test(clean)) {
    return clean.startsWith("i") ? "i" : "I";
  }

  return null;
}

let lastAssignedDominantScale: {
  root: RootNote;
  type: string;
  mapping: ScaleMapping;
} | null = null;

export function getSuggestedScale(
  root: RootNote,
  type: ChordTypeOptions,
  keyCenter: string = "C",
  romanNumeral?: string,
  isMinorKey?: boolean,
  targetChord?: { root: RootNote; type: string } | null,
  category?: string,
  precedingChord?: {
    root: RootNote;
    type: string;
    scale?: SuggestedScale | ScaleMapping;
    suggestedScale?: SuggestedScale;
  } | null
): SuggestedScale {
  const isKeyCenterMinor = Boolean(isMinorKey || keyCenter.endsWith("m"));
  const cleanKeyCenter = (keyCenter.endsWith("m") ? keyCenter.slice(0, -1) : keyCenter) as RootNote;
  const effectiveKeyCenter: RootNote = cleanKeyCenter in ROOT_MIDI_OFFSET_MAP ? cleanKeyCenter : "C";
  const isSameTonicAsKey = ROOT_MIDI_OFFSET_MAP[root] === ROOT_MIDI_OFFSET_MAP[effectiveKeyCenter];

  const rawTrimmed = (romanNumeral || "").trim();
  const rawUpper = rawTrimmed.toUpperCase();
  const cleanNumeral = rawTrimmed.toLowerCase().replace(/[^a-z0-9]/g, "");

  let selectedMapping: ScaleMapping = scaleMappings.major;

  if (type === "alt") {
    selectedMapping = scaleMappings.altered;
  } else if (type === "dim" || type === "dim7" || type === "dim7_9" || type === "dim7_11" || type === "dim7_b13") {
    selectedMapping = scaleMappings.diminished;
  } else if (type === "aug") {
    selectedMapping = scaleMappings.augmented;
  } else if (type === "maj7#11" || type === "maj9#11") {
    selectedMapping = scaleMappings.lydian;
  } else {
    const isTritoneSub =
      (category &&
        (category === "tritone_substitute" ||
          category.includes("tritone") ||
          category.includes("subv"))) ||
      cleanNumeral.includes("subv") ||
      rawUpper.includes("SUBV") ||
      type === "7#11";

    if (isTritoneSub) {
      selectedMapping = scaleMappings.tritoneSubstitute;
    } else {
      const isDominantType = [
        "7", "9", "13", "7sus4", "9sus4", "13sus4", "7b9", "7#9", "7b13"
      ].includes(type);

      const startsWithLowerV = rawTrimmed.startsWith("v") && !rawTrimmed.startsWith("vi");
      const isDominantDegree =
        !isMinorQuality(type) &&
        !startsWithLowerV &&
        (rawUpper === "V" ||
          rawUpper.startsWith("V7") ||
          rawUpper.startsWith("V.") ||
          rawUpper.startsWith("V/") ||
          rawUpper.startsWith("V ")) &&
        !rawUpper.startsWith("VI") &&
        !rawUpper.startsWith("VII") &&
        !rawUpper.startsWith("IV");

      if (isDominantType || isDominantDegree) {
        const isIdenticalToPreceding = Boolean(
          precedingChord &&
          precedingChord.root === root &&
          precedingChord.type === type
        );

        if (isIdenticalToPreceding) {
          if (precedingChord?.suggestedScale) {
            const rawName = precedingChord.suggestedScale.name.replace(new RegExp(`^${root}\\s+`), "");
            const foundMapping = Object.values(scaleMappings).find(m => m.name === rawName);
            selectedMapping = foundMapping || {
              name: rawName,
              intervals: precedingChord.suggestedScale.intervals
            };
          } else if (precedingChord?.scale) {
            if ("intervals" in precedingChord.scale && "name" in precedingChord.scale) {
              const rawName = (precedingChord.scale as any).name.replace(new RegExp(`^${root}\\s+`), "");
              const foundMapping = Object.values(scaleMappings).find(m => m.name === rawName);
              selectedMapping = foundMapping || {
                name: rawName,
                intervals: (precedingChord.scale as any).intervals
              };
            }
          } else if (
            lastAssignedDominantScale &&
            lastAssignedDominantScale.root === root &&
            lastAssignedDominantScale.type === type
          ) {
            selectedMapping = lastAssignedDominantScale.mapping;
          } else {
            selectedMapping = scaleMappings.dominantDefault;
          }
        } else {
          let comesFromHalfDim = false;
          let comesFromMin7 = false;

          if (precedingChord && precedingChord.type) {
            const pType = precedingChord.type.trim();
            if (
              pType === "m7b5" ||
              pType === "m11b5" ||
              pType === "mb13b5" ||
              pType === "m9b5" ||
              pType === "dim7" ||
              pType.includes("b5") ||
              pType.includes("ø")
            ) {
              comesFromHalfDim = true;
            } else if (
              (pType === "m7" ||
              pType === "m9" ||
              pType === "m11" ||
              pType === "m13" ||
              pType === "Menor" ||
              (pType.startsWith("m") && !pType.startsWith("maj"))) &&
              !isExplicitMajorChord(pType)
            ) {
              comesFromMin7 = true;
            }
          }

          if (comesFromMin7) {
            selectedMapping = scaleMappings.dominantDefault;
          } else if (comesFromHalfDim) {
            selectedMapping = scaleMappings.dominantMinorResolution;
          } else {
            let resolvesToMinor = false;
            let resolvesToMajor = false;

            if (targetChord && targetChord.type) {
              const targetTypeOrQuality = targetChord.type.trim();
              if (isTargetMinorQuality(targetTypeOrQuality)) {
                resolvesToMinor = true;
              } else if (isTargetMajorQuality(targetTypeOrQuality)) {
                resolvesToMajor = true;
              }
            }

            if (resolvesToMinor) {
              selectedMapping = scaleMappings.dominantMinorResolution;
            } else if (resolvesToMajor) {
              selectedMapping = scaleMappings.dominantDefault;
            } else {
              selectedMapping = scaleMappings.dominantDefault;
            }
          }
        }

        lastAssignedDominantScale = {
          root,
          type,
          mapping: selectedMapping
        };
      } else {
        const functionalDegree = extractDegreeFromRomanNumeral(romanNumeral);

        let degreeMatched = false;
        if (functionalDegree) {
          switch (functionalDegree) {
            case "I":
              selectedMapping = scaleMappings.major;
              degreeMatched = true;
              break;

            case "i":
              if (isExplicitMajorChord(type)) {
                selectedMapping = scaleMappings.major;
              } else {
                selectedMapping = scaleMappings.minorTonic;
              }
              degreeMatched = true;
              break;

            case "ii":
              selectedMapping = scaleMappings.minorDefault;
              degreeMatched = true;
              break;

            case "iii":
              selectedMapping = scaleMappings.phrygian;
              degreeMatched = true;
              break;

            case "bIII":
              selectedMapping = scaleMappings.major;
              degreeMatched = true;
              break;

            case "IV":
              selectedMapping = scaleMappings.lydian;
              degreeMatched = true;
              break;

            case "iv":
              selectedMapping = scaleMappings.minorDefault;
              degreeMatched = true;
              break;

            case "v":
              selectedMapping = scaleMappings.minorTonic;
              degreeMatched = true;
              break;

            case "vi":
              if (isExplicitMajorChord(type)) {
                selectedMapping = scaleMappings.major;
              } else {
                selectedMapping = scaleMappings.minorTonic;
              }
              degreeMatched = true;
              break;

            case "bVI":
              selectedMapping = scaleMappings.lydian;
              degreeMatched = true;
              break;

            case "bVII":
              selectedMapping = isDominantQuality(type) ? scaleMappings.dominantDefault : scaleMappings.major;
              degreeMatched = true;
              break;

            case "viiº":
            case "iiº":
              selectedMapping = scaleMappings.halfDiminished;
              degreeMatched = true;
              break;
          }
        }

        if (!degreeMatched) {
          if (type === "m7b5" || type === "m11b5" || type === "mb13b5" || type === "m9b5") {
            selectedMapping = scaleMappings.halfDiminished;
          } else if (isExplicitMajorChord(type)) {
            const isDegreeIV =
              !isKeyCenterMinor &&
              (ROOT_MIDI_OFFSET_MAP[root] - ROOT_MIDI_OFFSET_MAP[effectiveKeyCenter] + 12) % 12 === 5;
            if (isDegreeIV) {
              selectedMapping = scaleMappings.lydian;
            } else {
              selectedMapping = scaleMappings.major;
            }
          } else if (isMinorQuality(type)) {
            const isTonicInMinor = isKeyCenterMinor && isSameTonicAsKey;
            if (isTonicInMinor) {
              selectedMapping = scaleMappings.minorTonic;
            } else {
              selectedMapping = scaleMappings.minorDefault;
            }
          } else {
            selectedMapping = scaleMappings.major;
          }
        }
      }
    }
  }

  if (
    isMinorQuality(type) &&
    type !== "m7b5" &&
    type !== "dim7" &&
    selectedMapping.intervals.includes(4)
  ) {
    const functionalDegree = extractDegreeFromRomanNumeral(romanNumeral);
    selectedMapping =
      functionalDegree === "i" || functionalDegree === "vi" || functionalDegree === "v"
        ? scaleMappings.minorTonic
        : scaleMappings.minorDefault;
  }

  if (selectedMapping.name === "Eólica") {
    const functionalDegree = extractDegreeFromRomanNumeral(romanNumeral);
    const isAllowedAeolian =
      (functionalDegree === "i" ||
        functionalDegree === "vi" ||
        functionalDegree === "v" ||
        isMinorQuality(type)) &&
      !isExplicitMajorChord(type) &&
      functionalDegree !== "I";

    if (!isAllowedAeolian) {
      selectedMapping = scaleMappings.major;
    }
  }

  const scaleName = `${root} ${selectedMapping.name}`;
  const notes = selectedMapping.intervals.map(interval => transposeRoot(root, interval, effectiveKeyCenter));

  return { name: scaleName, notes, intervals: selectedMapping.intervals };
}

/**
 * Parsea un acorde en texto (ej. "Cmaj7/B", "G/B", "D6/9", "A13b9")
 * devolviendo la raíz principal, el tipo de acorde, el sufijo completo y la nota del bajo (si es inversión / slash chord).
 */
export function parseChord(chordString: string): {
  root: RootNote;
  type: ChordTypeOptions;
  suffix: string;
  bassNote?: RootNote;
} {
  const cleanChordName = chordString.trim();
  if (cleanChordName.length === 0) {
    return { root: "C", type: "Mayor", suffix: "" };
  }

  let root: RootNote = "C";
  let suffix = "";

  if (cleanChordName.length >= 2) {
    const doubleChar = cleanChordName.substring(0, 2) as RootNote;
    if (doubleChar in ROOT_MIDI_OFFSET_MAP) {
      root = doubleChar;
      suffix = cleanChordName.substring(2);
    } else {
      const singleChar = cleanChordName.substring(0, 1) as RootNote;
      if (singleChar in ROOT_MIDI_OFFSET_MAP) {
        root = singleChar;
        suffix = cleanChordName.substring(1);
      }
    }
  } else {
    const singleChar = cleanChordName.substring(0, 1) as RootNote;
    if (singleChar in ROOT_MIDI_OFFSET_MAP) {
      root = singleChar;
    }
  }

  // Detectar si existe una nota de bajo / inversión (ej. "Cmaj7/B", "G/B", "D6/9/A"),
  // sin confundir "6/9" o "m6/9" con una barra de inversión.
  let bassNote: RootNote | undefined = undefined;
  let baseSuffix = suffix.trim();

  const slashMatch = baseSuffix.match(/^(.*?)\/([A-G][b#]?)$/);
  if (slashMatch) {
    const candidateBass = slashMatch[2] as RootNote;
    if (candidateBass in ROOT_MIDI_OFFSET_MAP) {
      baseSuffix = slashMatch[1].trim();
      bassNote = candidateBass;
    }
  }

  let type: ChordTypeOptions = "Mayor";

  if (
    baseSuffix === "alt" ||
    baseSuffix === "7alt" ||
    baseSuffix === "alt7" ||
    baseSuffix === "7#9#5" ||
    baseSuffix === "7b9#5" ||
    baseSuffix === "7#9b13" ||
    baseSuffix === "7b9#9"
  ) {
    type = "alt";
  } else if (
    baseSuffix === "m7b5" ||
    baseSuffix === "min7b5" ||
    baseSuffix === "mi7b5" ||
    baseSuffix === "m7(b5)" ||
    baseSuffix === "ø" ||
    baseSuffix === "ø7" ||
    baseSuffix === "-7b5"
  ) {
    type = "m7b5";
  } else if (baseSuffix === "m11b5" || baseSuffix === "min11b5" || baseSuffix === "-11b5") {
    type = "m11b5";
  } else if (baseSuffix === "mb13b5" || baseSuffix === "m7b5(b13)" || baseSuffix === "m7b5b13") {
    type = "mb13b5";
  } else if (baseSuffix === "m9b5" || baseSuffix === "min9b5" || baseSuffix === "-9b5") {
    type = "m9b5";
  } else if (baseSuffix === "dim7(b13)" || baseSuffix === "dim7b13") {
    type = "dim7_b13";
  } else if (baseSuffix === "dim7(11)" || baseSuffix === "dim711") {
    type = "dim7_11";
  } else if (baseSuffix === "dim7(9)" || baseSuffix === "dim79") {
    type = "dim7_9";
  } else if (baseSuffix === "dim7" || baseSuffix === "°7" || baseSuffix === "o7") {
    type = "dim7";
  } else if (baseSuffix === "dim" || baseSuffix === "°" || baseSuffix === "o") {
    type = "dim7";
  } else if (baseSuffix === "aug" || baseSuffix === "+" || baseSuffix === "aug5" || baseSuffix === "+5") {
    type = "aug";
  } else if (
    baseSuffix === "maj7#11" ||
    baseSuffix === "maj7(#11)" ||
    baseSuffix === "Maj7#11" ||
    baseSuffix === "Δ#11" ||
    baseSuffix === "Δ(#11)" ||
    baseSuffix === "maj#11" ||
    baseSuffix === "M7#11"
  ) {
    type = "maj7#11";
  } else if (
    baseSuffix === "maj9#11" ||
    baseSuffix === "maj9(#11)" ||
    baseSuffix === "Maj9#11" ||
    baseSuffix === "Δ9#11" ||
    baseSuffix === "Δ9(#11)"
  ) {
    type = "maj9#11";
  } else if (baseSuffix === "maj13" || baseSuffix === "Maj13" || baseSuffix === "Δ13" || baseSuffix === "M13") {
    type = "maj13";
  } else if (baseSuffix === "maj9" || baseSuffix === "Maj9" || baseSuffix === "Δ9" || baseSuffix === "M9") {
    type = "maj9";
  } else if (
    baseSuffix === "maj7(#5)" ||
    baseSuffix === "maj7#5" ||
    baseSuffix === "Maj7(#5)" ||
    baseSuffix === "Maj7#5" ||
    baseSuffix === "Δ(#5)" ||
    baseSuffix === "Δ#5" ||
    baseSuffix === "M7(#5)" ||
    baseSuffix === "M7#5" ||
    baseSuffix === "maj7+5" ||
    baseSuffix === "maj7+"
  ) {
    type = "maj7(#5)";
  } else if (
    baseSuffix === "maj7" ||
    baseSuffix === "Maj7" ||
    baseSuffix === "Δ" ||
    baseSuffix === "Δ7" ||
    baseSuffix === "M7"
  ) {
    type = "maj7";
  } else if (
    baseSuffix === "m(maj7)" ||
    baseSuffix === "mΔ7" ||
    baseSuffix === "-Δ7" ||
    baseSuffix === "min(maj7)" ||
    baseSuffix === "mM7" ||
    baseSuffix === "m(7M)" ||
    baseSuffix === "minmaj7" ||
    baseSuffix === "mmaj7" ||
    baseSuffix === "mMaj7"
  ) {
    type = "m(maj7)";
  } else if (baseSuffix === "m13" || baseSuffix === "min13" || baseSuffix === "mi13" || baseSuffix === "-13") {
    type = "m13";
  } else if (baseSuffix === "m11" || baseSuffix === "min11" || baseSuffix === "mi11" || baseSuffix === "-11") {
    type = "m11";
  } else if (baseSuffix === "m9" || baseSuffix === "min9" || baseSuffix === "mi9" || baseSuffix === "-9") {
    type = "m9";
  } else if (baseSuffix === "m7" || baseSuffix === "min7" || baseSuffix === "mi7" || baseSuffix === "-7") {
    type = "m7";
  } else if (
    baseSuffix === "m6" ||
    baseSuffix === "min6" ||
    baseSuffix === "mi6" ||
    baseSuffix === "-6" ||
    baseSuffix === "m6/9" ||
    baseSuffix === "m6(9)"
  ) {
    type = "m6";
  } else if (baseSuffix === "m-add9" || baseSuffix === "m(add9)" || baseSuffix === "madd9") {
    type = "m-add9";
  } else if (baseSuffix === "6(9)" || baseSuffix === "69" || baseSuffix === "6/9") {
    type = "6(9)";
  } else if (baseSuffix === "6" || baseSuffix === "maj6" || baseSuffix === "M6") {
    type = "6";
  } else if (baseSuffix === "add9" || baseSuffix === "(add9)") {
    type = "add9";
  } else if (
    baseSuffix === "7#11" ||
    baseSuffix === "7(#11)" ||
    baseSuffix === "9#11" ||
    baseSuffix === "9(#11)" ||
    baseSuffix === "13#11" ||
    baseSuffix === "13(#11)"
  ) {
    type = "7#11";
  } else if (
    baseSuffix === "7b13" ||
    baseSuffix === "7(b13)" ||
    baseSuffix === "7#5" ||
    baseSuffix === "7(#5)" ||
    baseSuffix === "7+5" ||
    baseSuffix === "7+" ||
    baseSuffix === "9#5" ||
    baseSuffix === "7b9b13" ||
    baseSuffix === "7(b9,b13)"
  ) {
    type = "7b13";
  } else if (
    baseSuffix === "7b9" ||
    baseSuffix === "7(b9)" ||
    baseSuffix === "7-9" ||
    baseSuffix === "13b9" ||
    baseSuffix === "13(b9)"
  ) {
    type = "7b9";
  } else if (baseSuffix === "7#9" || baseSuffix === "7(#9)" || baseSuffix === "7+9") {
    type = "7#9";
  } else if (
    baseSuffix === "7b5" ||
    baseSuffix === "7(b5)" ||
    baseSuffix === "9b5" ||
    baseSuffix === "9(b5)"
  ) {
    type = "7#11";
  } else if (baseSuffix === "13sus4" || baseSuffix === "13sus" || baseSuffix === "7sus13") {
    type = "13sus4";
  } else if (baseSuffix === "9sus4" || baseSuffix === "9sus" || baseSuffix === "7sus9") {
    type = "9sus4";
  } else if (
    baseSuffix === "7sus4" ||
    baseSuffix === "7sus" ||
    baseSuffix === "sus4" ||
    baseSuffix === "sus" ||
    baseSuffix === "7sus2"
  ) {
    type = "7sus4";
  } else if (baseSuffix === "13" || baseSuffix === "13dom") {
    type = "13";
  } else if (baseSuffix === "9" || baseSuffix === "9dom") {
    type = "9";
  } else if (baseSuffix === "7" || baseSuffix === "dom7" || baseSuffix === "7dom") {
    type = "7";
  } else if (baseSuffix === "11" || baseSuffix === "11dom") {
    type = "9sus4";
  } else if (baseSuffix === "m" || baseSuffix === "min" || baseSuffix === "mi" || baseSuffix === "-") {
    type = "Menor";
  } else {
    type = "Mayor";
  }

  return { root, type, suffix, bassNote };
}

export function transposeChordString(
  chordString: string,
  semitones: number,
  keyCenter: RootNote | string = "C"
): string {
  if (!chordString || semitones === 0 || chordString.trim() === "%") return chordString;

  const parsed = parseChord(chordString);
  const newMainRoot = transposeRoot(parsed.root, semitones, keyCenter);

  if (parsed.bassNote) {
    const baseSuffixWithoutBass = parsed.suffix.replace(/\/[A-G][b#]?$/, "");
    const newBassRoot = transposeRoot(parsed.bassNote, semitones, keyCenter);
    return `${newMainRoot}${baseSuffixWithoutBass}/${newBassRoot}`;
  }

  return `${newMainRoot}${parsed.suffix}`;
}

export function getIRealPitchClassIntervals(
  type: ChordTypeOptions | string,
  rawSuffix: string = ""
): number[] {
  const cleanSuffix = rawSuffix.replace(/\/[A-G][b#]?$/, "").trim();

  if (
    cleanSuffix === "7b5" ||
    cleanSuffix === "7(b5)" ||
    cleanSuffix === "9b5" ||
    cleanSuffix === "9(b5)"
  ) {
    return [0, 4, 6, 10];
  }

  switch (type) {
    case "maj7":
      return [0, 4, 7, 11];
    case "maj7(#5)":
      return [0, 4, 8, 11];
    case "m7":
      return [0, 3, 7, 10];
    case "7":
      return [0, 4, 7, 10];
    case "m(maj7)":
      return [0, 3, 7, 11];
    case "m7b5":
      return [0, 3, 6, 10];
    case "dim7":
      return [0, 3, 6, 9];
    case "6":
      return [0, 4, 7, 9];
    case "m6":
      return [0, 3, 7, 9];
    case "7sus4":
      return [0, 5, 7, 10];
    case "Mayor":
      return [0, 4, 7];
    case "Menor":
      return [0, 3, 7];
    case "dim":
      return [0, 3, 6];
    case "aug":
      return [0, 4, 8];
    case "maj9":
      return [4, 7, 11, 2];
    case "maj13":
      return [4, 9, 11, 2];
    case "maj7#11":
    case "maj9#11":
      return [4, 6, 11, 2];
    case "6(9)":
      return [4, 7, 9, 2];
    case "m9":
      return [3, 7, 10, 2];
    case "m11":
      return [3, 5, 10, 2];
    case "m13":
      return [3, 9, 10, 2];
    case "m11b5":
      return [3, 5, 6, 10];
    case "mb13b5":
      return [3, 6, 8, 10];
    case "m9b5":
      return [3, 6, 10, 2];
    case "dim7_9":
      return [3, 6, 9, 2];
    case "dim7_11":
      return [3, 6, 9, 5];
    case "dim7_b13":
      return [3, 6, 9, 8];
    case "9":
      return [4, 7, 10, 2];
    case "13":
      return [4, 9, 10, 2];
    case "7b9":
      return [4, 7, 10, 1];
    case "7b13":
    case "alt":
      return [4, 8, 10, 1];
    case "7#11":
      return [4, 6, 10, 2];
    case "7#9":
      return [4, 10, 3];
    case "9sus4":
      return [5, 7, 10, 2];
    case "13sus4":
      return [5, 9, 10, 2];
    case "add9":
      return [0, 2, 4, 7];
    case "m-add9":
      return [0, 2, 3, 7];
    default:
      return [0, 4, 7];
  }
}

const TENSION_CHORD_ORDERED_VOICINGS: Record<
  string,
  { formA: number[]; formB: number[] }
> = {
  "7#11": {
    formA: [4, 10, 14, 18],
    formB: [10, 14, 16, 18],
  },
  "9": {
    formA: [4, 7, 10, 14],
    formB: [10, 14, 16, 19],
  },
  "13": {
    formA: [4, 10, 14, 21],
    formB: [10, 14, 16, 21],
  },
  "7b9": {
    formA: [4, 7, 10, 13],
    formB: [10, 13, 16, 19],
  },
  "7#9": {
    formA: [4, 10, 15],
    formB: [4, 7, 10, 15],
  },
  "7b13": {
    formA: [4, 10, 13, 20],
    formB: [10, 13, 16, 20],
  },
  alt: {
    formA: [4, 10, 15, 20],
    formB: [10, 13, 16, 20],
  },
  maj9: {
    formA: [4, 7, 11, 14],
    formB: [11, 14, 16, 19],
  },
  maj13: {
    formA: [4, 11, 14, 21],
    formB: [11, 14, 16, 21],
  },
  "maj7#11": {
    formA: [4, 11, 14, 18],
    formB: [11, 14, 16, 18],
  },
  "maj9#11": {
    formA: [4, 11, 14, 18],
    formB: [11, 14, 16, 18],
  },
  "6(9)": {
    formA: [4, 9, 14, 19],
    formB: [9, 14, 16, 19],
  },
  m9: {
    formA: [3, 7, 10, 14],
    formB: [10, 14, 15, 19],
  },
  m11: {
    formA: [3, 10, 14, 17],
    formB: [10, 14, 15, 17],
  },
  m13: {
    formA: [3, 10, 14, 21],
    formB: [10, 14, 15, 21],
  },
  m9b5: {
    formA: [3, 6, 10, 14],
    formB: [10, 14, 15, 18],
  },
  m11b5: {
    formA: [3, 6, 10, 17],
    formB: [10, 15, 17, 18],
  },
  mb13b5: {
    formA: [3, 6, 10, 20],
    formB: [10, 15, 18, 20],
  },
  "9sus4": {
    formA: [5, 7, 10, 14],
    formB: [10, 14, 17, 19],
  },
  "13sus4": {
    formA: [5, 10, 14, 21],
    formB: [10, 14, 17, 21],
  },
};

export function getJazzVoicingFormulas(
  type: ChordTypeOptions | string,
  rawSuffix: string = ""
): { typeA: number[]; typeB: number[] } {
  const ordered = TENSION_CHORD_ORDERED_VOICINGS[String(type)];
  if (ordered) {
    return { typeA: ordered.formA, typeB: ordered.formB };
  }
  const intervals = getIRealPitchClassIntervals(type, rawSuffix);
  return { typeA: intervals, typeB: intervals };
}

export function getChordIntervals(type: ChordTypeOptions, rawSuffix: string = ""): number[] {
  return getIRealPitchClassIntervals(type, rawSuffix);
}

function buildOrderedTensionVoicing(
  rootPitchClass: number,
  formA: number[],
  formB: number[],
  prevVoicing?: number[] | null
): number[] {
  const candidates: number[][] = [];

  for (const formula of [formA, formB]) {
    for (const baseOctave of [36, 48, 60]) {
      const rootMidi = baseOctave + rootPitchClass;
      const voicing = formula.map((interval) => rootMidi + interval);
      const lowest = voicing[0];
      const highest = voicing[voicing.length - 1];

      if (lowest >= 51 && highest <= 71) {
        candidates.push(voicing);
      }
    }
  }

  if (candidates.length === 0) {
    const rootMidi = 48 + rootPitchClass;
    let fallback = formA.map((i) => rootMidi + i);
    while (fallback[0] < 51) fallback = fallback.map((n) => n + 12);
    while (fallback[fallback.length - 1] > 72) fallback = fallback.map((n) => n - 12);
    return fallback;
  }

  const scoreCandidate = (v: number[]): number => {
    const avg = v.reduce((s, n) => s + n, 0) / v.length;
    let score = Math.abs(avg - 61.5);

    if (prevVoicing && prevVoicing.length > 0) {
      const prevAvg =
        prevVoicing.reduce((s, n) => s + n, 0) / prevVoicing.length;
      const centerDiff = Math.abs(avg - prevAvg);
      score = score * 0.65 + centerDiff * 0.35;
    }

    return score;
  };

  return candidates.sort((a, b) => scoreCandidate(a) - scoreCandidate(b))[0];
}

export function buildIRealVoicing(
  rootPitchClass: number,
  intervals: number[],
  prevVoicing?: number[] | null,
  isSharpNine: boolean = false
): number[] {
  const pitchClasses = Array.from(
    new Set(intervals.map((i) => ((rootPitchClass + i) % 12 + 12) % 12))
  );
  const targetCount = pitchClasses.length;
  const thirdPc = (rootPitchClass + 4) % 12;
  const sharpNinePc = (rootPitchClass + 3) % 12;

  const candidates: number[][] = [];

  for (let startMidi = 52; startMidi <= 60; startMidi++) {
    const voicing: number[] = [];
    const usedPc = new Set<number>();

    for (let step = 0; step < 16 && voicing.length < targetCount; step++) {
      const midi = startMidi + step;
      if (midi > 67) break;
      const pc = midi % 12;
      if (pitchClasses.includes(pc) && !usedPc.has(pc)) {
        if (isSharpNine && pc === sharpNinePc && !usedPc.has(thirdPc)) {
          continue;
        }
        voicing.push(midi);
        usedPc.add(pc);
      }
    }

    if (voicing.length === targetCount && voicing[voicing.length - 1] <= 67 && voicing[0] >= 52) {
      const key = voicing.join(",");
      if (!candidates.some((c) => c.join(",") === key)) {
        candidates.push(voicing);
      }
    }
  }

  if (candidates.length === 0) {
    return pitchClasses.map((pc) => {
      let m = 53 + ((pc - (53 % 12) + 12) % 12);
      if (m > 67) m -= 12;
      return m;
    }).sort((a, b) => a - b);
  }

  const scoreCandidate = (v: number[]): number => {
    const avg = v.reduce((s, n) => s + n, 0) / v.length;
    let score = Math.abs(avg - 60.5);

    for (let i = 0; i < v.length - 1; i++) {
      if (v[i + 1] - v[i] === 1) {
        score += 3.5;
      }
    }

    if (prevVoicing && prevVoicing.length === v.length) {
      const voiceMove =
        v.reduce((sum, n, idx) => sum + Math.abs(n - prevVoicing[idx]), 0) / v.length;
      score = score * 0.75 + voiceMove * 0.25;
    }

    return score;
  };

  return candidates.sort((a, b) => scoreCandidate(a) - scoreCandidate(b))[0];
}

export function buildJazzVoicing(
  chordString: string,
  previousVoicing?: number[] | null
): number[] {
  const parsed = parseChord(chordString);
  const rootPitchClass = ROOT_MIDI_OFFSET_MAP[parsed.root] ?? 0;

  let upperVoicing: number[];
  const orderedFormula = TENSION_CHORD_ORDERED_VOICINGS[String(parsed.type)];
  if (orderedFormula) {
    upperVoicing = buildOrderedTensionVoicing(
      rootPitchClass,
      orderedFormula.formA,
      orderedFormula.formB,
      previousVoicing
    );
  } else {
    const intervals = getIRealPitchClassIntervals(parsed.type, parsed.suffix);
    const isSharpNine = parsed.type === "7#9";
    upperVoicing = buildIRealVoicing(rootPitchClass, intervals, previousVoicing, isSharpNine);
  }

  // Si el acorde tiene inversión / nota en el bajo (ej. Cmaj7/B o G/B),
  // garantizamos que la nota más grave del voicing sea ese bajo en la octava 2-3 (MIDI 43-54)
  if (parsed.bassNote && parsed.bassNote in ROOT_MIDI_OFFSET_MAP) {
    const bassPc = ROOT_MIDI_OFFSET_MAP[parsed.bassNote];
    let bassMidi = 48 + bassPc;
    while (bassMidi >= upperVoicing[0]) {
      bassMidi -= 12;
    }
    if (bassMidi < 40) bassMidi += 12;
    const filteredUpper = upperVoicing.filter((m) => m !== bassMidi);
    return [bassMidi, ...filteredUpper];
  }

  return upperVoicing;
}

export function getDictionaryNotes(
  root: RootNote,
  type: ChordTypeOptions | string,
  mode: "chord" | "scale",
  startOctaveMidi: number = 48
): number[] {
  const rootOffset = ROOT_MIDI_OFFSET_MAP[root] || 0;
  const rootMidi = startOctaveMidi + rootOffset;

  if (mode === "scale") {
    for (const category of EXPLORER_CATEGORIES) {
      for (const scale of category.scales) {
        if (scale.name === type) {
          return [...scale.intervals.map((interval) => rootMidi + interval), rootMidi + 12];
        }
      }
    }
    const suggestedScale = getSuggestedScale(root, type as ChordTypeOptions, "C");
    const notes = suggestedScale.intervals?.map((interval) => rootMidi + interval) || [];
    if (notes.length > 0) notes.push(rootMidi + 12);
    return notes;
  } else {
    const suffix = type === "Mayor" ? "" : type === "Menor" ? "m" : String(type);
    return buildJazzVoicing(`${root}${suffix}`);
  }
}

export function getChordNotes(
  chordString: string,
  _startOctaveMidi: number = 48,
  previousVoicing?: number[] | null
): number[] {
  return buildJazzVoicing(chordString, previousVoicing);
}