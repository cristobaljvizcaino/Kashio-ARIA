import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, MessageSquare, Trash2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatWithAria } from '../services/geminiService';
import { ChatMessage } from '../types/types';

const STORAGE_KEY = 'aria_chat_history_v1';

const loadHistory = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
};

const saveHistory = (messages: ChatMessage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.warn('No se pudo persistir el historial de chat:', e);
  }
};

const INITIAL_GREETING: ChatMessage = {
  role: 'model',
  text: '¡Hola! Soy **ARIA**, tu Agente de IA para el PDLC de Kashio. Puedo ayudarte con:\n\n- Dudas sobre **gates G0–G5** y sus SLAs\n- Generación y estructura de **artefactos**\n- Alineación con **OEA / OKRs / KPC**\n- Buenas prácticas del **PDLC**\n\n¿En qué te ayudo hoy?'
};

const QUICK_PROMPTS = [
  '¿Qué artefactos se entregan en G2?',
  'Explícame la diferencia entre Change y Run',
  '¿Cómo estructuro un SRS?',
  'Resumen del flujo G0 → G5',
];

const AriaChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadHistory();
    return saved.length > 0 ? saved : [INITIAL_GREETING];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithAria(text, nextMessages);
      setMessages(prev => [...prev, { role: 'model', text: response || 'No obtuve respuesta.' }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error al consultar ARIA: ${err?.message || 'intenta nuevamente.'}` }]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_GREETING]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ARIA Chat</h1>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-amber-200">
                  Beta
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center space-x-2 mt-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>Agente IA online · Experto en PDLC Kashio</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleClear}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors text-xs font-semibold"
            title="Limpiar conversación"
          >
            <Trash2 size={14} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/40">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shrink-0 shadow">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                }`}
              >
                {msg.role === 'model' ? (
                  <div className="prose prose-sm max-w-none prose-slate prose-p:my-2 prose-ul:my-2 prose-headings:mt-3 prose-headings:mb-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shrink-0 shadow">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && !isTyping && (
          <div className="px-6 pt-4 pb-2 bg-white border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Sugerencias
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold hover:bg-indigo-100 border border-indigo-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-5 bg-white border-t border-slate-100">
          <div className="relative flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta sobre el PDLC... (Enter para enviar, Shift+Enter para nueva línea)"
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-slate-100 border border-transparent rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-200 outline-none text-sm font-medium resize-none max-h-40"
                style={{ minHeight: '48px' }}
                disabled={isTyping}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20"
              title="Enviar"
            >
              {isTyping ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-[10px] text-slate-400 font-medium flex items-center space-x-1.5">
              <MessageSquare size={12} />
              <span>{messages.filter(m => m.role === 'user').length} mensajes enviados</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Potenciado por Gemini · Historial guardado localmente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AriaChat;
