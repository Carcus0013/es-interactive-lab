import { Link } from '../utils/router';

export default function NotFound({ what = 'page' }: { what?: string }) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="font-mono text-sm text-dim">404</p>
      <h1 className="mt-2 text-3xl font-bold">This {what} does not exist</h1>
      <p className="mt-3 text-dim">The link may be mistyped, or the item was renamed. Search the course with Ctrl K, or go back to the dashboard.</p>
      <Link to="/" className="btn-gold mt-6">
        Go to the dashboard
      </Link>
    </div>
  );
}
