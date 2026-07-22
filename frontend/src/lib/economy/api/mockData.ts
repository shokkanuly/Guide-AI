export type DataPoint = {
  date: string;
  value: number;
};

export type DataSource = 
  | 'FRED'
  | 'World Bank'
  | 'IMF'
  | 'OECD'
  | 'BLS'
  | 'Trading Economics';

export type EconomicIndicator = {
  id: string;
  title: string;
  description: string;
  unit: string;
  source: DataSource;
  data: DataPoint[];
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
};

export type CountryInfo = {
  code: string;
  name: string;
  flag: string;
  region: string;
};

export const COUNTRIES: CountryInfo[] = [
  { code: 'USA', name: 'United States', flag: '🇺🇸', region: 'Americas' },
  { code: 'GBR', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe' },
  { code: 'DEU', name: 'Germany', flag: '🇩🇪', region: 'Europe' },
  { code: 'FRA', name: 'France', flag: '🇫🇷', region: 'Europe' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵', region: 'Asia Pacific' },
  { code: 'CHN', name: 'China', flag: '🇨🇳', region: 'Asia Pacific' },
  { code: 'IND', name: 'India', flag: '🇮🇳', region: 'Asia Pacific' },
  { code: 'KAZ', name: 'Kazakhstan', flag: '🇰🇿', region: 'Asia Pacific' },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷', region: 'Americas' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', region: 'Americas' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', region: 'Asia Pacific' },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', region: 'Asia Pacific' },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽', region: 'Americas' },
  { code: 'ZAF', name: 'South Africa', flag: '🇿🇦', region: 'Africa' },
  { code: 'TUR', name: 'Turkey', flag: '🇹🇷', region: 'Europe' },
  { code: 'SAU', name: 'Saudi Arabia', flag: '🇸🇦', region: 'Middle East' },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', region: 'Americas' },
  { code: 'IDN', name: 'Indonesia', flag: '🇮🇩', region: 'Asia Pacific' },
  { code: 'RUS', name: 'Russia', flag: '🇷🇺', region: 'Europe' },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸', region: 'Europe' },
  { code: 'ITA', name: 'Italy', flag: '🇮🇹', region: 'Europe' },
];

// Realistic economic baselines per country [cpi, unemployment, gdp, interest, confidence, housing_idx]
const COUNTRY_BASELINES: Record<string, [number, number, number, number, number, number]> = {
  USA: [3.2, 3.8, 2.1, 5.33, 98.7, 4.2],
  GBR: [4.0, 4.2, 0.6, 5.25, 87.3, 3.1],
  DEU: [2.4, 3.0, 0.2, 4.50, 86.0, -1.8],
  FRA: [2.8, 7.3, 1.1, 4.50, 84.5, 0.8],
  JPN: [2.6, 2.5, 1.2, 0.10, 92.3, 2.4],
  CHN: [0.9, 5.0, 4.8, 3.45, 88.1, -3.2],
  IND: [5.1, 8.0, 7.8, 6.50, 107.2, 8.3],
  KAZ: [8.4, 4.8, 4.2, 14.75, 98.5, 5.2],
  BRA: [4.6, 7.8, 2.9, 10.50, 79.4, 5.1],
  CAN: [2.9, 6.1, 1.7, 5.00, 91.2, 1.6],
  AUS: [3.4, 4.1, 2.0, 4.35, 93.1, 5.8],
  KOR: [2.7, 2.9, 2.4, 3.50, 95.8, 3.2],
  MEX: [4.2, 2.8, 1.5, 11.00, 74.3, 6.7],
  ZAF: [5.5, 32.1, 0.8, 8.25, 64.2, 2.1],
  TUR: [65.0, 8.5, 3.2, 50.00, 52.1, 42.3],
  SAU: [1.8, 3.9, 2.6, 6.00, 102.3, 3.4],
  ARG: [289.0, 6.9, -2.5, 60.00, 38.2, 210.0],
  IDN: [3.0, 5.3, 5.0, 6.25, 82.4, 4.1],
  RUS: [7.8, 2.6, 2.2, 16.00, 61.3, 9.2],
  ESP: [3.2, 11.7, 2.0, 4.50, 82.7, 4.8],
  ITA: [1.3, 6.7, 0.7, 4.50, 81.4, 0.4],
};

export type MapMetric = 'inflation' | 'gdp' | 'unemployment' | 'housing';

// Returns { countryCode: metricValue } for all 20 countries
export function getAllCountryMetricValues(metric: MapMetric): Record<string, number> {
  const idx: Record<MapMetric, number> = { inflation: 0, unemployment: 1, gdp: 2, housing: 5 };
  const result: Record<string, number> = {};
  for (const [code, baseline] of Object.entries(COUNTRY_BASELINES)) {
    result[code] = baseline[idx[metric]];
  }
  return result;
}


const generateData = (
  startVal: number,
  volatility: number,
  months: number = 12,
  trend: 'up' | 'down' | 'stable' = 'stable'
): DataPoint[] => {
  const data: DataPoint[] = [];
  let currentVal = startVal;
  const trendFactor = trend === 'up' ? 0.05 : trend === 'down' ? -0.05 : 0;
  const today = new Date();

  for (let i = months; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value: Number(currentVal.toFixed(2)),
    });
    currentVal = currentVal + (Math.random() - 0.5) * volatility + trendFactor * startVal * 0.01;
    if (currentVal < 0) currentVal = Math.max(0.01, currentVal);
  }
  return data;
};

const computeTrend = (data: DataPoint[]): 'up' | 'down' | 'stable' => {
  if (data.length < 3) return 'stable';
  const recent = data.slice(-3);
  const avg = (recent[2].value - recent[0].value) / recent[0].value;
  if (avg > 0.01) return 'up';
  if (avg < -0.01) return 'down';
  return 'stable';
};

export const computeHealthScore = (
  cpi: number,
  unemployment: number,
  gdp: number,
  interest: number
): number => {
  // Lower inflation is better (target ~2%)
  const inflationScore = Math.max(0, 100 - Math.abs(cpi - 2) * 5);
  // Lower unemployment is better
  const unemploymentScore = Math.max(0, 100 - unemployment * 3);
  // Higher GDP is better
  const gdpScore = Math.min(100, Math.max(0, 50 + gdp * 8));
  // Interest rates: moderate is best (~3-5%)
  const interestScore = Math.max(0, 100 - Math.abs(interest - 4) * 4);

  return Math.round((inflationScore * 0.3 + unemploymentScore * 0.3 + gdpScore * 0.25 + interestScore * 0.15));
};

export const getMockIndicators = async (country: string = 'USA'): Promise<EconomicIndicator[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  const baseline = COUNTRY_BASELINES[country] || COUNTRY_BASELINES['USA'];
  const [cpi, unemployment, gdp, interest, confidence, housing] = baseline;

  const cpiData = generateData(cpi, cpi * 0.04, 12, 'stable');
  const unemploymentData = generateData(unemployment, unemployment * 0.02, 12, 'stable');
  const gdpData = generateData(gdp, Math.abs(gdp) * 0.1, 12, gdp > 0 ? 'up' : 'down');
  const interestData = generateData(interest, interest * 0.02, 12, 'stable');
  const confidenceData = generateData(confidence, confidence * 0.02, 12, 'stable');
  const housingData = generateData(housing, Math.abs(housing) * 0.05, 12, housing > 0 ? 'up' : 'down');

  return [
    {
      id: 'inflation',
      title: 'CPI Inflation',
      description: 'Consumer Price Index — annual % change',
      unit: '%',
      source: 'FRED',
      data: cpiData,
      currentValue: cpiData[cpiData.length - 1].value,
      trend: computeTrend(cpiData),
    },
    {
      id: 'unemployment',
      title: 'Unemployment Rate',
      description: 'Seasonally adjusted, % of labor force',
      unit: '%',
      source: 'BLS',
      data: unemploymentData,
      currentValue: unemploymentData[unemploymentData.length - 1].value,
      trend: computeTrend(unemploymentData),
    },
    {
      id: 'gdp',
      title: 'GDP Growth',
      description: 'Real GDP annual growth rate',
      unit: '%',
      source: 'World Bank',
      data: gdpData,
      currentValue: gdpData[gdpData.length - 1].value,
      trend: computeTrend(gdpData),
    },
    {
      id: 'interest',
      title: 'Interest Rate',
      description: 'Central bank benchmark rate',
      unit: '%',
      source: 'FRED',
      data: interestData,
      currentValue: interestData[interestData.length - 1].value,
      trend: computeTrend(interestData),
    },
    {
      id: 'confidence',
      title: 'Consumer Confidence',
      description: 'Consumer confidence index (OECD)',
      unit: '',
      source: 'OECD',
      data: confidenceData,
      currentValue: confidenceData[confidenceData.length - 1].value,
      trend: computeTrend(confidenceData),
    },
    {
      id: 'housing',
      title: 'Housing Price Index',
      description: 'Residential property price growth %',
      unit: '%',
      source: 'Trading Economics',
      data: housingData,
      currentValue: housingData[housingData.length - 1].value,
      trend: computeTrend(housingData),
    },
  ];
};

export const getAllCountryScores = async (): Promise<Record<string, number>> => {
  const scores: Record<string, number> = {};
  for (const country of COUNTRIES) {
    const baseline = COUNTRY_BASELINES[country.code] || COUNTRY_BASELINES['USA'];
    const [cpi, unemployment, gdp, interest] = baseline;
    scores[country.code] = computeHealthScore(cpi, unemployment, gdp, interest);
  }
  return scores;
};
