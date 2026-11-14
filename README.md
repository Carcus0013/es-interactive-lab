# Embedded Systems: The Interactive Lab

A local-first study platform for **23CSE304 Embedded Systems** (Amrita School of Computing), built from the course's own lectures, lab programs and question papers. It teaches every syllabus topic, simulates the STM32F401CCU6 peripherals used in the lab, walks through each experiment line by line, and solves every previous-year question.

Everything runs in the browser. There is no server and no account, and your progress stays on your machine.

**Live site:** https://carcus0013.github.io/es-interactive-lab/

Every push to `main` runs the tests, builds the site and republishes it through GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

## What is inside

| Area | What you get |
|---|---|
| **Syllabus** | 40 topic pages across the 3 units. Each has five tabs: *Learn* (what, why, the problem it solves, how it works, where it is used), *In depth*, *Visualise*, *Exam prep* (definitions, formulas, frequently tested points, common mistakes, worked numericals, PYQ links) and *Revise & quiz* (notes, takeaways, 5+ MCQs, short and long questions). |
| **Practical lab** | 18 experiments: 14 lab programs kept verbatim, with a corrected version beside any that has a bug, plus written solutions for both Lab Evaluation 1 sets and both mid-term Part-B designs. Each page has the circuit, the code, a line-by-line explanation, an animated flowchart, a simulation, viva/register/debug questions and memorisation aids. |
| **Simulations** | 26 interactive models: a Thumb-2 register machine, pipeline, memory map, bit-banding, GPIO board, pull-ups, debouncing, seven-segment, LCD, ADC/SAR/flash ADC, DAC, PWM, RTC, SysTick, timers, NVIC, EXTI, UART, I²C, SPI and more. Every page states what its model simplifies. |
| **PYQ archive** | All 6 supplied papers (4 mid-terms, 2 lab evaluations), 28 questions, copied as printed and fully solved. Includes hide/show answers, self-marking and a timed exam mode. |
| **Question bank** | 500+ generated practice questions in 10 formats (MCQ, true/false, fill-in, short, long, numerical, programming, debugging, register-based, circuit-based), filterable by unit, topic, type and difficulty. Objective answers are graded automatically. |
| **Mock exams** | Configurable papers with a timer, results, weak-topic analysis and recommendations. |
| **Quick revision** | Formula book, register reference (addresses checked against RM0368), key diagrams, essential programs, last-minute notes and important questions. |
| **Progress** | Topic status, practical completion, PYQ self-marks, bookmarks, recent pages and mock history. Export, import or reset it from the Progress page. |

### How content is labelled

- **Course material**: taught in the supplied lectures or labs.
- **Prescribed textbook**: in the syllabus, taught from Valvano because no slides were supplied.
- **ADDITIONAL SYLLABUS COVERAGE**: in the syllabus text but with no supplied lecture (buzzer, seven-segment, DAC, PWM, RTC, timers, SPI).
- **GENERATED PRACTICE QUESTION**: every question-bank and mock item. Only the PYQ archive holds real exam questions, each with its paper and question number.
- Problems found in the supplied code or papers (for example, a register address printed with the wrong name) are kept as printed and flagged in a note.

See [CONTENT_COVERAGE.md](CONTENT_COVERAGE.md) for the topic-by-topic source map, and [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) for the full analysis of the supplied materials.

## Running it

You need Node.js 18 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-check and build one self-contained `dist/index.html` (code, styles and fonts inlined). Double-click it to open the lab, no server needed |
| `npm run build:web` | Multi-file build in `dist-web/` with lazy-loaded chunks, for hosting on a web server |
| `npm run preview` | Serve the `dist/` build locally |
| `npm test` | Run the test suite (CPU interpreter, number helpers, and validation of every content cross-reference) |
| `npm run typecheck` | TypeScript check only |
| `npm run coverage:doc` | Regenerate `CONTENT_COVERAGE.md` from the content |

### Opening it without a terminal

After `npm run build`, open **`dist/index.html`** (double-click it). You can copy that one file anywhere, even to a phone.

Do not open the `index.html` in the project folder itself, or a `dist-web/` page, straight from disk. Their code lives in separate module files, and browsers refuse to load those from `file://`. The page will tell you so instead of starting. `dist-web/` works when served over HTTP, from any folder or static host.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl K` or `/` | Search topics, formulas, practicals, simulations, diagrams, registers and PYQs |
| `t` | Toggle dark / light theme |
| `b` | Bookmark the current page |
| `?` | Show the shortcut help |
| `[` and `]` | Previous / next topic (on a topic page) |
| `1` to `5` | Switch topic tabs |
| `Esc` | Close dialogs and the mobile menu |

## Where your data lives

Progress is stored in the browser's `localStorage` under `esl-state-v1`, and the theme under `esl-theme`. Clearing site data erases it, so use **Progress → Export** to keep a backup file. Nothing is ever sent anywhere.

## Project layout

```
src/
  content/
    topics/unit1..3/   one file per syllabus topic (default-exports a Topic)
    practicals/        p01..p18 experiment files (default-export a Practical)
    pyq/               paper-*.ts question papers + shared.ts reusable answers
    bank/              extra generated questions (objective.ts, written.ts)
    registers.ts       register reference data
    md.ts              the md`` authoring helper
  simulations/         one component per simulation + registry.ts
  animations/          SVG primitives and the diagram registry
  pages/               route pages (Dashboard, TopicPage, PracticalPage, …)
  components/          Markdown renderer, code blocks, flowcharts, circuit diagrams, …
  quizzes/             MCQ, self-check, numerical and question-bank widgets
  data/                syllabus, search index, question-bank aggregation
  utils/               hash router, progress store, theme, grading helpers
scripts/
  coverage-report.ts   generates CONTENT_COVERAGE.md
```

Files are collected with `import.meta.glob`, so adding a topic, practical, paper or question file needs no registration step.

### Writing content

Content uses a small Markdown dialect, written with the `md` tag (`String.raw`, so C escapes stay literal):

- Code fences use `~~~c`, `~~~asm` or `~~~text`, because backticks would end the template string. Inline code is `«code»` or backticks.
- Callouts: `> [!note]`, `[!tip]`, `[!analogy]`, `[!exam]`, `[!warning]`, `[!source]`, `[!additional]`, `[!external]`, `[!math]`, each followed by an optional title.
- A formula block goes between `$$` lines.
- Embeds: `::diagram{id}` and `::sim{id preset=name}`.
- Internal links: `[text](/topic/gpio-registers)`, `[text](/lab/p17-smart-lighting)`.
- Escape a literal pipe inside a table cell as `\|`.

Practical explanations reference 1-based line ranges of the code. `npm test` fails if any range runs past the end of the code or starts on a blank line. It also fails if any diagram, simulation, topic, practical or PYQ reference does not exist.

## Tech

React 18, TypeScript (strict), Vite 5, Tailwind CSS 3, Vitest. Fonts are Archivo and JetBrains Mono, bundled locally through Fontsource. There is no router library: a small hash router keeps the build working from `file://`.
