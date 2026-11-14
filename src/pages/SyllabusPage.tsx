import { COURSE, UNITS } from '../data/units';
import { topicsOfUnit } from '../content/topics';
import { PageHeader, SourceBadge, StatusDot } from '../components/ui';
import { Callout } from '../components/Markdown';
import { Link } from '../utils/router';
import { useStore } from '../utils/store';

export default function SyllabusPage() {
  const topicState = useStore((s) => s.topics);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Syllabus"
        lead={`${COURSE.code} ${COURSE.name} (${COURSE.credits}), ${COURSE.semester}. The unit text below is copied from the official course-overview slides; each line links to the lesson that teaches it.`}
      />
      <Callout kind="source" title="Where this comes from">
        <p>
          <code>Day01-23CSE304 CourseOverview.pptx</code>, slides 3–4. The Unit 3 text box is cut off on the slide after “Timer”; the NVIC lecture’s title slide continues it as “Timer Periodic Interrupts, NVIC”, and the UART and I²C lectures that follow in the same series are included here as Unit 3 content as taught.
        </p>
      </Callout>

      {UNITS.map((u) => (
        <section key={u.id} className="mt-10">
          <h2 className="text-2xl font-semibold">
            Unit {u.id}: {u.title}
          </h2>
          <blockquote className="mt-3 border-l-2 border-gold/60 pl-4 text-[0.95rem] italic leading-relaxed text-ink/80">{u.syllabus}</blockquote>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  <th className="border-b border-line px-3 py-2 font-semibold">Topic</th>
                  <th className="border-b border-line px-3 py-2 font-semibold">Coverage</th>
                  <th className="border-b border-line px-3 py-2 font-semibold">Main source</th>
                  <th className="border-b border-line px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {topicsOfUnit(u.id).map((t) => (
                  <tr key={t.id} className="odd:bg-panel/40">
                    <td className="border-b border-line/60 px-3 py-2">
                      <Link to={`/topic/${t.id}`} className="font-medium hover:text-gold">
                        {t.title}
                      </Link>
                    </td>
                    <td className="border-b border-line/60 px-3 py-2">
                      <SourceBadge status={t.status} />
                    </td>
                    <td className="border-b border-line/60 px-3 py-2 font-mono text-xs text-dim">{t.sources[0]?.file}</td>
                    <td className="border-b border-line/60 px-3 py-2">
                      <StatusDot status={topicState[t.id]?.status ?? 'new'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Course outcomes</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {COURSE.outcomes.map(([c, d]) => (
              <div key={c} className="flex gap-3">
                <dt className="font-mono text-gold">{c}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Evaluation</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {COURSE.evaluation.map(([k, v]) => (
                <tr key={k}>
                  <td className="border-b border-line/60 py-1.5 pr-3">{k}</td>
                  <td className="border-b border-line/60 py-1.5 text-right font-mono">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold">Books</h2>
          <p className="mt-2 text-sm">
            <span className="text-dim">Text book: </span>
            {COURSE.textbook}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-dim">
            {COURSE.references.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
