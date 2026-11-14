import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import SearchPalette from './components/SearchPalette';
import { ErrorBoundary, Loading } from './components/SimFrame';
import { IconBookmark, IconChip, IconClose, IconMenu, IconMoon, IconSearch, IconSun } from './components/Icons';
import { Link, useRoute, useScrollReset } from './utils/router';
import { toggleBookmark, useStore, isStorageAvailable } from './utils/store';
import { useTheme } from './utils/theme';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const SyllabusPage = lazy(() => import('./pages/SyllabusPage'));
const UnitPage = lazy(() => import('./pages/UnitPage'));
const TopicPage = lazy(() => import('./pages/TopicPage'));
const LabIndex = lazy(() => import('./pages/LabIndex'));
const PracticalPage = lazy(() => import('./pages/PracticalPage'));
const SimsIndex = lazy(() => import('./pages/SimsIndex'));
const SimPage = lazy(() => import('./pages/SimPage'));
const PyqArchive = lazy(() => import('./pages/PyqArchive'));
const PyqPaperPage = lazy(() => import('./pages/PyqPaperPage'));
const PyqPractice = lazy(() => import('./pages/PyqPractice'));
const QuestionBank = lazy(() => import('./pages/QuestionBank'));
const MockExam = lazy(() => import('./pages/MockExam'));
const Revision = lazy(() => import('./pages/Revision'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const CoveragePage = lazy(() => import('./pages/CoveragePage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function routeElement(segments: string[]): ReactNode {
  const [a, b, c] = segments;
  switch (a) {
    case undefined:
      return <Dashboard />;
    case 'syllabus':
      return <SyllabusPage />;
    case 'unit':
      return <UnitPage id={Number(b)} />;
    case 'topic':
      return <TopicPage id={b} />;
    case 'lab':
      return b ? <PracticalPage id={b} /> : <LabIndex />;
    case 'sims':
      return b ? <SimPage id={b} /> : <SimsIndex />;
    case 'pyq':
      if (b === 'paper') return <PyqPaperPage id={c} />;
      if (b === 'practice') return <PyqPractice />;
      return <PyqArchive />;
    case 'bank':
      return <QuestionBank />;
    case 'mock':
      return <MockExam />;
    case 'revision':
      return <Revision section={b} />;
    case 'progress':
      return <ProgressPage />;
    case 'coverage':
      return <CoveragePage />;
    default:
      return <NotFound />;
  }
}

const SHORTCUTS: [string, string][] = [
  ['/  or  Ctrl K', 'Search everything'],
  ['t', 'Toggle dark / light theme'],
  ['b', 'Bookmark this page'],
  ['[  and  ]', 'Previous / next topic (on a topic page)'],
  ['1 – 5', 'Switch tabs on a topic page'],
  ['?', 'Show this list'],
];

export default function App() {
  const route = useRoute();
  const [theme, toggleTheme] = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const bookmarks = useStore((s) => s.bookmarks);
  const bookmarked = bookmarks.includes(route.path);
  useScrollReset(route.path);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 't') toggleTheme();
      else if (e.key === 'b') toggleBookmark(route.path);
      else if (e.key === '?') setHelpOpen((h) => !h);
      else if (e.key === 'Escape') {
        setHelpOpen(false);
        setNavOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [route.path, toggleTheme]);

  useEffect(() => setNavOpen(false), [route.path]);

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-scroll"
        onClick={(e) => {
          e.preventDefault();
          const m = document.getElementById('main-scroll');
          m?.setAttribute('tabindex', '-1');
          m?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-1 focus:text-mask">
        Skip to content
      </a>
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[17rem] shrink-0 flex-col border-r border-line bg-panel/60 lg:flex">
        <Link to="/" className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <IconChip size={22} className="text-gold" />
          <span className="silk leading-tight">
            <span className="block text-[1.05rem] font-bold">ES Interactive Lab</span>
            <span className="block text-xs text-dim">23CSE304 Embedded Systems</span>
          </span>
        </Link>
        <Sidebar />
      </aside>

      {/* mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-mask/70" onClick={() => setNavOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[85vw] max-w-xs flex-col border-r border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="silk font-bold">ES Interactive Lab</span>
              <button type="button" className="p-1 text-dim" onClick={() => setNavOpen(false)} aria-label="Close navigation">
                <IconClose />
              </button>
            </div>
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-mask/90 px-3 backdrop-blur sm:px-5">
          <button type="button" className="rounded p-2 text-dim hover:text-ink lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation">
            <IconMenu />
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex min-w-0 max-w-md flex-1 items-center gap-2 rounded border border-line bg-panel px-3 py-1.5 text-left text-sm text-dim hover:border-gold/50"
          >
            <IconSearch size={16} />
            <span className="truncate">Search the course</span>
            <span className="kbd ml-auto hidden sm:inline">Ctrl K</span>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className={`rounded p-2 hover:bg-raised ${bookmarked ? 'text-gold' : 'text-dim hover:text-ink'}`}
              onClick={() => toggleBookmark(route.path)}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this page'}
              title={bookmarked ? 'Remove bookmark (b)' : 'Bookmark this page (b)'}
            >
              <IconBookmark filled={bookmarked} />
            </button>
            <button type="button" className="rounded p-2 text-dim hover:bg-raised hover:text-ink" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme (t)">
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
            <button type="button" className="hidden rounded px-2 py-1 font-mono text-sm text-dim hover:bg-raised hover:text-ink sm:block" onClick={() => setHelpOpen(true)} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">
              ?
            </button>
          </div>
        </header>
        {!isStorageAvailable() && (
          <div className="border-b border-warn/40 bg-warn/10 px-5 py-2 text-sm text-warn">Browser storage is blocked, so progress will be lost when you close this tab.</div>
        )}
        <main id="main-scroll" className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-8 lg:px-10" key={route.path}>
          <ErrorBoundary label="This page">
            <Suspense fallback={<Loading label="Loading page" />}>{routeElement(route.segments)}</Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-mask/70 p-4" onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-line bg-panel p-5" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-xl font-semibold">Keyboard shortcuts</h2>
            <dl className="space-y-2 text-sm">
              {SHORTCUTS.map(([k, d]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="font-mono text-gold">{k}</dt>
                  <dd className="text-dim">{d}</dd>
                </div>
              ))}
            </dl>
            <button type="button" className="btn mt-5" onClick={() => setHelpOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
