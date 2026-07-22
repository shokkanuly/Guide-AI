"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingDown, TrendingUp, Calculator } from "lucide-react";
import { EconomicIndicator } from "@/lib/economy/api/mockData";
import { useTranslation } from "@/lib/economy/LanguageContext";

interface SimulatorProps {
  indicators: EconomicIndicator[];
}

export function Simulator({ indicators }: SimulatorProps) {
  const { t } = useTranslation();

  // What-If State
  const [inflationDelta, setInflationDelta] = useState([0]);
  const [interestDelta, setInterestDelta] = useState([0]);

  // Personal State
  const [income, setIncome] = useState("350000");
  const [expenses, setExpenses] = useState("250000");
  const [impactResult, setImpactResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedIncome = localStorage.getItem("econpulse_income");
    const savedExpenses = localStorage.getItem("econpulse_expenses");
    if (savedIncome) setIncome(savedIncome);
    if (savedExpenses) setExpenses(savedExpenses);
  }, []);

  useEffect(() => {
    localStorage.setItem("econpulse_income", income);
    localStorage.setItem("econpulse_expenses", expenses);
  }, [income, expenses]);

  // Helper to find latest value
  const getLatest = (id: string) => {
    const data = indicators.find(i => i.id === id)?.data;
    return data ? data[data.length - 1].value : 0;
  };

  const currentInflation = getLatest('inflation');
  const currentInterest = getLatest('interest');

  const calculateImpact = () => {
    setLoading(true);
    setTimeout(() => {
      const incomeNum = Number(income);
      const expensesNum = Number(expenses);
      
      const newInflation = currentInflation + inflationDelta[0];
      
      // Assuming 60% of expenses are goods/services affected by inflation
      const variableExpenses = expensesNum * 0.6;
      // Assuming 40% of expenses are debt service (mortgage, loans)
      const debtExpenses = expensesNum * 0.4;
      // Assume 50% of debt is variable rate (affected directly by interest rate changes)
      const variableDebtExpenses = debtExpenses * 0.5;

      const expenseIncrease = variableExpenses * (newInflation / 100);
      const mortgageImpact = variableDebtExpenses * (interestDelta[0] / 100); 
      
      const newExpenses = expensesNum + expenseIncrease + mortgageImpact;
      const newSavings = incomeNum - newExpenses;
      const oldSavings = incomeNum - expensesNum;

      setImpactResult({
        expenseChange: newExpenses - expensesNum,
        newSavings,
        savingsChange: newSavings - oldSavings,
      });
      setLoading(false);
    }, 600); // simulate calculation/AI delay
  };

  return (
    <Card className="w-full mt-8 bg-card/50 backdrop-blur-xl border-border/50 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-500" />
          {t("lab.title")}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t("lab.desc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="what-if" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="what-if" className="cursor-pointer">{t("lab.tabWhatIf")}</TabsTrigger>
            <TabsTrigger value="personal" className="cursor-pointer">{t("lab.tabPersonal")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="what-if" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-sm sm:text-base">{t("lab.labelInflationAdj")}</Label>
                  <span className="font-mono text-sm text-muted-foreground">
                    {inflationDelta[0] > 0 ? '+' : ''}{inflationDelta[0]}%
                  </span>
                </div>
                <Slider 
                  defaultValue={[0]} max={10} min={-10} step={0.5} 
                  value={inflationDelta} onValueChange={(val) => setInflationDelta(Array.isArray(val) ? [...val] : [val])} 
                />
                <p className="text-xs text-muted-foreground">
                  {t("lab.simulatedInflation")}: <span className="text-foreground font-semibold">{(currentInflation + inflationDelta[0]).toFixed(1)}%</span> (Current: {currentInflation}%)
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-sm sm:text-base">{t("lab.labelInterestAdj")}</Label>
                  <span className="font-mono text-sm text-muted-foreground">
                    {interestDelta[0] > 0 ? '+' : ''}{interestDelta[0]}%
                  </span>
                </div>
                <Slider 
                  defaultValue={[0]} max={5} min={-5} step={0.25} 
                  value={interestDelta} onValueChange={(val) => setInterestDelta(Array.isArray(val) ? [...val] : [val])} 
                />
                <p className="text-xs text-muted-foreground">
                  {t("lab.simulatedInterest")}: <span className="text-foreground font-semibold">{(currentInterest + interestDelta[0]).toFixed(2)}%</span> (Current: {currentInterest}%)
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("lab.labelIncome")}</Label>
                  <Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} className="bg-muted/40 border-border/60 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>{t("lab.labelExpenses")}</Label>
                  <Input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} className="bg-muted/40 border-border/60 text-sm" />
                </div>
                <Button onClick={calculateImpact} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer py-5 rounded-xl font-medium">
                  {loading ? (
                    <span className="animate-pulse flex items-center gap-2"><Sparkles className="w-4 h-4" /> {t("lab.statusCalculating")}</span>
                  ) : (
                    t("lab.buttonCalculate")
                  )}
                </Button>
              </div>

              {impactResult && (
                <div className="bg-muted/30 p-6 rounded-xl border border-border/50 flex flex-col justify-center space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    {t("lab.titleForecast")}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">{t("lab.labelExtraCosts")}</span>
                    <span className="text-sm sm:text-lg font-bold text-red-500 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      +{Math.round(impactResult.expenseChange).toLocaleString()} ₸
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">{t("lab.labelNewSavings")}</span>
                    <span className={`text-sm sm:text-lg font-bold ${impactResult.newSavings > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {Math.round(impactResult.newSavings).toLocaleString()} ₸
                    </span>
                  </div>

                  <p className="text-[10px] sm:text-xs text-muted-foreground pt-4 border-t border-border/50">
                    {t("lab.textBasedOn")}: {(currentInflation + inflationDelta[0]).toFixed(1)}% & {(currentInterest + interestDelta[0]).toFixed(2)}%.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
