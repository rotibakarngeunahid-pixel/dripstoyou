'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAdminLang } from '@/app/admin/AdminLayoutClient';
import { ADMIN_T } from '@/lib/admin-i18n';
import BlogTrafficChart, { type BlogTrafficPoint } from '@/components/admin/BlogTrafficChart';
import {
  type RangePreset,
  type Granularity,
  type SortKey,
  type BlogOverviewData,
  type BlogTopResponse,
  presetRange,
  todayStr,
  fetchBlogAnalytics,
  formatCompact,
  formatDateLabel,
} from '@/lib/blog-analytics-admin';

const STATUS_LABEL_ID: Record<string, string> = { draft: 'Draft', published: 'Tayang', archived: 'Arsip' };

export default function BlogAnalyticsClient() {
  const { lang } = useAdminLang();
  const t = ADMIN_T[lang];

  const [preset, setPreset] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const range = useMemo(() => presetRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const [granularity, setGranularity] = useState<Granularity | null>(null);

  const [overview, setOverview] = useState<BlogOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  const [series, setSeries] = useState<BlogTrafficPoint[]>([]);
  const [seriesGranularity, setSeriesGranularity] = useState<Granularity>('day');
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [seriesError, setSeriesError] = useState('');

  const [sort, setSort] = useState<SortKey>('views');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [top, setTop] = useState<BlogTopResponse | null>(null);
  const [topLoading, setTopLoading] = useState(true);
  const [topError, setTopError] = useState('');

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const data = await fetchBlogAnalytics<BlogOverviewData>({ scope: 'overview', from: range.from, to: range.to });
      setOverview(data);
    } catch (e) {
      setOverviewError(e instanceof Error ? e.message : t.baErrorState);
    } finally {
      setOverviewLoading(false);
    }
  }, [range.from, range.to, t.baErrorState]);

  const loadSeries = useCallback(async () => {
    setSeriesLoading(true);
    setSeriesError('');
    try {
      const params: Record<string, string> = { scope: 'series', from: range.from, to: range.to };
      if (granularity) params.granularity = granularity;
      const data = await fetchBlogAnalytics<{ series: BlogTrafficPoint[]; granularity: Granularity }>(params);
      setSeries(data.series);
      setSeriesGranularity(data.granularity);
    } catch (e) {
      setSeriesError(e instanceof Error ? e.message : t.baErrorState);
    } finally {
      setSeriesLoading(false);
    }
  }, [range.from, range.to, granularity, t.baErrorState]);

  const loadTop = useCallback(async () => {
    setTopLoading(true);
    setTopError('');
    try {
      const data = await fetchBlogAnalytics<BlogTopResponse>({
        scope: 'top',
        from: range.from,
        to: range.to,
        sort,
        q: query,
        page: String(page),
        per_page: '10',
      });
      setTop(data);
    } catch (e) {
      setTopError(e instanceof Error ? e.message : t.baErrorState);
    } finally {
      setTopLoading(false);
    }
  }, [range.from, range.to, sort, query, page, t.baErrorState]);

  useEffect(() => { const timer = setTimeout(() => { void loadOverview(); }, 0); return () => clearTimeout(timer); }, [loadOverview]);
  useEffect(() => { const timer = setTimeout(() => { void loadSeries(); }, 0); return () => clearTimeout(timer); }, [loadSeries]);
  useEffect(() => { const timer = setTimeout(() => { setPage(1); }, 0); return () => clearTimeout(timer); }, [range.from, range.to, sort, query]);
  useEffect(() => { const timer = setTimeout(() => { void loadTop(); }, 0); return () => clearTimeout(timer); }, [loadTop]);

  const presetOptions: { key: RangePreset; label: string }[] = [
    { key: 'today', label: t.baRangeToday },
    { key: '7d', label: t.baRange7d },
    { key: '30d', label: t.baRange30d },
    { key: '90d', label: t.baRange90d },
    { key: 'custom', label: t.baRangeCustom },
  ];

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'views', label: t.baSortViews },
    { key: 'clicks', label: t.baSortClicks },
    { key: 'recent', label: t.baSortRecent },
    { key: 'least', label: t.baSortLeast },
  ];

  const growthLabel = overview?.growthPct == null
    ? t.baGrowthNew
    : `${overview.growthPct >= 0 ? '↑' : '↓'} ${Math.abs(overview.growthPct).toLocaleString('id-ID', { maximumFractionDigits: 1 })}% ${t.baGrowthVsPrevious}`;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">{t.blogAnalyticsTitle}</h1>
          <p className="admin-subtitle">{t.blogAnalyticsSubtitle}</p>
        </div>
      </div>

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

      {overviewError ? (
        <div className="alert alert-error">
          {overviewError}
          <button type="button" className="button button-secondary" onClick={() => void loadOverview()}>{t.baRetry}</button>
        </div>
      ) : overviewLoading || !overview ? (
        <div className="admin-stat-grid">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />)}
        </div>
      ) : (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat-card tone-teal">
              <div className="admin-stat-card-top"><span>{t.baKpiTotalViews}</span></div>
              <div className="admin-stat-card-main">
                <strong>{formatCompact(overview.totalViews)}</strong>
                <span className="admin-stat-delta">{growthLabel}</span>
              </div>
              <p>{t.baViewsToday}: {formatCompact(overview.viewsToday)}</p>
            </div>
            <div className="admin-stat-card tone-ocean">
              <div className="admin-stat-card-top"><span>{t.baKpiUniqueVisitors}</span></div>
              <div className="admin-stat-card-main"><strong>{formatCompact(overview.totalUniqueVisitors)}</strong></div>
              <p>{t.baViews7d}: {formatCompact(overview.views7d)}</p>
            </div>
            <div className="admin-stat-card tone-gold">
              <div className="admin-stat-card-top"><span>{t.baKpiInteractions}</span></div>
              <div className="admin-stat-card-main"><strong>{formatCompact(overview.totalInteractions)}</strong></div>
              <p>{t.baViews30d}: {formatCompact(overview.views30d)}</p>
            </div>
            <div className="admin-stat-card tone-teal">
              <div className="admin-stat-card-top"><span>{t.baKpiTopArticle}</span></div>
              <div className="admin-stat-card-main">
                <strong style={{ fontSize: '1.15rem' }}>{overview.topArticle?.title ?? '—'}</strong>
              </div>
              <p>{overview.topArticle ? `${formatCompact(overview.topArticle.views)} views` : t.baEmptyState}</p>
            </div>
          </div>

          <div className="admin-analytics-subrow">
            <span>{t.baKpiTotalArtikel}: <strong>{overview.totalArticles}</strong></span>
            <span>{t.baKpiTotalPublished}: <strong>{overview.totalPublished}</strong></span>
            <span>{t.baKpiAvgViews}: <strong>{overview.avgViewsPerArticle.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</strong></span>
          </div>
        </>
      )}

      <section className="surface-card admin-analytics-panel">
        <div className="admin-analytics-panel-head">
          <h2 className="admin-card-title">{t.baTrafficChartTitle}</h2>
          <div className="admin-analytics-granularity">
            {(['day', 'week', 'month'] as Granularity[]).map((g) => (
              <button
                key={g}
                type="button"
                className={`button ${(granularity ?? seriesGranularity) === g ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setGranularity(g)}
              >
                {g === 'day' ? t.baGranularityDay : g === 'week' ? t.baGranularityWeek : t.baGranularityMonth}
              </button>
            ))}
          </div>
        </div>

        {seriesError ? (
          <div className="alert alert-error">
            {seriesError}
            <button type="button" className="button button-secondary" onClick={() => void loadSeries()}>{t.baRetry}</button>
          </div>
        ) : seriesLoading ? (
          <div className="skeleton" style={{ height: 220, borderRadius: 12 }} />
        ) : (
          <BlogTrafficChart
            data={series}
            granularity={seriesGranularity}
            viewsLabel={t.baLegendViews}
            visitorsLabel={t.baLegendVisitors}
            emptyLabel={t.baEmptyState}
          />
        )}
      </section>

      <section className="table-shell admin-analytics-panel">
        <div className="table-head">
          <h2 className="admin-card-title">{t.baTopArticlesTitle}</h2>
        </div>

        <div className="admin-analytics-top-controls">
          <div className="admin-search-field">
            <Search size={15} />
            <input
              type="search"
              className="admin-search-input"
              placeholder={t.baSearchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="control" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {sortOptions.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
          </select>
        </div>

        {topError ? (
          <div className="alert alert-error">
            {topError}
            <button type="button" className="button button-secondary" onClick={() => void loadTop()}>{t.baRetry}</button>
          </div>
        ) : topLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 12 }} />)}
          </div>
        ) : !top || top.items.length === 0 ? (
          <div className="empty-state">{t.baEmptyState}</div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.baColArticle}</th>
                    <th>{t.baColStatus}</th>
                    <th>{t.baColPublished}</th>
                    <th>{t.baColViews}</th>
                    <th>{t.baColVisitors}</th>
                    <th>{t.baColClicks}</th>
                    <th>{t.baColLastViewed}</th>
                  </tr>
                </thead>
                <tbody>
                  {top.items.map((item) => (
                    <tr key={item.id}>
                      <td data-label={t.baColArticle}>
                        <Link href={`/admin/blog/${item.id}/analytics`}>{item.title}</Link>
                      </td>
                      <td data-label={t.baColStatus}>
                        <span className="status-pill">{STATUS_LABEL_ID[item.status] ?? item.status}</span>
                      </td>
                      <td data-label={t.baColPublished} className="muted-small">{formatDateLabel(item.publishedAt)}</td>
                      <td data-label={t.baColViews}>{formatCompact(item.views)}</td>
                      <td data-label={t.baColVisitors}>{formatCompact(item.uniqueVisitors)}</td>
                      <td data-label={t.baColClicks}>{formatCompact(item.clicks)}</td>
                      <td data-label={t.baColLastViewed} className="muted-small">
                        {item.lastViewedAt ? formatDateLabel(item.lastViewedAt) : t.baNeverViewed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-analytics-pagination">
              <span className="muted-small">{top.pagination.total} artikel</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={page >= top.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
