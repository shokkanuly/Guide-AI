import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/economy/gemini';
import { fetchRealIndicators } from '@/lib/economy/api/fetchRealData';
import { unstable_cache, revalidateTag } from 'next/cache';

// Next.js data cache wrapper for Gemini API
const getCachedForecast = (country: string, indicators: any) => unstable_cache(
  async () => {
    const client = getGeminiClient();

    const summaryLines = indicators.map((ind: any) =>
      `- ${ind.title}: ${ind.currentValue?.toFixed?.(2) ?? ind.currentValue}${ind.unit} (trend: ${ind.trend}, source: ${ind.source})`
    ).join('\n');

    const prompt = `You are an expert macroeconomist. Analyze the following economic data for ${country} and provide a structured 3-month forecast.

CURRENT DATA:
${summaryLines}

Respond ONLY with a valid JSON object (no markdown, no code blocks) in exactly this format:
{
  "outlook": ["sentence 1", "sentence 2", "sentence 3"],
  "risks": ["risk 1", "risk 2"],
  "opportunities": ["opportunity 1", "opportunity 2"]
}

Each sentence should reference specific numbers from the data. Keep sentences concise (max 20 words each).`;

    if (!client) {
      const cpi = indicators.find((i: any) => i.id === 'inflation')?.currentValue ?? 3;
      const gdp = indicators.find((i: any) => i.id === 'gdp')?.currentValue ?? 2;
      const unemployment = indicators.find((i: any) => i.id === 'unemployment')?.currentValue ?? 5;
      const interest = indicators.find((i: any) => i.id === 'interest')?.currentValue ?? 5;

      return {
        outlook: [
          `${country} inflation at ${cpi.toFixed(1)}% — central bank expected to maintain current stance.`,
          `GDP growth of ${gdp.toFixed(1)}% suggests ${gdp > 2 ? 'robust' : 'sluggish'} economic momentum next quarter.`,
          `Unemployment at ${unemployment.toFixed(1)}% — labor market ${unemployment < 5 ? 'remains tight' : 'shows slack'}.`,
        ],
        risks: [
          `High interest rates at ${interest.toFixed(2)}% may dampen consumer spending.`,
          'Global uncertainty could slow export growth.',
        ],
        opportunities: [
          'Technology investment remains resilient despite macro headwinds.',
          `${gdp > 3 ? 'Strong' : 'Moderate'} growth creates openings for strategic investment.`,
        ],
      };
    }

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    return JSON.parse(jsonMatch[0]);
  },
  ['forecast', country],
  {
    revalidate: 600, // 10 minutes cache TTL
    tags: ['forecast', `forecast-${country.toLowerCase()}`],
  }
)();

async function handleForecast(country: string, refresh: boolean, indicatorsInput?: any) {
  const cacheTag = `forecast-${country.toLowerCase()}`;
  if (refresh) {
    revalidateTag(cacheTag, 'max');
  }

  // If indicators are not provided, fetch them server-side
  const indicators = indicatorsInput ?? (await fetchRealIndicators(country));
  return await getCachedForecast(country, indicators);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') ?? 'USA';
    const refresh = searchParams.get('refresh') === 'true';

    const data = await handleForecast(country, refresh);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleForecastError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { indicators, country } = await req.json();
    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get('refresh') === 'true';

    const data = await handleForecast(country, refresh, indicators);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleForecastError(error);
  }
}

function handleForecastError(error: any) {
  console.error('Forecast API Error:', error);

  const isRateLimit = error instanceof Error && 
    (error.message.includes('429') || 
     error.message.includes('RESOURCE_EXHAUSTED') || 
     (error as any).status === 429 || 
     (error as any).code === 429);

  if (isRateLimit) {
    return NextResponse.json(
      { 
        error: 'Gemini API rate limit exceeded (free tier limit is 5 requests/min). Please try again in a minute.', 
        outlook: [], 
        risks: [], 
        opportunities: [] 
      },
      { status: 429 }
    );
  }

  return NextResponse.json(
    { error: 'Failed to generate forecast', outlook: [], risks: [], opportunities: [] },
    { status: 500 }
  );
}
