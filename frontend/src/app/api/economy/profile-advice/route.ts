import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/economy/gemini';

export async function POST(req: Request) {
  try {
    const { age, city, income, interests, context, indicators, country, parentMode, language } = await req.json();
    const client = getGeminiClient();

    const indicatorSummary = Array.isArray(indicators)
      ? indicators.map((ind: any) => `- ${ind.title}: ${ind.currentValue}${ind.unit} (Trend: ${ind.trend})`).join('\n')
      : 'No current indicators';

    const langName = language === 'kk' ? 'Kazakh' : language === 'ru' ? 'Russian' : 'English';
    const prompt = `You are EconPulse AI — an expert economic adviser. Give a young person in Kazakhstan / Central Asia personalized, practical financial advice.
    
    You MUST write all values in the JSON response in ${langName}.

USER PROFILE:
- Age: ${age} years old (Target audience is 14–25 years old. Keep tone highly relevant, engaging, and educational)
- City: ${city}
- Monthly Income: ${income ? `${income} KZT` : '0 KZT'}
- Financial Interests: ${interests.join(', ')}
- Additional Personal Context: ${context || 'None provided'}
- Current Country Focus: ${country}
- Active Mode: ${parentMode ? 'Parent Mode (Focus on family budget, household expenses, and simple plain language)' : 'Youth Mode (Focus on personal savings, study, career start, and smart economic choices)'}

CURRENT MACRO INDICATORS:
${indicatorSummary}

Provide a structured roadmap. Your response MUST be a valid JSON object only (no markdown, no code blocks) in exactly this format:
{
  "personalOutlook": "Provide a 2-3 sentence overview of what the current economic situation (inflation, interest rates) means for a ${age}-year-old in ${city}.",
  "actionPlan": [
    "Action item 1: practical, concrete advice based on their interests and income.",
    "Action item 2: what they should do with their savings or study plans.",
    "Action item 3: another tailored recommendation."
  ],
  "inflationRiskMitigation": "A short paragraph explaining how they can shield their pocket money or earnings from inflation, using plain language."
}

Ensure all advice is highly actionable, clear, and avoids complex jargon. If Parent Mode is active, explain everything in terms of family budgeting, groceries, and kids' future.`;

    if (!client) {
      // Mock mode fallback
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      if (language === 'kk') {
        return NextResponse.json({
          personalOutlook: `Сіз ${city} қаласында тұратын ${age} жастағы адам болғандықтан, ағымдағы экономикалық көрсеткіштер жоғары инфляцияны көрсетеді, бұл ақшаның тез құнсызданатынын білдіреді. Шығындарды басқару өте маңызды.`,
          actionPlan: [
            `Қызығушылығыңыз ${interests[0] || 'бюджеттеу'} болғандықтан, шығындарды бақылау үшін мобильді қосымшаны қолданыңыз.`,
            `${income || 0} теңге табысыңыздан кемінде 10%-ын жоғары мөлшерлемелі теңге депозитіне (14-15%) сақтауға тырысыңыз.`,
            `Білім мен цифрлық дағдыларға (бағдарламалау, тілдер) инвестиция жасаңыз — бұл инфляцияға қарсы ең жақсы қорғаныс.`
          ],
          inflationRiskMitigation: `Қазақстанда инфляция шамамен 8-9% құрайды. Бұл бүгінгі 1000 теңге келесі жылы азырақ сатып алады деген сөз. Ақшаңызды қорғау үшін оны қолма-қол сақтамаңыз — депозитке салыңыз немесе қажетті кітаптар/курстарды баға өспей тұрып сатып алыңыз.`
        });
      }
      
      if (language === 'ru') {
        return NextResponse.json({
          personalOutlook: `Так как вам ${age} лет и вы находитесь в г. ${city}, текущие экономические показатели указывают на высокую инфляцию, что означает быстрое обесценивание денег. Управление расходами является ключевым фактором.`,
          actionPlan: [
            `Поскольку вы интересуетесь темой «${interests[0] || 'бюджетирование'}», начните отслеживать расходы с помощью мобильного приложения.`,
            `Из вашего месячного бюджета в ${income || 0} тенге старайтесь откладывать не менее 10% на депозит в тенге (сейчас ставки до 14-15%).`,
            `Инвестируйте в свое образование и цифровые навыки (программирование, языки) — это лучший долгосрочный щит от инфляции.`
          ],
          inflationRiskMitigation: `Инфляция в Казахстане составляет около 8-9%. Это означает, что 1 000 тенге сегодня купят меньше в следующем году. Чтобы защитить деньги, не держите наличные под матрасом — переведите сбережения на депозиты в тенге или купите важные книги/курсы сейчас.`
        });
      }

      return NextResponse.json({
        personalOutlook: `Given you are ${age} in ${city}, current economic indicators suggest high inflation which means money loses value fast. For a student or young worker, managing costs is key.`,
        actionPlan: [
          `Since you are interested in ${interests[0] || 'budgeting'}, start tracking expenses using a mobile app to find leaks.`,
          `With a monthly budget of ${income || 0} KZT, try to save at least 10% in a high-yield tenge deposit (currently offering up to 14-15%).`,
          `Invest in your education and digital skills (programming, languages) as this is the best long-term shield against inflation.`
        ],
        inflationRiskMitigation: `Inflation is currently around 8-9% in Kazakhstan. This means 1,000 KZT today will buy less next year. To protect your money, do not keep cash under the mattress—move savings into tenge deposits or purchase essential books/courses now before prices rise further.`
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
    console.error('Profile Advice API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate economic profile advice' },
      { status: 500 }
    );
  }
}
