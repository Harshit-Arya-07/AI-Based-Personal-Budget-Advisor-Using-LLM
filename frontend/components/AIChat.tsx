'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  RefreshCcw,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Settings,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { authedDelete, authedGet, authedPost, authedPut } from '@/lib/api';
import type { ExpenseItem } from '@/lib/types';

interface AIChatProps {
  expenses: ExpenseItem[];
  monthlyIncome: number;
}

interface ChatMetadata {
  insight?: string;
  suggestions?: string[];
  riskLevel?: 'Low' | 'Medium' | 'High';
  quickReplies?: string[];
  financialMood?: 'Stable' | 'Improving' | 'Risky' | 'Declining';
  moodReason?: string;
  topRiskFactors?: string[];
  actionPlan?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: ChatMetadata;
}

interface PersonalityMode {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const PERSONALITY_MODES: PersonalityMode[] = [
  { id: 'friendly', name: 'Friendly', description: 'Encouraging and supportive', icon: '😊' },
  { id: 'strict', name: 'Strict', description: 'Direct and no-nonsense', icon: '📋' },
  { id: 'analytical', name: 'Analytical', description: 'Data-focused insights', icon: '📊' },
];

const MOOD_CONFIG = {
  Stable: { color: '#10B981', icon: Shield, label: 'Stable' },
  Improving: { color: '#4F6EF7', icon: TrendingUp, label: 'Improving' },
  Risky: { color: '#F59E0B', icon: AlertTriangle, label: 'Risky' },
  Declining: { color: '#EF4444', icon: TrendingDown, label: 'Declining' },
};

const RISK_COLORS = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
};

export default function AIChat({ expenses, monthlyIncome }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [personalityMode, setPersonalityMode] = useState<string>('friendly');
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false);
  const [financialMood, setFinancialMood] = useState<keyof typeof MOOD_CONFIG>('Stable');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history and suggestions on mount
  useEffect(() => {
    const init = async () => {
      await Promise.all([loadChatHistory(), loadQuickSuggestions(), loadPersonalityMode()]);
      setIsLoadingHistory(false);
    };
    init();
  }, []);

  const loadChatHistory = async () => {
    try {
      const data = await authedGet('/api/budget/chat/history?limit=20');
      if (data.messages?.length > 0) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m.id || Date.now().toString(),
            role: m.role,
            content: m.message,
            timestamp: new Date(m.timestamp),
            metadata: m.metadata,
          }))
        );
        // Set mood from last assistant message
        const lastAssistant = data.messages.find((m: any) => m.role === 'assistant');
        if (lastAssistant?.metadata?.financialMood) {
          setFinancialMood(lastAssistant.metadata.financialMood);
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const loadQuickSuggestions = async () => {
    try {
      const data = await authedGet('/api/budget/chat/suggestions');
      setQuickReplies(data.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setQuickReplies(['How am I doing?', 'Where can I save?', 'Review my goals']);
    }
  };

  const loadPersonalityMode = async () => {
    try {
      const data = await authedGet('/api/budget/chat/personality');
      setPersonalityMode(data.personalityMode || 'friendly');
    } catch (err) {
      console.error('Failed to load personality mode:', err);
    }
  };

  const updatePersonalityMode = async (mode: string) => {
    try {
      await authedPut('/api/budget/chat/personality', { mode });
      setPersonalityMode(mode);
      setShowPersonalitySelector(false);
    } catch (err) {
      console.error('Failed to update personality mode:', err);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const data = await authedPost('/api/budget/chat/send', { message: text.trim() });
      const aiResponse = data.response;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.reply || "I apologize, I couldn't generate a response.",
        timestamp: new Date(),
        metadata: {
          insight: aiResponse.insight,
          suggestions: aiResponse.suggestions,
          riskLevel: aiResponse.riskLevel,
          quickReplies: aiResponse.quickReplies,
          financialMood: aiResponse.financialMood,
          moodReason: aiResponse.moodReason,
          topRiskFactors: aiResponse.topRiskFactors,
          actionPlan: aiResponse.actionPlan,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update quick replies and mood
      if (aiResponse.quickReplies?.length > 0) {
        setQuickReplies(aiResponse.quickReplies);
      }
      if (aiResponse.financialMood) {
        setFinancialMood(aiResponse.financialMood);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      // Provide user-friendly error messages
      let errorMessage = 'Failed to send message';
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (err.message?.includes('Rate limited')) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = async () => {
    try {
      await authedDelete('/api/budget/chat/history');
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
    setMessages([]);
    setError(null);
    loadQuickSuggestions();
  };

  const MoodBadge = () => {
    const config = MOOD_CONFIG[financialMood];
    const Icon = config.icon;
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: `${config.color}15`, color: config.color }}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-[600px] bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-[#4F6EF7]/5 to-[#8B5CF6]/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Financial Assistant</h3>
            <p className="text-xs text-muted-foreground">Powered by Gemini</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MoodBadge />

          {/* Personality selector */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPersonalitySelector(!showPersonalitySelector)}
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span className="text-sm">
                {PERSONALITY_MODES.find((m) => m.id === personalityMode)?.icon}
              </span>
              <ChevronDown className="w-3 h-3" />
            </motion.button>

            <AnimatePresence>
              {showPersonalitySelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[180px]"
                >
                  <div className="p-2 border-b border-border">
                    <p className="text-xs font-medium text-muted-foreground">AI Personality</p>
                  </div>
                  {PERSONALITY_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => updatePersonalityMode(mode.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2 ${
                        personalityMode === mode.id ? 'bg-accent' : ''
                      }`}
                    >
                      <span>{mode.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{mode.name}</p>
                        <p className="text-xs text-muted-foreground">{mode.description}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading history */}
        {isLoadingHistory && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#4F6EF7]" />
          </div>
        )}

        {/* Welcome message */}
        {!isLoadingHistory && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] mx-auto mb-4 flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">How can I help you today?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              I have access to your real financial data. Ask me anything!
            </p>

            {/* Quick reply chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {quickReplies.map((prompt) => (
                <motion.button
                  key={prompt}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendMessage(prompt)}
                  className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-[#4F6EF7] hover:bg-[#4F6EF7]/5 transition-colors"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Message list */}
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-[#4F6EF7]'
                    : 'bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6]'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message bubble */}
              <div className={`max-w-[75%] ${message.role === 'user' ? '' : 'space-y-2'}`}>
                <div
                  className={`p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[#4F6EF7] text-white rounded-tr-md'
                      : 'bg-accent text-foreground rounded-tl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-white/60' : 'text-muted-foreground'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* AI Response metadata */}
                {message.role === 'assistant' && message.metadata && (
                  <>
                    {/* Risk and insight badges */}
                    {(message.metadata.riskLevel || message.metadata.insight) && (
                      <div className="flex flex-wrap gap-2 px-1">
                        {message.metadata.riskLevel && (
                          <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: `${RISK_COLORS[message.metadata.riskLevel]}15`,
                              color: RISK_COLORS[message.metadata.riskLevel],
                            }}
                          >
                            Risk: {message.metadata.riskLevel}
                          </span>
                        )}
                        {message.metadata.insight && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[#4F6EF7]/10 text-[#4F6EF7] flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {message.metadata.insight.slice(0, 50)}
                            {message.metadata.insight.length > 50 ? '...' : ''}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action plan */}
                    {message.metadata.actionPlan && message.metadata.actionPlan.length > 0 && (
                      <div className="px-1">
                        <div className="bg-[#4F6EF7]/5 rounded-lg p-3 border border-[#4F6EF7]/20">
                          <p className="text-xs font-medium text-[#4F6EF7] mb-2">Action Plan</p>
                          <ul className="space-y-1">
                            {message.metadata.actionPlan.map((action, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-[#4F6EF7]">•</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-accent rounded-2xl rounded-tl-md p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#4F6EF7]" />
                <span className="text-sm text-muted-foreground">Analyzing your finances...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="px-4 py-2 rounded-lg bg-[#DC3545]/10 text-[#DC3545] text-sm flex items-center gap-2">
              <span>{error}</span>
              <button
                onClick={() => sendMessage(messages[messages.length - 1]?.content || '')}
                className="hover:underline"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      {!isLoading && messages.length > 0 && quickReplies.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickReplies.slice(0, 4).map((reply) => (
              <motion.button
                key={reply}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendMessage(reply)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-[#4F6EF7] hover:bg-[#4F6EF7]/5 transition-colors"
              >
                {reply}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background/50">
        <div className="relative flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your finances..."
            disabled={isLoading}
            maxLength={1000}
            className="flex-1 h-12 px-4 rounded-xl bg-accent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent disabled:opacity-50 transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #4F6EF7 0%, #8B5CF6 100%)',
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
