import { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, Building, Bot, User, RotateCcw, ChevronRight, ShieldCheck, CreditCard, Wrench, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const QUICK_PROMPTS = [
  { id: 'search', label: 'Tafuta nyumba Dar es Salaam', icon: Building, query: 'Natafuta nyumba au apartment ya kupanga Dar es Salaam yenye vyumba 2' },
  { id: 'gepg', label: 'Jinsi ya kulipa kodi kwa GePG', icon: CreditCard, query: 'Jinsi ya kupata GePG Control number na kulipa kodi kwa M-Pesa au benki?' },
  { id: 'maint', label: 'Kuomba matengenezo ya nyumba', icon: Wrench, query: 'Nahitaji kufungua tiketi ya matengenezo kwa sababu bomba linavuja' },
  { id: 'nida', label: 'Uhakiki wa Kitambulisho cha NIDA', icon: ShieldCheck, query: 'Kwa nini namba ya NIDA inahitajika na jinsi ya kuhakiki?' },
];

export default function AIAssistantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Habari! Mimi ni **SmartRent AI** 🤖, msaidizi wako wa huduma za nyumba za SmartRent TZ & Shirika la Nyumba la Taifa (NHC).\n\nNinaweza kukusaidia kutafuta nyumba, kuelewa malipo ya GePG Control Numbers, kuomba mafundi wa matengenezo, na sheria za upangaji. Ungependa nikusaidie nini leo?',
      properties: [],
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/ai/chat`, {
        message: query,
        conversationHistory: messages.slice(-6)
      });

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.data.data.reply,
        properties: res.data.data.properties || [],
        timestamp: new Date(res.data.data.timestamp)
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'Samahani, mtandao umekatika kidogo. Tafadhali hakikisha seva ya Node.js inafanya kazi au jaribu tena.',
          properties: [],
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: 'Gumzo limesafishwa! Je, kuna jambo lingine ungependa nikusaidie kulihusu makazi au malipo ya NHC?',
        properties: [],
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div className="hidden md:flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3.5 py-2 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 text-xs font-bold animate-bounce cursor-pointer" onClick={() => setIsOpen(true)}>
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Uliza SmartRent AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open AI Real Estate Assistant"
          className="relative group h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-slate-800 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-2 border-emerald-500/40"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <Bot className="w-7 h-7 text-accent group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Interactive AI Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] max-h-[620px] h-[82vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden font-sans animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-slate-800 to-primary p-4 text-white flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  SmartRent AI Assistant
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">NHC 24/7</span>
                </div>
                <div className="text-[11px] text-gray-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Msaidizi wa Nyumba & GePG
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Safisha mazungumzo"
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-950/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-primary text-accent flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-3.5 ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-br-none shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm'
                }`}>
                  <div className="whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Recommended Property Cards */}
                  {msg.properties && msg.properties.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                      <span className="font-bold text-[11px] text-gray-900 dark:text-white block">
                        Nyumba Zilizopendekezwa:
                      </span>
                      {msg.properties.map((prop) => (
                        <Link
                          key={prop.id}
                          to={`/properties/${prop.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-emerald-50 dark:hover:bg-gray-800 transition-colors border border-gray-200/60 dark:border-gray-700"
                        >
                          <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {prop.imageUrl ? (
                              <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                            ) : (
                              <Building className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white text-xs truncate">{prop.title}</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{prop.location}</p>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                              TZS {prop.monthlyRent?.toLocaleString()}/mwezi
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  )}

                  <span className={`text-[9px] block mt-1.5 ${
                    msg.sender === 'user' ? 'text-gray-300 text-right' : 'text-gray-400'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-gray-400 text-xs">
                <div className="w-7 h-7 rounded-lg bg-primary text-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-gray-500 font-medium ml-1">AI inajibu...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="p-2.5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map(({ id, label, icon: Icon, query }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSendMessage(query)}
                className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 border border-gray-200/60 dark:border-gray-700 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Uliza chochote kuhusu nyumba au GePG..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-accent outline-none border-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-accent hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50 transition-all flex-shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
