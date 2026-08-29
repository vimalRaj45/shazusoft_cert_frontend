import React, { useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';

export default function ServerWakeupBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleWakeup = (e) => {
      if (e.detail?.isWaking) {
        setDismissed(false);
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('server-waking-up', handleWakeup);
    return () => window.removeEventListener('server-waking-up', handleWakeup);
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99998,
        animation: 'fadeInWakeup 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div
        className="flex align-items-center gap-2.5 px-3 py-2 border-round-xl shadow-4"
        style={{
          background: '#123B32',
          color: '#FFFFFF',
          border: '1.5px solid #527A68',
          fontSize: '12.5px',
          fontWeight: 600,
          boxShadow: '0 10px 25px -5px rgba(18, 59, 50, 0.3)'
        }}
      >
        <div className="flex align-items-center justify-content-center p-1 border-round-full" style={{ background: 'rgba(196, 125, 76, 0.2)', color: '#C47D4C' }}>
          <Zap size={14} className="pi-spin" style={{ animationDuration: '2s' }} />
        </div>
        <span>Cloud Server is spinning up... Please hold on a moment!</span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
