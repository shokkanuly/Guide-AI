import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/economy/gemini';

export async function POST(req: Request) {
  try {
    const { scenario, context, profile, language } = await req.json();
    const client = getGeminiClient();

    const scenarioText = {
      "rate-hike": "Interest Rate Hike (+2.0% base rate increase to fight inflation)",
      "oil-drop": "Global Oil Price Crash (-25% drop impacting exports and budget revenues)",
      "tax-cut": "Income Tax Relief (-5% tax cuts to boost consumption)",
      "supply-chain": "Import Supply Chain Delays (+15% transit and import price shocks)"
    }[scenario as string] || scenario;

    const langName = language === 'kk' ? 'Kazakh' : language === 'ru' ? 'Russian' : 'English';
    const prompt = `You are EconPulse AI — a macroeconomic shock simulation analyst.
Analyze how the following economic shock event will affect the user based on their personal situation and context.

You MUST write all values in the JSON response in ${langName}.

SHOCK EVENT:
- Scenario: ${scenarioText}

USER PROFILE & CONTEXT:
- Name: ${profile?.name || 'Guest'}
- Age: ${profile?.age || '18'} years old
- City: ${profile?.city || 'Almaty'}
- Income/Allowance: ${profile?.income || '80000'} KZT
- Specific Family/Personal Context: ${context || 'None provided'}

Provide a structured, personalized impact assessment. Your response MUST be a valid JSON object only (no markdown, no code blocks) in exactly this format:
{
  "impactRating": "Negative | Neutral | Positive",
  "personalImpact": "A 2-sentence highly tailored description of how this shock affects them. Address them by name and reference their specific context (e.g. mortgage, student status, or saving plans) if provided.",
  "actionTip": "A specific action recommendation to mitigate the risk or capitalize on this scenario."
}

Ensure the tone is educational, encouraging, and extremely clear. Avoid jargon.`;

    if (!client) {
      // Mock fallback
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let rating = "Neutral";
      let impact = "";
      let tip = "";

      if (language === 'kk') {
        rating = "Neutral";
        impact = `${scenarioText} сценарийі аясында экономикалық өзгерістер сатып алу қабілетіңізге әсер етеді.`;
        tip = "Бағаларды бақылап, теңгелік депозиттерде қолма-қол ақша буферін сақтаңыз.";

        if (scenario === "rate-hike") {
          rating = context?.toLowerCase().includes("mortgage") || context?.toLowerCase().includes("loan") ? "Negative" : "Neutral";
          impact = `Сәлем, ${profile?.name || 'қонақ'}! Пайыздық мөлшерлеме өскендіктен, несие құны артады. Егер отбасыңызда өзгермелі ипотека болса, айлық төлемдер өседі. Сіз сияқты ${profile?.age || '18'} жастағы адам үшін теңгелік депозиттердің табыстылығы артады (15%-ға дейін).`;
          tip = "Жаңа несиелерден аулақ болыңыз. Ақшаны теңгелік жинақ депозиттеріне салыңыз.";
        } else if (scenario === "oil-drop") {
          rating = "Negative";
          impact = `Мұнай бағасының құлдырауы теңгені әлсіретеді. Импорттық техника (телефондар, ноутбуктер) қымбаттайды. Егер сіз ${profile?.city || 'Алматы'} қаласында сатып алуды жоспарласаңыз, қажетті техниканы ертерек алыңыз.`;
          tip = "Шетелдік қымбат тауарларды сатып алуды кейінге қалдырыңыз және жинақтарыңызды депозитке салыңыз.";
        } else if (scenario === "tax-cut") {
          rating = "Positive";
          impact = `Салықтың төмендеуі сізге көбірек бос қаражат береді. Сіздің ${profile?.income || '80000'} теңгелік бюджетіңізге бұл тікелей көмек. ${profile?.city || 'Алматы'} қаласында тұтыну белсенділігі артып, бизнеске көмектеседі.`;
          tip = "Салық үнемдеуін бірден жұмсамай, төтенше жағдайлар қорын құру үшін сақтаңыз.";
        } else if (scenario === "supply-chain") {
          rating = "Negative";
          impact = `Импорттық бағалардың өсуі азық-түлік шығындарын арттырады. Сіздің айлық табысыңыз ${profile?.income || '80000'} теңге болғандықтан, күнделікті сатып алатын тауарларыңыз азаяды.`;
          tip = "Бағалар қымбаттамай тұрып, жергілікті тауарларды және негізгі өнімдерді көбірек сатып алыңыз.";
        }
      } else if (language === 'ru') {
        rating = "Neutral";
        impact = `В рамках сценария ${scenarioText} экономические изменения повлияют на вашу покупательную способность.`;
        tip = "Следите за ценами и держите ликвидный буфер наличных на депозитах в тенге.";

        if (scenario === "rate-hike") {
          rating = context?.toLowerCase().includes("mortgage") || context?.toLowerCase().includes("loan") ? "Negative" : "Neutral";
          impact = `Привет, ${profile?.name || 'гость'}! С ростом ставок стоимость кредитов увеличится. Если у вашей семьи плавающая ипотека, ежемесячные платежи вырастут. Для вас в возрасте ${profile?.age || '18'} лет доходность по депозитам вырастет (до 15%), это отличное время для вкладов.`;
          tip = "Избегайте новых кредитов. Переводите свободные средства на депозиты в тенге с высокой ставкой.";
        } else if (scenario === "oil-drop") {
          rating = "Negative";
          impact = `Падение цен на нефть ослабляет тенге. Импортная техника (телефоны, ноутбуки) станет дороже. Если вы планируете покупки в г. ${profile?.city || 'Алматы'}, лучше приобрести технику раньше.`;
          tip = "Отложите покупку импортных предметов роскоши и держите сбережения в надежных инструментах.";
        } else if (scenario === "tax-cut") {
          rating = "Positive";
          impact = `Снижение налога оставляет вам больше свободных средств. Для вашего бюджета в ${profile?.income || '80000'} тенге это прямая поддержка. Потребление в г. ${profile?.city || 'Алматы'} вырастет, что поможет бизнесу.`;
          tip = "Сохраняйте сэкономленные на налогах средства, чтобы сформировать чрезвычайный фонд.";
        } else if (scenario === "supply-chain") {
          rating = "Negative";
          impact = `Перебои с импортом увеличат ваши счета за продукты и еду. Поскольку ваш доход составляет ${profile?.income || '80000'} тенге, вы заметите снижение объема покупок.`;
          tip = "Покупайте местные товары и продукты длительного хранения в больших объемах до роста цен.";
        }
      } else {
        rating = "Neutral";
        impact = `Under the ${scenarioText} scenario, economic changes will affect your purchasing power.`;
        tip = "Monitor prices and keep a liquid cash buffer in tenge deposits.";

        if (scenario === "rate-hike") {
          rating = context?.toLowerCase().includes("mortgage") || context?.toLowerCase().includes("loan") ? "Negative" : "Neutral";
          impact = `Hi ${profile?.name || 'there'}! Since rates are rising, borrowing costs will spike. If your family has a variable mortgage, monthly payments will increase. For a ${profile?.age || '18'}-year old, saving accounts will yield higher returns (up to 15%), making it a great time to deposit tenge.`;
          tip = "Avoid new variable credit card loans. Move cash to fixed-rate tenge savings accounts.";
        } else if (scenario === "oil-drop") {
          rating = "Negative";
          impact = `A oil drop weakens the tenge. Imported tech items (phones, laptops) will become more expensive. If you are planning purchases in ${profile?.city || 'Almaty'}, buy essential electronics soon.`;
          tip = "Defer buying foreign luxury items and hold some savings in inflation-hedged tools.";
        } else if (scenario === "tax-cut") {
          rating = "Positive";
          impact = `The tax cut gives you more disposable income. For a budget of ${profile?.income || '80000'} KZT, this is a direct boost to your pocket. Spending will surge in ${profile?.city || 'Almaty'}, which helps businesses.`;
          tip = "Save the 5% tax difference instead of spending it immediately to build an emergency fund.";
        } else if (scenario === "supply-chain") {
          rating = "Negative";
          impact = `Import price shocks will increase grocery and food bills. Since your monthly income is ${profile?.income || '80000'} KZT, you will see a reduction in what you can buy daily.`;
          tip = "Buy local goods and staples in bulk before logistics delays push supermarket prices up.";
        }
      }

      return NextResponse.json({
        impactRating: rating,
        personalImpact: impact,
        actionTip: tip
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
    console.error('Simulator Advice API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate shock simulation advice' },
      { status: 500 }
    );
  }
}
