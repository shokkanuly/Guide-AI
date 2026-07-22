import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/economy/gemini';

export async function POST(req: Request) {
  try {
    const { profession, salary, period, inflation, context, country, parentMode, language } = await req.json();
    const client = getGeminiClient();

    const langName = language === 'kk' ? 'Kazakh' : language === 'ru' ? 'Russian' : 'English';
    const prompt = `You are EconPulse AI — an expert salary and career negotiator.
A user has asked for a 5-10 year salary forecast and career advice under current macroeconomic conditions.

You MUST write all values in the JSON response in ${langName}.

USER CAREER DETAILS:
- Profession: ${profession}
- Current Monthly Salary: ${salary ? `${salary} KZT` : 'Not specified'}
- Forecast Period: ${period} years
- Additional Job Context: ${context || 'None provided'}
- Country: ${country}
- Baseline Inflation Rate: ${inflation}%
- Active Mode: ${parentMode ? 'Parent Mode (Focus on family stability, long term safety, easy explanations)' : 'Youth Mode (Focus on rapid upskilling, promotion, negotiating starter wages)'}

Provide a structured, helpful analysis. Your response MUST be a valid JSON object only (no markdown, no code blocks) in exactly this format:
{
  "careerOutlook": "A 2-sentence description of the career outlook for this profession in ${country} over the next decade.",
  "purchasingPowerWarning": "Explain in simple terms how much their ${salary || 250000} KZT will degrade in real purchasing power due to ${inflation}% inflation in ${period} years, and what they need to watch out for.",
  "negotiationTips": [
    "Tip 1: Concrete negotiation strategy or raise request tailored to this profession.",
    "Tip 2: Specific skill to learn to increase market value.",
    "Tip 3: How to frame the inflation rate during a salary review."
  ]
}

Ensure all advice is highly actionable, warm, and clear. If Parent Mode is active, explain in terms of family budgeting and long-term family stability.`;

    if (!client) {
      // Mock fallback
      await new Promise(resolve => setTimeout(resolve, 1000));
      const powerAfterPeriod = salary * Math.pow(1 - inflation / 100, period);
      
      if (language === 'kk') {
        return NextResponse.json({
          careerOutlook: `${country} елінде ${profession} мамандығының болашағы тұрақты. Сандық трансформация және жергілікті нарықтың өзгеруі білікті мамандарға деген сұранысты арттыруда.`,
          purchasingPowerWarning: `${inflation}% инфляция жағдайында сіздің қазіргі ${salary} теңге жалақыңыз сатып алу қабілетін жоғалтады. ${period} жылдан кейін бұл бүгінгі ${Math.round(powerAfterPeriod)} теңге сияқты сезіледі. Сондықтан жалақыны жыл сайын көтеру маңызды.`,
          negotiationTips: [
            `Жыл сайын кем дегенде ${inflation}% инфляция деңгейіне сәйкес келетін өнімділікке негізделген жалақыны қарауды сұраңыз.`,
            `Нарықта ерекшелену үшін салалық сертификаттарды немесе техникалық дағдыларды дамытыңыз.`,
            `Жалақыны қарау кезінде тек инфляцияны ғана емес, компания табысына қосқан нақты үлесіңізді атап көрсетіңіз.`
          ]
        });
      }
      
      if (language === 'ru') {
        return NextResponse.json({
          careerOutlook: `Перспективы для профессии «${profession}» в ${country} остаются стабильными. Цифровая трансформация и развитие рынка продолжают стимулировать спрос на квалифицированных специалистов.`,
          purchasingPowerWarning: `При инфляции в ${inflation}% ваша текущая зарплата в ${salary} тенге потеряет значительную покупательную способность. Через ${period} лет она будет эквивалентна ${Math.round(powerAfterPeriod)} тенге сегодня. Вам необходимы регулярные ежегодные прибавки для сохранения уровня жизни.`,
          negotiationTips: [
            `Запрашивайте ежегодный пересмотр оклада с привязкой к уровню инфляции в ${inflation}%.`,
            `Развивайте смежные компетенции и получайте профильные сертификаты, чтобы повысить свою ценность на рынке труда.`,
            `Подкрепляйте запрос на повышение конкретными результатами вашей работы и ростом ключевых показателей компании.`
          ]
        });
      }

      return NextResponse.json({
        careerOutlook: `The outlook for ${profession} in ${country} remains steady. Digital transformation and local market shifts continue to drive demand for skilled specialists.`,
        purchasingPowerWarning: `With ${inflation}% inflation, your current salary of ${salary} KZT will lose significant purchasing power. In ${period} years, it will feel like earning only ${Math.round(powerAfterPeriod)} KZT today. You must secure annual raises just to stay even.`,
        negotiationTips: [
          `Ask for a performance-based review annually, matching at least the ${inflation}% inflation benchmark.`,
          `Develop niche certifications or technical skills (e.g. project management or localized software training) to stand out.`,
          `Highlight your direct impact on revenue or cost-savings to make your salary review objective rather than based on cost of living alone.`
        ]
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
    console.error('Salary Advice API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate salary advice' },
      { status: 500 }
    );
  }
}
