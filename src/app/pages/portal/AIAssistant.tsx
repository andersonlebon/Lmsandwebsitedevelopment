import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, User, Sparkles, BookOpen, Languages, Monitor, Lightbulb } from 'lucide-react';

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

const MOCK_RESPONSES: Record<string, string> = {
  default: "Great question! I'm BTC's AI Learning Assistant. I can help you with language practice, course material explanations, study tips, and exam preparation. What would you like to learn about today?",
  english: "For English learning, I recommend focusing on: 1) Daily reading of news articles, 2) Listening to English podcasts, 3) Practicing speaking with classmates, and 4) Writing a journal entry every day. Would you like me to help with any specific topic?",
  french: "Le passé composé is used for completed actions in the past, while l'imparfait describes ongoing or habitual past actions. For example: 'J'ai mangé' (I ate - completed) vs 'Je mangeais' (I was eating - ongoing). Want me to give you more examples?",
  python: "In Python, variables store data values. You create a variable by assigning a value: `name = 'Amina'` (string), `age = 22` (integer), `grade = 94.5` (float), `is_student = True` (boolean). Python automatically detects the data type. Would you like to practice with some exercises?",
  ielts: "Here are my top IELTS tips: 1) Practice all 4 skills daily (Reading, Writing, Listening, Speaking), 2) Learn academic vocabulary, 3) Time yourself during practice tests, 4) For Writing Task 2, use a clear structure: Introduction, Body 1, Body 2, Conclusion. What's your target IELTS score?",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('english') || lower.includes('conversation')) return MOCK_RESPONSES.english;
  if (lower.includes('french') || lower.includes('passé') || lower.includes('imparfait')) return MOCK_RESPONSES.french;
  if (lower.includes('python') || lower.includes('variable') || lower.includes('data type')) return MOCK_RESPONSES.python;
  if (lower.includes('ielts') || lower.includes('exam') || lower.includes('preparation')) return MOCK_RESPONSES.ielts;
  return MOCK_RESPONSES.default;
}

export function PortalAIAssistant() {
  const user = JSON.parse(localStorage.getItem('btc_user') || '{"name":"Student"}');
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', text: `Hello, ${user.name}! I'm your BTC AI Learning Assistant. I can help you with your courses, practice languages, explain concepts, and prepare for exams. What would you like to work on today?` }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    const userMsg: Message = { id: messages.length, role: 'user', text: msg };
    setMessages(ms => [...ms, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const response = getResponse(msg);
      setMessages(ms => [...ms, { id: ms.length, role: 'assistant', text: response }]);
      setTyping(false);
    }, 1200 + Math.random() * 800);
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