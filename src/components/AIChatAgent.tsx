/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, ArrowRight, ShoppingCart, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils';

interface AIChatAgentProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  lang: 'en' | 'ar' | 'es';
  currency: 'USD' | 'EUR' | 'AED';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendations?: string[]; // Recommended product IDs
}

export default function AIChatAgent({
  products,
  onAddToCart,
  lang,
  currency
}: AIChatAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your **SuuqHub Smart AI Shopping Companion**. Need help choosing a high-performance ANC headphone, rolltop traveler backpack, smart watch-X, or workspace mesh chair? Ask me details, colors, or coupons, and I'll find your perfect fit!"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const userMessageText = inputText.trim();
    setInputText('');
    setSending(true);

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = { id: userMsgId, sender: 'user', text: userMessageText };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Structure previous conversation history to feed back-and-forth context
      const chatHistory = messages.slice(-5).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessageText,
          chatHistory
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          recommendations: data.generatedRecommendations || []
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: "I am having temporary latency queries in compiling technical details. Feel free to browse our catalogs directly above!"
        }]);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: "It looks like my communication grid is briefly silent. Please ensure the workspace server.ts is compiled."
      }]);
    } finally {
      setSending(false);
    }
  };

  // Helper to safely render simple custom markdown (bold statements)
  const formatText = (textString: string) => {
    return textString.split('\n').map((paragraph, pIdx) => {
      // Split by double asterisks for bolding
      const segments = paragraph.split('**');
      return (
        <p key={pIdx} className="mb-2 leading-relaxed">
          {segments.map((seg, sIdx) => (
            sIdx % 2 === 1 ? <strong key={sIdx} className="text-indigo-700 font-bold">{seg}</strong> : seg
          ))}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Sparkles Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="cursor-pointer bg-indigo-600 text-white p-3.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group animate-bounce border-2 border-white"
          id="ai-floating-trigger"
        >
          <Sparkles className="w-5 h-5 animate-pulse text-white" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-white text-xs">AI Shopper Bot</span>
        </button>
      )}

      {/* Expanded chat window panel */}
      {isOpen && (
        <div 
          className="w-80 sm:w-96 h-[500px] rounded bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 animate-fade"
          id="ai-shoppingkey-chat-window"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-900">SuuqHub Shopping Assistant</span>
                <span className="block text-[8px] font-mono text-emerald-600 font-bold tracking-wider uppercase">Active Gemini Flash AI</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-705 p-1 hover:bg-slate-100 rounded cursor-pointer transition"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Messages Port */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div key={m.id} className="space-y-2.5">
                <div className={`p-3 rounded max-w-[85%] text-left ${m.sender === 'user' ? 'bg-indigo-600 text-white self-end ml-auto' : 'bg-slate-100 text-slate-800 mr-auto border border-slate-200'}`}>
                  {formatText(m.text)}
                </div>

                {/* Recommendations CTA attachment panels */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 border border-indigo-100 bg-indigo-50/45 p-3 rounded max-w-[85%] mr-auto animate-in fade-in duration-200 text-left">
                    <span className="text-[9px] font-mono font-bold text-indigo-700 uppercase block tracking-wider mb-2">Smart Direct Adds:</span>
                    {m.recommendations.map((recId) => {
                      const matchedProd = products.find(p => p.id === recId);
                      if (!matchedProd) return null;
                      return (
                        <div key={recId} className="flex gap-2 items-center justify-between p-1.5 hover:bg-white rounded border border-slate-200 transition bg-white shadow-xs">
                          <div className="flex gap-1.5 items-center">
                            <img src={matchedProd.image} className="w-8 h-8 rounded bg-slate-50 object-cover" />
                            <div>
                              <span className="font-semibold block text-[10px] text-slate-800 line-clamp-1">{matchedProd.title}</span>
                              <span className="text-[9px] text-slate-500 font-mono">{formatPrice(matchedProd.price, currency)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => { onAddToCart(matchedProd); }}
                            className="bg-indigo-600 text-white p-1.5 rounded text-[9px] font-bold hover:bg-indigo-700 active:scale-95 cursor-pointer flex items-center justify-center"
                          >
                            <ShoppingCart className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono text-left max-w-[85%]">
                <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                <span>Gemini Personal Shopper consulting inventory...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form message entry */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              required
              type="text"
              disabled={sending}
              placeholder="Ask: Recommend the titanium watch..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-grow text-xs bg-slate-50 border border-slate-200 rounded px-4 py-2 text-slate-850 placeholder-slate-400 focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 active:scale-95 transition cursor-pointer flex items-center justify-center font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
