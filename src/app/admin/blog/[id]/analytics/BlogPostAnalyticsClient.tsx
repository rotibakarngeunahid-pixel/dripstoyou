'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';
import BlogTrafficChart from '@/components/admin/BlogTrafficChart';
import {
  type RangePreset,
  type Granularity,
  type BlogPostDetailResponse,
  type BlogBreakdownItem,
  presetRange,
  todayStr,
  fetchBlogAnalytics,
  formatCompact,
} from '@/lib/blog-analytics-admin';

function BreakdownPanel({ title, items, emptyLabel }: { title: string; items: BlogBreakdownItem[]; emptyLabel: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="admin-analytics-breakdown">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="muted-small">{emptyLabel}</p>
      ) : (
        <ul className="admin-analytics-breakdown-list">
          {items.map((item) => (
            <li key={item.label}>
              <div className="admin-analytics-breakdown-row">
                <span>{item.label}</span>
                <span>{formatCompact(item.count)}</span>
              </div>
              <div className="admin-analytics-breakdown-track">
                <div className="admin-analytics-breakdown-fill" style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function BlogPostAnalyticsClient({ postId }: { postId: string }) {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  const [preset, setPreset] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const range = useMemo(() => presetRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const [granularity, setGranularity] = useState<Granularity | null>(null);

  const [detail, setDetail] = useState<BlogPostDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { scope: 'detail', postId, from: range.from, to: range.to };
      if (granularity) params.granularity = granularity;
      const data = await fetchBlogAnalytics<BlogPostDetailResponse>(params);
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.baErrorState);
    } finally {
      setLoading(false);
    }
  }, [postId, range.from, range.to, granularity, t.baErrorState]);

  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);

  const presetOptions: { key: RangePreset; label: string }[] = [
    { key: 'today', label: t.baRangeToday },
    { key: '7d', label: t.baRange7d },
    { key: '30d', label: t.baRange30d },
    { key: '90d', label: t.baRange90d },
    { key: 'custom', label: t.baRangeCustom },
  ];

  return (
    <>
      <div className="admin-analytics-filters">
        {presetOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`button ${preset === opt.key ? 'button-primary' : 'button-secondary'}`}
            onClick={() => setPreset(opt.key)}
          >
            {opt.label}
          </button>
        ))}
        {preset === 'custom' && (
          <span className="admin-analytics-custom-range">
            <label>
              {t.baFrom}
              <input type="date" className="control" value={customFrom} max={customTo || todayStr()} onChange={(e) => setCustomFrom(e.target.value)} />
            </label>
            <label>
              {t.baTo}
              <input type="date" className="control" value={customTo} min={customFrom} max={todayStr()} onChange={(e) => setCustomTo(e.target.value)} />
            </label>
          </span>
        )}
      </div>

      {error ? (
        <div className="alert alert-error">
          {error}
          <button type="button" className="button button-secondary" onClick={() => void load()}>{t.baRetry}</button>
        </div>
      ) : loading || !detail ? (
        <div className="admin-stat-grid">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />)}
        </div>
      ) : (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat-card tone-teal">
              <div className="admin-stat-card-top"><span>{t.baKpiTotalViews}</span></div>
              <div className="admin-stat-card-main"><strong>{formatCompact(detail.performance.views)}</strong></div>
              <p>{t.baViewsToday}: {formatCompact(detail.performance.viewsToday)}</p>
            </div>
            <div className="admin-stat-card tone-ocean">
              <div className="admin-stat-card-top"><span>{t.baKpiUniqueVisitors}</span></div>
              <div className="admin-stat-card-main"><strong>{formatCompact(detail.performance.uniqueVisitors)}</strong></div>
              <p>{t.baViews7d}: {formatCompact(detail.performance.views7d)}</p>
            </div>
            <div className="admin-stat-card tone-gold">
              <div className="admin-stat-card-top"><span>{t.baKpiInteractions}</span></div>
              <div className="admin-stat-card-main"><strong>{formatCompact(detail.performance.interactions)}</strong></div>
              <p>{t.baViews30d}: {formatCompact(detail.performance.views30d)}</p>
            </div>
          </div>

          <section className="surface-card admin-analytics-panel">
            <div className="admin-analytics-panel-head">
              <h2 className="admin-card-title">{t.baTrafficOverTime}</h2>
              <div className="admin-analytics-granularity">
                {(['day', 'week', 'month'] as Granularity[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`button ${(granularity ?? 'day') === g ? 'button-primary' : 'button-secondary'}`}
                    onClick={() => setGranularity(g)}
                  >
                    {g === 'day' ? t.baGranularityDay : g === 'week' ? t.baGranularityWeek : t.baGranularityMonth}
                  </button>
                ))}
              </div>
            </div>
            <BlogTrafficChart
              data={detail.series}
              granularity={granularity ?? 'day'}
              viewsLabel={t.baLegendViews}
              visitorsLabel={t.baLegendVisitors}
              emptyLabel={t.baEmptyState}
            />
          </section>

          <section className="surface-card admin-analytics-panel">
            <h2 className="admin-card-title">{t.baVisitorInfoTitle}</h2>
            <div className="admin-analytics-breakdown-grid">
              <BreakdownPanel title={t.baDevice} items={detail.breakdowns.device} emptyLabel={t.baNoBreakdownData} />
              <BreakdownPanel title={t.baBrowser} items={detail.breakdowns.browser} emptyLabel={t.baNoBreakdownData} />
              <BreakdownPanel title={t.baOs} items={detail.breakdowns.os} emptyLabel={t.baNoBreakdownData} />
              <BreakdownPanel title={t.baReferrer} items={detail.breakdowns.referrer} emptyLabel={t.baNoBreakdownData} />
              {detail.breakdowns.country.length > 0 && (
                <BreakdownPanel title={t.baCountry} items={detail.breakdowns.country} emptyLabel={t.baNoBreakdownData} />
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
