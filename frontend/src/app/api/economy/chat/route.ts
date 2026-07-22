import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/economy/gemini';

export async function POST(req: Request) {
  try {
    const { messages, contextData, country, parentMode, language } = await req.json();

    const client = getGeminiClient();

    // Build rich dashboard context
    const indicatorSummary = Array.isArray(contextData)
      ? contextData.map((ind: any) => {
          const latest = ind.currentValue ?? ind.data?.[ind.data.length - 1]?.value ?? 'N/A';
          return `  • ${ind.title}: ${typeof latest === 'number' ? latest.toFixed(2) : latest}${ind.unit} | Trend: ${ind.trend ?? 'stable'} | Source: ${ind.source ?? 'N/A'}`;
        }).join('\n')
      : JSON.stringify(contextData, null, 2);

    const langName = language === 'kk' ? 'Kazakh' : language === 'ru' ? 'Russian' : 'English';
    const systemInstruction = `You are EconPulse AI — an expert macroeconomic analyst. You are currently analyzing ${country ?? 'the selected country'}.
    
    You MUST respond in ${langName}. Do not respond in other languages. If writing in Kazakh or Russian, keep the tone appropriate and translate financial concepts correctly.
    
LIVE DASHBOARD DATA (as of now):
${indicatorSummary}

DATA SOURCES ON THIS DASHBOARD:
  - CPI Inflation → Federal Reserve Economic Data (FRED) & U.S. Bureau of Labor Statistics (BLS)
  - GDP Growth → World Bank Data
  - Unemployment Rate → BLS / OECD Data Explorer
  - Interest Rate → FRED
  - Consumer Confidence → OECD Data Explorer
  - Housing Price Index → Trading Economics API

MODE:
  - ${parentMode ? 'Parent Mode is ACTIVE. Write in simple, family-budget terms (groceries, school supply costs, gas, milk, heating, mortgages, jobs security) with zero complex financial jargon. Explain macro concepts using warm family-budget analogies.' : 'Youth Mode is ACTIVE. Write in engaging terms for young people aged 14-25 (allowance, daily expenses, part-time savings, university tuition, technology purchases, coding, and first jobs).'}

INSTRUCTIONS:
1. Always reference specific numbers from the dashboard data above when answering. For example: "CPI inflation is currently X% in ${country}."
2. If asked about a metric visible on the dashboard, quote the exact value from the context.
3. Explain concepts in plain language. Use analogies when helpful.
4. When relevant, explain how the current data affects ordinary people (jobs, savings, mortgages, groceries).
5. Be concise — 2-4 paragraphs max unless the user asks for more detail.
6. Mention the data source when citing a specific metric.`;

    if (!client) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const cpi = contextData?.find?.((i: any) => i.id === 'inflation')?.currentValue ?? 'N/A';
      const gdp = contextData?.find?.((i: any) => i.id === 'gdp')?.currentValue ?? 'N/A';
      
      if (language === 'kk') {
        if (parentMode) {
          return NextResponse.json({
            message: `[Имитациялық режим — тікелей ИИ үшін GEMINI_API_KEY қосыңыз]\n\n${country ?? 'Таңдалған ел'} үшін ағымдағы отбасылық бюджет тақтасына негізделген:\n\n• Азық-түлік құны (Тұтыну бағаларының инфляциясы): ${typeof cpi === 'number' ? cpi.toFixed(2) + '%' : cpi}\n• Жұмыс сенімділігі (ЖІӨ өсуі): ${typeof gdp === 'number' ? gdp.toFixed(2) + '%' : gdp}\n\nБұл көрсеткіштер үй шаруашылығының шығындары өсіп жатқанын көрсетеді. Отбасылар азық-түлік шығындарын қайта қарауы керек және банктік несиелерден бас тарта тұрғаны жөн.`
          });
        }
        return NextResponse.json({
          message: `[Имитациялық режим — тікелей ИИ үшін GEMINI_API_KEY қосыңыз]\n\n${country ?? 'Таңдалған ел'} үшін ағымдағы экономикалық мәліметтерге негізделген:\n\n• CPI инфляциясы: ${typeof cpi === 'number' ? cpi.toFixed(2) + '%' : cpi}\n• ЖІӨ өсімі: ${typeof gdp === 'number' ? gdp.toFixed(2) + '%' : gdp}\n\nБұл көрсеткіштер инфляцияның ${typeof cpi === 'number' && cpi > 4 ? 'жоғары' : 'қалыпты'} екенін көрсетеді. Жоғары инфляция сатып алу қабілетін төмендетеді.`
        });
      }
      
      if (language === 'ru') {
        if (parentMode) {
          return NextResponse.json({
            message: `[Имитационный режим — добавьте GEMINI_API_KEY для работы ИИ]\n\nНа основе текущей панели семейного бюджета для ${country ?? 'выбранной страны'}:\n\n• Стоимость продуктов (Инфляция CPI): ${typeof cpi === 'number' ? cpi.toFixed(2) + '%' : cpi}\n• Надежность работы (Рост ВВП): ${typeof gdp === 'number' ? gdp.toFixed(2) + '%' : gdp}\n\nЭти показатели указывают на рост расходов. Семьям рекомендуется оптимизировать траты на продукты и временно воздержаться от новых кредитов.`
          });
        }
        return NextResponse.json({
          message: `[Имитационный режим — добавьте GEMINI_API_KEY для работы ИИ]\n\nНа основе текущих данных для ${country ?? 'выбранной страны'}:\n\n• Инфляция CPI: ${typeof cpi === 'number' ? cpi.toFixed(2) + '%' : cpi}\n• Рост ВВП: ${typeof gdp === 'number' ? gdp.toFixed(2) + '%' : gdp}\n\nЭти показатели указывают на ${typeof cpi === 'number' && cpi > 4 ? 'высокую' : 'умеренную'} инфляционную среду. Высокая инфляция снижает покупательную способность.`
        });
      }

      if (parentMode) {
        return NextResponse.json({
          message: `[Mock Mode — add GEMINI_API_KEY for live AI]\n\nBased on the current family budget dashboard for ${country ?? 'the selected country'}:\n\n• Cost of Groceries (CPI Inflation): ${typeof cpi === 'number' ? cpi.toFixed(2) + '%' : cpi}\n• Job Security (GDP Growth): ${typeof gdp === 'number' ? gdp.toFixed(2) + '%' : gdp}\n\nThese indicators suggest that household expenses are rising. Families should review daily purchases for groceries and delay non-essential bank loans to maintain a healthy budget.`
        });
      }

      return NextResponse.json({
        message: `[Mock Mode — add GEMINI_API_KEY for live AI]\n\nBased on the current dashboard data for ${country ?? 'the selected country'}:\n\n• CPI Inflation: ${typeof cpi === 'number' ? cpi.toFixed(2) + '%' : cpi} (FRED/BLS)\n• GDP Growth: ${typeof gdp === 'number' ? gdp.toFixed(2) + '%' : gdp} (World Bank)\n\nThese indicators suggest a ${typeof cpi === 'number' && cpi > 4 ? 'high-inflation' : 'moderate'} environment. Higher inflation typically reduces purchasing power and pressures central banks to raise interest rates, which increases borrowing costs for mortgages and business loans.`
      });
    }

    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const responseStream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: { systemInstruction },
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          if (chunk.text) {
            controller.enqueue(new TextEncoder().encode(chunk.text));
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      }
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);

    const isRateLimit = error instanceof Error && 
      (error.message.includes('429') || 
       error.message.includes('RESOURCE_EXHAUSTED') || 
       (error as any).status === 429 || 
       (error as any).code === 429);

    if (isRateLimit) {
      return NextResponse.json(
        { error: 'Gemini API rate limit exceeded (free tier is limited to 5 requests/min). Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate response. Please try again later.' },
      { status: 500 }
    );
  }
}
