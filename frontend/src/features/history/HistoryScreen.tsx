import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fetchSettings, type Settings } from '../../api/days.ts';
import { Footer } from '../../components/Footer/Footer.tsx';
import { Bone, Loading } from '../../components/Skeleton/Skeleton.tsx';
import { fetchHistory, type History } from '../../api/history.ts';
import {
  addDays,
  counts,
  dateRange,
  formatWeekRange,
  isoWeek,
  monthEnd,
  monthName,
  monthStart,
  monthSummaries,
  shiftMonth,
  summarize,
  weekStart,
} from '../../domain/history.ts';
import { berlinLogicalDate } from '../../domain/time.ts';
import { BalanceCard } from './BalanceCard.tsx';
import { MonthView } from './MonthView.tsx';
import { WeekView } from './WeekView.tsx';
import { MonthList, YearBars } from './YearView.tsx';
import styles from './History.module.css';

type View = 'week' | 'month' | 'year';

const VIEWS: { id: View; label: string }[] = [
  { id: 'week', label: 'Woche' },
  { id: 'month', label: 'Monat' },
  { id: 'year', label: 'Jahr' },
];

function period(view: View, anchor: string): { from: string; to: string } {
  if (view === 'week') {
    const from = weekStart(anchor);
    return { from, to: addDays(from, 6) };
  }
  if (view === 'month') {
    return { from: monthStart(anchor), to: monthEnd(anchor) };
  }
  const year = anchor.slice(0, 4);
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

function shift(view: View, anchor: string, step: -1 | 1): string {
  if (view === 'week') {
    return addDays(anchor, step * 7);
  }
  if (view === 'month') {
    return shiftMonth(anchor, step);
  }
  return `${String(Number(anchor.slice(0, 4)) + step)}-01-01`;
}

/** Screens 13–15: history by week, month and year (BRIEFING §11). */
export function HistoryScreen({
  onOpenDay = () => undefined,
}: {
  /** Opens a day on the "Heute" tab (D-178); older days there are read only. */
  onOpenDay?: (date: string, isToday: boolean) => void;
} = {}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState<string | null>(null);
  // Logical today from the device clock, known before any history arrives (limits "Weiter").
  const [today, setToday] = useState<string | null>(null);
  const [data, setData] = useState<{ key: string; history: History } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        const now = berlinLogicalDate(new Date(), s.dayBoundaryMin);
        setSettings(s);
        setToday(now);
        setAnchor(now);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Verlauf konnte nicht geladen werden.');
      });
  }, []);

  const range = anchor === null ? null : period(view, anchor);
  const key = range === null ? '' : `${range.from}_${range.to}`;

  useEffect(() => {
    if (range === null) {
      return;
    }
    let cancelled = false;
    fetchHistory(range.from, range.to)
      .then((history) => {
        if (!cancelled) {
          setData({ key: `${range.from}_${range.to}`, history });
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Verlauf konnte nicht geladen werden.');
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the key covers the range
  }, [key]);

  const history = data?.key === key ? data.history : null;
  const tolerance = settings?.tolerancePct ?? 5;
  const days = useMemo(() => new Map((history?.days ?? []).map((d) => [d.date, d])), [history]);
  const summary = useMemo(() => summarize(history?.days ?? [], tolerance), [history, tolerance]);

  const segment = (
    <div className={styles['segment']} role="group" aria-label="Zeitraum">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          aria-pressed={view === v.id}
          onClick={() => {
            setView(v.id);
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
  );

  if (range === null || anchor === null || today === null) {
    return (
      <div className={styles['screen']}>
        <h1 className={styles['title']}>Verlauf</h1>
        {segment}
        {error !== null ? (
          <p role="alert">{error}</p>
        ) : (
          <>
            <div className={styles['nav']} aria-hidden="true">
              <Bone width={48} height={48} radius="pill" />
              <Bone width={120} height={20} />
              <Bone width={48} height={48} radius="pill" />
            </div>
            <HistorySkeleton title={null} />
          </>
        )}
        <Footer />
      </div>
    );
  }

  const atEnd = range.to >= today;
  const counted = (history?.days ?? []).filter(counts);
  const proteinTarget = counted.length === 0 ? null : summary.targets.protein / counted.length;
  const year = anchor.slice(0, 4);
  const label =
    view === 'week'
      ? { main: `KW ${String(isoWeek(range.from).week)}`, sub: formatWeekRange(range.from, range.to) }
      : view === 'month'
        ? { main: `${monthName(range.from)} ${range.from.slice(0, 4)}`, sub: null }
        : { main: year, sub: null };
  const names = {
    week: ['Vorherige Woche', 'Nächste Woche'],
    month: ['Vorheriger Monat', 'Nächster Monat'],
    year: ['Vorheriges Jahr', 'Nächstes Jahr'],
  }[view];
  const running = range.to >= today ? ' bis heute' : '';
  const title = { week: 'Wochenbilanz', month: `Monatsbilanz${running}`, year: `Jahresbilanz${running}` }[
    view
  ];
  const months = view === 'year' ? monthSummaries(history?.days ?? [], tolerance) : [];

  return (
    <div className={styles['screen']}>
      <h1 className={styles['title']}>Verlauf</h1>
      {segment}

      <div className={styles['nav']}>
        <button
          type="button"
          className={styles['navButton']}
          aria-label={names[0]}
          onClick={() => {
            setAnchor(shift(view, anchor, -1));
          }}
        >
          <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <div className={styles['navLabel']} aria-live="polite">
          <span>{label.main}</span>
          {label.sub !== null && <small>{label.sub}</small>}
        </div>
        <button
          type="button"
          className={styles['navButton']}
          aria-label={names[1]}
          disabled={atEnd}
          onClick={() => {
            setAnchor(shift(view, anchor, 1));
          }}
        >
          <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      {error !== null && <p role="alert">{error}</p>}
      {history === null && error === null && <HistorySkeleton title={title} />}

      {history !== null && (
        <>
          <BalanceCard
            title={title}
            summary={summary}
            proteinTarget={proteinTarget}
            asPercent={view === 'year'}
          >
            {view === 'year' && <YearBars year={year} months={months} tolerancePct={tolerance} />}
          </BalanceCard>
          {view === 'week' && (
            <WeekView
              dates={dateRange(range.from, range.to)}
              days={days}
              summary={summary}
              tolerancePct={tolerance}
              today={history.today}
              onOpenDay={onOpenDay}
            />
          )}
          {view === 'month' && (
            <MonthView
              dates={dateRange(range.from, range.to)}
              days={days}
              tolerancePct={tolerance}
              today={history.today}
              onOpenDay={onOpenDay}
            />
          )}
          {view === 'year' && <MonthList months={months} />}
        </>
      )}
      <Footer />
    </div>
  );
}

/** Loading state in the final layout (D-157): balance card with bones, then the block for table/calendar/bars. */
function HistorySkeleton({ title }: { title: string | null }) {
  return (
    <Loading className={styles['skeleton']}>
      <section className={styles['card']}>
        {title === null ? <Bone width="40%" height={12} /> : <h2 className={styles['cardTitle']}>{title}</h2>}
        <div className={styles['figures']}>
          <div className={styles['figure']}>
            <Bone width={130} height={36} />
            <Bone width={90} height={12} />
          </div>
          <div className={`${styles['figure'] ?? ''} ${styles['boneRight'] ?? ''}`}>
            <Bone width={96} height={36} />
            <Bone width={72} height={12} />
          </div>
        </div>
        <div className={styles['tiles']}>
          {[0, 1, 2].map((i) => (
            <Bone key={i} height={58} radius="card" />
          ))}
        </div>
      </section>
      <Bone height={240} radius="card" />
    </Loading>
  );
}
