import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes } from 'react';

// Minimal hash router: works from file:// (single-file build) and from a dev server.
// Routes look like  #/topic/bit-banding?tab=exam

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}
const getHash = () => window.location.hash || '#/';

export interface Route {
  path: string;
  segments: string[];
  query: URLSearchParams;
  /** in-page anchor: #/pyq/paper/x#anchor or #/page?q=1#anchor */
  anchor: string;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [beforeAnchor, anchor = ''] = raw.split('#');
  const [p, q = ''] = beforeAnchor.split('?');
  const path = p.startsWith('/') ? p : '/' + p;
  return { path, segments: path.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(q), anchor };
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, getHash);
  return parseHash(hash);
}

export function currentPath(): string {
  return parseHash(getHash()).path;
}

export function navigate(to: string) {
  const target = to.startsWith('#') ? to : '#' + to;
  if (window.location.hash !== target) window.location.hash = target;
}

export function href(to: string) {
  return to.startsWith('#') ? to : '#' + to;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export function Link({ to, ...rest }: LinkProps) {
  return <a href={href(to)} {...rest} />;
}

/** Scroll to top on path change (not on query-only change). */
export function useScrollReset(path: string) {
  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [path]);
}
