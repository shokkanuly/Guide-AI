export interface HistoricalDataPoint {
  date: string;
  value: number;
}

export function getHistoricalData(
  country: string,
  metric: "inflation" | "interest" | "gdp",
  timeframe: "1Y" | "5Y" | "10Y"
): { data: HistoricalDataPoint[]; description: string } {
  const isKAZ = country === "KAZ";
  const isUSA = country === "USA";

  // Generic country baselines
  const baselines: Record<string, { inflation: number; interest: number; gdp: number }> = {
    KAZ: { inflation: 8.4, interest: 14.75, gdp: 4.2 },
    USA: { inflation: 3.2, interest: 5.33, gdp: 2.1 },
    DEU: { inflation: 2.4, interest: 4.50, gdp: 0.2 },
    GBR: { inflation: 4.0, interest: 5.25, gdp: 0.6 },
    RUS: { inflation: 7.8, interest: 16.00, gdp: 2.2 },
  };

  const base = baselines[country] || { inflation: 3.5, interest: 5.0, gdp: 2.0 };

  if (timeframe === "1Y") {
    // 1 Year: 12 monthly data points (Jul 25 - Jun 26)
    const months = [
      "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25",
      "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"
    ];
    
    let currentVal = base[metric];
    const data = months.map((m, idx) => {
      // Small random walk to look realistic
      const noise = (Math.sin(idx / 2) * 0.1) + ((Math.random() - 0.5) * 0.08);
      let val = currentVal + noise;
      if (metric === "interest" && isKAZ) val = 14.75; // keep Kazakhstan base rate flat
      if (metric === "interest" && isUSA) val = 5.33; // keep US rate flat
      if (val < 0.1) val = 0.1;
      return { date: m, value: parseFloat(val.toFixed(2)) };
    });

    const desc = {
      inflation: `Annual CPI inflation rate over the last 12 months, hovering around a baseline of ${base.inflation}%.`,
      interest: `Central bank benchmark policy interest rate maintained stable at ${base.interest}% over the past year.`,
      gdp: `Monthly annualized real GDP growth estimate showing seasonal fluctuations around ${base.gdp}%.`
    }[metric];

    return { data, description: desc };
  } 
  
  if (timeframe === "5Y") {
    // 5 Years: 20 quarterly points (Q3 21 - Q2 26)
    const quarters = [
      "Q3 21", "Q4 21", "Q1 22", "Q2 22", "Q3 22", "Q4 22",
      "Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24", "Q2 24",
      "Q3 24", "Q4 24", "Q1 25", "Q2 25", "Q3 25", "Q4 25",
      "Q1 26", "Q2 26"
    ];

    let data: HistoricalDataPoint[] = [];

    if (metric === "inflation") {
      if (isKAZ) {
        // Kazakhstan inflation spiked in 2022/2023, reached ~20%
        const path = [8.2, 8.5, 12.0, 14.5, 17.7, 19.6, 20.3, 19.1, 15.6, 11.2, 9.5, 8.9, 8.6, 8.4, 8.5, 8.3, 8.4, 8.4, 8.5, 8.4];
        data = quarters.map((q, i) => ({ date: q, value: path[i] }));
      } else if (isUSA) {
        // US inflation peaked in mid-2022 (~9.1%)
        const path = [5.4, 6.8, 7.9, 8.6, 8.3, 7.1, 5.0, 4.0, 3.7, 3.4, 3.2, 3.0, 2.9, 2.6, 2.5, 2.4, 2.5, 2.6, 2.5, 3.2];
        data = quarters.map((q, i) => ({ date: q, value: path[i] }));
      } else {
        // Generic country inflation peak in 2022/2023
        data = quarters.map((q, i) => {
          const peakCoeff = Math.exp(-Math.pow(i - 4, 2) / 30); // peak around index 4 (Q3 22)
          const val = base.inflation + (base.inflation * 1.5 * peakCoeff) + (Math.random() - 0.5) * 0.3;
          return { date: q, value: parseFloat(Math.max(0.1, val).toFixed(2)) };
        });
      }
    } else if (metric === "interest") {
      if (isKAZ) {
        // Kazakhstan raised rates to 16.75% during the inflation crisis
        const path = [9.0, 9.75, 13.5, 14.0, 14.5, 16.0, 16.75, 16.75, 16.5, 15.75, 14.75, 14.5, 14.25, 14.0, 14.25, 14.5, 14.75, 14.75, 14.75, 14.75];
        data = quarters.map((q, i) => ({ date: q, value: path[i] }));
      } else if (isUSA) {
        // US raised rates from 0.1% to 5.33% rapidly
        const path = [0.1, 0.1, 0.25, 1.5, 2.5, 3.78, 4.65, 5.08, 5.33, 5.33, 5.33, 5.33, 5.33, 5.33, 5.33, 5.33, 5.33, 5.33, 5.33, 5.33];
        data = quarters.map((q, i) => ({ date: q, value: path[i] }));
      } else {
        data = quarters.map((q, i) => {
          // General rate hikes starting 2022
          const hikeCoeff = 1 / (1 + Math.exp(-(i - 6) / 2)); // sigmoidal rise
          const val = 0.5 + ((base.interest - 0.5) * hikeCoeff) + (Math.random() - 0.5) * 0.15;
          return { date: q, value: parseFloat(Math.max(0.0, val).toFixed(2)) };
        });
      }
    } else { // GDP
      if (isKAZ) {
        const path = [3.5, 4.0, 4.4, 3.4, 3.1, 3.2, 4.5, 4.8, 5.1, 5.1, 4.2, 4.0, 3.9, 4.1, 4.2, 4.3, 4.2, 4.1, 4.2, 4.2];
        data = quarters.map((q, i) => ({ date: q, value: path[i] }));
      } else if (isUSA) {
        const path = [4.9, 5.5, 3.7, 1.8, -0.6, 2.9, 2.2, 2.1, 4.9, 3.4, 1.6, 2.8, 2.0, 2.2, 2.1, 2.0, 2.1, 2.2, 2.1, 2.1];
        data = quarters.map((q, i) => ({ date: q, value: path[i] }));
      } else {
        data = quarters.map((q, i) => {
          const val = base.gdp + (Math.sin(i / 1.5) * 0.8) + (Math.random() - 0.5) * 0.25;
          return { date: q, value: parseFloat(val.toFixed(2)) };
        });
      }
    }

    const desc = {
      inflation: `5-Year trend capturing the historic global post-pandemic inflation surge peaking in 2022-2023, followed by central bank stabilization efforts.`,
      interest: `Benchmark interest rates showing aggressive monetary tightening cycles to curb inflation between 2022 and 2024.`,
      gdp: `Quarterly GDP growth showing post-COVID recovery peaks, economic cooling phases, and stabilization toward long-term potential.`
    }[metric];

    return { data, description: desc };
  }

  // timeframe === "10Y"
  // 10 Years: 10 annual points (2016 to 2025)
  const years = ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];
  let data: HistoricalDataPoint[] = [];

  if (metric === "inflation") {
    if (isKAZ) {
      // 2015 float triggered 2016 inflation surge to 14.6%
      const path = [14.6, 7.4, 6.0, 5.4, 6.8, 8.4, 15.0, 14.5, 9.3, 8.4];
      data = years.map((y, i) => ({ date: y, value: path[i] }));
    } else if (isUSA) {
      const path = [1.3, 2.1, 2.4, 1.8, 1.2, 4.7, 8.0, 4.1, 3.4, 3.2];
      data = years.map((y, i) => ({ date: y, value: path[i] }));
    } else {
      data = years.map((y, i) => {
        let val = base.inflation;
        if (i === 0) val = base.inflation * 1.3; // 2016
        if (i === 4) val = base.inflation * 0.5; // 2020 Covid drop
        if (i === 6 || i === 7) val = base.inflation * 2.5; // 2022/23 spike
        val += (Math.random() - 0.5) * 0.5;
        return { date: y, value: parseFloat(Math.max(0.1, val).toFixed(2)) };
      });
    }
  } else if (metric === "interest") {
    if (isKAZ) {
      const path = [17.0, 10.25, 9.25, 9.25, 9.0, 9.75, 16.0, 16.75, 14.75, 14.75];
      data = years.map((y, i) => ({ date: y, value: path[i] }));
    } else if (isUSA) {
      const path = [0.4, 1.0, 2.2, 2.16, 0.38, 0.08, 1.68, 5.08, 5.33, 5.33];
      data = years.map((y, i) => ({ date: y, value: path[i] }));
    } else {
      data = years.map((y, i) => {
        let val = base.interest;
        if (i >= 4 && i <= 5) val = 0.5; // 2020/21 low interest
        if (i >= 8) val = base.interest; // stable high rates
        val += (Math.random() - 0.5) * 0.3;
        return { date: y, value: parseFloat(Math.max(0.0, val).toFixed(2)) };
      });
    }
  } else { // GDP
    if (isKAZ) {
      const path = [1.1, 4.1, 4.1, 4.5, -2.6, 4.3, 3.2, 5.1, 4.0, 4.2];
      data = years.map((y, i) => ({ date: y, value: path[i] }));
    } else if (isUSA) {
      const path = [1.6, 2.3, 2.9, 2.3, -2.2, 5.7, 1.9, 2.5, 2.2, 2.1];
      data = years.map((y, i) => ({ date: y, value: path[i] }));
    } else {
      data = years.map((y, i) => {
        let val = base.gdp;
        if (i === 4) val = -2.5; // 2020 Covid contraction
        if (i === 5) val = base.gdp * 2.2; // 2021 rebound
        val += (Math.random() - 0.5) * 0.4;
        return { date: y, value: parseFloat(val.toFixed(2)) };
      });
    }
  }

  const desc = {
    inflation: `10-Year historical record. Shows long-term structural inflation baselines, the stability of the late 2010s, and the major global inflationary cycle starting in 2021.`,
    interest: `Benchmark policy rates over a decade. Highlights the low interest rate era (2016-2021) and the dramatic shift to higher rates to suppress inflation.`,
    gdp: `Annual GDP growth rate showing macro cycles, including the sharp 2020 pandemic recession, the subsequent 2021 economic reopen spike, and trend stabilization.`
  }[metric];

  return { data, description: desc };
}
