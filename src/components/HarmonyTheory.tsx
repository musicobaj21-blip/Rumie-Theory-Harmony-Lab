import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  BookOpen,
  Check,
  X,
  PlayCircle,
  BookCheck,
  Volume2,
  Maximize2,
} from "lucide-react";
import {
  harmonyCurriculumPart1,
  CurriculumChapter,
} from "../data/merinoSyllabusPart1";
import englishData from "../data/merinoSyllabusPart1EnData.json";
import ScaleFretboard from "./ScaleFretboard";
import ChordFretboard from "./ChordFretboard";
import IntervalFretboard from "./IntervalFretboard";
import ScalePianoKeyboard from "./ScalePianoKeyboard";
import ChordPianoKeyboard, {
  KeyboardVoicingMode,
  resolveKeyboardVoicingData,
} from "./ChordPianoKeyboard";
import IntervalPianoKeyboard from "./IntervalPianoKeyboard";
import { useInstrument } from "../contexts/InstrumentContext";
import ChordDictionary from "./ChordDictionary";
import GlobalIntervalMap from "./GlobalIntervalMap";
import { getArpeggioShape } from "../data/arpeggios";
import { academiaAudio } from "../utils/academiaAudio";
import { dictionaryAudio } from "../utils/dictionaryAudio";
import {
  CHORD_DEFINITIONS,
  getGuitarChordVoicings,
  getGuitarChordFrequencies,
  ROOT_MIDI_OFFSET_MAP,
} from "../data/chords";
import {
  transposeRoot,
  parseChord,
  getChordNotes,
  spellScaleNotes,
  spellNoteFromDegree,
} from "../utils/music";
import { RootNote } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import QuizCapitulo7 from "./QuizCapitulo7";
import QuizCapitulo8 from "./QuizCapitulo8";
import QuizCapitulo9 from "./QuizCapitulo9";
import QuizCapitulo6 from "./QuizCapitulo6";
import QuizCapitulo5 from "./QuizCapitulo5";
import QuizCapitulo4 from "./QuizCapitulo4";
import QuizCapitulo3 from "./QuizCapitulo3";
import QuizCapitulo2 from "./QuizCapitulo2";
import QuizCapitulo1 from "./QuizCapitulo1";
import QuizCapitulo1En from "./QuizCapitulo1En";
import QuizCapitulo2En from "./QuizCapitulo2En";
import QuizCapitulo3En from "./QuizCapitulo3En";
import QuizCapitulo4En from "./QuizCapitulo4En";
import QuizCapitulo5En from "./QuizCapitulo5En";
import QuizCapitulo6En from "./QuizCapitulo6En";
import QuizCapitulo7En from "./QuizCapitulo7En";
import QuizCapitulo8En from "./QuizCapitulo8En";
import QuizCapitulo9En from "./QuizCapitulo9En";
import QuizCapitulo10En from "./QuizCapitulo10En";
import QuizCapitulo11En from "./QuizCapitulo11En";
import QuizCapitulo12En from "./QuizCapitulo12En";
import QuizCapitulo13En from "./QuizCapitulo13En";
import QuizCapitulo14En from "./QuizCapitulo14En";


export const buildOneOctaveScale = (rawNotes: string[]) => {
  let scale = [...rawNotes];
  if (scale.length === 7) {
    scale.push(scale[0]); 
  } else if (scale.length > 8) {
    scale = scale.slice(0, 8);
  }

  const pitchMap: Record<string, number> = { 'C':0, 'C#':1, 'Db':1, 'D':2, 'D#':3, 'Eb':3, 'E':4, 'F':5, 'F#':6, 'Gb':6, 'G':7, 'G#':8, 'Ab':8, 'A':9, 'A#':10, 'Bb':10, 'B':11 };
  
  let currentOctave = 3;
  let previousPitch = -1;
  
  return scale.map((noteName) => {
    const cleanNote = noteName.replace(/[0-9]/g, '');
    const currentPitch = pitchMap[cleanNote] ?? 0;
    
    if (currentPitch <= previousPitch && previousPitch !== -1) {
      currentOctave++;
    }
    
    previousPitch = currentPitch;
    
    const safeOctave = currentOctave > 4 ? 4 : currentOctave; 
    
    return `${cleanNote}${safeOctave}`;
  });
};

import QuizCapitulo10 from "./QuizCapitulo10";
import QuizCapitulo11 from "./QuizCapitulo11";
import QuizCapitulo12 from "./QuizCapitulo12";
import QuizCapitulo14 from "./QuizCapitulo14";
import QuizCapitulo13 from "./QuizCapitulo13";
import Capitulo9 from "./Capitulo9";
import Capitulo9En from "./Capitulo9En";
import Capitulo10En from "./Capitulo10En";
import Capitulo11En from "./Capitulo11En";
import Capitulo12En from "./Capitulo12En";
import Capitulo13En from "./Capitulo13En";
import Capitulo14En from "./Capitulo14En";
import Capitulo10 from "./Capitulo10";
import Capitulo11 from "./Capitulo11";
import Capitulo12 from "./Capitulo12";
import Capitulo13 from "./Capitulo13";
import Capitulo14 from "./Capitulo14";

const escalasSostenidos = [
  { t: 'C', c: ['C:Mayor', 'D:Menor', 'E:Menor', 'F:Mayor', 'G:Mayor', 'A:Menor', 'B:dim7'] },
  { t: 'G', c: ['G:Mayor', 'A:Menor', 'B:Menor', 'C:Mayor', 'D:Mayor', 'E:Menor', 'F#:dim7'] },
  { t: 'D', c: ['D:Mayor', 'E:Menor', 'F#:Menor', 'G:Mayor', 'A:Mayor', 'B:Menor', 'C#:dim7'] },
  { t: 'A', c: ['A:Mayor', 'B:Menor', 'C#:Menor', 'D:Mayor', 'E:Mayor', 'F#:Menor', 'G#:dim7'] },
  { t: 'E', c: ['E:Mayor', 'F#:Menor', 'G#:Menor', 'A:Mayor', 'B:Mayor', 'C#:Menor', 'D#:dim7'] },
  { t: 'B', c: ['B:Mayor', 'C#:Menor', 'D#:Menor', 'E:Mayor', 'F#:Mayor', 'G#:Menor', 'A#:dim7'] },
  { t: 'F#', c: ['F#:Mayor', 'G#:Menor', 'A#:Menor', 'B:Mayor', 'C#:Mayor', 'D#:Menor', 'E#:dim7'] }
];

const escalasBemoles = [
  { t: 'F', c: ['F:Mayor', 'G:Menor', 'A:Menor', 'Bb:Mayor', 'C:Mayor', 'D:Menor', 'E:dim7'] },
  { t: 'Bb', c: ['Bb:Mayor', 'C:Menor', 'D:Menor', 'Eb:Mayor', 'F:Mayor', 'G:Menor', 'A:dim7'] },
  { t: 'Eb', c: ['Eb:Mayor', 'F:Menor', 'G:Menor', 'Ab:Mayor', 'Bb:Mayor', 'C:Menor', 'D:dim7'] },
  { t: 'Ab', c: ['Ab:Mayor', 'Bb:Menor', 'C:Menor', 'Db:Mayor', 'Eb:Mayor', 'F:Menor', 'G:dim7'] },
  { t: 'Db', c: ['Db:Mayor', 'Eb:Menor', 'F:Menor', 'Gb:Mayor', 'Ab:Mayor', 'Bb:Menor', 'C:dim7'] },
  { t: 'Gb', c: ['Gb:Mayor', 'Ab:Menor', 'Bb:Menor', 'Cb:Mayor', 'Db:Mayor', 'Eb:Menor', 'F:dim7'] }
];

const Capitulo3Tablas = ({ onAction, type, language }: { onAction: (action: string) => void, type: "sostenidos" | "bemoles", language?: string }) => {
  const isSostenidos = type === 'sostenidos';
  const data = isSostenidos ? escalasSostenidos : escalasBemoles;

  return (
    <div className="w-full mb-6 overflow-hidden rounded-xl border border-slate-700 p-0">
      <table className="w-full table-fixed text-[9px] sm:text-[11px] text-center text-slate-300">
        <thead className="text-[8px] sm:text-[10px] text-white uppercase bg-cyan-600">
          <tr>
            <th className="p-1 sm:p-2 font-bold w-[14%] text-left pl-2">{language === 'en' ? 'DEGREE' : 'GRADO'}</th>
            <th className="p-1 sm:p-2 w-[12%]">I</th>
            <th className="p-1 sm:p-2 w-[12%]">II</th>
            <th className="p-1 sm:p-2 w-[12%]">III</th>
            <th className="p-1 sm:p-2 w-[12%]">IV</th>
            <th className="p-1 sm:p-2 w-[12%]">V</th>
            <th className="p-1 sm:p-2 w-[12%]">VI</th>
            <th className="p-1 sm:p-2 w-[14%]">VII</th>
          </tr>
        </thead>
        <tbody>
          {data.map((fila) => (
            <tr key={fila.t} className="border-b border-slate-700 hover:bg-slate-700/30">
              <td className="p-1 sm:p-2 font-bold bg-slate-900 text-cyan-400 border-r border-slate-700 text-left pl-2">
                <a
                  href={`#action:scale:${fila.t}:Mayor`}
                  onClick={(e) => {
                    e.preventDefault();
                    onAction(`#action:scale:${fila.t}:Mayor`);
                  }}
                  className="cursor-pointer underline decoration-cyan-400/60 underline-offset-2 hover:text-cyan-300 text-cyan-400"
                >
                  {fila.t}
                </a>
              </td>
              {fila.c.map((acordeData, i) => {
                const [rootStr, typeStr] = acordeData.split(':');
                // Transform for display: Mayor -> "", Menor -> "m", dim7 -> "dim"
                let display = rootStr;
                if (typeStr === "Menor") display += "m";
                else if (typeStr === "dim7") display += "dim";
                
                const isVGrado = i === 4;

                return (
                  <td key={i} className="p-1 sm:p-2">
                    <a 
                      href={`#action:chord:${rootStr}:${typeStr}`} 
                      onClick={(e) => { e.preventDefault(); onAction(`#action:chord:${rootStr}:${typeStr}`); }} 
                      className={`cursor-pointer underline decoration-current/60 underline-offset-2 ${isVGrado ? 'text-orange-500 font-bold hover:text-orange-400' : 'text-slate-300 hover:text-slate-100'}`}
                    >
                      {display}
                    </a>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const acordesSostenidos = [
  { t: 'C', c: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5'] },
  { t: 'G', c: ['Gmaj7', 'Am7', 'Bm7', 'Cmaj7', 'D7', 'Em7', 'F#m7b5'] },
  { t: 'D', c: ['Dmaj7', 'Em7', 'F#m7', 'Gmaj7', 'A7', 'Bm7', 'C#m7b5'] },
  { t: 'A', c: ['Amaj7', 'Bm7', 'C#m7', 'Dmaj7', 'E7', 'F#m7', 'G#m7b5'] },
  { t: 'E', c: ['Emaj7', 'F#m7', 'G#m7', 'Amaj7', 'B7', 'C#m7', 'D#m7b5'] },
  { t: 'B', c: ['Bmaj7', 'C#m7', 'D#m7', 'Emaj7', 'F#7', 'G#m7', 'A#m7b5'] },
  { t: 'F#', c: ['F#maj7', 'G#m7', 'A#m7', 'Bmaj7', 'C#7', 'D#m7', 'E#m7b5'] }
];

const acordesBemoles = [
  { t: 'F', c: ['Fmaj7', 'Gm7', 'Am7', 'Bbmaj7', 'C7', 'Dm7', 'Em7b5'] },
  { t: 'Bb', c: ['Bbmaj7', 'Cm7', 'Dm7', 'Ebmaj7', 'F7', 'Gm7', 'Am7b5'] },
  { t: 'Eb', c: ['Ebmaj7', 'Fm7', 'Gm7', 'Abmaj7', 'Bb7', 'Cm7', 'Dm7b5'] },
  { t: 'Ab', c: ['Abmaj7', 'Bbm7', 'Cm7', 'Dbmaj7', 'Eb7', 'Fm7', 'Gm7b5'] },
  { t: 'Db', c: ['Dbmaj7', 'Ebm7', 'Fm7', 'Gbmaj7', 'Ab7', 'Bbm7', 'Cm7b5'] },
  { t: 'Gb', c: ['Gbmaj7', 'Abm7', 'Bbm7', 'Cbmaj7', 'Db7', 'Ebm7', 'Fm7b5'] }
];

const menoresSostenidos = [
  { t: 'A Menor', c: ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'E7', 'Fmaj7', 'G7'] },
  { t: 'E Menor', c: ['Em7', 'F#m7b5', 'Gmaj7', 'Am7', 'B7', 'Cmaj7', 'D7'] },
  { t: 'B Menor', c: ['Bm7', 'C#m7b5', 'Dmaj7', 'Em7', 'F#7', 'Gmaj7', 'A7'] },
  { t: 'F# Menor', c: ['F#m7', 'G#m7b5', 'Amaj7', 'Bm7', 'C#7', 'Dmaj7', 'E7'] },
  { t: 'C# Menor', c: ['C#m7', 'D#m7b5', 'Emaj7', 'F#m7', 'G#7', 'Amaj7', 'B7'] },
  { t: 'G# Menor', c: ['G#m7', 'A#m7b5', 'Bmaj7', 'C#m7', 'D#7', 'Emaj7', 'F#7'] },
  { t: 'D# Menor', c: ['D#m7', 'E#m7b5', 'F#maj7', 'G#m7', 'A#7', 'Bmaj7', 'C#7'] }
];

const menoresBemoles = [
  { t: 'D Menor', c: ['Dm7', 'Em7b5', 'Fmaj7', 'Gm7', 'A7', 'Bbmaj7', 'C7'] },
  { t: 'G Menor', c: ['Gm7', 'Am7b5', 'Bbmaj7', 'Cm7', 'D7', 'Ebmaj7', 'F7'] },
  { t: 'C Menor', c: ['Cm7', 'Dm7b5', 'Ebmaj7', 'Fm7', 'G7', 'Abmaj7', 'Bb7'] },
  { t: 'F Menor', c: ['Fm7', 'Gm7b5', 'Abmaj7', 'Bbm7', 'C7', 'Dbmaj7', 'Eb7'] },
  { t: 'Bb Menor', c: ['Bbm7', 'Cm7b5', 'Dbmaj7', 'Ebm7', 'F7', 'Gbmaj7', 'Ab7'] },
  { t: 'Eb Menor', c: ['Ebm7', 'Fm7b5', 'Gbmaj7', 'Abm7', 'Bb7', 'Cbmaj7', 'Db7'] }
];

const Capitulo7Tablas = ({ onAction, type, language }: { onAction: (action: string) => void, type: 'sostenidos' | 'bemoles', language?: string }) => {
  const isSostenidos = type === 'sostenidos';
  const data = isSostenidos ? menoresSostenidos : menoresBemoles;

  return (
    <div className="w-full mb-6 overflow-hidden rounded-xl border border-slate-700 p-0">
      <table className="w-full table-fixed text-[9px] sm:text-[11px] text-center text-slate-300">
        <thead className="text-[8px] sm:text-[10px] text-white uppercase bg-cyan-600">
          <tr>
            <th className="p-1 sm:p-2 font-bold w-[14%] text-left pl-2">{language === 'en' ? 'Scale' : 'Escala'}</th>
            <th className="p-1 sm:p-2 w-[10%]">i</th>
            <th className="p-1 sm:p-2 w-[16%]">ii°</th>
            <th className="p-1 sm:p-2 w-[14%]">III</th>
            <th className="p-1 sm:p-2 w-[11%]">iv</th>
            <th className="p-1 sm:p-2 w-[10%]">V</th>
            <th className="p-1 sm:p-2 w-[14%]">VI</th>
            <th className="p-1 sm:p-2 w-[11%]">VII</th>
          </tr>
        </thead>
        <tbody>
          {data.map((fila) => (
            <tr key={fila.t} className="border-b border-slate-700 hover:bg-slate-700/30">
              <td className="p-1 sm:p-2 font-bold bg-slate-900 text-cyan-400 border-r border-slate-700 text-left pl-2">
                <a
                  href={`#action:scale:${fila.t.split(" ")[0]}:Menor`}
                  onClick={(e) => {
                    e.preventDefault();
                    onAction(`#action:scale:${fila.t.split(" ")[0]}:Menor`);
                  }}
                  className="cursor-pointer underline decoration-cyan-400/60 underline-offset-2 hover:text-cyan-300 text-cyan-400"
                >
                  {fila.t}
                </a>
              </td>
              {fila.c.map((acorde, i) => {
                let rootMatch = acorde.match(/^[A-G](#|b)?/);
                let rootStr = rootMatch ? rootMatch[0] : "";
                let typeStr = acorde.substring(rootStr.length);
                
                // V grado en este curso es dominante (E7), pintar de naranja
                const isVGrado = i === 4; 
                
                return (
                  <td key={i} className="p-1 sm:p-2">
                    <a 
                      href={`#action:chord:${rootStr}:${typeStr}`} 
                      onClick={(e) => { e.preventDefault(); onAction(`#action:chord:${rootStr}:${typeStr}`); }} 
                      className={`cursor-pointer underline decoration-current/60 underline-offset-2 ${isVGrado ? 'text-orange-500 font-bold hover:text-orange-400' : 'text-slate-300 hover:text-slate-100'}`}
                    >
                      {acorde}
                    </a>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Capitulo4Tablas = ({ onAction, language }: { onAction: (action: string) => void, language?: string }) => {
  return (
    <>
      <h4 className="text-sm font-semibold text-white mb-2 mt-4">{language === 'en' ? 'Major Scales with Sharps (#)' : 'Escalas Mayores con Sostenidos (#)'}</h4>
      <div className="w-full mb-6 overflow-hidden rounded-xl border border-slate-700 p-0">
        <table className="w-full table-fixed text-[9px] sm:text-[11px] text-center text-slate-300">
          <thead className="text-[8px] sm:text-[10px] text-white uppercase bg-cyan-600">
            <tr>
              <th className="p-1 sm:p-2 font-bold w-[14%] text-left pl-2">{language === 'en' ? 'DEGREE' : 'GRADO'}</th>
              <th className="p-1 sm:p-2 w-[14%]">I</th>
              <th className="p-1 sm:p-2 w-[11%]">II</th>
              <th className="p-1 sm:p-2 w-[11%]">III</th>
              <th className="p-1 sm:p-2 w-[14%]">IV</th>
              <th className="p-1 sm:p-2 w-[10%]">V</th>
              <th className="p-1 sm:p-2 w-[11%]">VI</th>
              <th className="p-1 sm:p-2 w-[15%]">VII</th>
            </tr>
          </thead>
          <tbody>
            {acordesSostenidos.map((fila) => (
              <tr key={fila.t} className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="p-1 sm:p-2 font-bold bg-slate-900 text-cyan-400 border-r border-slate-700 text-left pl-2">
                  <a
                    href={`#action:scale:${fila.t}:Mayor`}
                    onClick={(e) => {
                      e.preventDefault();
                      onAction(`#action:scale:${fila.t}:Mayor`);
                    }}
                    className="cursor-pointer underline decoration-cyan-400/60 underline-offset-2 hover:text-cyan-300 text-cyan-400"
                  >
                    {fila.t}
                  </a>
                </td>
                {fila.c.map((acorde, i) => {
                  let rootMatch = acorde.match(/^[A-G](#|b)?/);
                  let rootStr = rootMatch ? rootMatch[0] : fila.t;
                  let typeStr = acorde.substring(rootStr.length);
                  
                  const isVGrado = i === 4;

                  return (
                    <td key={i} className="p-1 sm:p-2">
                      <a 
                        href={`#action:chord:${rootStr}:${typeStr}`} 
                        onClick={(e) => { e.preventDefault(); onAction(`#action:chord:${rootStr}:${typeStr}`); }} 
                        className={`cursor-pointer underline decoration-current/60 underline-offset-2 ${isVGrado ? 'text-orange-500 font-bold hover:text-orange-400' : 'text-slate-300 hover:text-slate-100'}`}
                      >
                        {acorde}
                      </a>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="text-sm font-semibold text-white mb-2">{language === 'en' ? 'Major Scales with Flats (b)' : 'Escalas Mayores con Bemoles (b)'}</h4>
      <div className="w-full mb-2 overflow-hidden rounded-xl border border-slate-700 p-0">
        <table className="w-full table-fixed text-[9px] sm:text-[11px] text-center text-slate-300">
          <thead className="text-[8px] sm:text-[10px] text-white uppercase bg-cyan-600">
            <tr>
              <th className="p-1 sm:p-2 font-bold w-[14%] text-left pl-2">{language === 'en' ? 'DEGREE' : 'GRADO'}</th>
              <th className="p-1 sm:p-2 w-[14%]">I</th>
              <th className="p-1 sm:p-2 w-[11%]">II</th>
              <th className="p-1 sm:p-2 w-[11%]">III</th>
              <th className="p-1 sm:p-2 w-[14%]">IV</th>
              <th className="p-1 sm:p-2 w-[10%]">V</th>
              <th className="p-1 sm:p-2 w-[11%]">VI</th>
              <th className="p-1 sm:p-2 w-[15%]">VII</th>
            </tr>
          </thead>
          <tbody>
            {acordesBemoles.map((fila) => (
              <tr key={fila.t} className="border-b border-slate-700 hover:bg-slate-700/30">
                <td className="p-1 sm:p-2 font-bold bg-slate-900 text-cyan-400 border-r border-slate-700 text-left pl-2">
                  <a
                    href={`#action:scale:${fila.t}:Mayor`}
                    onClick={(e) => {
                      e.preventDefault();
                      onAction(`#action:scale:${fila.t}:Mayor`);
                    }}
                    className="cursor-pointer underline decoration-cyan-400/60 underline-offset-2 hover:text-cyan-300 text-cyan-400"
                  >
                    {fila.t}
                  </a>
                </td>
                {fila.c.map((acorde, i) => {
                  let rootMatch = acorde.match(/^[A-G](#|b)?/);
                  let rootStr = rootMatch ? rootMatch[0] : fila.t;
                  let typeStr = acorde.substring(rootStr.length);
                  
                  const isVGrado = i === 4;

                  return (
                    <td key={i} className="p-1 sm:p-2">
                      <a 
                        href={`#action:chord:${rootStr}:${typeStr}`} 
                        onClick={(e) => { e.preventDefault(); onAction(`#action:chord:${rootStr}:${typeStr}`); }} 
                        className={`cursor-pointer underline decoration-current/60 underline-offset-2 ${isVGrado ? 'text-orange-500 font-bold hover:text-orange-400' : 'text-slate-300 hover:text-slate-100'}`}
                      >
                        {acorde}
                      </a>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

type VisualizerData = {
  type: "chord" | "interval" | "scale" | "empty";
  root?: string;
  note?: string;
  chordType?: string;
  scaleName?: string;
  triadShape?: { string: number, fret: number, label: string, finger?: number }[];
  fingersOverride?: (number | null)[];
  barres?: { fret: number, stringFrom: number, stringTo: number }[];
  isArpeggio?: boolean;
  intervals?: number[];
  notes?: string[];
  positions?: (number | null)[];
  title?: string;
  forceBaseFret?: number;
  autoPlayTrigger?: number;
};

const INVERSION_SHAPES: Record<string, { 
  positions: number[], 
  fingersOverride?: (number | null)[], 
  title: string, 
  rootNote: string, 
  chordType: string,
  forceBaseFret?: number,
  triadShape?: { string: number, fret: number, label: string, finger?: number }[],
  barres?: { fret: number, stringFrom: number, stringTo: number }[]
}> = {
  "C/E": {
    positions: [-1, -1, 2, 0, 1, -1],
    fingersOverride: [null, null, 2, null, 1, null],
    title: "C/E (1ª Inversión - Tríada)",
    rootNote: "C",
    chordType: "Mayor",
    forceBaseFret: 1,
    triadShape: [
      { string: 4, fret: 2, label: "Bajo" },
      { string: 3, fret: 0, label: "G" },
      { string: 2, fret: 1, label: "C" }
    ]
  },
  "C/G": {
    positions: [-1, -1, 5, 5, 5, -1],
    fingersOverride: [null, null, 1, 1, 1, null],
    title: "C/G (2ª Inversión - Tríada)",
    rootNote: "C",
    chordType: "Mayor",
    forceBaseFret: 5,
    triadShape: [
      { string: 4, fret: 5, label: "Bajo" },
      { string: 3, fret: 5, label: "C" },
      { string: 2, fret: 5, label: "E" }
    ]
  },
  "Cmaj7/E": {
    positions: [-1, -1, 2, 4, 1, 3],
    fingersOverride: [null, null, 2, 4, 1, 3],
    title: "Cmaj7/E (1ª Inversión - Drop 2)",
    rootNote: "C",
    chordType: "maj7",
    forceBaseFret: 1,
    triadShape: [
      { string: 4, fret: 2, label: "Bajo" },
      { string: 3, fret: 4, label: "B" },
      { string: 2, fret: 1, label: "C" },
      { string: 1, fret: 3, label: "G" }
    ]
  },
  "Cmaj7/G": {
    positions: [-1, -1, 5, 5, 5, 7],
    fingersOverride: [null, null, 1, 1, 1, 3],
    title: "Cmaj7/G (2ª Inversión - Drop 2)",
    rootNote: "C",
    chordType: "maj7",
    forceBaseFret: 5,
    triadShape: [
      { string: 4, fret: 5, label: "Bajo" },
      { string: 3, fret: 5, label: "C" },
      { string: 2, fret: 5, label: "E" },
      { string: 1, fret: 7, label: "B" }
    ]
  },
  "Cmaj7/B": {
    positions: [-1, -1, 9, 9, 8, 8],
    fingersOverride: [null, null, 3, 4, 1, 2],
    title: "Cmaj7/B (3ª Inversión - Drop 2)",
    rootNote: "C",
    chordType: "maj7",
    forceBaseFret: 7,
    triadShape: [
      { string: 4, fret: 9, label: "Bajo" },
      { string: 3, fret: 9, label: "E" },
      { string: 2, fret: 8, label: "G" },
      { string: 1, fret: 8, label: "C" }
    ]
  },
  "G/B": {
    positions: [-1, 2, 0, 0, 3, 3],
    fingersOverride: [null, 1, null, null, 3, 4],
    title: "G/B (1ª Inversión)",
    rootNote: "G",
    chordType: "Mayor"
  },
  "F/A": {
    positions: [-1, 0, 3, 2, 1, 1],
    fingersOverride: [null, null, 3, 2, 1, 1],
    title: "F/A (1ª Inversión)",
    rootNote: "F",
    chordType: "Mayor"
  }
};

export interface ChapterMeasureOverride {
  customRoman?: string;
  customScale?: string;
  customRomans?: (string | undefined)[];
  customScales?: (string | undefined)[];
}

export interface ChapterLabProgressionPayload {
  chapterId: string;
  title: string;
  key: string;
  isMinor: boolean;
  style: string;
  tempo: number;
  chords: string[];
  measureOverrides?: ChapterMeasureOverride[];
}

export const CHAPTER_LAB_PROGRESSIONS: Record<
  string,
  Omit<ChapterLabProgressionPayload, "chapterId">
> = {
  capitulo_1: {
    title: "Cap. 1: Intervalos y Armonía Básica",
    key: "C",
    isMinor: false,
    style: "Pop",
    tempo: 100,
    chords: ["C", "F", "G", "C", "Am", "Dm", "G7", "C"],
    measureOverrides: [
      { customRoman: "I", customScale: "C Jónica (Mayor)" },
      { customRoman: "IV", customScale: "F Lidia" },
      { customRoman: "V", customScale: "G Mixolidia" },
      { customRoman: "I", customScale: "C Jónica (Mayor)" },
      { customRoman: "vi", customScale: "A Eólica (Menor)" },
      { customRoman: "ii", customScale: "D Dórica" },
      { customRoman: "V7", customScale: "G Mixolidia" },
      { customRoman: "I", customScale: "C Jónica (Mayor)" },
    ],
  },
  capitulo_2: {
    title: "Cap. 2: Acordes Tríadas (Mayor, Menor, Dim, Aug)",
    key: "C",
    isMinor: false,
    style: "Pop",
    tempo: 100,
    chords: ["C", "Cm", "Cdim7", "Caug", "C", "Am", "F", "G"],
    measureOverrides: [
      { customRoman: "I", customScale: "C Jónica (Mayor)" },
      { customRoman: "i", customScale: "C Eólica (Menor)" },
      { customRoman: "°7", customScale: "C Disminuida" },
      { customRoman: "I+", customScale: "C Tonos Enteros" },
      { customRoman: "I", customScale: "C Jónica (Mayor)" },
      { customRoman: "vi", customScale: "A Eólica" },
      { customRoman: "IV", customScale: "F Lidia" },
      { customRoman: "V", customScale: "G Mixolidia" },
    ],
  },
  capitulo_3: {
    title: "Cap. 3: Escala Mayor (Let It Be - I V vi IV)",
    key: "C",
    isMinor: false,
    style: "Pop",
    tempo: 85,
    chords: ["C", "G", "Am", "F", "C", "G", "F", "C"],
    measureOverrides: [
      { customRoman: "I", customScale: "C Jónica (Mayor)" },
      { customRoman: "V", customScale: "G Mixolidia" },
      { customRoman: "vi", customScale: "A Eólica" },
      { customRoman: "IV", customScale: "F Lidia" },
      { customRoman: "I", customScale: "C Jónica (Mayor)" },
      { customRoman: "V", customScale: "G Mixolidia" },
      { customRoman: "IV", customScale: "F Lidia" },
      { customRoman: "I", customScale: "C Jónica (Mayor)" },
    ],
  },
  capitulo_4: {
    title: "Cap. 4: Acordes Tétradas (II-V-I Mayor y Menor)",
    key: "C",
    isMinor: false,
    style: "Jazz Swing",
    tempo: 112,
    chords: ["Dm7", "G7", "Cmaj7", "Cmaj7", "Bm7b5", "E7", "Am7", "Am7"],
    measureOverrides: [
      { customRoman: "ii7", customScale: "D Dórica" },
      { customRoman: "V7", customScale: "G Mixolidia" },
      { customRoman: "Imaj7", customScale: "C Jónica" },
      { customRoman: "Imaj7", customScale: "C Jónica" },
      { customRoman: "ii°/vi", customScale: "B Locria" },
      { customRoman: "V7/vi", customScale: "E Frigia Dominante" },
      { customRoman: "vi7", customScale: "A Eólica" },
      { customRoman: "vi7", customScale: "A Eólica" },
    ],
  },
  capitulo_5: {
    title: "Cap. 5: Funciones Armónicas y Sustitutos",
    key: "C",
    isMinor: false,
    style: "Jazz Swing",
    tempo: 112,
    chords: ["Cmaj7", "Fmaj7", "G7", "Cmaj7", "Am7", "Dm7", "Bm7b5", "Cmaj7"],
    measureOverrides: [
      { customRoman: "Imaj7", customScale: "C Jónica" },
      { customRoman: "IVmaj7", customScale: "F Lidia" },
      { customRoman: "V7", customScale: "G Mixolidia" },
      { customRoman: "Imaj7", customScale: "C Jónica" },
      { customRoman: "vi7", customScale: "A Eólica" },
      { customRoman: "ii7", customScale: "D Dórica" },
      { customRoman: "vii°", customScale: "B Locria" },
      { customRoman: "Imaj7", customScale: "C Jónica" },
    ],
  },
  capitulo_6: {
    title: "Cap. 6: Inversiones y Modos Griegos",
    key: "C",
    isMinor: false,
    style: "Pop",
    tempo: 96,
    chords: ["C", "G/B", "Am", "F/A", "Cmaj7", "Cmaj7/E", "Fmaj7", "G7"],
    measureOverrides: [
      { customRoman: "I", customScale: "C Jónica" },
      { customRoman: "V6", customScale: "G Mixolidia" },
      { customRoman: "vi", customScale: "A Eólica" },
      { customRoman: "IV6", customScale: "F Lidia" },
      { customRoman: "Imaj7", customScale: "C Jónica" },
      { customRoman: "Imaj7/3", customScale: "C Jónica" },
      { customRoman: "IVmaj7", customScale: "F Lidia" },
      { customRoman: "V7", customScale: "G Mixolidia" },
    ],
  },
  capitulo_7: {
    title: "Cap. 7: Escala Menor Natural (Autumn Leaves II-V-I)",
    key: "A",
    isMinor: true,
    style: "Jazz Swing",
    tempo: 118,
    chords: ["Dm7", "G7", "Cmaj7", "Fmaj7", "Bm7b5", "E7", "Am7", "Am7"],
    measureOverrides: [
      { customRoman: "iv7", customScale: "D Dórica" },
      { customRoman: "bVII7", customScale: "G Mixolidia" },
      { customRoman: "bIIImaj7", customScale: "C Jónica" },
      { customRoman: "bVImaj7", customScale: "F Lidia" },
      { customRoman: "ii°", customScale: "B Locria" },
      { customRoman: "V7", customScale: "E Frigia Dominante" },
      { customRoman: "i7", customScale: "A Menor Natural (Eólica)" },
      { customRoman: "i7", customScale: "A Menor Natural (Eólica)" },
    ],
  },
  capitulo_8: {
    title: "Cap. 8: Escala Menor Armónica",
    key: "A",
    isMinor: true,
    style: "Jazz Swing",
    tempo: 112,
    chords: ["Am(maj7)", "Bm7b5", "E7b9", "Am(maj7)", "Dm7", "G#dim7", "Cmaj7(#5)", "E7b9"],
    measureOverrides: [
      { customRoman: "i(maj7)", customScale: "A Menor Armónica" },
      { customRoman: "ii°", customScale: "B Locria 6 (♮6)" },
      { customRoman: "V7", customScale: "E Frigia Dominante" },
      { customRoman: "i(maj7)", customScale: "A Menor Armónica" },
      { customRoman: "iv", customScale: "D Dórica #4" },
      { customRoman: "vii°7", customScale: "G# Disminuida (Ultralocria bb7)" },
      { customRoman: "bIII+", customScale: "C Jónica #5 (Aumentada)" },
      { customRoman: "V7", customScale: "E Frigia Dominante" },
    ],
  },
  capitulo_9: {
    title: "Cap. 9: Modos de la Escala Menor Armónica",
    key: "A",
    isMinor: true,
    style: "Jazz Swing",
    tempo: 110,
    chords: ["Am(maj7)", "Bm7b5", "E7b9", "Am(maj7)", "Dm7", "G#dim7", "Cmaj7(#5)", "E7b9"],
    measureOverrides: [
      { customRoman: "i(maj7)", customScale: "A Menor Armónica" },
      { customRoman: "ii°", customScale: "B Locria 6 (♮6)" },
      { customRoman: "V7", customScale: "E Frigia Dominante" },
      { customRoman: "i(maj7)", customScale: "A Menor Armónica" },
      { customRoman: "iv", customScale: "D Dórica #4" },
      { customRoman: "vii°7", customScale: "G# Disminuida (Ultralocria bb7)" },
      { customRoman: "bIII+", customScale: "C Jónica #5 (Aumentada)" },
      { customRoman: "V7", customScale: "E Frigia Dominante" },
    ],
  },
  capitulo_10: {
    title: "Cap. 10: Dominantes Secundarios y Sustitutos Tritonales",
    key: "C",
    isMinor: false,
    style: "Jazz Swing",
    tempo: 115,
    chords: ["Cmaj7", "E7", "Am7", "A7", "Dm7", "Db7", "Cmaj7", "G7"],
    measureOverrides: [
      { customRoman: "Imaj7", customScale: "C Jónica" },
      { customRoman: "V7/vi", customScale: "E Frigia Dominante" },
      { customRoman: "vi7", customScale: "A Eólica" },
      { customRoman: "V7/ii", customScale: "A Mixolidia b13" },
      { customRoman: "ii7", customScale: "D Dórica" },
      { customRoman: "subV7/I", customScale: "Db Lidia b7" },
      { customRoman: "Imaj7", customScale: "C Jónica" },
      { customRoman: "V7", customScale: "G Mixolidia" },
    ],
  },
  capitulo_11: {
    title: "Cap. 11: Dominantes Extendidos y ii7 Relativos",
    key: "C",
    isMinor: false,
    style: "Jazz Swing",
    tempo: 116,
    chords: ["E7", "A7", "D7", "G7", "Em7b5_A7", "Dm7", "Abm7_Db7", "Cmaj7"],
    measureOverrides: [
      { customRoman: "V7/vi", customScale: "E Frigia Dominante" },
      { customRoman: "V7/ii", customScale: "A Mixolidia b13" },
      { customRoman: "V7/V", customScale: "D Lidia b7" },
      { customRoman: "V7", customScale: "G Mixolidia" },
      { customRomans: ["ii°/ii", "V7/ii"], customScales: ["E Locria", "A Frigia Dom"] },
      { customRoman: "ii7", customScale: "D Dórica" },
      { customRomans: ["subii7", "subV7"], customScales: ["Ab Dórica", "Db Lidia b7"] },
      { customRoman: "Imaj7", customScale: "C Jónica" },
    ],
  },
  capitulo_12: {
    title: "Cap. 12: Tensiones Armónicas (9, 11, #11, 13)",
    key: "C",
    isMinor: false,
    style: "Jazz Swing",
    tempo: 108,
    chords: ["Cmaj9", "A7b13", "Dm11", "G13", "Cmaj7#11", "E7#9", "Am9", "D9"],
    measureOverrides: [
      { customRoman: "Imaj9", customScale: "C Jónica" },
      { customRoman: "V7/ii", customScale: "A Mixolidia b13" },
      { customRoman: "ii11", customScale: "D Dórica" },
      { customRoman: "V13", customScale: "G Mixolidia" },
      { customRoman: "Imaj7(#11)", customScale: "C Lidia" },
      { customRoman: "V7/vi", customScale: "E Superlocria (Alterada)" },
      { customRoman: "vi9", customScale: "A Eólica" },
      { customRoman: "V9/V", customScale: "D Lidia b7" },
    ],
  },
  capitulo_13: {
    title: "Cap. 13: Intercambio Modal (Acordes Prestados)",
    key: "C",
    isMinor: false,
    style: "Bossa Nova",
    tempo: 112,
    chords: ["Cmaj7", "Fmaj7", "Fm7", "Cmaj7", "Cmaj7", "Abmaj7", "Bb7", "Cmaj7"],
    measureOverrides: [
      { customRoman: "Imaj7", customScale: "C Jónica" },
      { customRoman: "IVmaj7", customScale: "F Lidia" },
      { customRoman: "iv7", customScale: "F Dórica" },
      { customRoman: "Imaj7", customScale: "C Jónica" },
      { customRoman: "Imaj7", customScale: "C Jónica" },
      { customRoman: "bVImaj7", customScale: "Ab Lidia" },
      { customRoman: "bVII7", customScale: "Bb Lidia b7" },
      { customRoman: "Imaj7", customScale: "C Jónica" },
    ],
  },
  capitulo_14: {
    title: "Cap. 14: Escala Menor Melódica y Dominante Alterado",
    key: "C",
    isMinor: true,
    style: "Jazz Swing",
    tempo: 104,
    chords: ["Dm7b5", "G7b13", "Cm(maj7)", "Cm6", "Dm7b5", "G7b13", "Cm(maj7)", "F7#11"],
    measureOverrides: [
      { customRoman: "ii°", customScale: "D Locria ♮2" },
      { customRoman: "V7alt", customScale: "G Superlocria (Alterada)" },
      { customRoman: "i(maj7)", customScale: "C Menor Melódica" },
      { customRoman: "i6", customScale: "C Menor Melódica" },
      { customRoman: "ii°", customScale: "D Locria ♮2" },
      { customRoman: "V7alt", customScale: "G Superlocria (Alterada)" },
      { customRoman: "i(maj7)", customScale: "C Menor Melódica" },
      { customRoman: "IV7(#11)", customScale: "F Lidia b7" },
    ],
  },
};

function resolveChapterChordOverrideByToken(
  chapterId: string,
  chordToken: string
): ChapterMeasureOverride | undefined {
  const clean = chordToken.trim();
  if (chapterId === "capitulo_8" || chapterId === "capitulo_9") {
    const map89: Record<string, ChapterMeasureOverride> = {
      "Am(maj7)": { customRoman: "i(maj7)", customScale: "A Menor Armónica" },
      "Am6": { customRoman: "i6", customScale: "A Menor Armónica" },
      "Am7": { customRoman: "i7", customScale: "A Menor Armónica" },
      "Bm7b5": { customRoman: "ii°", customScale: "B Locria 6 (♮6)" },
      "Cmaj7(#5)": { customRoman: "bIII+", customScale: "C Jónica #5 (Aumentada)" },
      "Cmaj7": { customRoman: "bIII+", customScale: "C Jónica #5 (Aumentada)" },
      "Dm7": { customRoman: "iv", customScale: "D Dórica #4" },
      "Dm6": { customRoman: "iv6", customScale: "D Dórica #4" },
      "E7b9": { customRoman: "V7", customScale: "E Frigia Dominante" },
      "E7": { customRoman: "V7", customScale: "E Frigia Dominante" },
      "Fmaj7": { customRoman: "bVImaj7", customScale: "F Lidia #2" },
      "G#dim7": { customRoman: "vii°7", customScale: "G# Disminuida (Ultralocria bb7)" },
    };
    return map89[clean];
  }
  if (chapterId === "capitulo_14") {
    const map14: Record<string, ChapterMeasureOverride> = {
      "Dm7b5": { customRoman: "ii°", customScale: "D Locria ♮2" },
      "G7b13": { customRoman: "V7alt", customScale: "G Superlocria (Alterada)" },
      "G7alt": { customRoman: "V7alt", customScale: "G Superlocria (Alterada)" },
      "G7(#9)": { customRoman: "V7alt", customScale: "G Superlocria (Alterada)" },
      "G7#9": { customRoman: "V7alt", customScale: "G Superlocria (Alterada)" },
      "G7": { customRoman: "V7alt", customScale: "G Superlocria (Alterada)" },
      "Cm(maj7)": { customRoman: "i(maj7)", customScale: "C Menor Melódica" },
      "Cm6": { customRoman: "i6", customScale: "C Menor Melódica" },
      "Fm7": { customRoman: "iv7", customScale: "F Dórica" },
      "F7#11": { customRoman: "IV7(#11)", customScale: "F Lidia b7" },
      "F7(#11)": { customRoman: "IV7(#11)", customScale: "F Lidia b7" },
      "Db7#11": { customRoman: "subV7", customScale: "Db Lidia b7" },
      "Db7(#11)": { customRoman: "subV7", customScale: "Db Lidia b7" },
      "D7(#11)": { customRoman: "II7(#11)", customScale: "D Lidia b7" },
      "D7#11": { customRoman: "II7(#11)", customScale: "D Lidia b7" },
      "Am7b5": { customRoman: "ii°", customScale: "A Locria ♮2" },
      "D7(#9)": { customRoman: "V7alt", customScale: "D Superlocria (Alterada)" },
      "D7#9": { customRoman: "V7alt", customScale: "D Superlocria (Alterada)" },
      "B7(#9)": { customRoman: "V7alt", customScale: "B Superlocria (Alterada)" },
      "B7#9": { customRoman: "V7alt", customScale: "B Superlocria (Alterada)" },
    };
    return map14[clean];
  }
  if (chapterId === "capitulo_13") {
    const map13: Record<string, ChapterMeasureOverride> = {
      "Cmaj7": { customRoman: "Imaj7", customScale: "C Jónica" },
      "C": { customRoman: "I", customScale: "C Jónica" },
      "Fmaj7": { customRoman: "IVmaj7", customScale: "F Lidia" },
      "F": { customRoman: "IV", customScale: "F Lidia" },
      "Fm7": { customRoman: "iv7", customScale: "F Dórica" },
      "Fm": { customRoman: "iv", customScale: "F Dórica" },
      "E": { customRoman: "V/vi", customScale: "E Frigia Dominante" },
      "E7": { customRoman: "V7/vi", customScale: "E Frigia Dominante" },
      "Abmaj7": { customRoman: "bVImaj7", customScale: "Ab Lidia" },
      "Ab": { customRoman: "bVI", customScale: "Ab Lidia" },
      "Bbmaj7": { customRoman: "bVIImaj7", customScale: "Bb Mixolidia" },
      "Bb7": { customRoman: "bVII7", customScale: "Bb Lidia b7" },
      "Bb": { customRoman: "bVII", customScale: "Bb Mixolidia" },
      "Ebmaj7": { customRoman: "bIIImaj7", customScale: "Eb Lidia" },
      "Eb": { customRoman: "bIII", customScale: "Eb Lidia" },
      "Dbmaj7": { customRoman: "bIImaj7", customScale: "Db Lidia" },
      "D7": { customRoman: "II7", customScale: "D Lidia b7" },
      "A7": { customRoman: "V7/II", customScale: "A Mixolidia" },
      "Dmaj7": { customRoman: "Imaj7 (en D)", customScale: "D Jónica" },
      "G": { customRoman: "I (en G)", customScale: "G Jónica" },
      "G7": { customRoman: "V7", customScale: "G Mixolidia" },
    };
    return map13[clean];
  }
  return undefined;
}

function normalizeAcademyChordToken(token: string): string {
  const trimmed = token.trim();
  const m = trimmed.match(
    /^([A-G][b#]?)-(Mayor|Menor|maj7\(#5\)|maj7#5|maj7|m7|7|m7b5|m7\(b5\)|dim7|aug|m6|6|9|13|alt|m\(maj7\))$/
  );
  if (m) {
    const [, root, qual] = m;
    if (qual === "Mayor") return root;
    if (qual === "Menor") return `${root}m`;
    if (qual === "m7(b5)") return `${root}m7b5`;
    if (qual === "maj7#5") return `${root}maj7(#5)`;
    return `${root}${qual}`;
  }
  return trimmed.replace(/m7\(b5\)/g, "m7b5");
}

function getDefaultVisualizerForChapter(chapterId: string): VisualizerData {
  switch (chapterId) {
    case "capitulo_1":
      return { type: "interval", root: "C", note: "E" };
    case "capitulo_2":
      return {
        type: "chord",
        root: "C",
        chordType: "Mayor",
        triadShape: [
          { string: 3, fret: 5, label: "1" },
          { string: 2, fret: 5, label: "3" },
          { string: 1, fret: 3, label: "5" },
        ],
        fingersOverride: [null, null, null, 2, 3, 1],
        isArpeggio: false,
      };
    case "capitulo_3":
      return {
        type: "scale",
        root: "C",
        scaleName: "Mayor",
        notes: ["C", "D", "E", "F", "G", "A", "B"],
        intervals: [0, 2, 4, 5, 7, 9, 11],
      };
    case "capitulo_4":
      return { type: "chord", root: "C", chordType: "maj7", isArpeggio: false };
    case "capitulo_5":
      return { type: "chord", root: "G", chordType: "7", isArpeggio: false };
    case "capitulo_6":
      return {
        type: "scale",
        root: "D",
        scaleName: "Dórica",
        notes: ["D", "E", "F", "G", "A", "B", "C"],
        intervals: [0, 2, 3, 5, 7, 9, 10],
      };
    case "capitulo_7":
      return {
        type: "scale",
        root: "A",
        scaleName: "Menor",
        notes: ["A", "B", "C", "D", "E", "F", "G"],
        intervals: [0, 2, 3, 5, 7, 8, 10],
      };
    case "capitulo_8":
      return {
        type: "scale",
        root: "A",
        scaleName: "Menor Armónica",
        notes: ["A", "B", "C", "D", "E", "F", "G#"],
        intervals: [0, 2, 3, 5, 7, 8, 11],
      };
    case "capitulo_9":
      return {
        type: "scale",
        root: "E",
        scaleName: "Mixolidio b9 b13",
        notes: ["E", "F", "G#", "A", "B", "C", "D"],
        intervals: [0, 1, 4, 5, 7, 8, 10],
      };
    case "capitulo_10":
      return { type: "chord", root: "E", chordType: "7", isArpeggio: false };
    case "capitulo_11":
      return { type: "chord", root: "A", chordType: "7", isArpeggio: false };
    case "capitulo_12":
      return { type: "chord", root: "C", chordType: "maj7", isArpeggio: false };
    case "capitulo_13":
      return { type: "chord", root: "F", chordType: "m7", isArpeggio: false };
    case "capitulo_14":
      return {
        type: "scale",
        root: "C",
        scaleName: "Menor Melódica",
        notes: ["C", "D", "Eb", "F", "G", "A", "B"],
        intervals: [0, 2, 3, 5, 7, 9, 11],
      };
    default:
      return {
        type: "scale",
        root: "C",
        scaleName: "Mayor",
        notes: ["C", "D", "E", "F", "G", "A", "B"],
        intervals: [0, 2, 4, 5, 7, 9, 11],
      };
  }
}

export default function HarmonyTheory({
  isVisible = true,
  onOpenInLab,
}: {
  isVisible?: boolean;
  onOpenInLab?: (payload: ChapterLabProgressionPayload) => void;
} = {}) {
  const { t, language } = useLanguage();
  const { instrument, setInstrument } = useInstrument();
  const curriculum = (language === 'en' && englishData.length > 0) ? englishData : harmonyCurriculumPart1;
  const [activeChapterId, setActiveChapterId] = useState<string>(
    curriculum[0].id,
  );
  const activeChapter =
    curriculum.find((c) => c.id === activeChapterId) ||
    curriculum[0];

  const [activeTab, setActiveTab] = useState<"theory" | "quiz">("theory");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const [visualizerData, setVisualizerData] = useState<VisualizerData>(() =>
    getDefaultVisualizerForChapter(curriculum[0].id)
  );
  const prevInstrumentRef = useRef<"piano" | "guitar">(instrument);
  const [showGlobalMap, setShowGlobalMap] = useState<boolean>(false);
  const [activeSequenceIndex, setActiveSequenceIndex] = useState<number | null>(null);
  const [customChapterChords, setCustomChapterChords] = useState<Record<string, string[]>>({});
  const playbackRef = useRef<number | null>(null);
  const progressionRef = useRef<number | null>(null);
  const melodyRef = useRef<number | null>(null);
  const [academyKeyboardMode, setAcademyKeyboardMode] = useState<KeyboardVoicingMode>('fundamental');
  const [isSensoryModalOpen, setIsSensoryModalOpen] = useState<boolean>(false);
  const readingContainerRef = useRef<HTMLDivElement | null>(null);
  const prevChapterIdRef = useRef<string>(activeChapterId);

  // Asegurar que el scroll al tope superior ocurra ÚNICAMENTE cuando cambia el ID del capítulo seleccionado
  useEffect(() => {
    if (prevChapterIdRef.current !== activeChapterId) {
      prevChapterIdRef.current = activeChapterId;
      if (readingContainerRef.current) {
        readingContainerRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeChapterId]);

  const stopAllAcademyPlayback = () => {
    if (progressionRef.current) {
      clearTimeout(progressionRef.current);
      progressionRef.current = null;
    }
    if (playbackRef.current) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }
    if (melodyRef.current) {
      clearTimeout(melodyRef.current);
      melodyRef.current = null;
    }
    academiaAudio.stopAll();
    setActiveSequenceIndex(null);
  };

  const handleTryConceptInLab = (overrideChords?: string[]) => {
    stopAllAcademyPlayback();
    const basePreset = CHAPTER_LAB_PROGRESSIONS[activeChapterId] || CHAPTER_LAB_PROGRESSIONS.capitulo_1;
    const isUsingPresetChords =
      (!overrideChords || overrideChords.length === 0) &&
      (!customChapterChords[activeChapterId] || customChapterChords[activeChapterId].length === 0);

    const chordsToLoad =
      overrideChords && overrideChords.length > 0
        ? overrideChords
        : customChapterChords[activeChapterId] && customChapterChords[activeChapterId].length > 0
        ? customChapterChords[activeChapterId]
        : basePreset.chords;

    const resolvedOverrides: ChapterMeasureOverride[] | undefined = isUsingPresetChords
      ? basePreset.measureOverrides
      : chordsToLoad.map((token, idx) => {
          const byToken = resolveChapterChordOverrideByToken(activeChapterId, token);
          if (byToken) return byToken;
          const presetMatchIdx = basePreset.chords.findIndex(
            (c) => c.trim().toLowerCase() === token.trim().toLowerCase()
          );
          if (presetMatchIdx !== -1 && basePreset.measureOverrides?.[presetMatchIdx]) {
            return basePreset.measureOverrides[presetMatchIdx];
          }
          return basePreset.measureOverrides?.[idx] &&
            basePreset.chords[idx]?.trim().toLowerCase() === token.trim().toLowerCase()
            ? basePreset.measureOverrides[idx]
            : {};
        });

    const payload: ChapterLabProgressionPayload = {
      chapterId: activeChapterId,
      title: basePreset.title || activeChapter.title,
      key: basePreset.key,
      isMinor: basePreset.isMinor,
      style: basePreset.style,
      tempo: basePreset.tempo,
      chords: chordsToLoad,
      measureOverrides: resolvedOverrides,
    };

    window.dispatchEvent(new CustomEvent("loadLabProgression", { detail: payload }));
    window.dispatchEvent(new CustomEvent("navigateTab", { detail: "lab" }));
    if (onOpenInLab) {
      onOpenInLab(payload);
    }
  };

  useEffect(() => {
    setActiveSequenceIndex(null);
    if (playbackRef.current !== null) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }
  }, [visualizerData]);

  // Sincronización de Instrumento Global (Piano vs Guitarra) y Motor de Audio en Academia
  useEffect(() => {
    const targetInst = instrument === "piano" ? "piano" : "guitar";
    academiaAudio.setInstrument(targetInst);
    dictionaryAudio.setInstrument(targetInst);

    if (prevInstrumentRef.current !== instrument) {
      prevInstrumentRef.current = instrument;
      if (!isVisible) return;

      const activeVis =
        visualizerData.type === "empty"
          ? getDefaultVisualizerForChapter(activeChapterId)
          : visualizerData;

      if (activeVis.type === "scale" && activeVis.root) {
        setVisualizerData({
          ...activeVis,
          autoPlayTrigger: Date.now(),
        });
      } else if (activeVis.type === "interval" && activeVis.root && activeVis.note) {
        const shapeNotes = getIsolatedIntervalShapeData(activeVis.root, activeVis.note);
        if (shapeNotes && shapeNotes.length > 0) {
          const tuningNotes = [40, 45, 50, 55, 59, 64];
          const freqs = shapeNotes.map(
            (n) => 440 * Math.pow(2, (tuningNotes[n.stringIdx] + n.fret - 69) / 12)
          );
          academiaAudio.playChord(freqs, targetInst, { strumDelay: 0.35 });
        }
      } else if (activeVis.type === "chord" && activeVis.root && activeVis.chordType) {
        let freqs: number[] = [];
        if (activeVis.triadShape) {
          const tuningNotes = [40, 45, 50, 55, 59, 64];
          freqs = [...activeVis.triadShape]
            .sort((a, b) => (6 - a.string) - (6 - b.string))
            .map((n) => 440 * Math.pow(2, (tuningNotes[6 - n.string] + n.fret - 69) / 12));
        } else if (activeVis.positions) {
          freqs = getGuitarChordFrequencies(activeVis.positions);
        } else {
          const voicings = getGuitarChordVoicings(
            activeVis.root as any,
            activeVis.chordType as any
          );
          if (voicings && voicings.length > 0) {
            freqs = getGuitarChordFrequencies(voicings[0].frets);
          }
        }
        if (freqs.length > 0) {
          academiaAudio.playChord(freqs, targetInst, {
            strumDelay: targetInst === "piano" ? 0.016 : 0.045,
          });
        }
      }
    }
  }, [instrument, isVisible, activeChapterId, visualizerData]);

  const checkQuizAnswer = (index: number) => {
    if (quizFeedback) return;
    setSelectedAnswer(index);
    if (index === activeChapter.quiz[quizIndex].correctAnswerIndex) {
      setQuizFeedback("correct");
      setTimeout(() => {
        if (quizIndex < activeChapter.quiz.length - 1) {
          setQuizIndex(quizIndex + 1);
        }
        setQuizFeedback(null);
        setSelectedAnswer(null);
      }, 1500);
    } else {
      setQuizFeedback("incorrect");
      setTimeout(() => {
        setQuizFeedback(null);
        setSelectedAnswer(null);
      }, 1200);
    }
  };

  const getIsolatedIntervalShapeData = (root: string, note: string) => {
    const cRoot = { stringIdx: 1, fret: 3, label: "C" };
    if (root !== "C") return [cRoot];

    switch (note) {
      case "C":
        return [cRoot, { stringIdx: 3, fret: 5, label: "C" }]; // Octava
      case "C#":
        return [cRoot, { stringIdx: 1, fret: 4, label: "C#" }];
      case "D":
        return [cRoot, { stringIdx: 1, fret: 5, label: "D" }];
      case "D#":
        return [cRoot, { stringIdx: 2, fret: 1, label: "D#" }];
      case "E":
        return [cRoot, { stringIdx: 2, fret: 2, label: "E" }];
      case "F":
        return [cRoot, { stringIdx: 2, fret: 3, label: "F" }];
      case "F#":
        return [cRoot, { stringIdx: 2, fret: 4, label: "F#" }];
      case "G":
        return [cRoot, { stringIdx: 2, fret: 5, label: "G" }];
      case "G#":
        return [cRoot, { stringIdx: 3, fret: 1, label: "G#" }];
      case "A":
        return [cRoot, { stringIdx: 3, fret: 2, label: "A" }];
      case "A#":
        return [cRoot, { stringIdx: 3, fret: 3, label: "A#" }];
      case "B":
        return [cRoot, { stringIdx: 3, fret: 4, label: "B" }];
      default:
        return [cRoot];
    }
  };

  const handleActionLink = (href: string) => {
    if (progressionRef.current) {
        clearTimeout(progressionRef.current);
        progressionRef.current = null;
    }
    let cleanHref = href.replace("#action:", "");
    try {
      cleanHref = decodeURIComponent(cleanHref);
    } catch(e) {}
    
    const parts = cleanHref.split(":");
    let type = parts[0] as "chord" | "interval" | "scale" | "arpeggio" | "note" | "standard" | "progression" | "stop" | "melody" | "combined";
    let root = parts[1];
    if (root === "E#") root = "F";
    else if (root === "Cb") root = "B";

    if (type === "stop") {
      stopAllAcademyPlayback();
      return;
    }

    if (type === "progression" || type === "melody" || type === "combined") {
      stopAllAcademyPlayback();
      let chordsStr = "";
      let melodyStr = "";
      let instType = "sine";
      
      if (type === "progression") {
          chordsStr = parts[1];
      } else if (type === "melody") {
          const params = cleanHref.replace("melody:", "").split(";");
          melodyStr = params[0];
          for (const p of params) {
              if (p.startsWith("inst=")) {
                  const inst = p.replace("inst=", "");
                  if (inst === "sax" || inst === "lead") instType = "triangle";
              }
          }
      } else if (type === "combined") {
          const combinedParts = cleanHref.replace("combined:", "").split(";");
          for (const p of combinedParts) {
              if (p.startsWith("progression=")) chordsStr = p.replace("progression=", "");
              if (p.startsWith("melody=")) melodyStr = p.replace("melody=", "");
              if (p.startsWith("inst=")) {
                  const inst = p.replace("inst=", "");
                  if (inst === "sax" || inst === "lead") instType = "triangle";
              }
          }
      }

      const measureMs = 1350; // ~1.35s por acorde para progresiones fluidas y claras
      const halfMeasureMs = measureMs / 2;

      if (chordsStr) {
          const chordList = chordsStr.split(",");
          const normalizedForLab = chordList.map((c) =>
            c.includes("_")
              ? c.split("_").map(normalizeAcademyChordToken).join("_")
              : normalizeAcademyChordToken(c)
          );
          setCustomChapterChords((prev) => ({
            ...prev,
            [activeChapterId]: normalizedForLab,
          }));

          const schedule: { raw: string; r: string; cType: string; durationMs: number }[] = [];
          chordList.forEach(chord => {
            if (chord.includes("_")) {
               const [raw1, raw2] = chord.split("_");
               const chord1 = normalizeAcademyChordToken(raw1);
               const chord2 = normalizeAcademyChordToken(raw2);
               const parsed1 = parseChord(chord1);
               const parsed2 = parseChord(chord2);
               schedule.push({ raw: chord1, r: parsed1.root, cType: parsed1.type, durationMs: halfMeasureMs });
               schedule.push({ raw: chord2, r: parsed2.root, cType: parsed2.type, durationMs: halfMeasureMs });
            } else {
               const cleanChord = normalizeAcademyChordToken(chord);
               const parsed = parseChord(cleanChord);
               schedule.push({ raw: cleanChord, r: parsed.root, cType: parsed.type, durationMs: measureMs });
            }
          });
          
          let index = 0;
          const playNextChord = () => {
             if (index >= schedule.length) {
                if (progressionRef.current) clearTimeout(progressionRef.current);
                progressionRef.current = null;
                return;
             }
             
             const chord = schedule[index];
             setVisualizerData({ type: "chord", root: chord.r, chordType: chord.cType, isArpeggio: false });
             
             const currentInst = prevInstrumentRef.current === "piano" ? "piano" : "guitar";
             // Obtener arreglo completo de notas y frecuencias desde el Diccionario Maestro
             let freqs: number[] = [];
             if (currentInst === "guitar") {
                 const voicings = getGuitarChordVoicings(chord.r as any, chord.cType as any);
                 if (voicings && voicings.length > 0) {
                     freqs = getGuitarChordFrequencies(voicings[0].frets);
                 }
             }
             if (!freqs || freqs.length === 0) {
                 const midiNotes = getChordNotes(chord.raw || `${chord.r}${chord.cType}`, 48);
                 freqs = midiNotes.map(m => 440 * Math.pow(2, (m - 69) / 12));
             }

             academiaAudio.stopAll();

             if (freqs.length > 0) {
                 // Reproducción limpia a través del filtro pasa-altos @ 180Hz y transpuesta a registro medio
                 academiaAudio.playChord(freqs, currentInst, { strumDelay: currentInst === "piano" ? 0.016 : 0.045 });
             }

             // Acompañar con fundamental limpia en registro medio (octava 3), filtrada por High-Pass 180Hz
             if (chord.r) {
                 const rootOffset = (ROOT_MIDI_OFFSET_MAP as any)[chord.r] ?? 0;
                 const bassMidi = 48 + rootOffset; // Octava 3 (registro medio) en lugar de octava 2 (36)
                 academiaAudio.playBassNote(bassMidi, chord.durationMs / 1000, 0.45);
             }

             progressionRef.current = setTimeout(playNextChord, chord.durationMs) as any;
             index++;
          };
          
          playNextChord();
      }

      if (melodyStr) {
          const notes = melodyStr.split(",");
          let melodyIndex = 0;

          const playNextNote = () => {
              if (melodyIndex >= notes.length) {
                  if (melodyRef.current) clearTimeout(melodyRef.current);
                  melodyRef.current = null;
                  return;
              }
              const noteStr = notes[melodyIndex];
              const match = noteStr.match(/^([A-G][b#]?)([0-9])(?::([0-9.]+))?$/);
              let currentNoteDuration = measureMs / 4; // Default to 1 beat (quarter note)
              
              if (match) {
                  const n = match[1];
                  const oct = parseInt(match[2], 10);
                  if (match[3]) {
                      currentNoteDuration = parseFloat(match[3]) * (measureMs / 4);
                  }
                  const map: Record<string, number> = {
                      C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11
                  };
                  const midi = map[n] + (oct + 1) * 12;
                  const freq = 440 * Math.pow(2, (midi - 69) / 12);
                  const targetInst = instrument === "piano" ? "piano" : "guitar";
                  academiaAudio.playSingleNote(freq, targetInst);
              }
              melodyRef.current = setTimeout(playNextNote, currentNoteDuration) as any;
              melodyIndex++;
          };
          playNextNote();
      }

      return;
    }

    if (type === "standard") {
      stopAllAcademyPlayback();
      sessionStorage.setItem("initialStandard", root);
      window.dispatchEvent(new CustomEvent("selectStandard", { detail: root }));
      window.dispatchEvent(new CustomEvent("navigateTab", { detail: "lab" }));
      return;
    }

    if (type === "arpeggio") {
      const rootNote = root as RootNote;
      const cType = parts[2];
      
      let intervals = [0, 4, 7];
      if (cType === "Mayor" || cType === "maj") intervals = [0, 4, 7];
      else if (cType === "Menor" || cType === "m") intervals = [0, 3, 7];
      else if (cType === "maj7") intervals = [0, 4, 7, 11];
      else if (cType === "maj7(#5)" || cType === "maj7#5") intervals = [0, 4, 8, 11];
      else if (cType === "m7") intervals = [0, 3, 7, 10];
      else if (cType === "m(maj7)" || cType === "mmaj7") intervals = [0, 3, 7, 11];
      else if (cType === "7") intervals = [0, 4, 7, 10];
      else if (cType === "m7b5" || cType === "m7(b5)") intervals = [0, 3, 6, 10];
      else if (cType === "dim7") intervals = [0, 3, 6, 9];
      else if (cType === "aug") intervals = [0, 4, 8];

      const scaleName = `Arpegio ${rootNote} ${cType}`;
      const notes = intervals.map((interval) =>
        spellNoteFromDegree(rootNote, interval, undefined, cType),
      );

      setVisualizerData({
        type: "scale",
        root: rootNote,
        scaleName,
        isArpeggio: true,
        intervals,
        notes,
        autoPlayTrigger: Date.now(),
      });
      return;
    }

    if (type === "interval") {
      const targetNote = parts[2];
      setVisualizerData({ type, root, note: targetNote });
      const shapeNotes = getIsolatedIntervalShapeData(root, targetNote);
      if (shapeNotes && shapeNotes.length > 0) {
        const tuningNotes = [40, 45, 50, 55, 59, 64];
        const freqs = shapeNotes.map((n) => 440 * Math.pow(2, (tuningNotes[n.stringIdx] + n.fret - 69) / 12));
        const targetInst = instrument === "piano" ? "piano" : "guitar";
        academiaAudio.playChord(freqs, targetInst, { strumDelay: 0.35 });
      }
    } else if (type === "chord") {
      if (INVERSION_SHAPES[root]) {
        const chordData = INVERSION_SHAPES[root];
        setVisualizerData({
          type: "chord",
          root: chordData.rootNote,
          chordType: chordData.chordType,
          title: chordData.title,
          positions: chordData.positions,
          fingersOverride: chordData.fingersOverride,
          isArpeggio: false,
          forceBaseFret: chordData.forceBaseFret,
          triadShape: chordData.triadShape,
          barres: chordData.barres
        });
        const invFreqs = getGuitarChordFrequencies(chordData.positions);
        if (invFreqs.length > 0) {
          const targetInst = instrument === "piano" ? "piano" : "guitar";
          academiaAudio.playChord(invFreqs, targetInst, { strumDelay: targetInst === "piano" ? 0.016 : 0.045 });
        }
        return;
      }

      let triadShape = undefined;
      let fingersOverride = undefined;
      
      if (activeChapterId === "capitulo_2" && parts.length >= 3) {
        const rootNote = parts[1];
        const cType = parts[2] as "Mayor" | "Menor" | "dim7" | "aug";
        
        const rootFretMap: Record<string, number> = { 
          "G": 12, "G#": 13, "Ab": 13, "A": 14, "A#": 15, "Bb": 15, 
          "B": 4, "C": 5, "C#": 6, "Db": 6, "D": 7, "D#": 8, "Eb": 8, 
          "E": 9, "E#": 10, "F": 10, "F#": 11, "Gb": 11 
        };
        const rootFret = rootFretMap[rootNote] !== undefined ? rootFretMap[rootNote] : 5;
        
        const dynamicTriadShapes: Record<string, {string: number, fret: number, label: string}[]> = {
          "Mayor": [{ string: 3, fret: rootFret, label: '1' }, { string: 2, fret: rootFret, label: '3' }, { string: 1, fret: rootFret - 2, label: '5' }],
          "Menor": [{ string: 3, fret: rootFret, label: '1' }, { string: 2, fret: rootFret - 1, label: 'b3' }, { string: 1, fret: rootFret - 2, label: '5' }],
          "dim7": [{ string: 3, fret: rootFret, label: '1' }, { string: 2, fret: rootFret - 1, label: 'b3' }, { string: 1, fret: rootFret - 3, label: 'b5' }],
          "aug": [{ string: 3, fret: rootFret, label: '1' }, { string: 2, fret: rootFret, label: '3' }, { string: 1, fret: rootFret - 1, label: '#5' }]
        };
        
        const chapter2Fingers: Record<string, (number | null)[]> = {
          "Mayor": [null, null, null, 2, 3, 1],
          "Menor": [null, null, null, 3, 2, 1],
          "dim7": [null, null, null, 3, 2, 1],
          "aug": [null, null, null, 2, 3, 1]
        };
        
        if (dynamicTriadShapes[cType]) {
           triadShape = dynamicTriadShapes[cType];
           fingersOverride = chapter2Fingers[cType];
        }
      }
      let cType = parts[2];
      let r = root;
      if (!cType) {
         const parsed = parseChord(r);
         r = parsed.root;
         cType = parsed.type;
      } else if (!(cType in CHORD_DEFINITIONS)) {
         const parsed = parseChord(`${r}${cType === "Mayor" ? "" : cType === "Menor" ? "m" : cType}`);
         r = parsed.root;
         cType = parsed.type;
      }
      setVisualizerData({ type: "chord", root: r, chordType: cType, triadShape, fingersOverride, isArpeggio: false });

      // Reproducir sonido del acorde al hacer clic en el ejemplo del curso
      let freqs: number[] = [];
      if (triadShape) {
        const tuningNotes = [40, 45, 50, 55, 59, 64];
        freqs = [...triadShape]
          .sort((a, b) => (6 - a.string) - (6 - b.string))
          .map(n => 440 * Math.pow(2, (tuningNotes[6 - n.string] + n.fret - 69) / 12));
      } else {
        const voicings = getGuitarChordVoicings(r as any, cType as any);
        if (voicings && voicings.length > 0) {
          freqs = getGuitarChordFrequencies(voicings[0].frets);
        }
      }
      if (!freqs || freqs.length === 0) {
        const midiNotes = getChordNotes(`${r}${cType === "Mayor" ? "" : cType === "Menor" ? "m" : cType}`, 48);
        freqs = midiNotes.map(m => 440 * Math.pow(2, (m - 69) / 12));
      }
      if (freqs.length > 0) {
        const targetInst = instrument === "piano" ? "piano" : "guitar";
        academiaAudio.playChord(freqs, targetInst, { strumDelay: targetInst === "piano" ? 0.016 : 0.045 });
      }
    } else if (type === "scale") {
      let intervals = [0, 2, 4, 5, 7, 9, 11]; // Jónica default
      const sName = parts[2] || "Mayor";
      
      if (sName === "Dórica" || sName === "Dórico") intervals = [0, 2, 3, 5, 7, 9, 10];
      else if (sName === "Frigia" || sName === "Frigio") intervals = [0, 1, 3, 5, 7, 8, 10];
      else if (sName === "Lidia" || sName === "Lidio") intervals = [0, 2, 4, 6, 7, 9, 11];
      else if (sName === "Mixolidia" || sName === "Mixolidio") intervals = [0, 2, 4, 5, 7, 9, 10];
      else if (sName === "Eólica" || sName === "Eólico" || sName === "Menor") intervals = [0, 2, 3, 5, 7, 8, 10];
      else if (sName === "Menor Armónica" || sName === "Armónica") intervals = [0, 2, 3, 5, 7, 8, 11];
      else if (sName === "Menor Melódica" || sName === "Melódica") intervals = [0, 2, 3, 5, 7, 9, 11];
      else if (sName === "Locria" || sName === "Lócrio") intervals = [0, 1, 3, 5, 6, 8, 10];
      else if (sName === "Locrio 6") intervals = [0, 1, 3, 5, 6, 9, 10];
      else if (sName === "Jónico Aumentado") intervals = [0, 2, 4, 5, 8, 9, 11];
      else if (sName === "Dórico #4") intervals = [0, 2, 3, 6, 7, 9, 10];
      else if (sName === "Mixolidio b9 b13") intervals = [0, 1, 4, 5, 7, 8, 10];
      else if (sName === "Lidio #2") intervals = [0, 3, 4, 6, 7, 9, 10];
      else if (sName === "Superlocrio") intervals = [0, 1, 3, 4, 6, 8, 9];
      else if (sName === "Dórico b2") intervals = [0, 1, 3, 5, 7, 9, 10];
      else if (sName === "Lidio Aumentado") intervals = [0, 2, 4, 6, 8, 9, 11];
      else if (sName === "Lidio b7") intervals = [0, 2, 4, 6, 7, 9, 10];
      else if (sName === "Mixolidio b13") intervals = [0, 2, 4, 5, 7, 8, 10];
      else if (sName === "Locrio natural 2") intervals = [0, 2, 3, 5, 6, 8, 10];
      else if (sName === "Alterado") intervals = [0, 1, 3, 4, 6, 8, 10];

      const notes = spellScaleNotes(root as RootNote, intervals, sName);

      setVisualizerData({ type: "scale", root, scaleName: sName, notes, intervals, autoPlayTrigger: Date.now() });
    } else if (type === "note") {
      setVisualizerData({ type: "scale", root, scaleName: root, notes: [root], intervals: [0], autoPlayTrigger: Date.now() });
    }
  };

  const handlePlaySound = () => {
    if (
      visualizerData.type === "chord" &&
      visualizerData.root &&
      visualizerData.chordType
    ) {
      // Clear any pending playback
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
        playbackRef.current = null;
      }
      setActiveSequenceIndex(null);

      let freqs: number[] = [];
      if (visualizerData.triadShape) {
        const tuningNotes = [40, 45, 50, 55, 59, 64];
        freqs = visualizerData.triadShape
          .sort((a, b) => (6 - a.string) - (6 - b.string))
          .map(n => 440 * Math.pow(2, (tuningNotes[6 - n.string] + n.fret - 69) / 12));
      } else if (visualizerData.positions) {
        freqs = getGuitarChordFrequencies(visualizerData.positions);
      } else {
        const voicings = getGuitarChordVoicings(
          visualizerData.root as any,
          visualizerData.chordType as any,
        );
        if (voicings && voicings.length > 0) {
          freqs = getGuitarChordFrequencies(voicings[0].frets);
        }
      }

      if (freqs.length > 0) {
        const targetInst = instrument === "piano" ? "piano" : "guitar";
        if (visualizerData.isArpeggio) {
          academiaAudio.playChord(freqs, targetInst, { strumDelay: 0.5 });
          
          let count = 0;
          const seqLength = freqs.length;
          
          // First note starts immediately
          setActiveSequenceIndex(1);
          count++;
          
          playbackRef.current = setInterval(() => {
            if (count < seqLength) {
              setActiveSequenceIndex(count + 1);
              count++;
            } else {
              setActiveSequenceIndex(null);
              if (playbackRef.current) clearInterval(playbackRef.current);
            }
          }, 500) as any;
        } else {
          academiaAudio.playChord(freqs, targetInst, { strumDelay: targetInst === "piano" ? 0.016 : 0.045 });
        }
      }
    }
    // For intervals and scales, ideally we'd play individual notes, but passing for now for simplicity
  };

  const currentQuiz = activeChapter.quiz[quizIndex];

  const renderSensoryVisualizer = (isExpandedView: boolean) => {
    const activeVis =
      visualizerData.type === "empty"
        ? getDefaultVisualizerForChapter(activeChapterId)
        : visualizerData;

    if (
      activeVis.type === "chord" &&
      activeVis.root &&
      activeVis.chordType
    ) {
      const cDef =
        CHORD_DEFINITIONS[activeVis.chordType as keyof typeof CHORD_DEFINITIONS] ||
        CHORD_DEFINITIONS["Mayor"];
      const isExplicitInvTitle = Boolean(
        activeVis.title &&
          (activeVis.title.includes("1ª Inversión") ||
            activeVis.title.includes("2ª Inversión") ||
            activeVis.title.includes("3ª Inversión"))
      );
      const resolvedKb = resolveKeyboardVoicingData(
        activeVis.root as RootNote,
        activeVis.chordType,
        isExplicitInvTitle
          ? activeVis.title?.includes("1ª Inversión")
            ? "inv1"
            : activeVis.title?.includes("2ª Inversión")
              ? "inv2"
              : "inv3"
          : academyKeyboardMode
      );

      return (
        <div className="w-full transform transition-all animate-in fade-in zoom-in-95 duration-300 flex flex-col">
          {activeVis.triadShape || activeVis.positions || activeVis.isArpeggio ? (
            <div className="w-full flex flex-col">
              {instrument === "piano" ? (
                <ChordPianoKeyboard
                  root={activeVis.root as any}
                  type={activeVis.chordType as any}
                  title={
                    activeVis.title ||
                    (activeVis.isArpeggio
                      ? `Arpegio ${activeVis.root} ${activeVis.chordType}`
                      : `${activeVis.root} ${activeVis.chordType}`)
                  }
                  subtitle={resolvedKb.subtitle}
                  positions={activeVis.positions}
                  activeSequenceIndex={activeSequenceIndex}
                  onPlay={activeVis.isArpeggio ? handlePlaySound : undefined}
                  playLabel={
                    activeVis.isArpeggio ? t("academy.playArpeggio") : t("academy.playChord")
                  }
                  voicingMode={academyKeyboardMode}
                  onVoicingModeChange={setAcademyKeyboardMode}
                  showVoicingSelector={!activeVis.isArpeggio && !isExplicitInvTitle}
                  isExpanded={isExpandedView}
                />
              ) : (
                <ChordFretboard
                  root={activeVis.root as any}
                  type={activeVis.chordType as any}
                  title={
                    activeVis.title ||
                    (activeVis.isArpeggio
                      ? `Arpegio ${activeVis.root} ${activeVis.chordType}`
                      : `${activeVis.root} ${activeVis.chordType}`)
                  }
                  triadShape={activeVis.triadShape}
                  fingersOverride={activeVis.fingersOverride}
                  positions={activeVis.positions}
                  showFretNumbers={
                    !activeVis.triadShape ||
                    activeChapterId === "capitulo_2" ||
                    activeChapterId === "capitulo_3" ||
                    activeChapterId === "capitulo_6" ||
                    !!activeVis.positions
                  }
                  showIntervalLabels={false}
                  showFingerings={!!activeVis.positions}
                  isArpeggio={activeVis.isArpeggio}
                  activeSequenceIndex={activeSequenceIndex}
                  forceBaseFret={activeVis.forceBaseFret}
                  barres={activeVis.barres}
                  onPlay={handlePlaySound}
                  playLabel={
                    activeVis.isArpeggio ? t("academy.playArpeggio") : t("academy.playChord")
                  }
                  isExpanded={isExpandedView}
                />
              )}

              {/* Tarjetas de Metadatos: CLASIFICACIÓN y GRADOS */}
              <div className="w-full mt-2.5 grid grid-cols-2 gap-2">
                <div className="bg-neutral-900 border border-neutral-800 py-2 px-3 rounded-lg flex flex-col gap-0.5 min-w-0">
                  <span className="text-neutral-400 text-[10px] uppercase tracking-wider font-mono leading-tight">
                    {t("chords.classification")}
                  </span>
                  <span className="text-neutral-200 font-sans text-xs sm:text-sm font-semibold leading-snug break-words">
                    {cDef.suffix}
                  </span>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 py-2 px-3 rounded-lg flex flex-col gap-0.5 min-w-0">
                  <span className="text-neutral-400 text-[10px] uppercase tracking-wider font-mono leading-tight">
                    {t("chords.degrees")}
                  </span>
                  <span className="text-neutral-200 font-sans text-xs sm:text-sm font-semibold leading-snug break-words">
                    {instrument === "piano"
                      ? resolvedKb.degreesDisplay
                      : cDef.chordFormula.split("-").join(" - ")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <ChordDictionary
              defaultRoot={activeVis.root as RootNote}
              defaultType={activeVis.chordType as any}
              hideControls={true}
              hideTitle={activeVis.title ? true : false}
              forceBaseFret={activeVis.forceBaseFret}
              onPlay={handlePlaySound}
              playLabel={
                activeVis.isArpeggio ? t("academy.playArpeggio") : t("academy.playChord")
              }
              voicingMode={academyKeyboardMode}
              onVoicingModeChange={setAcademyKeyboardMode}
              isExpanded={isExpandedView}
            />
          )}
        </div>
      );
    }

    if (
      activeVis.type === "interval" &&
      activeVis.root &&
      activeVis.note
    ) {
      const intervalNotes = getIsolatedIntervalShapeData(
        activeVis.root,
        activeVis.note
      );
      return (
        <div className="w-full transform transition-all animate-in fade-in zoom-in-95 duration-300 flex flex-col">
          {instrument === "piano" ? (
            <IntervalPianoKeyboard
              intervalName={activeVis.note}
              notes={intervalNotes}
              isExpanded={isExpandedView}
            />
          ) : (
            <IntervalFretboard
              intervalName={activeVis.note}
              notes={intervalNotes}
              isExpanded={isExpandedView}
            />
          )}
        </div>
      );
    }

    if (activeVis.type === "scale" && activeVis.root) {
      return (
        <div className="w-full transform transition-all animate-in fade-in zoom-in-95 duration-300">
          {instrument === "piano" ? (
            <ScalePianoKeyboard
              scaleName={activeVis.scaleName || activeVis.root}
              root={activeVis.root as any}
              notes={buildOneOctaveScale(
                activeVis.notes || ["C", "D", "E", "F", "G", "A", "B"]
              )}
              isArpeggio={activeVis.isArpeggio}
              autoPlayTrigger={activeVis.autoPlayTrigger}
              isExpanded={isExpandedView}
            />
          ) : (
            <ScaleFretboard
              scaleName={activeVis.scaleName || activeVis.root}
              root={activeVis.root as any}
              notes={activeVis.notes || ["C", "D", "E", "F", "G", "A", "B"]}
              isArpeggio={activeVis.isArpeggio}
              intervals={activeVis.intervals}
              autoPlayTrigger={activeVis.autoPlayTrigger}
              isExpanded={isExpandedView}
            />
          )}
        </div>
      );
    }

    return null;
  };

  const handleActionLinkRef = useRef(handleActionLink);
  handleActionLinkRef.current = handleActionLink;

  const stableOnAction = useCallback((href: string) => {
    handleActionLinkRef.current(href);
  }, []);

  const markdownComponents = useMemo(
    () =>
      ({
        h1: ({ node, ...props }: any) => (
          <h1
            className="text-2xl sm:text-3xl font-display font-bold text-neutral-100 mb-6"
            {...props}
          />
        ),
        h2: ({ node, ...props }: any) => (
          <h2
            className="text-xl sm:text-2xl font-display font-bold text-neutral-100 mt-8 mb-4 border-b border-neutral-800 pb-2"
            {...props}
          />
        ),
        h3: ({ node, ...props }: any) => (
          <h3
            className="text-lg font-display font-semibold text-orange-500 mt-6 mb-3"
            {...props}
          />
        ),
        p: ({ node, ...props }: any) => (
          <p
            className="text-base text-neutral-200 mb-4 leading-relaxed font-sans"
            {...props}
          />
        ),
        ul: ({ node, ...props }: any) => <ul className="space-y-3 mb-6" {...props} />,
        li: ({ node, ...props }: any) => (
          <li
            className="flex items-start text-base text-neutral-200 font-sans"
            {...props}
          >
            <span className="text-orange-500 mr-2 mt-1.5 text-xs">●</span>
            <span>{props.children}</span>
          </li>
        ),
        blockquote: ({ node, ...props }: any) => (
          <blockquote
            className="border-l-4 border-orange-500 bg-orange-500/10 p-4 rounded-r-lg my-6 text-orange-200 font-medium text-base"
            {...props}
          />
        ),
        table: ({ node, ...props }: any) => (
          <div className="my-6 border border-neutral-800 bg-neutral-950 rounded-lg w-full overflow-hidden shadow-none">
            <table
              className="w-full table-fixed text-xs sm:text-sm text-neutral-200"
              {...props}
            />
          </div>
        ),
        thead: ({ node, ...props }: any) => (
          <thead
            className="bg-neutral-900 text-neutral-300 font-semibold text-xs sm:text-sm border-b border-neutral-800"
            {...props}
          />
        ),
        th: ({ node, ...props }: any) => {
          const isCap1 = activeChapterId === "capitulo_1";
          const isCap4 = activeChapterId === "capitulo_4";
          return (
            <th
              className={`
                font-semibold border-b border-neutral-800 text-center py-2.5
                px-0 sm:px-1 first:text-left first:px-2 sm:first:px-4
                ${
                  isCap1
                    ? "first:w-2/5 w-1/5 whitespace-nowrap first:whitespace-normal"
                    : isCap4
                    ? "first:w-[10%] w-[12%] last:w-[18%] whitespace-nowrap text-xs tracking-tighter"
                    : "first:w-1/5 w-[11.4%] whitespace-nowrap"
                }
              `}
              {...props}
            />
          );
        },
        tbody: ({ node, ...props }: any) => (
          <tbody className="divide-y divide-neutral-800" {...props} />
        ),
        tr: ({ node, ...props }: any) => (
          <tr className="hover:bg-neutral-800/50 transition-colors" {...props} />
        ),
        td: ({ node, ...props }: any) => {
          const isCap1 = activeChapterId === "capitulo_1";
          const isCap4 = activeChapterId === "capitulo_4";
          return (
            <td
              className={`
                px-0 py-2.5 text-center align-middle
                first:font-semibold first:text-left first:px-2 sm:first:px-4 text-xs sm:text-sm text-neutral-200
                ${
                  isCap1
                    ? "whitespace-nowrap first:whitespace-normal break-words"
                    : isCap4
                    ? "whitespace-nowrap px-0 sm:px-1 text-xs tracking-tighter"
                    : "whitespace-nowrap"
                }
              `}
              {...props}
            />
          );
        },
        a: ({ node, href, children, ...props }: any) => {
          if (href?.startsWith("#action:")) {
            const rawClass =
              props.className ||
              "inline-flex items-center justify-center text-orange-400 font-bold hover:text-orange-300 transition-colors rounded px-1 py-0.5 cursor-pointer text-base";
            const isNoUnderline = rawClass.includes("!no-underline");
            const finalClass = isNoUnderline
              ? rawClass
              : `${rawClass} underline decoration-current/70 underline-offset-4 cursor-pointer`;
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  stableOnAction(href);
                }}
                className={finalClass}
              >
                {children}
              </button>
            );
          }
          return (
            <a
              href={href}
              className={
                props.className ||
                "text-orange-400 underline hover:text-orange-300 text-base font-semibold cursor-pointer"
              }
              {...props}
            >
              {children}
            </a>
          );
        },
        "capitulo3-tablas": ((props: any) => (
          <Capitulo3Tablas onAction={stableOnAction} language={language} {...props} />
        )) as any,
        "capitulo4-tablas": ((props: any) => (
          <Capitulo4Tablas onAction={stableOnAction} language={language} {...props} />
        )) as any,
        "capitulo7-tablas": ((props: any) => (
          <Capitulo7Tablas onAction={stableOnAction} language={language} {...props} />
        )) as any,
        "capitulo9-contenido": ((props: any) =>
          language === "en" ? (
            <Capitulo9En onAction={stableOnAction} {...props} />
          ) : (
            <Capitulo9 onAction={stableOnAction} {...props} />
          )) as any,
        "capitulo10-contenido": ((props: any) =>
          language === "en" ? (
            <Capitulo10En onAction={stableOnAction} {...props} />
          ) : (
            <Capitulo10 onAction={stableOnAction} {...props} />
          )) as any,
        "capitulo11-contenido": ((props: any) =>
          language === "en" ? (
            <Capitulo11En onAction={stableOnAction} {...props} />
          ) : (
            <Capitulo11 onAction={stableOnAction} {...props} />
          )) as any,
        "capitulo12-contenido": ((props: any) =>
          language === "en" ? (
            <Capitulo12En onAction={stableOnAction} {...props} />
          ) : (
            <Capitulo12 onAction={stableOnAction} {...props} />
          )) as any,
        "capitulo13-contenido": ((props: any) =>
          language === "en" ? (
            <Capitulo13En onAction={stableOnAction} {...props} />
          ) : (
            <Capitulo13 onAction={stableOnAction} {...props} />
          )) as any,
        "capitulo14-contenido": ((props: any) =>
          language === "en" ? (
            <Capitulo14En onAction={stableOnAction} {...props} />
          ) : (
            <Capitulo14 onAction={stableOnAction} {...props} />
          )) as any,
      }) as any,
    [activeChapterId, language, stableOnAction]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1400px] mx-auto items-start relative">
      {/* Columna 1 (Izquierda): Navegación de los 14 Capítulos (Sticky con el scroll de la página) */}
      <div className="w-full lg:w-1/4 shrink-0 sticky top-6 self-start h-auto">
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-3.5 h-auto shadow-none">
          <h2 className="text-sm font-sans font-bold text-neutral-200 uppercase tracking-wider mb-3 border-b border-neutral-800 pb-2 flex items-center gap-2">
            <BookOpen size={16} className="text-orange-400" />
            {t('academy.linusAcademy')}
          </h2>
          <div className="flex flex-col gap-1">
            {curriculum.map((chap) => (
              <button
                key={chap.id}
                onClick={() => {
                  if (progressionRef.current) {
                     clearTimeout(progressionRef.current);
                     progressionRef.current = null;
                  }
                  setActiveChapterId(chap.id);
                  setActiveTab("theory");
                  setQuizIndex(0);
                  setQuizFeedback(null);
                  setSelectedAnswer(null);
                  setVisualizerData(getDefaultVisualizerForChapter(chap.id));
                  setShowGlobalMap(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors flex flex-col gap-0.5 border cursor-pointer shadow-none ${
                  activeChapterId === chap.id
                    ? "bg-orange-500 text-white font-semibold border-orange-500"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white border-transparent"
                }`}
              >
                <span className={`font-semibold text-xs sm:text-sm leading-snug ${activeChapterId === chap.id ? "text-white" : "text-neutral-200"}`}>{chap.title}</span>
                <span className={`text-[10px] uppercase tracking-wider ${activeChapterId === chap.id ? "text-orange-100" : "text-neutral-500"}`}>
                  {chap.level === "Básico" ? t('academy.basicLevel') : chap.level === "Intermedio" ? t('academy.intermediateLevel') : chap.level === "Avanzado" ? t('academy.advancedLevel') : chap.level}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300">
            <p className="mb-1">
              <strong className="text-white">El Arte de la Armonía</strong>
            </p>
            <p>
              {t('academy.syncInstructionMobile')}
            </p>
          </div>
        </div>
      </div>

      {/* Columna 2 (Central): Lección de Teoría & Quiz (Flujo completo con el scroll de la página) */}
      <div
        ref={readingContainerRef}
        className="w-full lg:w-2/4 bg-neutral-900 rounded-xl border border-neutral-800 min-h-[600px] h-auto flex flex-col shadow-none"
      >
        <div className="flex items-center border-b border-neutral-800 p-3.5 gap-2 bg-neutral-950/60 rounded-t-xl relative z-10">
            <button
              type="button"
              onClick={() => setActiveTab("theory")}
              className={`px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors cursor-pointer shadow-none ${
                activeTab === "theory"
                  ? "bg-orange-500 text-white"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800 border-transparent"
              }`}
            >
              {t('academy.theoryLesson')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("quiz")}
              className={`px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-none ${
                activeTab === "quiz"
                  ? "bg-orange-500 text-white"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800 border-transparent"
              }`}
            >
              <BookCheck size={16} />
              {t('academy.quiz')}
            </button>
          </div>

          <div className="p-6 md:p-8 flex-1">
            {activeTab === "theory" && (
              <div className="flex flex-col gap-6">
                <div className="markdown-body">
                  {activeChapterId === "capitulo_9" ? (
                    language === "en" ? (
                      <Capitulo9En onAction={stableOnAction} />
                    ) : (
                      <Capitulo9 onAction={stableOnAction} />
                    )
                  ) : activeChapterId === "capitulo_10" ? (
                    language === "en" ? (
                      <Capitulo10En onAction={stableOnAction} />
                    ) : (
                      <Capitulo10 onAction={stableOnAction} />
                    )
                  ) : activeChapterId === "capitulo_11" ? (
                    language === "en" ? (
                      <Capitulo11En onAction={stableOnAction} />
                    ) : (
                      <Capitulo11 onAction={stableOnAction} />
                    )
                  ) : activeChapterId === "capitulo_12" ? (
                    language === "en" ? (
                      <Capitulo12En onAction={stableOnAction} />
                    ) : (
                      <Capitulo12 onAction={stableOnAction} />
                    )
                  ) : activeChapterId === "capitulo_13" ? (
                    language === "en" ? (
                      <Capitulo13En onAction={stableOnAction} />
                    ) : (
                      <Capitulo13 onAction={stableOnAction} />
                    )
                  ) : activeChapterId === "capitulo_14" ? (
                    language === "en" ? (
                      <Capitulo14En onAction={stableOnAction} />
                    ) : (
                      <Capitulo14 onAction={stableOnAction} />
                    )
                  ) : (
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={markdownComponents}
                    >
                      {activeChapter.theoryMarkdown}
                    </Markdown>
                  )}
                </div>
                {showGlobalMap && activeChapterId === "capitulo_1" && instrument !== 'piano' ? (
                  <div className="mt-8 border-t border-neutral-800 pt-8 animate-in fade-in zoom-in-95 duration-500 w-full">
                    <GlobalIntervalMap />
                  </div>
                ) : (
                  activeChapterId === "capitulo_1" && instrument !== 'piano' && (
                    <div className="mt-8 flex justify-center border-t border-neutral-800 pt-8">
                      <button 
                        onClick={() => setShowGlobalMap(true)}
                        className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-orange-400 font-bold tracking-wider uppercase text-sm rounded-lg border border-neutral-700 transition-colors shadow-none cursor-pointer"
                      >
                        {language === 'en' ? 'View Full Map on Fretboard' : 'Ver Mapa Completo en el Mástil'}
                      </button>
                    </div>
                  )
                )}

                {/* Sección Inferior de Ejemplos Prácticos y Repertorio de Estudio */}
                {(() => {
                  const preset = CHAPTER_LAB_PROGRESSIONS[activeChapterId] || CHAPTER_LAB_PROGRESSIONS.capitulo_1;
                  const clickedChords = customChapterChords[activeChapterId];
                  const activeChords =
                    clickedChords && clickedChords.length > 0
                      ? clickedChords
                      : preset.chords;

                  const repertoireStandardMap: Record<string, { id: string; name: string }> = {
                    capitulo_4: { id: "mack-the-knife", name: "Mack the Knife" },
                    capitulo_8: { id: "minor-swing", name: "Minor Swing" },
                    capitulo_10: { id: "mack-the-knife", name: "Mack the Knife" },
                    capitulo_11: { id: "all-of-me", name: "All of Me" },
                    capitulo_12: { id: "autumn-leaves", name: "Autumn Leaves" },
                    capitulo_13: { id: "all-of-me", name: "All of Me" },
                    capitulo_14: { id: "blue-bossa", name: "Blue Bossa" },
                  };
                  const linkedStandard = repertoireStandardMap[activeChapterId];

                  return (
                    <div className="mt-8 p-6 rounded-xl bg-neutral-950 border border-orange-500/40 flex flex-col gap-4 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400 block mb-1">
                            {language === "en" ? "PRACTICAL EXAMPLE & STUDY REPERTOIRE" : "EJEMPLO PRÁCTICO Y REPERTORIO DE ESTUDIO"}
                          </span>
                          <h4 className="text-base sm:text-lg font-bold text-white">
                            {preset.title}
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md self-start sm:self-center">
                          {preset.style} • {preset.tempo} BPM
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {activeChords.map((ch, idx) => (
                          <span
                            key={`${ch}-${idx}`}
                            className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-700 text-orange-300 font-mono text-xs sm:text-sm font-bold"
                          >
                            {ch.replace(/_/g, " · ")}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => handleTryConceptInLab()}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f25100] to-amber-600 hover:from-[#ff6214] hover:to-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(242,81,0,0.35)] transition-all cursor-pointer"
                        >
                          <PlayCircle size={16} className="shrink-0" />
                          <span>
                            {language === "en"
                              ? "Listen in Harmonic Pro"
                              : "Escuchar en Harmonic Pro"}
                          </span>
                        </button>

                        {linkedStandard && (
                          <button
                            type="button"
                            onClick={() => handleActionLink(`#action:standard:${linkedStandard.id}`)}
                            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-orange-500/40 text-orange-300 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <PlayCircle size={16} className="text-orange-400 shrink-0" />
                            <span>
                              {language === "en"
                                ? `Open Standard "${linkedStandard.name}" in Harmonic Pro`
                                : `Abrir Estándar "${linkedStandard.name}" en Harmonic Pro`}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Crédito de Autoría al Final del Último Capítulo (Capítulo 14) */}
                {activeChapterId === "capitulo_14" && (
                  <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-[#0e0c0a] via-[#17120e] to-[#0e0c0a] border border-amber-500/40 shadow-[0_0_24px_rgba(245,158,11,0.12)] text-center">
                    <p className="text-sm sm:text-base font-semibold text-amber-100/95 tracking-wide leading-relaxed">
                      Curso interactivo desarrollado por Francisco Rumie — Músico y Director del Instituto de las Artes de Chile.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "quiz" && (
              <>
                {activeChapterId === "capitulo_14" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo14En /> : <QuizCapitulo14 />}
                  </div>
                ) : activeChapterId === "capitulo_13" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo13En /> : <QuizCapitulo13 />}
                  </div>
                ) : activeChapterId === "capitulo_12" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo12En /> : <QuizCapitulo12 />}
                  </div>
                ) : activeChapterId === "capitulo_11" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo11En /> : <QuizCapitulo11 />}
                  </div>
                ) : activeChapterId === "capitulo_10" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo10En /> : <QuizCapitulo10 />}
                  </div>
                ) : activeChapterId === "capitulo_9" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo9En /> : <QuizCapitulo9 />}
                  </div>
                ) : activeChapterId === "capitulo_8" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo8En /> : <QuizCapitulo8 />}
                  </div>
                ) : activeChapterId === "capitulo_7" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo7En /> : <QuizCapitulo7 />}
                  </div>
                ) : activeChapterId === "capitulo_6" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo6En /> : <QuizCapitulo6 />}
                  </div>
                ) : activeChapterId === "capitulo_5" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo5En /> : <QuizCapitulo5 />}
                  </div>
                ) : activeChapterId === "capitulo_4" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo4En /> : <QuizCapitulo4 />}
                  </div>
                ) : activeChapterId === "capitulo_3" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo3En /> : <QuizCapitulo3 />}
                  </div>
                ) : activeChapterId === "capitulo_2" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo2En /> : <QuizCapitulo2 />}
                  </div>
                ) : activeChapterId === "capitulo_1" ? (
                  <div className="pt-8">
                    {language === 'en' ? <QuizCapitulo1En /> : <QuizCapitulo1 />}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto pt-8">
                    <div className="text-center mb-10 w-full flex justify-between items-center">
                      <h2 className="text-2xl font-display font-bold text-neutral-100">
                        {language === 'en' ? 'Test your knowledge' : 'Prueba tus conocimientos'}
                      </h2>
                      <span className="text-xs font-mono text-neutral-400 border border-neutral-800 px-3 py-1.5 rounded-lg bg-neutral-950 shadow-none">
                        {language === 'en' ? `Question ${quizIndex + 1} of ${activeChapter.quiz.length}` : `Pregunta ${quizIndex + 1} de ${activeChapter.quiz.length}`}
                      </span>
                    </div>

                    {currentQuiz ? (
                      <>
                        <div className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-8 mb-8 text-center text-lg text-neutral-100 font-medium leading-relaxed shadow-none">
                          {currentQuiz.question}
                        </div>

                        <div className="flex flex-col gap-3 w-full">
                          {currentQuiz.options.map((option: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => checkQuizAnswer(idx)}
                              className={`py-4 px-6 rounded-lg border text-left transition-colors focus:outline-none flex justify-between items-center text-sm sm:text-base font-medium shadow-none cursor-pointer ${
                                quizFeedback && idx === currentQuiz.correctAnswerIndex
                                  ? "bg-emerald-600 text-white border-emerald-500 font-semibold"
                                  : quizFeedback && idx === selectedAnswer
                                    ? "bg-red-600 text-white border-red-500 font-semibold"
                                    : "bg-neutral-950 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white hover:border-neutral-700"
                              }`}
                            >
                              <span className="text-sm sm:text-base font-medium">{option}</span>
                              {quizFeedback && idx === currentQuiz.correctAnswerIndex && (
                                <Check size={18} className="text-white" />
                              )}
                              {quizFeedback === "incorrect" && idx === selectedAnswer && (
                                <X size={18} className="text-white" />
                              )}
                            </button>
                          ))}
                        </div>

                        {quizFeedback && (
                          <div
                            className={`w-full mt-6 p-4 rounded-lg text-sm font-medium ${
                              quizFeedback === "correct" ? "bg-emerald-950/60 border border-emerald-800 text-emerald-200" : "bg-red-950/60 border border-red-800 text-red-200"
                            }`}
                          >
                            <strong>
                              {quizFeedback === "correct" ? language === "en" ? "Correct!" : "¡Correcto!" : language === "en" ? "Incorrect." : "Incorrecto."}
                            </strong>{" "}
                            {currentQuiz.explanation}
                          </div>
                        )}

                        {quizIndex === activeChapter.quiz.length - 1 && quizFeedback === "correct" && (
                          <div className="mt-10 p-6 bg-neutral-950 border border-neutral-800 rounded-xl text-center w-full shadow-none">
                            <h3 className="text-xl font-bold text-orange-400 mb-2">
                              {language === "en" ? "Chapter Completed!" : "¡Capítulo Completado!"}
                            </h3>
                            <p className="text-neutral-300 text-sm">
                              {language === "en" ? "You have successfully completed this chapter's quiz." : "Has finalizado el quiz de este capítulo exitosamente."}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-8 mb-8 text-center text-lg text-neutral-200 font-medium leading-relaxed shadow-none">
                        {language === "en" ? "This chapter does not have a quiz yet." : "Este capítulo aún no tiene quiz."}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      {/* Columna 3 (Derecha): MÁSTIL SENSORIAL / PIANO SENSORIAL (Sticky top-6 self-start y 100% completo h-auto sin recortes) */}
      <div className="w-full lg:w-1/4 shrink-0 sticky top-6 self-start h-auto">
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-3.5 flex flex-col items-center justify-start h-auto shadow-none">
          {/* Encabezado de la Tarjeta Sensorial con Botón Ampliar */}
          <div className="w-full flex items-center justify-between gap-2 border-b border-neutral-800 pb-2.5 mb-2.5">
            <h3 className="text-xs uppercase tracking-wider text-neutral-200 font-bold flex items-center gap-1.5 min-w-0">
              <PlayCircle size={16} className="text-orange-400 shrink-0" />
              <span className="whitespace-normal break-words">
                {instrument === 'piano' ? t('academy.sensoryPiano') : t('academy.sensoryFretboard')}
              </span>
            </h3>

            <button
              type="button"
              onClick={() => setIsSensoryModalOpen(true)}
              title={language === 'en' ? 'Expand Full Instrument' : 'Vista Ampliada / Instrumento Completo'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-orange-400 hover:text-orange-300 border border-neutral-800 hover:border-orange-500/50 text-xs font-semibold tracking-wide transition-colors shrink-0 cursor-pointer"
            >
              <Maximize2 size={13} className="shrink-0" />
              <span>{language === 'en' ? 'Expand' : 'Ampliar'}</span>
            </button>
          </div>

          <div className="w-full h-auto flex flex-col items-center justify-start">
            {renderSensoryVisualizer(false)}
          </div>
        </div>
      </div>

      {/* Modal Pop-up de "Vista Ampliada / Instrumento Completo" (Ventana flotante mediana y compacta) */}
      {isSensoryModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsSensoryModalOpen(false)}
        >
          <div
            className={`bg-neutral-900 border border-neutral-800 rounded-2xl w-full ${
              visualizerData.type === 'scale' ? 'max-w-2xl' : 'max-w-xl'
            } p-5 shadow-2xl relative h-auto max-h-[82vh] overflow-y-auto custom-scrollbar`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal Ampliado */}
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-neutral-800 pb-3 mb-3.5">
              <div className="flex items-center gap-2">
                <PlayCircle size={18} className="text-orange-400 shrink-0" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-neutral-100 uppercase tracking-wider">
                    {instrument === 'piano' ? t('academy.sensoryPiano') : t('academy.sensoryFretboard')}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {/* Selector rápido Guitarra / Teclado sincronizado globalmente */}
                <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setInstrument('guitar')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      instrument === 'guitar'
                        ? 'bg-orange-500 text-white'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {language === 'en' ? 'GUITAR' : 'GUITARRA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstrument('piano')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      instrument === 'piano'
                        ? 'bg-orange-500 text-white'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {language === 'en' ? 'KEYBOARD' : 'TECLADO'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSensoryModalOpen(false)}
                  aria-label="Cerrar vista ampliada"
                  className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contenido del Instrumento */}
            <div className="w-full h-auto">
              {renderSensoryVisualizer(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
