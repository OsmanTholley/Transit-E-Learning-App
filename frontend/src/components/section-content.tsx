import { SectionContent } from "@/types/app";

type Props = {
  content: SectionContent;
};

export function SectionContentView({ content }: Props) {
  return (
    <section className="space-y-6">
      {content.stats && content.stats.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.stats.map((stat) => (
            <article key={stat.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              {stat.trend ? <p className="mt-1 text-xs text-slate-500">{stat.trend}</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      {content.table ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                {content.table.columns.map((column) => (
                  <th key={column} className="px-4 py-3 text-left font-medium text-slate-700">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {content.table.rows.map((row, rowIndex) => (
                <tr key={`${row.join("-")}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`} className="px-4 py-3 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {content.bullets && content.bullets.length > 0 ? (
        <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Highlights</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {content.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
