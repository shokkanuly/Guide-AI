import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Sparkles, X, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES } from "@/lib/economy/api/mockData";
import { useTranslation } from "@/lib/economy/LanguageContext";

type Message = {
  role: "user" | "ai";
  content: string;
};

const QUICK_PROMPTS = [
  "What's the inflation outlook?",
  "How do interest rates affect me?",
  "Is GDP growth strong?",
  "Compare unemployment trends",
];

export function AiChat({ contextData, country, parentMode = false }: { contextData: any; country: string; parentMode?: boolean }) {
  const { t, language } = useTranslation();
  const countryInfo = COUNTRIES.find(c => c.code === country);
  
  const countryNameDict: Record<string, Record<string, string>> = {
    KAZ: { ru: "Казахстан", kk: "Қазақстан", en: "Kazakhstan" },
    USA: { ru: "США", kk: "АҚШ", en: "United States" },
    RUS: { ru: "Россия", kk: "Ресей", en: "Russia" },
  };
  const countryLocalizedName = countryInfo ? (countryNameDict[countryInfo.code]?.[language] ?? countryInfo.name) : country;
  const countryLabel = countryInfo ? `${countryInfo.flag} ${countryLocalizedName}` : country;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Message timestamps to implement the sliding rate limiter window (5 RPM limit)
  const [msgTimestamps, setMsgTimestamps] = useState<number[]>([]);
  const [cooldown, setCooldown] = useState(0);

  // Reset greeting when country or parentMode or language changes
  useEffect(() => {
    const greeting = parentMode
      ? t("chat.welcomeFamily", { country: countryLabel })
      : t("chat.welcomeAnalyst", { country: countryLabel });

    setMessages([{ role: "ai", content: greeting }]);
  }, [country, countryLabel, parentMode, language, t]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, isLoading]);

  // Handle visual cooldown decrement
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown(c => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSend = async (text?: string) => {
    const userMessage = (text ?? input).trim();
    if (!userMessage || isLoading || cooldown > 0) return;
    setInput("");

    const now = Date.now();
    // Keep only timestamps within the last 60 seconds
    const activeTimestamps = msgTimestamps.filter(t => now - t < 60000);

    let nextCooldown = 1; // Reduced to 1s for better experience
    if (activeTimestamps.length >= 6) {
      const timeToWait = Math.ceil((60000 - (now - activeTimestamps[0])) / 1000);
      nextCooldown = Math.max(timeToWait, 1);
    }

    setCooldown(nextCooldown);
    setMsgTimestamps([...activeTimestamps, now]);

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, contextData, country, parentMode, language }),
      });

      if (!response.ok) {
        let errMsg = "Sorry, I encountered an error. Please try again.";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const data = await response.json();
            errMsg = data.error || errMsg;
          }
        } catch (_) {}

        setMessages(prev => [...prev, { role: "ai", content: errMsg }]);
        setIsLoading(false);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: "ai", content: data.message || data.error }]);
        setIsLoading(false);
        return;
      }

      // Streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiResponse = "";

      setMessages(prev => [...prev, { role: "ai", content: "" }]);
      setIsLoading(false);

      while (reader && !done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          aiResponse += decoder.decode(value, { stream: true });
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "ai", content: aiResponse };
            return updated;
          });
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", content: "Failed to connect to the AI server." }]);
      setIsLoading(false);
    }
  };

  // Localized quick prompts list
  const quickPromptsList = [
    t("chat.quickPrompts.0") || QUICK_PROMPTS[0],
    t("chat.quickPrompts.1") || QUICK_PROMPTS[1],
    t("chat.quickPrompts.2") || QUICK_PROMPTS[2],
    t("chat.quickPrompts.3") || QUICK_PROMPTS[3],
  ];

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/30 flex items-center justify-center z-40 transition-colors cursor-pointer"
            style={{ boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background border-l border-border/50 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-auto border-b border-border/50 flex flex-col px-4 py-3 bg-muted/20 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-blue-400">
                  <Bot className="w-5 h-5" />
                  <span>{parentMode ? t("chat.familyTitle") : t("chat.analystTitle")}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full -mr-1">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Database className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {t("chat.subtitle")}
                </span>
              </div>
              <div className="text-xs text-blue-400/80 mt-1 font-medium">
                {t("historical.legendValue")}: {countryLabel}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0 p-4">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-muted/50 border border-border/50 text-foreground rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-sm p-4 flex gap-1.5 items-center">
                      {[0, 150, 300].map((delay) => (
                        <div
                          key={delay}
                          className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Prompts */}
            <div className="px-4 pb-2 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {quickPromptsList.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading || cooldown > 0}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-blue-500/40 hover:bg-blue-500/5 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 pt-2 bg-background border-t border-border/50 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    cooldown > 0
                      ? t("chat.cooldown", { secs: cooldown })
                      : t("chat.placeholder", { country: countryLocalizedName })
                  }
                  className="flex-1 bg-muted/50 border-border/50 focus-visible:ring-blue-500 text-sm"
                  disabled={isLoading || cooldown > 0}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading || cooldown > 0}
                  className="bg-blue-600 hover:bg-blue-500 text-white shrink-0 relative cursor-pointer"
                >
                  {cooldown > 0 ? (
                    <span className="text-[10px] font-bold">{cooldown}s</span>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


