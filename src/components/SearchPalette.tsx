import { useEffect, useMemo, useRef, useState } from 'react';
import { search, type SearchDoc } from '../data/search';
import { navigate } from '../utils/router';
import { useStore } from '../utils/store';
import { IconSearch } from './Icons';

export default function SearchPalette({ open, onClose, initial = '' }: { open: boolean; onClose: () => void; initial?: string }) {
  const [q, setQ] = useState(initial);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const recent = useStore((s) => s.recent);
  const results: SearchDoc[] = useMemo(() => search(q), [q]);

  useEffect(() => {
    if (open) {
      setQ(initial);
      setSel(0);
      setTimeout(() => input.current?.focus(), 10);
    }
  }, [open, initial]);
  useEffect(() => setSel(0), [q]);

  if (!open) return null;

  const go = (route: string) => {
    onClose();
    navigate(route);
  };
  const list = q.trim() ? results : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-mask/70 p-4 pt-[10vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-line bg-panel shadow-2xl" role="dialog" aria-modal="true" aria-label="Search" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <IconSearch className="text-dim" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search topics, registers, practicals, PYQs…  e.g. “BRR 9600”, “EXTICR”, “bit band”"
            className="w-full bg-transparent py-3.5 text-base text-ink outline-none placeholder:text-dim/70"
            aria-label="Search query"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSel((s) => Math.min(s + 1, list.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSel((s) => Math.max(s - 1, 0));
              } else if (e.key === 'Enter' && list[sel]) go(list[sel].route);
            }}
          />
          <span className="kbd">Esc</span>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2" role="listbox" aria-label="Results">
          {!q.trim() && (
            <>
              <li className="px-3 py-2 text-xs text-dim">{recent.length ? 'Recently visited' : 'Type to search the whole course.'}</li>
              {recent.slice(0, 8).map((r) => (
                <li key={r.route}>
                  <button type="button" className="w-full rounded px-3 py-2 text-left text-sm hover:bg-raised" onClick={() => go(r.route)}>
                    {r.title}
                  </button>
                </li>
              ))}
            </>
          )}
          {q.trim() && list.length === 0 && <li className="px-3 py-6 text-center text-sm text-dim">No matches for “{q}”. Try a register name, a pin (PA0) or a keyword.</li>}
          {list.map((d, i) => (
            <li key={d.kind + d.route + d.title} role="option" aria-selected={i === sel}>
              <button
                type="button"
                onMouseEnter={() => setSel(i)}
                onClick={() => go(d.route)}
                className={`flex w-full items-start gap-3 rounded px-3 py-2 text-left ${i === sel ? 'bg-gold/10' : ''}`}
              >
                <span className="mt-0.5 w-20 shrink-0 text-xs text-dim">{d.kind}</span>
                <span className="min-w-0">
                  <span className={`block text-sm font-medium ${i === sel ? 'text-gold' : 'text-ink'}`}>{d.title}</span>
                  {d.snippet && <span className="block truncate text-xs text-dim">{d.snippet}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-4 border-t border-line px-4 py-2 text-xs text-dim">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> move
          </span>
          <span>
            <span className="kbd">Enter</span> open
          </span>
          <span className="ml-auto">
            <span className="kbd">/</span> or <span className="kbd">Ctrl K</span> opens search
          </span>
        </div>
      </div>
    </div>
  );
}
