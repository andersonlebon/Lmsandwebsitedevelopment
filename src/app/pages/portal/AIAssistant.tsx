import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, User, Sparkles, BookOpen, Languages, Monitor, Lightbulb } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const suggestions = [
  { icon: Languages, text: 'Explain the difference between passé composé and imparfait' },
  { icon: BookOpen, text: 'Help me practice English conversation' },
  { icon: Monitor, text: 'Explain Python variables and data types' },
  { icon: Lightbulb, text: 'Give me tips for my IELTS preparation' },
];

export function PortalAIAssistant() {
  const [messages, setMessages] = useState<Message[]>(() => {
    let name = 'Student';
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('btc_user') : null;
      if (raw) {
        const o = JSON.parse(raw);
        if (o && typeof o.name === 'string') name = o.name;
      }
    } catch { /* ignore */ }
    return [
      { id: 0, role: 'assistant', text: `Hello, ${name}! I'm KALI, your Learning Assistant. I can help you with your courses, practice languages, explain concepts, and prepare for exams. What would you like to work on today?` }
    ];
  });
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    const userMsg: Message = { id: messages.length, role: 'user', text: msg };
    setMessages(ms => [...ms, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const data = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: msg }),
      });
      const responseText = typeof data?.text === 'string' ? data.text : 'Sorry, I could not get a response. Please try again.';
      setMessages(ms => [...ms, { id: ms.length, role: 'assistant', text: responseText }]);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setMessages(ms => [...ms, { id: ms.length, role: 'assistant', text: `Sorry: ${errMsg}` }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>AI Learning Assistant</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Powered by BTC — your personal study companion</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Online</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                }`}
                style={msg.role === 'user' ? { background: 'var(--btc-primary,#16a34a)' } : {}}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
                    <User size={16} className="text-gray-500 dark:text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full bg-gray-400" />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-5 pb-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1"><Sparkles size={12} /> Quick suggestions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSend(s.text)}
                  className="flex items-center gap-2 p-3 rounded-xl text-left text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-600">
                  <s.icon size={14} style={{ color: 'var(--btc-primary,#16a34a)' }} />
                  <span className="truncate">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about your courses..."
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 transition-colors"
            />
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleSend()}
              disabled={!input.trim() || typing}
              className="px-4 py-3 rounded-xl text-white font-medium disabled:opacity-50 transition-all hover:opacity-90"
              style={{ background: 'var(--btc-primary,#16a34a)' }}>
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}