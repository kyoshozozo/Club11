/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Sparkles, Coffee } from 'lucide-react';
import { OPENING_HOURS, DAY_NAMES, WEEK_ORDER, formatDayHours, MAX_CHAT_QUESTIONS, CHAT_LIMIT_MESSAGE } from '../data';

interface AiChatbotProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onNavigateToBooking: () => void;
}

export default function AiChatbot({ isOpen, setIsOpen, onNavigateToBooking }: AiChatbotProps) {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Szia! Sára vagyok, a Club 11 virtuális csaposa és szalonvezetője! 👋 Miben segíthetek ma? Kérdezhetsz a biliárd árakról, a nyitvatartásról, a megközelítésről, vagy az isteni, ropogós nachosunkról!',
      timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages list changes
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // A 12. kérdés megválaszolása után a csapos telefonra irányít, és nem fogad több kérdést
  const questionCount = messages.filter(m => m.role === 'user').length;
  const limitReached = questionCount >= MAX_CHAT_QUESTIONS;

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading || limitReached) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    // Ez volt az utolsó megengedett kérdés: a válasz után jön a telefonos üzenet
    const isLastQuestion = updatedMessages.filter(m => m.role === 'user').length >= MAX_CHAT_QUESTIONS;
    const limitMsg = () => ({
      id: `msg-${Date.now() + 2}`,
      role: 'model',
      text: CHAT_LIMIT_MESSAGE,
      timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    });

    try {
      // Fetch response from server-side /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, text: m.text })) }),
      });

      const data = await response.json();
      
      const modelMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: data.text || 'Sajnálom, de valamilyen porszem került a gépezetbe. Kérlek, hívj fel minket telefonon!',
        timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => (isLastQuestion && !data.limitReached) ? [...prev, modelMsg, limitMsg()] : [...prev, modelMsg]);

    } catch (err) {
      console.error('Error fetching chatbot reply:', err);
      const errorMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: `Szia! Jelenleg hálózati hiba lépett fel. Nyitvatartásunk: ${WEEK_ORDER.map(day => `${DAY_NAMES[day]}: ${formatDayHours(OPENING_HOURS[day])}`).join(', ')}. Hívj minket telefonon: +36 70 621 4181!`,
        timestamp: new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => isLastQuestion ? [...prev, errorMsg, limitMsg()] : [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (question: string) => {
    handleSendMessage(question);
  };

  const quickReplies = [
    'Mik a biliárd árak?',
    'Mikor vagytok nyitva?',
    'Hol található a szalon?',
    'Hogyan tudok foglalni?',
    'Milyen ételek vannak?'
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 w-[350px] sm:w-[420px] h-[520px] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-2xl overflow-hidden shadow-emerald-500/10"
      id="ai-chatbot-modal"
    >
      
      {/* Header panel */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-mono font-bold text-slate-950 text-xs">
            11
          </div>
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-1">
              Sára – Club 11 Csapos
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 fill-current animate-pulse" />
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 block -mt-0.5">Sára (Virtuális Csapos AI)</span>
          </div>
        </div>

        <button 
          onClick={() => setIsOpen(false)}
          id="close-chatbot"
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/40">
        {messages.map((msg) => {
          const isModel = msg.role === 'model';
          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-2.5 ${isModel ? 'justify-start' : 'justify-end'}`}
              id={`chat-msg-${msg.id}`}
            >
              {isModel && (
                <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5 font-bold">
                  11
                </div>
              )}
              
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                isModel
                  ? 'bg-slate-900 text-slate-200 border border-slate-850 rounded-tl-none'
                  : 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
              }`}>
                <p className="whitespace-pre-line font-sans">{msg.text}</p>
                <span className={`block text-[8px] font-mono mt-1.5 text-right ${isModel ? 'text-slate-500' : 'text-slate-950/60'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5 font-bold">
              11
            </div>
            <div className="bg-slate-900 border border-slate-850 text-slate-400 rounded-2xl rounded-tl-none px-3.5 py-3 text-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: '0ms'}}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: '150ms'}}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: '300ms'}}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies list */}
      {messages.length < 5 && (
        <div className="px-4 py-2 border-t border-slate-900 bg-slate-950 space-y-1">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider block">Gyakori kérdések</span>
          <div className="flex flex-wrap gap-1.5">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                id={`quick-reply-${reply.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => handleQuickReply(reply)}
                className="py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-[10px] font-semibold text-slate-300 border border-slate-850 hover:border-slate-800 transition-all font-sans"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls form */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            id="chat-input-field"
            placeholder={limitReached ? 'További kérdésekkel hívj minket: +36 70 621 4181' : 'Kérdezz valamit a Club 11-ről...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading || limitReached}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
          />
          <button
            type="submit"
            id="chat-submit-btn"
            disabled={!inputText.trim() || isLoading || limitReached}
            className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black transition-all hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:scale-100"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
