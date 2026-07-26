'use client';

import { useId, useMemo, useState } from 'react';

export interface BlogTrafficPoint {
  date: string;
  views: number;
  uniqueVisitors: number;
}

// Validated categorical pair (dataviz skill, slots 1-2 of the documented
// default palette) — the brand's own teal/gold read as gray or sub-3:1 at
// chart-mark chroma, so marks use this pair while chrome/text stay on the
// site's own tokens.
const SERIES_VIEWS_COLOR = '#2a78d6';
const SERIES_VISITORS_COLOR = '#eb6834';

function formatBucketLabel(date: string, granularity: 'day' | 'week' | 'month'): string {
  const d = new Date(date.includes('T') ? date : `${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  if (granularity === 'month') return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export default function BlogTrafficChart({
  data,
  granularity = 'day',
  viewsLabel = 'Views',
  visitorsLabel = 'Unique Visitors',
  emptyLabel = 'Belum ada data analytics untuk periode ini.',
}: {
  data: BlogTrafficPoint[];
  granularity?: 'day' | 'week' | 'month';
  viewsLabel?: string;
  visitorsLabel?: string;
  emptyLabel?: string;
}) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 16 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxValue = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => Math.max(d.views, d.uniqueVisitors)));
    const magnitude = 10 ** Math.floor(Math.log10(max));
    return Math.max(1, Math.ceil(max / magnitude) * magnitude);
  }, [data]);

  const xFor = (i: number) => (data.length <= 1 ? padding.left : padding.left + (i / (data.length - 1)) * plotW);
  const yFor = (v: number) => padding.top + plotH - (v / maxValue) * plotH;

  function linePath(values: number[]): string {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`).join(' ');
  }

  function areaPath(values: number[]): string {
    if (values.length === 0) return '';
    const baseline = (padding.top + plotH).toFixed(1);
    return `${linePath(values)} L ${xFor(values.length - 1).toFixed(1)} ${baseline} L ${xFor(0).toFixed(1)} ${baseline} Z`;
  }

  if (data.length === 0) {
    return <div className="empty-state">{emptyLabel}</div>;
  }

  const viewsValues = data.map((d) => d.views);
  const visitorValues = data.map((d) => d.uniqueVisitors);
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="blog-chart">
      <div className="blog-chart-legend">
        <span className="blog-chart-legend-item">
          <span className="blog-chart-swatch" style={{ background: SERIES_VIEWS_COLOR }} aria-hidden="true" />
          {viewsLabel}
        </span>
        <span className="blog-chart-legend-item">
          <span className="blog-chart-swatch" style={{ background: SERIES_VISITORS_COLOR }} aria-hidden="true" />
          {visitorsLabel}
        </span>
        <button
          type="button"
          className="blog-chart-table-toggle"
          onClick={() => setShowTable((s) => !s)}
        >
          {showTable ? 'Lihat grafik' : 'Lihat sebagai tabel'}
        </button>
      </div>

      {showTable ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>{viewsLabel}</th>
                <th>{visitorsLabel}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.date}>
                  <td>{formatBucketLabel(d.date, granularity)}</td>
                  <td>{d.views.toLocaleString('id-ID')}</td>
                  <td>{d.uniqueVisitors.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="blog-chart-svg"
            role="img"
            aria-label={`Grafik traffic: ${viewsLabel} dan ${visitorsLabel}`}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id={`${gradientId}-views`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_VIEWS_COLOR} stopOpacity="0.12" />
                <stop offset="100%" stopColor={SERIES_VIEWS_COLOR} stopOpacity="0" />
              </linearGradient>
            </defs>

            {gridSteps.map((g) => {
              const y = padding.top + plotH * (1 - g);
              return (
                <line
                  key={g}
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#e1e0d9"
                  strokeWidth={1}
                />
              );
            })}

            <path d={areaPath(viewsValues)} fill={`url(#${gradientId}-views)`} stroke="none" />
            <path d={linePath(viewsValues)} fill="none" stroke={SERIES_VIEWS_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d={linePath(visitorValues)} fill="none" stroke={SERIES_VISITORS_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            <circle cx={xFor(data.length - 1)} cy={yFor(viewsValues[data.length - 1])} r={4} fill={SERIES_VIEWS_COLOR} stroke="#fcfcfb" strokeWidth={2} />
            <circle cx={xFor(data.length - 1)} cy={yFor(visitorValues[data.length - 1])} r={4} fill={SERIES_VISITORS_COLOR} stroke="#fcfcfb" strokeWidth={2} />

            {hoverIndex !== null && (
              <line
                x1={xFor(hoverIndex)}
                x2={xFor(hoverIndex)}
                y1={padding.top}
                y2={padding.top + plotH}
                stroke="#c3c2b7"
                strokeWidth={1}
              />
            )}

            {/* Transparent hit targets — bigger than the 2px line, per-bucket hover/focus. */}
            {data.map((d, i) => (
              <rect
                key={d.date}
                x={xFor(i) - plotW / Math.max(1, 2 * (data.length - 1 || 1))}
                y={padding.top}
                width={data.length > 1 ? plotW / (data.length - 1) : plotW}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onFocus={() => setHoverIndex(i)}
                tabIndex={0}
                aria-label={`${formatBucketLabel(d.date, granularity)}: ${viewsLabel} ${d.views}, ${visitorsLabel} ${d.uniqueVisitors}`}
              />
            ))}
          </svg>

          <div className="blog-chart-tooltip" role="status" aria-live="polite">
            {hovered ? (
              <>
                <strong>{formatBucketLabel(hovered.date, granularity)}</strong>
                <span>
                  <span className="blog-chart-swatch" style={{ background: SERIES_VIEWS_COLOR }} aria-hidden="true" />
                  {viewsLabel}: <b>{hovered.views.toLocaleString('id-ID')}</b>
                </span>
                <span>
                  <span className="blog-chart-swatch" style={{ background: SERIES_VISITORS_COLOR }} aria-hidden="true" />
                  {visitorsLabel}: <b>{hovered.uniqueVisitors.toLocaleString('id-ID')}</b>
                </span>
              </>
            ) : (
              <span className="blog-chart-tooltip-hint">Arahkan kursor ke grafik untuk detail per periode.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
