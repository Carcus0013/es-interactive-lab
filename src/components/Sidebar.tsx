import { useEffect, useState, type ReactNode } from 'react';
import { UNITS } from '../data/units';
import { topicsOfUnit, TOPIC_BY_ID } from '../content/topics';
import { Link, useRoute } from '../utils/router';
import { useStore } from '../utils/store';
import { IconArchive, IconBook, IconCards, IconChart, IconChevron, IconChip, IconFlask, IconHome, IconList, IconMap, IconTarget, IconWave } from './Icons';
import { StatusDot } from './ui';

function NavItem({ to, icon, children, active }: { to: string; icon: ReactNode; children: ReactNode; active: boolean }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[0.92rem] transition-colors ${
        active ? 'bg-gold/10 text-gold' : 'text-ink/80 hover:bg-raised hover:text-ink'
      }`}
    >
      <span className={active ? 'text-gold' : 'text-dim'}>{icon}</span>
      {children}
    </Link>
  );
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { path, segments } = useRoute();
  const topicState = useStore((s) => s.topics);
  const currentUnit = segments[0] === 'unit' ? Number(segments[1]) : segments[0] === 'topic' ? TOPIC_BY_ID[segments[1]]?.unit : undefined;
  const [open, setOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (currentUnit) setOpen((o) => ({ ...o, [currentUnit]: true }));
  }, [currentUnit]);

  const is = (p: string) => (p === '/' ? path === '/' : path === p || path.startsWith(p + '/'));

  return (
    <nav className="flex h-full flex-col gap-0.5 overflow-y-auto px-3 pb-6 pt-3 text-sm" aria-label="Main" onClick={(e) => (e.target as HTMLElement).closest('a') && onNavigate?.()}>
      <NavItem to="/" icon={<IconHome size={17} />} active={is('/')}>
        Dashboard
      </NavItem>
      <NavItem to="/syllabus" icon={<IconMap size={17} />} active={is('/syllabus')}>
        Syllabus
      </NavItem>

      <div className="mb-1 mt-4 px-2.5 text-xs text-dim">Units</div>
      {UNITS.map((u) => {
        const topics = topicsOfUnit(u.id);
        const done = topics.filter((t) => topicState[t.id]?.status === 'done').length;
        const expanded = !!open[u.id];
        return (
          <div key={u.id}>
            <div className={`flex items-center rounded ${is(`/unit/${u.id}`) ? 'bg-gold/10' : ''}`}>
              <button
                type="button"
                className="rounded p-1.5 text-dim hover:text-ink"
                aria-label={expanded ? `Collapse unit ${u.id}` : `Expand unit ${u.id}`}
                aria-expanded={expanded}
                onClick={() => setOpen((o) => ({ ...o, [u.id]: !expanded }))}
              >
                <IconChevron size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
              <Link to={`/unit/${u.id}`} className={`flex flex-1 items-baseline gap-2 py-1.5 pr-2 text-[0.92rem] ${is(`/unit/${u.id}`) ? 'text-gold' : 'text-ink/85 hover:text-ink'}`}>
                <span className="font-semibold">Unit {u.id}</span>
                <span className="ml-auto font-mono text-[0.7rem] text-dim">
                  {done}/{topics.length}
                </span>
              </Link>
            </div>
            {expanded && (
              <ul className="mb-1 ml-[1.15rem] border-l border-line pl-2">
                {topics.map((t) => {
                  const active = path === `/topic/${t.id}`;
                  return (
                    <li key={t.id}>
                      <Link
                        to={`/topic/${t.id}`}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-start gap-2 rounded px-2 py-1 text-[0.84rem] leading-snug ${active ? 'bg-gold/10 text-gold' : 'text-ink/75 hover:bg-raised hover:text-ink'}`}
                      >
                        <StatusDot status={topicState[t.id]?.status ?? 'new'} className="mt-[0.4rem]" />
                        <span>{t.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      <div className="mb-1 mt-4 px-2.5 text-xs text-dim">Practice</div>
      <NavItem to="/lab" icon={<IconFlask size={17} />} active={is('/lab')}>
        Practical lab
      </NavItem>
      <NavItem to="/sims" icon={<IconWave size={17} />} active={is('/sims')}>
        Simulations
      </NavItem>
      <NavItem to="/pyq" icon={<IconArchive size={17} />} active={is('/pyq')}>
        PYQ archive & solutions
      </NavItem>
      <NavItem to="/bank" icon={<IconList size={17} />} active={is('/bank')}>
        Question bank
      </NavItem>
      <NavItem to="/mock" icon={<IconTarget size={17} />} active={is('/mock')}>
        Mock exam
      </NavItem>

      <div className="mb-1 mt-4 px-2.5 text-xs text-dim">Revise</div>
      <NavItem to="/revision" icon={<IconCards size={17} />} active={is('/revision')}>
        Quick revision
      </NavItem>
      <NavItem to="/progress" icon={<IconChart size={17} />} active={is('/progress')}>
        Progress & bookmarks
      </NavItem>
      <NavItem to="/coverage" icon={<IconBook size={17} />} active={is('/coverage')}>
        Sources & coverage
      </NavItem>

      <div className="mt-auto px-2.5 pt-6 text-[0.72rem] leading-relaxed text-dim">
        <IconChip size={14} className="mb-1 inline text-gold" /> 23CSE304 on the STM32F401CCU6
      </div>
    </nav>
  );
}
