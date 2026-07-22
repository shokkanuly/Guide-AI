"use server";

import { cookies } from "next/headers";
import { fetchRealIndicators, RealIndicator } from "@/lib/economy/api/fetchRealData";
import { getCachedData, setCachedData } from "@/lib/economy/api/cache";
import { getGeminiClient } from "@/lib/economy/gemini";
import * as fs from "fs";
import * as path from "path";

export interface EconomyUserProfile {
  name: string;
  email: string;
  age: string;
  city: string;
  income: string;
  interests: string[];
  context: string;
  salaryProfession?: string;
  salaryValue?: string;
  salaryContext?: string;
  simContext?: string;
  language?: string;
}

/**
 * Persists the economy profile extras to server-side cookies
 */
export async function saveEconomyProfile(profile: EconomyUserProfile) {
  const cookieStore = await cookies();
  cookieStore.set("econpulse_user_profile", JSON.stringify(profile), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: false,
  });
  return { success: true, profile };
}

/**
 * Fetches cached economic indicators for a country
 */
export async function fetchCachedEconomicData(country: string): Promise<RealIndicator[]> {
  const cacheKey = `indicators_${country}`;
  const cached = getCachedData<RealIndicator[]>(cacheKey);
  if (cached) return cached;

  const fresh = await fetchRealIndicators(country);
  setCachedData(cacheKey, fresh);
  return fresh;
}

/**
 * Generates personalized economic advice using Gemini
 */
export async function generatePersonalizedAdviceAction(
  profile: EconomyUserProfile,
  indicators: RealIndicator[],
  country: string,
  parentMode: boolean,
  language: string
) {
  const cacheKey = `advice_${profile.age}_${profile.city}_${profile.income}_${language}_${country}_${parentMode ? "parent" : "youth"}`;
  const cached = getCachedData<unknown>(cacheKey, 600000);
  if (cached) return cached;

  const indicatorSummary = Array.isArray(indicators)
    ? indicators.map((ind) => `- ${ind.title}: ${ind.currentValue}${ind.unit} (Trend: ${ind.trend})`).join("\n")
    : "No current indicators";

  const langName = language === "kk" ? "Kazakh" : language === "ru" ? "Russian" : "English";

  const prompt = `You are EconPulse AI — an expert economic adviser. Give a young person in Kazakhstan / Central Asia personalized, practical financial advice.
  
You MUST write all values in the JSON response in ${langName}.

USER PROFILE:
- Age: ${profile.age} years old
- City: ${profile.city}
- Monthly Income: ${profile.income ? `${profile.income} KZT` : "0 KZT"}
- Goal & Financial Interests: ${profile.context || "None provided"}
- Current Country Focus: ${country}
- Active Mode: ${parentMode ? "Parent Mode (Focus on family budget, household expenses, and simple plain language)" : "Youth Mode (Focus on personal savings, study, career start, and smart economic choices)"}

CURRENT MACRO INDICATORS:
${indicatorSummary}

Provide a structured roadmap. Your response MUST be a valid JSON object only (no markdown, no code blocks) in exactly this format:
{
  "personalOutlook": "2-3 sentence overview of what the current economic situation means for this person.",
  "actionPlan": [
    "Action item 1: practical, concrete advice based on their goals and income.",
    "Action item 2: what they should do with their savings or study plans.",
    "Action item 3: another tailored recommendation."
  ],
  "inflationRiskMitigation": "A short paragraph explaining how they can shield their money from inflation."
}

Ensure all advice is highly actionable, clear, and avoids complex jargon.`;

  const client = getGeminiClient();

  try {
    if (!client) {
      // Mock fallback
      await new Promise((resolve) => setTimeout(resolve, 800));
      const fallback = {
        personalOutlook: `Given you are ${profile.age} in ${profile.city}, current economic indicators suggest high inflation which means money loses value fast.`,
        actionPlan: [
          `Save at least 10% of your ${profile.income || 0} KZT income in high-yield tenge deposits.`,
          `Focus on your primary goal: ${profile.context || "saving & study"}.`,
          `Develop high-demand skills to outpace local inflation.`,
        ],
        inflationRiskMitigation: `Inflation is currently high. Protect your money by avoiding cash; move savings into tenge deposits or buy essential study resources early.`,
      };
      setCachedData(cacheKey, fallback);
      return fallback;
    }

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    const result = JSON.parse(jsonMatch[0]);
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error("generatePersonalizedAdviceAction error:", error);
    throw new Error("Failed to generate economic profile advice");
  }
}

/**
 * Generates a downloadable economic report
 */
export async function generateReportAction(
  profile: EconomyUserProfile,
  indicators: RealIndicator[],
  country: string
) {
  const indicatorSummary = indicators
    .map((ind) => `- ${ind.title}: ${ind.currentValue}${ind.unit} (${ind.isRealData ? "Real" : "Simulated"} — Source: ${ind.source})`)
    .join("\n");

  const reportContent = `# EconPulse AI — Personalized Economic Intelligence Report

## User Profile Summary
- **Name**: ${profile.name}
- **Age**: ${profile.age}
- **Location**: ${profile.city.toUpperCase()}, Kazakhstan
- **Monthly Income**: ${profile.income} KZT
- **Target Goal**: ${profile.context}
- **Country Context**: ${country}
- **Generated On**: ${new Date().toLocaleDateString()}

## Current Macroeconomic Indicators
${indicatorSummary}

## Personal Economic Advice & Strategy
For a ${profile.age}-year-old in ${profile.city.toUpperCase()}:
1. **Budget Buffer**: Maintain at least 3 months of expenses in a liquid high-yield tenge savings account.
2. **Goal Trajectory**: Allocate a recurring portion of your ${profile.income} KZT income toward: *${profile.context}*.
3. **Inflation Guard**: Avoid keeping savings in cash — allocate surplus funds into interest-bearing instruments.

---
*Report generated by GovGuide Civic Suite / EconPulse AI. For educational purposes only.*
`;

  try {
    const publicDir = path.join(process.cwd(), "public");
    const reportsDir = path.join(publicDir, "reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const fileName = `report_${profile.city}_${profile.age}.md`;
    fs.writeFileSync(path.join(reportsDir, fileName), reportContent, "utf-8");

    return { success: true, url: `/reports/${fileName}`, fileName, content: reportContent };
  } catch (error) {
    console.error("Failed to generate report:", error);
    throw new Error("Report generation failed");
  }
}
