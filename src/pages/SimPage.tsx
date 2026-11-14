import { useEffect } from 'react';
import { SIM_BY_ID } from '../simulations/registry';
import { TOPIC_BY_ID } from '../content/topics';
import SimFrame from '../components/SimFrame';
import { Callout } from '../components/Markdown';
import { PageHeader } from '../components/ui';
import { Link, useRoute } from '../utils/router';
import { pushRecent } from '../utils/store';
import NotFound from './NotFound';

export default function SimPage({ id }: { id: string }) {
  const meta = SIM_BY_ID[id];
  const { query } = useRoute();
  useEffect(() => {
    if (meta) pushRecent(`/sims/${meta.id}`, `Simulation: ${meta.title}`);
  }, [meta]);
  if (!meta) return <NotFound what="simulation" />;
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader kicker={<Link to="/sims" className="hover:text-gold">Simulations, Unit {meta.unit}</Link>} title={meta.title} lead={meta.summary} />
      <Callout kind="note" title="Educational model">
        <p>{meta.model}</p>
      </Callout>
      <SimFrame id={meta.id} preset={query.get('preset') ?? undefined} standalone />
      <div className="mt-8">
        <h2 className="mb-2 text-lg font-semibold">Learn the theory behind it</h2>
        <ul className="flex flex-wrap gap-2">
          {meta.topics
            .filter((t) => TOPIC_BY_ID[t])
            .map((t) => (
              <li key={t}>
                <Link to={`/topic/${t}`} className="btn">
                  {TOPIC_BY_ID[t].title}
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
