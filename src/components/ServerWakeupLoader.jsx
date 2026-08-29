import React, { useState, useEffect } from 'react';
import { Server, Zap, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ServerWakeupLoader({ message = "Connecting to server...", fullScreen = true }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusText = () => {
    if (elapsed < 3) return message || "Connecting to secure backend service...";
    if (elapsed < 7) return "Cloud server is waking up from cold start...";
    if (elapsed < 14) return "Warming up database and backend services... Please hold on!";
    if (elapsed < 25) return "Almost ready! Finalizing server initialization...";
    return "Connecting to server... Thank you for your patience!";
  };

  const containerStyle = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(245, 243, 236, 0.97)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeInWakeup 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        animation: 'fadeInWakeup 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      };

  return (
    <div style={containerStyle}>
      <div
        className="w-full max-w-md p-4 sm:p-5 text-center border-round-3xl shadow-4"
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #D3DDD7',
          boxShadow: '0 20px 40px -15px rgba(18, 59, 50, 0.15)'
        }}
      >
        {/* Animated Icon with Glow Aura */}
        <div className="relative inline-flex align-items-center justify-content-center mb-3">
          <div
            className="border-round-full p-4 flex align-items-center justify-content-center"
            style={{
              background: '#E8EFEB',
              color: '#123B32',
              position: 'relative',
              animation: 'pulseGlow 2s infinite ease-in-out'
            }}
          >
            <Server size={38} style={{ color: '#123B32' }} />
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#C47D4C',
                color: '#FFFFFF',
                borderRadius: '50%',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap size={14} className="pi-spin" style={{ animationDuration: '2s' }} />
            </div>
          </div>
        </div>

        {/* Brand Badge */}
        <div className="flex align-items-center justify-content-center gap-1 mb-2">
          <ShieldCheck size={14} style={{ color: '#527A68' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#527A68', letterSpacing: '0.08em' }}>
            CertiVerify • Shazu Soft Engine
          </span>
        </div>

        {/* Title Header */}
        <h2 className="text-xl sm:text-2xl font-bold m-0 mb-2" style={{ color: '#123B32' }}>
          Server Waking Up
        </h2>

        {/* Dynamic Message */}
        <p className="text-xs sm:text-sm font-semibold mb-4 px-2" style={{ color: '#2F5B4E', minHeight: '40px', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
          {getStatusText()}
        </p>

        {/* Shimmer Progress Bar */}
        <div
          className="w-full border-round-pill mb-3 overflow-hidden"
          style={{ height: '8px', background: '#E8EFEB', position: 'relative' }}
        >
          <div
            className="h-full border-round-pill"
            style={{
              width: `${Math.min(100, Math.max(12, (elapsed / 25) * 100))}%`,
              background: 'linear-gradient(90deg, #123B32 0%, #2F5B4E 50%, #C47D4C 100%)',
              transition: 'width 0.8s ease-in-out',
              boxShadow: '0 0 10px rgba(18, 59, 50, 0.4)'
            }}
          />
        </div>

        {/* Footer Info & Elapsed Timer */}
        <div className="flex align-items-center justify-content-between text-xs pt-2 border-top-1" style={{ borderColor: '#E8EFEB', color: '#527A68' }}>
          <span className="inline-flex align-items-center gap-1 font-semibold">
            <RefreshCw size={12} className="pi-spin" />
            Initializing instance...
          </span>
          <span className="font-bold font-monospace px-2 py-0.5 border-round text-xs" style={{ background: '#E8EFEB', color: '#123B32' }}>
            {elapsed}s elapsed
          </span>
        </div>
      </div>
    </div>
  );
}
