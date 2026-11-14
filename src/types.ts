// Core content model. Educational content lives in src/data and src/content;
// UI components only consume these types.

export type UnitId = 1 | 2 | 3;

/** course = faculty lecture/lab material, textbook = prescribed text only, additional = ADDITIONAL SYLLABUS COVERAGE */
export type SourceStatus = 'course' | 'textbook' | 'additional';

export interface SourceRef {
  file: string;
  detail?: string;
}

export interface MCQ {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

/** Question with model answer. `a` is markdown. */
export interface QA {
  q: string;
  a: string;
  marks?: number;
}

export interface Numerical {
  q: string;
  given: string[];
  find: string;
  formula: string;
  steps: string[];
  answer: string;
  /** numeric answer for auto-grading (optional) */
  value?: number;
  tolerance?: number;
  unit?: string;
  concept?: string;
}

export interface Formula {
  name: string;
  expr: string;
  vars?: string;
  example?: string;
  topic?: string;
}

export interface Fundamentals {
  what: string;
  why: string;
  problem: string;
  how: string;
  where: string;
}

export interface Topic {
  id: string;
  unit: UnitId;
  order: number;
  title: string;
  short: string;
  status: SourceStatus;
  sources: SourceRef[];
  /** extra note shown when content goes beyond the course material */
  externalNote?: string;
  keywords: string[];
  /** 3 = appears in PYQs repeatedly, 2 = PYQ once or heavy lecture emphasis, 1 = covered */
  importance: 1 | 2 | 3;
  pyq?: string[];
  practicals?: string[];
  sims?: string[];
  related?: string[];
  fundamentals: Fundamentals;
  detailed: string;
  visual: string;
  exam: {
    definitions: { term: string; def: string }[];
    formulas?: Formula[];
    frequent: string[];
    mistakes: string[];
    diagrams: string[];
    shortQs: QA[];
    longQs: QA[];
    numericals?: Numerical[];
  };
  revision: {
    notes: string[];
    takeaways: string[];
    mcqs: MCQ[];
  };
}

export interface Unit {
  id: UnitId;
  title: string;
  syllabus: string;
  blurb: string;
}

/* ---------------- practicals ---------------- */

export interface CodeExplain {
  /** 1-based inclusive line range inside the program */
  lines: [number, number];
  what: string;
  why: string;
  register?: string;
  internal?: string;
  ifRemoved?: string;
}

export interface Program {
  id: string;
  title: string;
  file: string;
  /** verbatim code from the supplied materials (or authored solution when `authored` is true) */
  code: string;
  authored?: boolean;
  corrected?: { code: string; changes: string[] };
  explain: CodeExplain[];
}

export interface CircuitSpec {
  leds?: { pin: string; label: string; activeLow?: boolean }[];
  switches?: { pin: string; label: string; pull?: 'up' | 'down' }[];
  analog?: { pin: string; label: string; kind: 'pot' | 'ldr' }[];
  uart?: { tx: string; rx?: string; label: string };
  i2c?: { scl: string; sda: string; label: string };
}

export interface Practical {
  id: string;
  order: number;
  title: string;
  unit: UnitId;
  objective: string;
  components: string[];
  connections: { pin: string; to: string; mode: string }[];
  expected: string;
  sources: SourceRef[];
  circuit: CircuitSpec;
  programs: Program[];
  flow: { label: string; detail: string; kind?: 'start' | 'init' | 'loop' | 'decision' | 'isr' | 'io' | 'end' }[];
  sim?: { id: string; preset?: string };
  exam: {
    viva: QA[];
    registerQs: QA[];
    pinQs: QA[];
    outputQs: QA[];
    debugQs: QA[];
    errors: string[];
    modifications: string[];
    explainToExaminer: string;
  };
  memorise: {
    essentials: string[];
    patterns: { name: string; code: string }[];
    skeleton: string;
  };
  topics: string[];
}

/* ---------------- PYQs ---------------- */

export type QKind = 'theory' | 'numerical' | 'program' | 'mixed';

export interface PyqQuestion {
  id: string;          // e.g. MT25A-5a
  number: string;      // as printed: "5(a)"
  text: string;        // verbatim question text (markdown)
  marks: number;
  co?: string;
  btl?: string;
  unit: UnitId;
  topics: string[];
  kind: QKind;
  solution: string;    // markdown
  sourceNote?: string; // e.g. issue in the printed question
}

export interface PyqPaper {
  id: string;
  title: string;
  exam: string;        // Mid-Term / Lab Evaluation-1
  year: number;
  month: string;
  set: string;
  file: string;
  duration?: string;
  maxMarks: number;
  notes?: string;
  questions: PyqQuestion[];
}

/* ---------------- question bank ---------------- */

export type BankType = 'mcq' | 'tf' | 'fill' | 'short' | 'long' | 'numerical' | 'program' | 'debug' | 'register' | 'circuit';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface BankItem {
  id: string;
  type: BankType;
  unit: UnitId;
  topic: string;
  difficulty: Difficulty;
  marks: number;
  q: string;
  options?: string[];
  answer: string | number | boolean;
  /** for numerical auto-grading */
  tolerance?: number;
  /** accepted alternative strings for fill-in-the-blank */
  accept?: string[];
  explain: string;
  /** true for every item: generated practice question, not a PYQ */
  generated: true;
}

export interface RegisterInfo {
  name: string;
  periph: string;
  address: string;
  purpose: string;
  bits: { bits: string; name: string; meaning: string }[];
  config: string;
  code: string;
  topics: string[];
  source: string;
}
