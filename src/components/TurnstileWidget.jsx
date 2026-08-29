import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TurnstileWidget({ onVerify, siteKey }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [verified, setVerified] = useState(false);

  // Cloudflare Turnstile Official Site Key (env or configured site key)
  const activeSiteKey = siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAEhK_CLNNa0heFKc';

  useEffect(() => {
    // Inject Cloudflare Turnstile API Script if not present
    let script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const renderWidget = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: activeSiteKey,
            theme: 'light',
            callback: (token) => {
              setVerified(true);
              if (onVerify) onVerify(token);
            },
            'error-callback': () => {
              setVerified(false);
            },
            'expired-callback': () => {
              setVerified(false);
            }
          });
        } catch (e) {
          console.warn('Turnstile widget render notice:', e);
        }
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const timer = setInterval(() => {
        if (window.turnstile) {
          clearInterval(timer);
          renderWidget();
        }
      }, 250);
      return () => clearInterval(timer);
    }

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {}
      }
    };
  }, [activeSiteKey]);

  return (
    <div className="flex flex-column align-items-center justify-content-center my-3 w-full">
      <div
        className="p-3 border-round-2xl shadow-1 flex flex-column align-items-center gap-2"
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #D3DDD7',
          maxWidth: '380px',
          width: '100%'
        }}
      >
        <div ref={containerRef} className="cf-turnstile" />

        <div className="flex align-items-center gap-1.5 text-xs font-semibold" style={{ color: '#527A68' }}>
          {verified ? (
            <>
              <CheckCircle2 size={14} style={{ color: '#123B32' }} />
              <span style={{ color: '#123B32' }}>Turnstile Security Verified</span>
            </>
          ) : (
            <>
              <ShieldCheck size={14} style={{ color: '#123B32' }} />
              <span>Protected by Cloudflare Turnstile</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
