import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Send,
  User,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  Info,
  Loader2,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api';

const SUGGESTED_QUERIES = [
  'What does "BID" and "TID" mean on my prescription?',
  'What is the difference between "before meals" and "after meals"?',
  'What does PRN or SOS mean for medications?',
  'Why is it important to complete a full course of antibiotics?',
  'What should I do if I accidentally miss a medication dose?',
];

export default function AIHealthAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: `Hello! I am your **PRESCRIPTO AI Health Assistant**.\n\nI can help you understand medical abbreviations (such as BID, TID, OD), prescription instructions (like taking before or after meals), and general medication concepts.\n\n*Note: I provide educational information only and cannot diagnose medical conditions or change your medication doses. Always consult your doctor for medical advice.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageToSend = null) => {
    const text = messageToSend || inputMessage;
    if (!text || !text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await api.post('/health-chat', {
        message: text.trim(),
      });

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: res.data.reply,
            isEmergency: res.data.isEmergency,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: 'I apologize, but I am having trouble connecting to the health knowledge service. Please try again or speak to your healthcare provider.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        sender: 'assistant',
        text: `Hello! I am your **PRESCRIPTO AI Health Assistant**.\n\nI can help you understand medical abbreviations, general medication guidance, and healthcare terminology.\n\n*Disclaimer: I am an AI educational companion, not a doctor.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to render basic markdown formatting (*, **, lists)
  const renderFormattedText = (raw) => {
    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {raw.split('\n\n').map((paragraph, idx) => {
          // Check for bullet lists
          if (paragraph.includes('\n- ') || paragraph.startsWith('- ') || paragraph.includes('\n* ')) {
            const lines = paragraph.split('\n');
            return (
              <ul key={idx} className="list-disc pl-4 space-y-1">
                {lines.map((line, lIdx) => (
                  <li key={lIdx}>{line.replace(/^[-*]\s*/, '')}</li>
                ))}
              </ul>
            );
          }

          // Format bold and italics
          const formatted = paragraph
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

          return <p key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />;
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-5rem)] flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-1">
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            <span>AI HEALTH ASSISTANT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Healthcare &amp; Medication Guidance
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/doctors"
            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 flex items-center gap-1.5 transition"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Consult Real Doctor</span>
          </Link>
          <button
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition"
            title="Reset Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="mb-4 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 flex-shrink-0">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-[11px] leading-tight">
          <strong>Medical Notice:</strong> This assistant provides educational guidance on prescriptions, abbreviations, and instructions. It does not provide medical diagnoses or alter treatments. For emergency symptoms, call emergency services immediately.
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4 mb-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-2xs ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : msg.isEmergency
                    ? 'bg-rose-50 text-rose-900 border border-rose-300 rounded-tl-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  renderFormattedText(msg.text)
                )}

                <div
                  className={`text-[10px] mt-2 text-right ${
                    isUser ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Analyzing medical guidance...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar flex-shrink-0">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Ask:</span>
        </span>
        {SUGGESTED_QUERIES.map((query, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSend(query)}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-600 text-xs font-medium whitespace-nowrap transition"
          >
            {query}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex-shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask about prescription symbols (BID, TID), meal timing, or medication tips..."
          disabled={loading}
          className="flex-1 px-4 py-2 text-xs sm:text-sm bg-transparent focus:outline-hidden text-slate-800"
        />

        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition shadow-sm shadow-blue-200 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
