"use client";

import React, { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { Send, Bot, User, Trash2, Clock, Star, AlertCircle, Bookmark, ExternalLink } from "lucide-react";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  programs?: any[];
  sources?: any[];
}

export default function ChatPage() {
  const { language, t } = useLanguage();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/chat/sessions");
      setSessions(res.data);
      if (res.data.length > 0 && !activeSessionId) {
        setActiveSessionId(res.data[0].id);
      } else if (res.data.length === 0) {
        setMessages([]);
      }
    } catch (err) {
      setError("Failed to load chat history.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/chat/sessions/${sessionId}/messages`);
      setMessages(res.data);
    } catch (err) {
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMsgText = inputValue;
    setInputValue("");
    setError(null);

    const tempUserMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: userMsgText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    setLoading(true);

    try {
      const res = await api.post("/chat", {
        message: userMsgText,
        session_id: activeSessionId || undefined,
        language: language === "kz" ? "kz" : language, // match backend enum kx/ru/en
      });

      const aiMsg: ChatMessage = {
        id: res.data.message_id || Math.random().toString(),
        role: "assistant",
        content: res.data.answer,
        created_at: new Date().toISOString(),
        programs: res.data.programs_found || [],
        sources: res.data.sources || [],
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (!activeSessionId) {
        setActiveSessionId(res.data.session_id);
        fetchSessions();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to communicate with AI.");
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat session?")) return;
    try {
      await api.delete(`/chat/sessions/${id}`);
      if (activeSessionId === id) {
        setActiveSessionId(null);
      }
      fetchSessions();
    } catch (err) {
      setError("Failed to delete session.");
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-12rem)] grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
        {/* Chat History Sidebar */}
        <div className="lg:col-span-3 bg-bg-card border border-border-card rounded-3xl p-4 flex flex-col justify-between hidden lg:flex h-full">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <button
              onClick={createNewSession}
              className="w-full bg-emerald-primary/10 hover:bg-emerald-primary/20 border border-emerald-primary/20 text-emerald-light font-bold py-2.5 px-4 rounded-xl text-sm transition-all"
            >
              {t("newChat")}
            </button>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block px-2 mb-2 text-left">{t("recentChats")}</span>
              {loadingSessions ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-bg-dark rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-xs text-text-secondary text-center py-8">No chat history.</div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                      activeSessionId === session.id
                        ? "bg-bg-dark border-emerald-primary/30 text-emerald-light"
                        : "border-transparent text-text-secondary hover:text-text-primary hover:bg-white/5"
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="truncate text-white font-bold">{session.title}</div>
                      <div className="text-[9px] text-text-muted mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="p-1 hover:bg-red-primary/10 rounded text-text-muted hover:text-red-primary transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-9 bg-bg-card border border-border-card rounded-3xl flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="border-b border-border-card/60 p-4 flex items-center gap-3 shrink-0 bg-bg-card/40">
            <div className="w-10 h-10 rounded-2xl bg-emerald-primary/10 text-emerald-light flex items-center justify-center font-bold">🤖</div>
            <div className="text-left">
              <h3 className="font-bold text-sm text-white">{t("govNavigator")}</h3>
              <p className="text-[10px] text-emerald-light">{t("chatPrompt")}</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-dark/15">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 bg-emerald-primary/10 rounded-2xl flex items-center justify-center text-emerald-light">
                  <Bot className="w-6 h-6" />
                </div>
                <h4 className="font-outfit font-bold text-lg text-white">How can I help you today?</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Try asking questions like: <br />
                  <span className="italic">"Can I get a startup grant in Almaty?"</span> or <br />
                  <span className="italic">"What scholarships are available for students?"</span>
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 max-w-4xl ${
                  msg.role === "user" ? "flex-row-reverse self-end ml-auto" : "self-start"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                  msg.role === "user"
                    ? "bg-emerald-primary/10 text-emerald-light"
                    : "bg-emerald-primary text-white"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-3 max-w-[85%]">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed text-left ${
                    msg.role === "user"
                      ? "bg-emerald-primary text-white rounded-tr-none"
                      : "bg-bg-card border border-border-card rounded-tl-none text-text-primary"
                  }`}>
                    {msg.content}
                  </div>

                  {/* Render programs if found */}
                  {msg.role === "assistant" && msg.programs && msg.programs.length > 0 && (
                    <div className="space-y-2 border border-border-green/20 bg-emerald-primary/5 p-4 rounded-2xl">
                      <div className="text-xs font-bold text-emerald-light flex items-center gap-1.5 text-left">
                        <Bookmark className="w-3.5 h-3.5" />
                        {t("matchedOpportunities")}
                      </div>
                      <div className="grid gap-2">
                        {msg.programs.map((prog: any, idx: number) => (
                          <div key={idx} className="bg-bg-card p-3 rounded-xl border border-border-card flex items-center justify-between gap-3 text-left">
                            <div>
                              <div className="text-xs font-bold text-white">{prog.title}</div>
                              <div className="text-[10px] text-text-secondary mt-0.5">
                                {prog.organization} {prog.amount_display && `• Max: ${prog.amount_display}`}
                              </div>
                            </div>
                            <span className="bg-emerald-primary/10 border border-emerald-primary/20 text-emerald-light font-bold text-[10px] px-2.5 py-1 rounded-lg">
                              {prog.match_score || "80"}% Match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Render source citations */}
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-text-secondary text-left">
                      <span className="font-bold text-text-muted">{t("sources")}</span>
                      {msg.sources.map((src: any, idx: number) => (
                        <a
                          key={idx}
                          href={src.source_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 hover:text-emerald-light underline"
                        >
                          [{idx + 1}] {src.title || "Government Document"}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 max-w-4xl self-start">
                <div className="w-8 h-8 rounded-lg bg-emerald-primary text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-bg-card border border-border-card p-4 rounded-2xl rounded-tl-none max-w-[85%] self-start flex items-center gap-1.5 py-3">
                  <span className="w-1.5 h-1.5 bg-emerald-primary rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-4 max-w-4xl self-start text-red-primary">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs">{error}</div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="border-t border-border-card/60 p-4 bg-bg-card/40 shrink-0 flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t("chatPlaceholder")}
              className="block w-full px-4 py-3 bg-bg-dark border border-border-card rounded-2xl focus:outline-none focus:border-emerald-primary focus:ring-1 focus:ring-emerald-primary text-white text-sm"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="bg-emerald-primary hover:bg-emerald-dark disabled:bg-emerald-primary/44 text-white p-3 rounded-2xl transition-colors shadow-md shadow-emerald-primary/10 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
