/**
 * Server-only module: fetches real economic data from FRED and World Bank.
 * Never import this directly in client components.
 *
 * Data sources:
 *  - FRED (Federal Reserve) → US data, monthly/quarterly. Requires FRED_API_KEY.
 *  - World Bank Open Data  → All countries, annual. No key required.
 *  - OECD SDMX-JSON API   → OECD members consumer confidence. No key required.
 */

export type DataPoint = { date: string; value: number };
export type DataFrequency = 'monthly' | 'quarterly' | 'annual' | 'simulated';

export interface RealIndicator {
  id: string;
  title: string;
  description: string;
  unit: string;
  source: string;
  sourceUrl: string;
  dataFrequency: DataFrequency;
  lastPublished: string | null; // ISO date string of most recent observation
  data: DataPoint[];
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
  isRealData: boolean;
}

// Map our 3-letter codes → World Bank ISO-2 codes
const ISO2: Record<string, string> = {
  USA:'US', GBR:'GB', DEU:'DE', FRA:'FR', JPN:'JP', CHN:'CN', IND:'IN', KAZ:'KZ',
  BRA:'BR', CAN:'CA', AUS:'AU', KOR:'KR', MEX:'MX', ZAF:'ZA', TUR:'TR',
  SAU:'SA', ARG:'AR', IDN:'ID', RUS:'RU', ESP:'ES', ITA:'IT',
};

// Current known central bank interest rates (updated infrequently)
const CENTRAL_BANK_RATES: Record<string, number> = {
  USA:5.33, GBR:5.25, DEU:4.50, FRA:4.50, JPN:0.10, CHN:3.45, IND:6.50, KAZ:14.75,
  BRA:10.50, CAN:5.00, AUS:4.35, KOR:3.50, MEX:11.00, ZAF:8.25, TUR:50.00,
  SAU:6.00, ARG:60.00, IDN:6.25, RUS:16.00, ESP:4.50, ITA:4.50,
};

// FRED series IDs for US data
const FRED_SERIES = {
  inflation:    { id: 'CPIAUCSL',      units: 'pc1',  title: 'CPI Inflation',         description: 'Consumer Price Index, YoY % change',            unit: '%', source: 'FRED / BLS',           sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL' },
  unemployment: { id: 'UNRATE',        units: 'lin',  title: 'Unemployment Rate',     description: 'Civilian unemployment rate, seasonally adjusted', unit: '%', source: 'FRED / BLS',           sourceUrl: 'https://fred.stlouisfed.org/series/UNRATE' },
  gdp:          { id: 'A191RL1Q225SBEA',units:'lin',  title: 'GDP Growth',            description: 'Real GDP growth rate, SAAR (quarterly)',          unit: '%', source: 'FRED / BEA',           sourceUrl: 'https://fred.stlouisfed.org/series/A191RL1Q225SBEA' },
  interest:     { id: 'FEDFUNDS',      units: 'lin',  title: 'Interest Rate',         description: 'Federal Funds Effective Rate',                   unit: '%', source: 'FRED / Federal Reserve',sourceUrl: 'https://fred.stlouisfed.org/series/FEDFUNDS' },
  confidence:   { id: 'UMCSENT',       units: 'lin',  title: 'Consumer Confidence',   description: 'University of Michigan Consumer Sentiment Index', unit: '',  source: 'FRED / U. Michigan',   sourceUrl: 'https://fred.stlouisfed.org/series/UMCSENT' },
  housing:      { id: 'CSUSHPINSA',    units: 'pc1',  title: 'Housing Price Index',   description: 'S&P/Case-Shiller US National Home Price, YoY %',  unit: '%', source: 'FRED / S&P',           sourceUrl: 'https://fred.stlouisfed.org/series/CSUSHPINSA' },
};

// World Bank indicator codes
const WB_INDICATORS = {
  inflation:    { id: 'FP.CPI.TOTL.ZG',   title: 'CPI Inflation',     description: 'Inflation, consumer prices (annual %)', unit: '%', source: 'World Bank', sourceUrl: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG' },
  unemployment: { id: 'SL.UEM.TOTL.ZS',   title: 'Unemployment Rate', description: 'Unemployment, total (% of labor force)', unit: '%', source: 'World Bank / ILO', sourceUrl: 'https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS' },
  gdp:          { id: 'NY.GDP.MKTP.KD.ZG', title: 'GDP Growth',        description: 'GDP growth (annual %)',                  unit: '%', source: 'World Bank', sourceUrl: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG' },
};

// ---------- helpers ----------

function computeTrend(data: DataPoint[]): 'up' | 'down' | 'stable' {
  if (data.length < 3) return 'stable';
  const recent = data.slice(-3);
  const diff = (recent[2].value - recent[0].value) / Math.abs(recent[0].value || 1);
  if (diff > 0.01) return 'up';
  if (diff < -0.01) return 'down';
  return 'stable';
}

function formatFredDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

function formatWbDate(year: string): string {
  return `Jan ${year.slice(2)}`; // "2023" → "Jan 23"
}

// ---------- FRED fetcher ----------

async function fetchFredSeries(
  seriesId: string,
  units: string,
  apiKey: string,
  limit = 14,
): Promise<{ data: DataPoint[]; lastPublished: string | null }> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    units,
    limit: String(limit),
    sort_order: 'desc',
    file_type: 'json',
  });

  const url = `https://api.stlouisfed.org/fred/series/observations?${params}`;
  const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 h
  if (!res.ok) throw new Error(`FRED ${seriesId} → HTTP ${res.status}`);

  const json = await res.json();
  const observations: Array<{ date: string; value: string }> = json.observations ?? [];

  const points: DataPoint[] = observations
    .filter(o => o.value !== '.' && !isNaN(parseFloat(o.value)))
    .map(o => ({ date: formatFredDate(o.date), value: parseFloat(parseFloat(o.value).toFixed(2)) }))
    .reverse(); // oldest first

  const lastPublished = observations.find(o => o.value !== '.')?.date ?? null;
  return { data: points, lastPublished };
}

// ---------- World Bank fetcher ----------

async function fetchWorldBank(
  iso2: string,
  indicatorId: string,
  limit = 12,
): Promise<{ data: DataPoint[]; lastPublished: string | null }> {
  const url = `https://api.worldbank.org/v2/country/${iso2}/indicator/${indicatorId}?format=json&mrv=${limit}&per_page=${limit}`;
  const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24 h (annual data)
  if (!res.ok) throw new Error(`World Bank ${indicatorId} (${iso2}) → HTTP ${res.status}`);

  const json = await res.json();
  const rows: Array<{ date: string; value: number | null }> = (json[1] ?? []).filter(
    (r: any) => r.value !== null && r.value !== undefined,
  );

  const points: DataPoint[] = rows
    .map(r => ({ date: formatWbDate(r.date), value: parseFloat(r.value!.toFixed(2)) }))
    .reverse();

  const lastPublished = rows.length > 0 ? rows[0].date : null;
  return { data: points, lastPublished };
}

// ---------- mock fallback generator ----------

function mockSeries(start: number, volatility: number, months = 12): DataPoint[] {
  let val = start;
  const today = new Date();
  return Array.from({ length: months + 1 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (months - i), 1);
    const point = { date: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), value: parseFloat(val.toFixed(2)) };
    val += (Math.random() - 0.5) * volatility;
    if (val < 0) val = 0.01;
    return point;
  });
}

// ---------- main export ----------

export async function fetchRealIndicators(country: string): Promise<RealIndicator[]> {
  const apiKey = process.env.FRED_API_KEY;
  const iso2 = ISO2[country] ?? 'US';
  const isUSA = country === 'USA';

  const results: RealIndicator[] = [];

  // ── INFLATION ──────────────────────────────────────────────────────────
  try {
    if (isUSA && apiKey) {
      const { data, lastPublished } = await fetchFredSeries(FRED_SERIES.inflation.id, FRED_SERIES.inflation.units, apiKey);
      const cv = data[data.length - 1]?.value ?? 3.2;
      results.push({ ...FRED_SERIES.inflation, id: 'inflation', dataFrequency: 'monthly', lastPublished, data, currentValue: cv, trend: computeTrend(data), isRealData: true });
    } else {
      const { data, lastPublished } = await fetchWorldBank(iso2, WB_INDICATORS.inflation.id);
      const cv = data[data.length - 1]?.value ?? 3;
      results.push({ ...WB_INDICATORS.inflation, id: 'inflation', dataFrequency: 'annual', lastPublished, data, currentValue: cv, trend: computeTrend(data), isRealData: true });
    }
  } catch {
    const data = mockSeries(3.2, 0.4);
    results.push({ id: 'inflation', title: 'CPI Inflation', description: 'Consumer Price Index (simulated)', unit: '%', source: 'Simulated', sourceUrl: '', dataFrequency: 'simulated', lastPublished: null, data, currentValue: data[data.length - 1].value, trend: computeTrend(data), isRealData: false });
  }

  // ── UNEMPLOYMENT ──────────────────────────────────────────────────────
  try {
    if (isUSA && apiKey) {
      const { data, lastPublished } = await fetchFredSeries(FRED_SERIES.unemployment.id, FRED_SERIES.unemployment.units, apiKey);
      const cv = data[data.length - 1]?.value ?? 3.8;
      results.push({ ...FRED_SERIES.unemployment, id: 'unemployment', dataFrequency: 'monthly', lastPublished, data, currentValue: cv, trend: computeTrend(data), isRealData: true });
    } else {
      const { data, lastPublished } = await fetchWorldBank(iso2, WB_INDICATORS.unemployment.id);
      const cv = data[data.length - 1]?.value ?? 5;
      results.push({ ...WB_INDICATORS.unemployment, id: 'unemployment', dataFrequency: 'annual', lastPublished, data, currentValue: cv, trend: computeTrend(data), isRealData: true });
    }
  } catch {
    const data = mockSeries(3.8, 0.2);
    results.push({ id: 'unemployment', title: 'Unemployment Rate', description: 'Unemployment rate (simulated)', unit: '%', source: 'Simulated', sourceUrl: '', dataFrequency: 'simulated', lastPublished: null, data, currentValue: data[data.length - 1].value, trend: computeTrend(data), isRealData: false });
  }

  // ── GDP GROWTH ────────────────────────────────────────────────────────
  try {
    if (isUSA && apiKey) {
      const { data, lastPublished } = await fetchFredSeries(FRED_SERIES.gdp.id, FRED_SERIES.gdp.units, apiKey, 8);
      const cv = data[data.length - 1]?.value ?? 2.1;
      results.push({ ...FRED_SERIES.gdp, id: 'gdp', dataFrequency: 'quarterly', lastPublished, data, currentValue: cv, trend: computeTrend(data), isRealData: true });
    } else {
      const { data, lastPublished } = await fetchWorldBank(iso2, WB_INDICATORS.gdp.id);
      const cv = data[data.length - 1]?.value ?? 2;
      results.push({ ...WB_INDICATORS.gdp, id: 'gdp', dataFrequency: 'annual', lastPublished, data, currentValue: cv, trend: computeTrend(data), isRealData: true });
    }
  } catch {
    const data = mockSeries(2.1, 0.5);
    results.push({ id: 'gdp', title: 'GDP Growth', description: 'Real GDP growth (simulated)', unit: '%', source: 'Simulated', sourceUrl: '', dataFrequency: 'simulated', lastPublished: null, data, currentValue: data[data.length - 1].value, trend: computeTrend(data), isRealData: false });
  }

  // ── INTEREST RATE ─────────────────────────────────────────────────────
  try {
    if (isUSA && apiKey) {
      const { data, lastPublished } = await fetchFredSeries(FRED_SERIES.interest.id, FRED_SERIES.interest.units, apiKey);
      const cv = data[data.length - 1]?.value ?? 5.33;
      results.push({ ...FRED_SERIES.interest, id: 'interest', dataFrequency: 'monthly', lastPublished, data, currentValue: cv, trend: computeTrend(data), isRealData: true });
    } else {
      // Use known central bank rate as baseline with slight mock variation
      const baseRate = CENTRAL_BANK_RATES[country] ?? 5;
      const data = mockSeries(baseRate, baseRate * 0.015);
      results.push({ id: 'interest', title: 'Interest Rate', description: 'Central bank benchmark rate (estimated)', unit: '%', source: 'Central Bank (Est.)', sourceUrl: '', dataFrequency: 'simulated', lastPublished: null, data, currentValue: baseRate, trend: 'stable', isRealData: false });
    }
  } catch {
    const data = mockSeries(5.33, 0.1);
    results.push({ id: 'interest', title: 'Interest Rate', description: 'Interest rate (simulated)', unit: '%', source: 'Simulated', sourceUrl: '', dataFrequency: 'simulated', lastPublished: null, data, currentValue: data[data.length - 1].value, trend: computeTrend(data), isRealData: false });
  }

  // ── CONSUMER CONFIDENCE ───────────────────────────────────────────────
  try {
    if (isUSA && apiKey) {
      const { data, lastPublished } = await fetchFredSeries(FRED_SERIES.confidence.id, FRED_SERIES.confidence.units, apiKey);
      const cv = data[data.length - 1]?.value ?? 70;
      results.push({ ...FRED_SERIES.confidence, id: 'confidence', dataFrequency: 'monthly', lastPublished, data, currentValue: cv, trend: computeTrend(data), isRealData: true });
    } else {
      // Try OECD consumer confidence for non-US countries
      const oecd = await fetchOecdConfidence(country);
      if (oecd.data.length > 0) {
        const cv = oecd.data[oecd.data.length - 1].value;
        results.push({ id: 'confidence', title: 'Consumer Confidence', description: 'OECD Consumer Confidence Index (amplitude adjusted)', unit: '', source: 'OECD', sourceUrl: 'https://stats.oecd.org', dataFrequency: 'monthly', lastPublished: oecd.lastPublished, data: oecd.data, currentValue: cv, trend: computeTrend(oecd.data), isRealData: true });
      } else throw new Error('No OECD data');
    }
  } catch {
    const base = 85 + Math.random() * 20;
    const data = mockSeries(base, base * 0.02);
    results.push({ id: 'confidence', title: 'Consumer Confidence', description: 'Consumer confidence index (simulated)', unit: '', source: 'Simulated', sourceUrl: '', dataFrequency: 'simulated', lastPublished: null, data, currentValue: data[data.length - 1].value, trend: computeTrend(data), isRealData: false });
  }

  // ── HOUSING ───────────────────────────────────────────────────────────
  try {
    if (isUSA && apiKey) {
      const { data, lastPublished } = await fetchFredSeries(FRED_SERIES.housing.id, FRED_SERIES.housing.units, apiKey);
      const cv = data[data.length - 1]?.value ?? 4;
      results.push({ ...FRED_SERIES.housing, id: 'housing', dataFrequency: 'monthly', lastPublished, data, currentValue: cv, trend: computeTrend(data), isRealData: true });
    } else {
      throw new Error('Housing data not available for non-US via free API');
    }
  } catch {
    const base = 3 + Math.random() * 4;
    const data = mockSeries(base, base * 0.1);
    results.push({ id: 'housing', title: 'Housing Price Index', description: 'Residential property price growth % (estimated)', unit: '%', source: 'Estimated', sourceUrl: '', dataFrequency: 'simulated', lastPublished: null, data, currentValue: data[data.length - 1].value, trend: computeTrend(data), isRealData: false });
  }

  return results;
}

// ---------- OECD consumer confidence ----------

const OECD_COUNTRY_CODES: Record<string, string> = {
  GBR:'GBR', DEU:'DEU', FRA:'FRA', JPN:'JPN', CAN:'CAN', AUS:'AUS',
  KOR:'KOR', MEX:'MEX', TUR:'TUR', IDN:'IDN', ESP:'ESP', ITA:'ITA',
  BRA:'BRA', IND:'IND', ZAF:'ZAF',
};

async function fetchOecdConfidence(country: string): Promise<{ data: DataPoint[]; lastPublished: string | null }> {
  const code = OECD_COUNTRY_CODES[country];
  if (!code) throw new Error('Country not in OECD');

  const url = `https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,4.0/${code}.M.LI.AA.AMPLOP.....?startPeriod=2023-01&format=csvfilewithlabels`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`OECD HTTP ${res.status}`);

  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('Empty OECD response');

  // CSV: first line is headers, rest are data
  const points: DataPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    // Columns may vary; find TIME_PERIOD and OBS_VALUE
    const headers = lines[0].split(',');
    const timeIdx = headers.findIndex(h => h.includes('TIME_PERIOD'));
    const valIdx = headers.findIndex(h => h.includes('OBS_VALUE'));
    if (timeIdx < 0 || valIdx < 0) break;

    const period = cols[timeIdx]?.replace(/"/g, '').trim(); // e.g. "2024-03"
    const val = parseFloat(cols[valIdx]?.replace(/"/g, '').trim());
    if (period && !isNaN(val)) {
      const [year, month] = period.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      points.push({ date: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), value: parseFloat(val.toFixed(2)) });
    }
  }

  const lastPublished = points.length > 0 ? points[points.length - 1].date : null;
  return { data: points.slice(-13), lastPublished };
}
