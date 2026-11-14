import { useMemo, useState, type ReactNode } from 'react';

// Small, dependency-free C / ARM-assembly highlighter.
const C_KEYWORDS = new Set(
  'int char void unsigned signed long short float double const volatile static extern return if else while for do break continue switch case default struct typedef enum sizeof uint8_t uint16_t uint32_t int32_t int16_t int8_t bool true false'.split(' '),
);
const PERIPHS = /^(RCC|GPIO[A-H]|ADC1?|SysTick|NVIC|EXTI|SYSCFG|USART[1-6]|I2C[1-3]|SPI[1-4]|TIM\d+|SCB)$/;

type Tok = { t: string; c?: string };

export function tokenizeC(line: string, state: { inComment: boolean }, asm = false): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const push = (t: string, c?: string) => out.push({ t, c });
  while (i < line.length) {
    if (state.inComment) {
      const end = line.indexOf('*/', i);
      if (end === -1) {
        push(line.slice(i), 'text-dim italic');
        return out;
      }
      push(line.slice(i, end + 2), 'text-dim italic');
      i = end + 2;
      state.inComment = false;
      continue;
    }
    const rest = line.slice(i);
    let m: RegExpMatchArray | null;
    if (rest.startsWith('//') || (asm && rest.startsWith(';'))) {
      push(rest, 'text-dim italic');
      break;
    }
    if (rest.startsWith('/*')) {
      state.inComment = true;
      push('/*', 'text-dim italic');
      i += 2;
      continue;
    }
    if ((m = rest.match(/^#\s*\w+/))) {
      push(m[0], 'text-ch3');
      i += m[0].length;
      continue;
    }
    if ((m = rest.match(/^"(?:\\.|[^"\\])*"?|^'(?:\\.|[^'\\])*'?/))) {
      push(m[0], 'text-ch4');
      i += m[0].length;
      continue;
    }
    if ((m = rest.match(/^(0[xX][0-9a-fA-F_]+|0b[01_]+|\d+(\.\d+)?)[uUlL]*/))) {
      push(m[0], 'text-ch1');
      i += m[0].length;
      continue;
    }
    if ((m = rest.match(/^->\s*([A-Za-z_]\w*)(\[\d+\])?/))) {
      push('->', 'text-dim');
      push(rest.slice(2, m[0].length), 'text-ch2');
      i += m[0].length;
      continue;
    }
    if ((m = rest.match(/^[A-Za-z_]\w*/))) {
      const w = m[0];
      if (C_KEYWORDS.has(w)) push(w, 'text-gold');
      else if (PERIPHS.test(w)) push(w, 'text-ch2 font-semibold');
      else if (/_IRQHandler$|_Handler$/.test(w)) push(w, 'text-ch3');
      else if (/^[A-Z][A-Z0-9_]{2,}$/.test(w)) push(w, 'text-ch2');
      else push(w);
      i += w.length;
      continue;
    }
    if ((m = rest.match(/^(<<|>>|\|=|&=|\^=|~|&&|\|\||[!=<>]=?|[&|^])/))) {
      push(m[0], 'text-ch1/80');
      i += m[0].length;
      continue;
    }
    push(line[i]);
    i++;
  }
  return out;
}

interface CodeBlockProps {
  code: string;
  lang?: string;
  title?: ReactNode;
  highlight?: [number, number] | null;
  onLineClick?: (line: number) => void;
  maxHeight?: number;
  showLineNumbers?: boolean;
}

export default function CodeBlock({ code, lang = 'c', title, highlight, onLineClick, maxHeight, showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => {
    const st = { inComment: false };
    const src = code.replace(/\t/g, '    ').replace(/\s+$/, '');
    return src.split('\n').map((l) => (lang === 'text' ? [{ t: l }] : tokenizeC(l, st, lang === 'asm')));
  }, [code, lang]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="not-prose my-4 overflow-hidden rounded-md border border-line bg-[rgb(var(--mask))]">
      <div className="flex items-center justify-between border-b border-line bg-raised/60 px-3 py-1.5 text-xs text-dim">
        <span className="truncate font-mono">{title ?? lang}</span>
        <button type="button" className="rounded px-2 py-0.5 hover:text-gold" onClick={copy} aria-label="Copy code">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-auto py-2 font-mono text-[0.82rem] leading-[1.6]" style={maxHeight ? { maxHeight } : undefined}>
        {lines.map((toks, idx) => {
          const n = idx + 1;
          const hot = highlight && n >= highlight[0] && n <= highlight[1];
          return (
            <div
              key={idx}
              onClick={onLineClick ? () => onLineClick(n) : undefined}
              className={`flex pr-4 ${hot ? 'bg-gold/15 shadow-[inset_3px_0_0_rgb(var(--gold))]' : ''} ${onLineClick ? 'cursor-pointer hover:bg-raised/70' : ''}`}
            >
              {showLineNumbers && <span className="w-10 shrink-0 select-none pr-3 text-right text-dim/50">{n}</span>}
              <code className="whitespace-pre">
                {toks.length === 0 ? ' ' : toks.map((t, j) => (t.c ? <span key={j} className={t.c}>{t.t}</span> : <span key={j}>{t.t}</span>))}
              </code>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
