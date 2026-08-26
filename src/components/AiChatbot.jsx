import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Bot, Sparkles, Send, X, RefreshCw, BarChart2, Search, FileText, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'init_1',
      role: 'assistant',
      content: 'Hello! I am your **Certificate Assistant**. Ask me anything about your certificates, recipient names, or summary counts.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text,
        chatHistory: messages.map((m) => ({ role: m.role, content: m.content }))
      });

      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: res.data?.answer || 'I could not find matching certificate records.'
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Unable to reach assistant service. Please check your connection or try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'Total Summary', icon: <BarChart2 size={12} />, query: 'Total Certificates Summary' },
    { label: 'Recent Certificates', icon: <Search size={12} />, query: 'Who received recent certificates?' },
    { label: 'Certificate Designs', icon: <FileText size={12} />, query: 'List Certificate Designs' },
    { label: 'How to Verify', icon: <ShieldCheck size={12} />, query: 'How to verify a certificate?' }
  ];

  const renderMessageContent = (content) => {
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" style="color: #123B32; font-weight: 700; text-decoration: underline;">$1</a>');

    return <div dangerouslySetInnerHTML={{ __html: formatted.replace(/\n/g, '<br/>') }} />;
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999
      }}
    >
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex align-items-center gap-2 px-3 py-2.5 border-round-3xl shadow-4 cursor-pointer border-none"
          style={{
            background: 'linear-gradient(135deg, #123B32 0%, #2F5B4E 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(18, 59, 50, 0.35)',
            cursor: 'pointer'
          }}
        >
          <div className="flex align-items-center justify-content-center border-round-full p-1" style={{ background: '#C47D4C', color: '#FFFFFF' }}>
            <Sparkles size={14} />
          </div>
          <span>Certificate Assistant</span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div
          className="border-round-2xl shadow-6 flex flex-column overflow-hidden"
          style={{
            width: '390px',
            maxWidth: 'calc(100vw - 36px)',
            height: '520px',
            maxHeight: 'calc(100vh - 90px)',
            background: '#FFFFFF',
            border: '1.5px solid #D3DDD7',
            boxShadow: '0 20px 40px -10px rgba(18, 59, 50, 0.25)'
          }}
        >
          {/* Header */}
          <div
            className="px-3 py-3 flex align-items-center justify-content-between"
            style={{
              background: 'linear-gradient(135deg, #123B32 0%, #2F5B4E 100%)',
              color: '#FFFFFF'
            }}
          >
            <div className="flex align-items-center gap-2">
              <div className="flex align-items-center justify-content-center border-round-full p-1.5 shadow-1" style={{ background: '#C47D4C', color: '#FFFFFF' }}>
                <Bot size={17} />
              </div>
              <div>
                <h4 className="font-bold text-sm m-0 text-white" style={{ letterSpacing: '-0.2px' }}>
                  Certificate Assistant
                </h4>
                <div className="text-xs" style={{ color: '#E8EFEB', fontSize: '11px', marginTop: '1px' }}>
                  Ask questions in plain English
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-transparent border-none text-white cursor-pointer p-1 border-round hover:surface-hover transition-colors flex align-items-center justify-content-center"
              style={{ opacity: 0.9 }}
              title="Close Assistant"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompts Row */}
          <div
            className="flex align-items-center gap-2 overflow-x-auto"
            style={{
              padding: '8px 12px',
              background: '#F5F3EC',
              borderBottom: '1.5px solid #D3DDD7',
              scrollbarWidth: 'none',
              flexWrap: 'nowrap',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p.query)}
                className="cursor-pointer transition-all"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  height: '30px',
                  padding: '0 12px',
                  borderRadius: '9999px',
                  background: '#FFFFFF',
                  color: '#123B32',
                  border: '1.5px solid #D3DDD7',
                  fontSize: '11px',
                  fontWeight: '600',
                  boxShadow: '0 1px 3px rgba(18,59,50,0.06)',
                  flexShrink: 0
                }}
              >
                <span style={{ color: '#C47D4C', display: 'flex', alignItems: 'center' }}>{p.icon}</span>
                <span style={{ whiteSpace: 'nowrap', color: '#123B32' }}>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div
            className="flex-1 p-3 overflow-y-auto flex flex-column gap-2.5"
            style={{ background: '#FAF9F6' }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-column ${m.role === 'user' ? 'align-items-end' : 'align-items-start'}`}
              >
                <div
                  className="p-3 text-xs shadow-1"
                  style={{
                    maxWidth: '85%',
                    lineHeight: '1.55',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? '#123B32' : '#FFFFFF',
                    color: m.role === 'user' ? '#FFFFFF' : '#26322E',
                    border: m.role === 'user' ? 'none' : '1px solid #D3DDD7'
                  }}
                >
                  {renderMessageContent(m.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex align-items-center gap-2 text-xs font-bold p-1" style={{ color: '#527A68' }}>
                <RefreshCw size={13} className="pi-spin" />
                <span>Checking records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 flex gap-2 align-items-center"
            style={{
              background: '#FFFFFF',
              borderTop: '1.5px solid #D3DDD7'
            }}
          >
            <InputText
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a certificate or recipient..."
              className="flex-1 p-inputtext-sm text-xs"
              style={{
                borderRadius: '10px',
                background: '#F5F3EC',
                border: '1px solid #D3DDD7',
                padding: '0.55rem 0.75rem'
              }}
              disabled={loading}
            />
            <Button
              type="submit"
              icon={<Send size={14} />}
              className="p-button-primary p-button-sm"
              style={{
                background: '#123B32',
                borderColor: '#123B32',
                borderRadius: '10px',
                minWidth: '38px',
                height: '35px'
              }}
              disabled={!input.trim() || loading}
            />
          </form>
        </div>
      )}
    </div>
  );
}
