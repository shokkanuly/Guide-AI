"use client";

import { useAuth } from "@/context/AuthContext";
import { EconomyUserProfile } from "@/app/economy/actions";

/**
 * Maps Guide AI's authenticated user from AuthContext into the
 * EconomyUserProfile shape expected by all EconPulse components.
 *
 * This is the central integration point between the two systems:
 * one login → both GovGuide programs AND EconPulse economy use the same identity.
 */
export function useEconomyProfile(): EconomyUserProfile {
  const { user } = useAuth();

  if (!user) {
    // Sensible defaults when not yet loaded
    return {
      name: "Guest",
      email: "",
      age: "25",
      city: "astana",
      income: "350000",
      interests: [],
      context: "",
      salaryProfession: "software-engineer",
      salaryValue: "500000",
      salaryContext: "",
      simContext: "",
      language: "en",
    };
  }

  return {
    name: user.full_name ?? "User",
    email: user.email ?? "",
    // Pull from extended profile fields if they exist, else use sensible defaults
    age: (user as any).profile?.age ?? "25",
    city: (user as any).profile?.city ?? "astana",
    income: (user as any).profile?.monthly_income ?? "350000",
    interests: (user as any).profile?.interests ?? [],
    context: (user as any).profile?.bio ?? "",
    salaryProfession: (user as any).profile?.profession ?? "software-engineer",
    salaryValue: (user as any).profile?.salary ?? "500000",
    salaryContext: (user as any).profile?.salary_context ?? "",
    simContext: (user as any).profile?.sim_context ?? "",
    language: "en",
  };
}
