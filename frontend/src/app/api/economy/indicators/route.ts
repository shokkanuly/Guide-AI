import { NextResponse } from 'next/server';
import { fetchRealIndicators } from '@/lib/economy/api/fetchRealData';

// Simple in-memory cache (process-level, survives across requests in a single server instance)
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = (searchParams.get('country') ?? 'USA').toUpperCase();

  // Check cache
  const cached = cache.get(country);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ indicators: cached.data, fromCache: true });
  }

  try {
    const indicators = await fetchRealIndicators(country);
    cache.set(country, { data: indicators, ts: Date.now() });
    return NextResponse.json({ indicators, fromCache: false });
  } catch (error: any) {
    console.error('economic-data route error:', error);
    return NextResponse.json({ error: error.message ?? 'Failed to fetch data' }, { status: 500 });
  }
}
