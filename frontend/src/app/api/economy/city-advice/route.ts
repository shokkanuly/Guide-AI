import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/economy/gemini';

export async function POST(req: Request) {
  try {
    const { cityA, cityB, salaryA, salaryB, basketA, basketB, disposableA, disposableB, priceDetails, userContext, language } = await req.json();
    const client = getGeminiClient();

    const langName = language === 'kk' ? 'Kazakh' : language === 'ru' ? 'Russian' : 'English';
    const prompt = `You are EconPulse AI — an expert cost of living and relocation analyst.
Analyze a potential relocation or cost comparison between two cities in Kazakhstan:

You MUST write all values in the JSON response in ${langName}.

CITY COMPARISON:
- City A (Base): ${cityA} (Salary: ${salaryA} KZT, Basket Cost: ${basketA} KZT, Net Disposable: ${disposableA} KZT)
- City B (Target): ${cityB} (Salary: ${salaryB} KZT, Basket Cost: ${basketB} KZT, Net Disposable: ${disposableB} KZT)

DETAILED PRICE BASKETS (rent, transit, bread, milk, gasoline):
${priceDetails}

USER PROFILE / CONTEXT:
- Additional Details: ${userContext || 'None provided'}

Provide a structured, helpful analysis. Your response MUST be a valid JSON object only (no markdown, no code blocks) in exactly this format:
{
  "analysis": "A 2-sentence summary comparing cost of living, specifically noting differences in rent, utilities, or daily baskets.",
  "disposableIncomeOutlook": "A 2-sentence evaluation of whether moving to ${cityB} makes financial sense. Address the user's disposable income delta (Net Diff: ${disposableB - disposableA} KZT).",
  "savingsTip": "An actionable savings or negotiation tip (e.g. negotiation tactics, rental advice) for their transition."
}

Ensure the analysis is highly clear, numbers-based, and avoids financial jargon.`;

    if (!client) {
      // Mock fallback
      await new Promise(resolve => setTimeout(resolve, 800));
      const diff = disposableB - disposableA;
      
      if (language === 'kk') {
        return NextResponse.json({
          analysis: `${cityB} қаласындағы жалдау және коммуналдық қызмет шығындары ірі мегаполистерге тән. Тұтыну себеттерін салыстыру сүт, нан және бензин сияқты күнделікті тауарлар бағасындағы айырмашылықтарды көрсетеді.`,
          disposableIncomeOutlook: `${cityB} қаласына көшу сізге айына ${diff.toLocaleString()} теңге бос сбережения айырмашылығын береді. ${
            diff > 0 
              ? `Бұл сізге жинақтау қабілетін арттыратын жақсы қаржылық мүмкіндікті ұсынады.` 
              : `Бұл сіздің бос қаражатыңыздың азаюына әкеледі, сондықтан көшуді негіздеу үшін жоғарырақ жалақы талап етуіңіз керек.`
          }`,
          savingsTip: `Есіңізде болсын, пәтер жалдау шығындардың ең үлкен бөлігін құрайды. Шығындарды азайту үшін пәтерді бірге жалдау немесе қашықтан жұмыс істеу күндерін қарастырыңыз.`
        });
      }

      if (language === 'ru') {
        return NextResponse.json({
          analysis: `Расходы на аренду и коммунальные услуги в ${cityB} соответствуют стандартам мегаполиса. Сравнение потребительских корзин показывает различия в стоимости продуктов первой необходимости, таких как молоко и хлеб.`,
          disposableIncomeOutlook: `Переезд в ${cityB} дает чистую разницу в размере ${diff.toLocaleString()} тенге в месяц. ${
            diff > 0 
              ? `Это представляет собой положительную финансовую возможность, увеличивая ваши накопления.` 
              : `Это приведет к уменьшению свободных сбережений, поэтому вам следует договориться о более высокой зарплате для переезда.`
          }`,
          savingsTip: `Учтите, что расходы на аренду составляют наибольшую часть трат. Попробуйте рассмотреть варианты совместной аренды или договориться об удаленных днях работы.`
        });
      }

      return NextResponse.json({
        analysis: `Rent and utilities in ${cityB} are typical of major metropolitan standards. Comparing basket costs shows that transit and basic staples like bread and milk differ between the two cities.`,
        disposableIncomeOutlook: `Moving to ${cityB} yields a net difference of ${diff.toLocaleString()} KZT in monthly disposable income. ${
          diff > 0 
            ? `This represents a positive financial opportunity, giving you more savings power.` 
            : `This results in lower net savings, meaning you should negotiate a higher wage in ${cityB} to justify the move.`
        }`,
        savingsTip: `Keep in mind that rental costs make up the largest chunk of expenses. Try searching for shared apartments or negotiating remote work days to lower transit bills.`
      });
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

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('City Advice API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate city advice analysis' },
      { status: 500 }
    );
  }
}
