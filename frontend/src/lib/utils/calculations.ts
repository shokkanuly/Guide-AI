export interface SalaryProjectionPoint {
  year: number;
  realPurchasingPower: number;
  nominalNeeded: number;
  careerGrowth: number;
}

/**
 * Projects inflation impact on salary over a period of years.
 */
export function calculateSalaryProjection(
  salary: number,
  inflationRate: number,
  period: number
): SalaryProjectionPoint[] {
  const infDecimal = inflationRate / 100;
  const data: SalaryProjectionPoint[] = [];

  for (let year = 1; year <= period; year++) {
    // 1. Inflation decay (Purchasing power reduction)
    const realPurchasingPower = salary * Math.pow(1 - infDecimal, year);
    
    // 2. Inflation Adjusted (Nominal salary needed to retain initial purchasing power)
    const nominalNeeded = salary * Math.pow(1 + infDecimal, year);
    
    // 3. Career Growth (Salary raising at inflation + 3% real growth annually)
    const careerGrowth = salary * Math.pow(1 + infDecimal + 0.03, year);

    data.push({
      year,
      realPurchasingPower: Math.round(realPurchasingPower),
      nominalNeeded: Math.round(nominalNeeded),
      careerGrowth: Math.round(careerGrowth),
    });
  }
  return data;
}

export interface CityDataPoint {
  apartmentRent: number;
  utilities: number;
  publicTransportPass: number;
  gasolinePrice: number;
  breadPrice: number;
  milkPrice: number;
  gymMembership: number;
}

/**
 * Computes standard basket cost for a Kazakhstan city
 */
export function calculateCityBasket(city: CityDataPoint): number {
  return (
    city.apartmentRent +
    city.utilities +
    city.publicTransportPass +
    (city.gasolinePrice * 40) + // 40 Litres
    (city.breadPrice * 15) +     // 15 loaves
    (city.milkPrice * 15) +      // 15 Litres
    city.gymMembership
  );
}

/**
 * Computes percentage difference between two basket costs
 */
export function calculateCostDifferencePercentage(basketA: number, basketB: number): string {
  if (basketA === 0) return "0.0";
  return (((basketB - basketA) / basketA) * 100).toFixed(1);
}

export interface RelocationResult {
  disposableA: number;
  disposableB: number;
  diff: number;
  diffAbs: number;
  severity: "success" | "warning" | "danger";
}

/**
 * Computes relocation financial benefit/risk
 */
export function calculateRelocationDelta(
  currentSalary: number,
  basketA: number,
  targetSalary: number,
  basketB: number
): RelocationResult {
  const disposableA = currentSalary - basketA;
  const disposableB = targetSalary - basketB;

  const diff = disposableB - disposableA;
  const diffAbs = Math.abs(diff);

  let severity: "success" | "warning" | "danger" = "warning";

  if (diff > 15000) {
    severity = "success";
  } else if (diff < -15000) {
    severity = "danger";
  }

  return {
    disposableA,
    disposableB,
    diff,
    diffAbs,
    severity,
  };
}
