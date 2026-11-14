import { Fragment, memo, type ReactNode } from 'react';
import CodeBlock from './CodeBlock';
import Directive from './Directive';
import { Link } from '../utils/router';

/*
  Tiny markdown dialect used for all authored content.
  Blocks:  ## / ### / #### headings, paragraphs, - lists, 1. lists, | tables |,
           ```c fences, > [!note|analogy|external|warning|exam|source|tip] callouts,
           $$ formula $$ (one or more lines), ::sim{id} / ::diagram{id} directives, ---.
  Inline:  **bold**, *italic*, `code`, [text](/route or https://), ^{sup}, _{sub}
*/

type Block =
  | { k: 'h'; level: number; text: string }
  | { k: 'p'; text: string }
  | { k: 'ul' | 'ol'; items: string[] }
  | { k: 'table'; head: string[]; rows: string[][]; align: ('l' | 'c' | 'r')[] }
  | { k: 'code'; lang: string; code: string; title?: string }
  | { k: 'callout'; kind: string; title?: string; body: string }
  | { k: 'formula'; text: string }
  | { k: 'directive'; name: string; arg: string }
  | { k: 'hr' };

function splitRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));
}

export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) {
      i++;
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(```|~~~)(\w*)\s*(.*)$/))) {
      const fence = m[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) body.push(lines[i++]);
      i++;
      blocks.push({ k: 'code', lang: m[2] || 'c', code: dedent(body.join('\n')), title: m[3] || undefined });
      continue;
    }
    if ((m = t.match(/^(#{2,4})\s+(.*)$/))) {
      blocks.push({ k: 'h', level: m[1].length, text: m[2] });
      i++;
      continue;
    }
    if (t === '---') {
      blocks.push({ k: 'hr' });
      i++;
      continue;
    }
    if ((m = t.match(/^::(\w+)\{([^}]*)\}$/))) {
      blocks.push({ k: 'directive', name: m[1], arg: m[2] });
      i++;
      continue;
    }
    if (t.startsWith('$$')) {
      const body: string[] = [];
      let first = t.slice(2);
      if (first.endsWith('$$') && first.length > 0) {
        blocks.push({ k: 'formula', text: first.slice(0, -2).trim() });
        i++;
        continue;
      }
      if (first.trim()) body.push(first);
      i++;
      while (i < lines.length && !lines[i].trim().endsWith('$$')) body.push(lines[i++].trim());
      if (i < lines.length) {
        const last = lines[i].trim().slice(0, -2).trim();
        if (last) body.push(last);
      }
      i++;
      blocks.push({ k: 'formula', text: body.join('\n') });
      continue;
    }
    if (t.startsWith('>')) {
      const body: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) body.push(lines[i++].trim().replace(/^>\s?/, ''));
      let kind = 'note';
      let title: string | undefined;
      const head = body[0]?.match(/^\[!(\w+)\]\s*(.*)$/);
      if (head) {
        kind = head[1].toLowerCase();
        title = head[2] || undefined;
        body.shift();
      }
      blocks.push({ k: 'callout', kind, title, body: body.join('\n') });
      continue;
    }
    if (t.startsWith('|')) {
      const rows: string[][] = [];
      let align: ('l' | 'c' | 'r')[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const r = lines[i].trim();
        if (/^\|?\s*:?-{2,}/.test(r)) {
          align = splitRow(r).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'c' : c.endsWith(':') ? 'r' : 'l'));
        } else rows.push(splitRow(r));
        i++;
      }
      const [head, ...rest] = rows;
      blocks.push({ k: 'table', head, rows: rest, align });
      continue;
    }
    if (/^[-*]\s+/.test(t) || /^\d+\.\s+/.test(t)) {
      const ordered = /^\d+\.\s+/.test(t);
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i];
        const lt = l.trim();
        if (ordered ? /^\d+\.\s+/.test(lt) : /^[-*]\s+/.test(lt)) {
          items.push(lt.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ''));
          i++;
        } else if (lt && /^\s{2,}/.test(l) && items.length) {
          items[items.length - 1] += '\n' + lt; // continuation / nested line
          i++;
        } else break;
      }
      blocks.push({ k: ordered ? 'ol' : 'ul', items });
      continue;
    }
    // paragraph
    const body: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{2,4}\s|```|~~~|>|\||::\w+\{|\$\$|---$)/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    )
      body.push(lines[i++].trim());
    blocks.push({ k: 'p', text: body.join(' ') });
  }
  return blocks;
}

function dedent(s: string) {
  const ls = s.split('\n');
  const ind = Math.min(...ls.filter((l) => l.trim()).map((l) => l.match(/^\s*/)![0].length));
  return Number.isFinite(ind) ? ls.map((l) => l.slice(ind)).join('\n') : s;
}

/* ---------------- inline ---------------- */

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|«[^»]+»|\[[^\]]+\]\([^)\s]+\)|\^\{[^}]+\}|_\{[^}]+\})/g;

export function Inline({ text }: { text: string }): JSX.Element {
  const parts = text.replace(/\\\|/g, '|').split(INLINE);
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}><Inline text={p.slice(2, -2)} /></strong>;
        if ((p.startsWith('`') && p.endsWith('`')) || (p.startsWith('«') && p.endsWith('»'))) return <code key={i}>{p.slice(1, -1)}</code>;
        if (p.startsWith('^{')) return <sup key={i}>{p.slice(2, -1)}</sup>;
        if (p.startsWith('_{')) return <sub key={i}>{p.slice(2, -1)}</sub>;
        if (p.startsWith('[')) {
          const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (m) {
            const to = m[2];
            if (/^https?:/.test(to))
              return (
                <a key={i} href={to} target="_blank" rel="noreferrer">
                  {m[1]}
                </a>
              );
            return (
              <Link key={i} to={to}>
                {m[1]}
              </Link>
            );
          }
        }
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}><Inline text={p.slice(1, -1)} /></em>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/* ---------------- callouts ---------------- */

const CALLOUT: Record<string, { label: string; cls: string }> = {
  note: { label: 'Note', cls: 'border-line bg-raised/50' },
  tip: { label: 'Tip', cls: 'border-ch4/50 bg-ch4/5' },
  analogy: { label: 'Analogy', cls: 'border-ch2/50 bg-ch2/5' },
  exam: { label: 'Exam focus', cls: 'border-gold/60 bg-gold/5' },
  warning: { label: 'Common mistake', cls: 'border-bad/60 bg-bad/5' },
  external: { label: 'External knowledge — not from your course slides', cls: 'border-ch3/60 bg-ch3/5' },
  source: { label: 'From your course material', cls: 'border-gold/40 bg-panel' },
  additional: { label: 'Additional syllabus coverage', cls: 'border-ch3/60 bg-ch3/5' },
  math: { label: 'Derivation', cls: 'border-ch1/40 bg-ch1/5' },
};

export function Callout({ kind, title, children }: { kind: string; title?: string; children: ReactNode }) {
  const c = CALLOUT[kind] ?? CALLOUT.note;
  return (
    <aside className={`not-prose my-5 rounded-md border-l-[3px] border ${c.cls} px-4 py-3 text-[0.95rem] leading-relaxed`}>
      <div className="mb-1 text-sm font-semibold text-ink">{title ?? c.label}</div>
      <div className="md text-ink/90 [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

/* ---------------- render ---------------- */

function RenderBlock({ b }: { b: Block }) {
  switch (b.k) {
    case 'h': {
      const id = b.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (b.level === 2) return <h2 id={id}><Inline text={b.text} /></h2>;
      if (b.level === 3) return <h3 id={id}><Inline text={b.text} /></h3>;
      return <h4 id={id}><Inline text={b.text} /></h4>;
    }
    case 'p':
      return <p><Inline text={b.text} /></p>;
    case 'ul':
    case 'ol': {
      const Tag = b.k;
      return (
        <Tag>
          {b.items.map((it, i) => (
            <li key={i}>
              {it.split('\n').map((seg, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  <Inline text={seg.replace(/^[-*]\s+/, '• ')} />
                </Fragment>
              ))}
            </li>
          ))}
        </Tag>
      );
    }
    case 'table':
      return (
        <div className="not-prose -mx-1 overflow-x-auto">
          <table className="md-table w-full border-collapse text-sm">
            <thead>
              <tr>
                {b.head.map((h, i) => (
                  <th key={i} className="border-b border-line bg-raised px-3 py-2 text-left font-semibold">
                    <Inline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="odd:bg-panel/40">
                  {r.map((c, j) => (
                    <td key={j} className={`border-b border-line/60 px-3 py-2 align-top ${b.align[j] === 'r' ? 'text-right' : b.align[j] === 'c' ? 'text-center' : ''}`}>
                      <Inline text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'code':
      return <CodeBlock code={b.code} lang={b.lang} title={b.title} />;
    case 'callout':
      return (
        <Callout kind={b.kind} title={b.title}>
          <Markdown src={b.body} bare />
        </Callout>
      );
    case 'formula':
      return (
        <div className="not-prose my-4 overflow-x-auto rounded-md border border-ch1/30 bg-ch1/5 px-4 py-3 font-mono text-[0.95rem] text-ink">
          {b.text.split('\n').map((l, i) => (
            <div key={i}>
              <Inline text={l} />
            </div>
          ))}
        </div>
      );
    case 'directive':
      return <Directive name={b.name} arg={b.arg} />;
    case 'hr':
      return <hr className="my-8 border-line" />;
  }
}

function MarkdownImpl({ src, bare, className = '' }: { src: string; bare?: boolean; className?: string }) {
  const blocks = parseBlocks(src);
  const content = blocks.map((b, i) => <RenderBlock key={i} b={b} />);
  if (bare) return <>{content}</>;
  return <div className={`md ${className}`}>{content}</div>;
}

const Markdown = memo(MarkdownImpl);
export default Markdown;
