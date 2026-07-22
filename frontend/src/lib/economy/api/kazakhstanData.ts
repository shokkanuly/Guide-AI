export interface CityEconomics {
  id: string;
  name: string;
  averageSalary: number;      // KZT
  apartmentRent: number;      // KZT (1-bedroom in city center)
  publicTransportPass: number; // KZT (Monthly pass)
  gasolinePrice: number;       // KZT (Litre of AI-95)
  breadPrice: number;          // KZT (Loaf of standard bread)
  milkPrice: number;           // KZT (1 Litre)
  gymMembership: number;       // KZT (Monthly subscription)
  utilities: number;           // KZT (Heating, electricity, water, garbage)
}

export interface ProfessionInfo {
  id: string;
  name: string;
  averageSalary: number; // KZT
  growthOutlook: 'High' | 'Medium' | 'Stable' | 'At Risk';
  description: string;
}

export const KAZAKHSTAN_CITIES: CityEconomics[] = [
  {
    id: 'almaty',
    name: 'Almaty 🏔️',
    averageSalary: 380000,
    apartmentRent: 220000,
    publicTransportPass: 10000,
    gasolinePrice: 255,
    breadPrice: 240,
    milkPrice: 480,
    gymMembership: 18000,
    utilities: 25000,
  },
  {
    id: 'astana',
    name: 'Astana 🏢',
    averageSalary: 350000,
    apartmentRent: 180000,
    publicTransportPass: 9000,
    gasolinePrice: 250,
    breadPrice: 220,
    milkPrice: 450,
    gymMembership: 15000,
    utilities: 22000,
  },
  {
    id: 'shymkent',
    name: 'Shymkent ☀️',
    averageSalary: 240000,
    apartmentRent: 120000,
    publicTransportPass: 8000,
    gasolinePrice: 250,
    breadPrice: 180,
    milkPrice: 400,
    gymMembership: 12000,
    utilities: 15000,
  },
  {
    id: 'karaganda',
    name: 'Karaganda 🏭',
    averageSalary: 270000,
    apartmentRent: 110000,
    publicTransportPass: 8000,
    gasolinePrice: 250,
    breadPrice: 190,
    milkPrice: 410,
    gymMembership: 12000,
    utilities: 18000,
  },
  {
    id: 'aktobe',
    name: 'Aktobe 💨',
    averageSalary: 260000,
    apartmentRent: 100000,
    publicTransportPass: 7500,
    gasolinePrice: 248,
    breadPrice: 190,
    milkPrice: 420,
    gymMembership: 11000,
    utilities: 16000,
  },
  {
    id: 'taraz',
    name: 'Taraz 🏛️',
    averageSalary: 210000,
    apartmentRent: 80000,
    publicTransportPass: 7000,
    gasolinePrice: 248,
    breadPrice: 170,
    milkPrice: 390,
    gymMembership: 9000,
    utilities: 14000,
  },
  {
    id: 'pavlodar',
    name: 'Pavlodar 🌊',
    averageSalary: 280000,
    apartmentRent: 100000,
    publicTransportPass: 8000,
    gasolinePrice: 250,
    breadPrice: 195,
    milkPrice: 430,
    gymMembership: 11000,
    utilities: 17000,
  },
  {
    id: 'ust-kamenogorsk',
    name: 'Ust-Kamenogorsk 🌲',
    averageSalary: 295000,
    apartmentRent: 115000,
    publicTransportPass: 8500,
    gasolinePrice: 252,
    breadPrice: 200,
    milkPrice: 440,
    gymMembership: 12000,
    utilities: 19000,
  }
];

export const KAZAKHSTAN_PROFESSIONS: ProfessionInfo[] = [
  {
    id: 'software-engineer',
    name: 'Software Engineer 💻',
    averageSalary: 650000,
    growthOutlook: 'High',
    description: 'High demand in Astana Hub and local banking apps. Tech sector is growing rapidly.',
  },
  {
    id: 'school-teacher',
    name: 'School Teacher 📚',
    averageSalary: 280000,
    growthOutlook: 'Stable',
    description: 'Government funding increases teacher pay steadily. High social importance.',
  },
  {
    id: 'doctor',
    name: 'Doctor 🩺',
    averageSalary: 320000,
    growthOutlook: 'Stable',
    description: 'High demand in both public and private medical facilities.',
  },
  {
    id: 'construction-engineer',
    name: 'Construction Engineer 🏗️',
    averageSalary: 420000,
    growthOutlook: 'Medium',
    description: 'Driven by urban development programs and residential projects in major cities.',
  },
  {
    id: 'accountant',
    name: 'Accountant 📊',
    averageSalary: 300000,
    growthOutlook: 'Stable',
    description: 'Every SME and corporate in KZ requires accounting, though automation is a slight risk.',
  },
  {
    id: 'retail-manager',
    name: 'Retail & Sales Manager 🛍️',
    averageSalary: 250000,
    growthOutlook: 'Medium',
    description: 'Strong retail growth driven by online shopping hubs and Almaty megamalls.',
  },
  {
    id: 'barista-waiter',
    name: 'Barista / Service Staff ☕',
    averageSalary: 160000,
    growthOutlook: 'Stable',
    description: 'Popular entry job for students. High turnover but constant openings in specialty cafes.',
  }
];
