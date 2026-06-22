import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Send, X, Bot, Sparkles, RefreshCw, 
  AlertCircle, ChevronDown, Minimize2, Maximize2 
} from 'lucide-react';

interface AIChatbotProps {
  user?: {
    id: string;
    name: string;
    role: "CLIENTE" | "VENDEDOR" | "ADMINISTRADOR";
  } | null;
  db?: {
    products: any[];
    sales: any[];
    customers: any[];
    inventory?: any[];
    categories?: any[];
  };
  isDarkMode?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}

export default function AIChatbot({ user, db, isDarkMode = true }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Safe resolution of current user variables
  const resolvedUser = user || { id: 'anon', name: 'Cliente Invitado', role: 'CLIENTE' as const };
  const role = resolvedUser.role || 'CLIENTE';
  const userName = resolvedUser.name || 'Invitado';

  // Dynamic system greeting based on user role
  const getGreetingText = () => {
    if (role === 'CLIENTE') {
      return `¡Hola, **${userName}**! Soy **AndesModa AI**, tu asesor personal de modas. Estoy aquí para recomendarte excelentes prendas de alpaca, mostrarte colecciones nuevas, vigilar ofertas del catálogo o ayudarte en el carrito. ¿De qué te gustaría hablar hoy?`;
    } else if (role === 'VENDEDOR') {
      return `¡Hola, **${userName}**! Soy **AndesModa AI**, tu asistente comercial en tienda. Consúltame sobre el stock físico disponible en el catálogo, sugerencias rápidas de venta cruzada para clientes o comparaciones de productos. ¿Cómo te asisto hoy?`;
    } else {
      return `¡Hola, de nuevo, **${userName}**! Soy **AndesModa AI**, tu consultor administrativo de negocios. Analizo inventarios, alerta por bajo stock, ventas cruzadas y consolidados financieros por canales de venta. ¿Qué reporte estratégico analizamos hoy?`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);

  // Set greeting content reactively if user prop or role changes
  useEffect(() => {
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: getGreetingText(),
        timestamp: new Date()
      }
    ]);
  }, [role, userName]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when messages change or open
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Dynamic quick suggestions based on user role
  const getSuggestionsByRole = () => {
    if (role === 'CLIENTE') {
      return [
        "¿Qué chompas andinas me recomiendas?",
        "¿Qué promociones tienen?",
        "¿Cuál es mi pedido?",
        "¿Cómo son los envíos?"
      ];
    } else if (role === 'VENDEDOR') {
      return [
        "¿Cuánto stock queda del producto Saco Tradicional?",
        "¿Qué puedo ofrecer adicionalmente?",
        "¿Qué productos se venden más?",
        "¿Colecciones con más margen?"
      ];
    } else {
      return [
        "Dame un resumen ejecutivo.",
        "¿Qué productos debo reabastecer?",
        "¿Cómo van las ventas este mes?",
        "¿Qué categoría genera más ingresos?"
      ];
    }
  };

  const suggestions = getSuggestionsByRole();

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setErrorMsg(null);
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Map message structure for backend
      const chatHistory = messages
        .filter(m => m.id !== 'init')
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
          user: resolvedUser // Pass designated user profiles and roles!
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'No se pudo obtener respuesta de la IA de AndesModa.');
      }

      const data = await response.json();
      
      const modelResponse: Message = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelResponse]);
    } catch (err: any) {
      console.error("Error communicating with Gemini backend:", err);
      setErrorMsg(err.message || 'Error de conexión con el asistente AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: 'Historial restablecido. Estoy listo para tus nuevas consultas sobre inventario y ventas.',
        timestamp: new Date()
      }
    ]);
    setErrorMsg(null);
  };

  // Simple clean bold highlighting renderer
  const parseMarkdownBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-indigo-400 dark:text-indigo-300">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Rewrite styles to fit light/dark mode with crisp readability and compliant contrast
  const sanitizeOrStyleHtml = (htmlContent: string) => {
    if (!isDarkMode) {
      // In light mode, let's keep it mostly original but optimize border & family
      return htmlContent
        .replace(/font-family:[^;"]+/gi, 'font-family: inherit')
        .replace(/max-width:\s*\d+px/gi, 'max-width: 100%');
    }

    // In dark mode, let's substitute style attributes to design-paired high contrast equivalents
    let styledHtml = htmlContent;
    
    // Reset font-family to inherit
    styledHtml = styledHtml.replace(/font-family:[^;"]+/gi, 'font-family: inherit');
    styledHtml = styledHtml.replace(/max-width:\s*\d+px/gi, 'max-width: 100%');

    // Background replacements
    styledHtml = styledHtml.replace(/background-color:\s*#f9f9f9/gi, 'background-color: #1e293b');
    styledHtml = styledHtml.replace(/background-color:\s*#fff(fff)?/gi, 'background-color: #0f172a');
    styledHtml = styledHtml.replace(/background:\s*#fff(fff)?/gi, 'background-color: #0f172a');
    
    // Border replacements
    styledHtml = styledHtml.replace(/border:\s*1px solid #e0e0e0/gi, 'border: 1px solid #334155');
    styledHtml = styledHtml.replace(/border:\s*1px solid #eee/gi, 'border: 1px solid #1e293b');
    styledHtml = styledHtml.replace(/border-bottom:\s*2px solid #3498db/gi, 'border-bottom: 2px solid #6366f1');
    styledHtml = styledHtml.replace(/border-bottom:\s*3px solid #3498db/gi, 'border-bottom: 3px solid #6366f1');
    styledHtml = styledHtml.replace(/border-top:\s*1px solid #eee/gi, 'border-top: 1px solid #334155');
    styledHtml = styledHtml.replace(/border-bottom:\s*1px solid #eee/gi, 'border-bottom: 1px solid #334155');

    // Text color replacements
    styledHtml = styledHtml.replace(/color:\s*#2c3e50/gi, 'color: #f8fafc'); // titles
    styledHtml = styledHtml.replace(/color:\s*#34495e/gi, 'color: #e2e8f0'); // subtitles
    styledHtml = styledHtml.replace(/color:\s*#555(555)?/gi, 'color: #94a3b8'); // text body
    styledHtml = styledHtml.replace(/color:\s*#777(777)?/gi, 'color: #64748b'); // footnotes
    styledHtml = styledHtml.replace(/color:\s*#3498db/gi, 'color: #818cf8'); // accents-blue
    styledHtml = styledHtml.replace(/color:\s*#28a745/gi, 'color: #34d399'); // success-green
    styledHtml = styledHtml.replace(/color:\s*#e74c3c/gi, 'color: #f87171'); // error-red
    
    // Shadows
    styledHtml = styledHtml.replace(/box-shadow:\s*[^;"]+/gi, 'box-shadow: 0 4px 12px rgba(0,0,0,0.4)');

    return styledHtml;
  };

  const renderMessageContent = (text: string) => {
    // 1. Try to extract from ```html ... ``` blocks
    const htmlBlockRegex = /```html\s*([\s\S]*?)\s*```/gi;
    const matches = [...text.matchAll(htmlBlockRegex)];

    if (matches.length > 0) {
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;

      matches.forEach((match, index) => {
        const textBefore = text.substring(lastIndex, match.index);
        const htmlContent = match[1];

        if (textBefore.trim()) {
          elements.push(
            <div key={`text-${index}`} className="whitespace-pre-line text-xs font-sans leading-relaxed">
              {parseMarkdownBold(textBefore)}
            </div>
          );
        }

        elements.push(
          <div 
            key={`html-${index}`}
            className="my-3 overflow-x-auto rounded-xl max-w-full text-xs"
            dangerouslySetInnerHTML={{ __html: sanitizeOrStyleHtml(htmlContent) }}
          />
        );

        lastIndex = (match.index || 0) + match[0].length;
      });

      const textAfter = text.substring(lastIndex);
      if (textAfter.trim()) {
        elements.push(
          <div key="text-end" className="whitespace-pre-line text-xs font-sans leading-relaxed">
            {parseMarkdownBold(textAfter)}
          </div>
        );
      }

      return <div className="space-y-2">{elements}</div>;
    }

    // 2. If no ```html markup is present but HTML occurs as root-level divs
    if (text.includes('<div') || text.includes('<table') || text.includes('<ul')) {
      return (
        <div 
          className="overflow-x-auto max-w-full text-xs"
          dangerouslySetInnerHTML={{ __html: sanitizeOrStyleHtml(text) }}
        />
      );
    }

    // 3. Standard text with dynamic bold markup
    return (
      <div className="whitespace-pre-line text-xs font-sans leading-relaxed">
        {parseMarkdownBold(text)}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Sparkly Launcher Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="ai-chatbot-toggle-btn"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white rounded-full shadow-2xl shadow-indigo-500/30 transition-all duration-250 border border-indigo-400/20 ring-2 ring-indigo-500/10 cursor-pointer"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-indigo-600 animate-pulse" />
            </div>
            <span className="text-sm font-bold tracking-tight">AndesModa AI</span>
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Windows Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-chatbot-window"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '56px' : '560px',
              width: '380px'
            }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`flex flex-col rounded-2xl shadow-2xl overflow-hidden border transition-all duration-300 ${
              isDarkMode 
                ? 'bg-slate-950 border-slate-800 text-slate-100 shadow-slate-950/70' 
                : 'bg-white border-slate-200 text-slate-850 shadow-slate-200/90'
            }`}
          >
            {/* Header segment with premium slate look */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between select-none shrink-0 text-white">
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-600/20 p-1.5 rounded-lg border border-indigo-500/35">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5 leading-none">
                    AndesModa AI
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </h3>
                  <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wider font-mono font-bold">Análisis de Retail & POS</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Clear chat history */}
                <button
                  onClick={clearHistory}
                  title="Limpiar Conversación"
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                {/* Toggle minimization */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>

                {/* Close window */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main scrollable body panel */}
            {!isMinimized && (
              <>
                <div 
                  className={`flex-1 overflow-y-auto p-4 space-y-4 ${
                    isDarkMode ? 'bg-slate-900/10' : 'bg-slate-50/50'
                  }`}
                >
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex gap-2 max-w-[85%] ${
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      {msg.role !== 'user' && (
                        <div className="bg-indigo-600/10 p-1 h-7 w-7 rounded-lg border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-indigo-400" />
                        </div>
                      )}

                      <div className={`p-3 rounded-xl text-xs leading-relaxed space-y-1 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : isDarkMode 
                            ? 'bg-slate-900 border border-slate-800 rounded-tl-none' 
                            : 'bg-white border border-slate-200 rounded-tl-none text-zinc-800'
                      }`}>
                        {renderMessageContent(msg.text)}
                        <span className={`block text-[8px] text-right mt-1.5 ${
                          msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                        }`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Typing / Thinking indication */}
                  {isLoading && (
                    <div className="flex gap-2 max-w-[80%] animate-pulse">
                      <div className="bg-indigo-600/10 p-1 h-7 w-7 rounded-lg border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className={`p-3 rounded-xl text-xs rounded-tl-none flex items-center gap-1.5 ${
                        isDarkMode ? 'bg-slate-900/60' : 'bg-slate-100'
                      }`}>
                        <span className="text-slate-400 font-medium">Analizando datos del sistema</span>
                        <div className="flex gap-1">
                          <span className="h-1 w-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1 w-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1 w-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Errors badge */}
                  {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-start gap-2.5 text-xs text-rose-400">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500 animate-bounce" />
                      <div>
                        <span className="font-bold block">No disponible</span>
                        <p className="mt-0.5 leading-relaxed text-rose-300">{errorMsg}</p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestion Quick Chips */}
                <div className={`px-4 py-2 flex gap-1.5 overflow-x-auto select-none border-t shrink-0 ${
                  isDarkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200'
                }`}>
                  {suggestions.map((suggest, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(suggest)}
                      disabled={isLoading}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full border whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                        isDarkMode 
                          ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-indigo-500/40 text-slate-300' 
                          : 'border-slate-200 bg-white hover:bg-slate-100 hover:border-indigo-500/40 text-slate-600'
                      }`}
                    >
                      {suggest}
                    </button>
                  ))}
                </div>

                {/* Chat send input form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                  }}
                  className={`p-3 border-t shrink-0 flex gap-2 ${
                    isDarkMode ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200'
                  }`}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    placeholder="Pregúntame sobre stock, ventas o clientes..."
                    className={`flex-1 text-xs px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-850 text-slate-100 placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl transition-all font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
