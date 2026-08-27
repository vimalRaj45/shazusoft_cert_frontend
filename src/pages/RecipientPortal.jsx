import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Search, QrCode, Download, ExternalLink, Award, CheckCircle2, ShieldCheck, Mail, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { getApiUrl } from '../services/api';

export default function RecipientPortal() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  const qrScannerRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const isEmail = query.includes('@');
      const res = await axios.get(getApiUrl('/public/lookup'), {
        params: isEmail ? { email: query.trim() } : { code: query.trim() }
      });
      setResults(res.data.certificates || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Start QR Scanner
  useEffect(() => {
    let html5QrCode = null;

    if (scannerOpen) {
      setCameraError('');
      // Allow DOM to render scanner div
      setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode('qr-reader');
          qrScannerRef.current = html5QrCode;

          html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              // Successfully scanned QR
              handleQrResult(decodedText);
              html5QrCode.stop().then(() => {
                setScannerOpen(false);
              }).catch(console.error);
            },
            (errorMessage) => {
              // scanning...
            }
          ).catch((err) => {
            console.error('Camera access error:', err);
            setCameraError('Camera access unavailable. Please permit camera permissions or enter certificate code manually.');
          });
        } catch (e) {
          setCameraError('Unable to initialize QR camera scanner.');
        }
      }, 300);
    }

    return () => {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.stop().catch(() => {});
        } catch (e) {}
      }
    };
  }, [scannerOpen]);

  const handleQrResult = (scannedText) => {
    // If URL like /verify/CODE, extract code
    let extractedCode = scannedText.trim();
    if (extractedCode.includes('/verify/')) {
      extractedCode = extractedCode.split('/verify/')[1].split('?')[0].split('#')[0];
    } else if (extractedCode.includes('code=')) {
      extractedCode = new URL(extractedCode).searchParams.get('code') || extractedCode;
    }

    if (extractedCode) {
      navigate(`/verify/${extractedCode}`);
    }
  };

  const closeScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().catch(() => {});
    }
    setScannerOpen(false);
  };

  return (
    <div className="min-h-screen py-6 px-3 md:px-5" style={{ background: '#F5F3EC' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex align-items-center justify-content-center p-2 mb-2">
            <img
              src="/logo.png"
              alt="Shazu Soft Technologies Logo"
              style={{ maxHeight: '55px', width: 'auto', display: 'block' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="font-bold text-2xl md:text-3xl m-0" style={{ color: '#123B32', letterSpacing: '-0.5px' }}>
            Recipient Credential Portal
          </h1>
          <p className="text-xs md:text-sm font-semibold mt-1" style={{ color: '#527A68' }}>
            Search by email, certificate code, or scan certificate QR code directly.
          </p>
        </div>

        {/* Search & QR Scanner Card */}
        <div className="border-round-2xl shadow-2 p-4 mb-4" style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7' }}>
          <form onSubmit={handleSearch} className="flex flex-column sm:flex-row gap-2">
            <div className="p-input-icon-left flex-1">
              <i className="pi pi-search" />
              <InputText
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your email address or certificate ID..."
                className="w-full"
                required
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                type="submit"
                label="Search"
                icon={<Search size={16} className="mr-1" />}
                className="p-button-primary font-bold text-xs"
                loading={loading}
              />
              <Button
                type="button"
                label="Scan QR"
                icon={<QrCode size={16} className="mr-1" style={{ color: '#C47D4C' }} />}
                className="p-button-outlined font-bold text-xs"
                style={{ color: '#123B32', borderColor: '#D3DDD7', background: '#E8EFEB' }}
                onClick={() => setScannerOpen(true)}
              />
            </div>
          </form>
        </div>

        {/* Results List */}
        {results.length > 0 ? (
          <div className="flex flex-column gap-3">
            <h3 className="font-bold text-base m-0 mb-1" style={{ color: '#123B32' }}>
              Found {results.length} Authenticated Credential(s)
            </h3>
            {results.map((cert) => (
              <div
                key={cert.id}
                className="border-round-xl p-4 shadow-1 flex flex-column sm:flex-row justify-content-between align-items-sm-center gap-3"
                style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7' }}
              >
                <div>
                  <div className="flex align-items-center gap-2 mb-1">
                    <Tag
                      severity={cert.status === 'issued' ? 'success' : 'danger'}
                      value={cert.status === 'issued' ? 'Authentic' : 'Revoked'}
                    />
                    <span className="text-xs font-monospace font-bold" style={{ color: '#123B32' }}>
                      {cert.unique_code}
                    </span>
                  </div>
                  <h3 className="font-bold text-base md:text-lg m-0" style={{ color: '#123B32' }}>
                    {cert.recipient_name}
                  </h3>
                  <div className="font-semibold text-xs md:text-sm mt-0.5" style={{ color: '#527A68' }}>
                    {cert.field_data?.course_title || cert.field_data?.course || cert.template_name}
                  </div>
                  <div className="text-xs text-500 mt-1">
                    Issued: {new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/verify/${cert.unique_code}`}
                    className="p-button p-button-outlined p-button-sm no-underline font-bold text-xs"
                    style={{ color: '#123B32', borderColor: '#123B32' }}
                  >
                    <ExternalLink size={13} className="mr-1" /> View & Verify
                  </a>
                  <a
                    href={getApiUrl(`/public/certificates/${cert.unique_code}/download`)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-button p-button-primary p-button-sm no-underline font-bold text-xs"
                  >
                    <Download size={13} className="mr-1" /> Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : searched && !loading ? (
          <div className="border-round-xl p-5 text-center shadow-1" style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7' }}>
            <p className="text-sm font-semibold m-0" style={{ color: '#527A68' }}>
              No credentials found matching "<strong>{query}</strong>". Please check for typos or scan your certificate QR code.
            </p>
          </div>
        ) : null}
      </div>

      {/* Live QR Code Scanner Modal */}
      <Dialog
        header="Scan Certificate QR Code"
        visible={scannerOpen}
        style={{ width: '420px', maxWidth: '95vw' }}
        modal
        onHide={closeScanner}
      >
        <div className="text-center">
          <p className="text-xs mb-3" style={{ color: '#527A68' }}>
            Point your device camera at the anti-tamper QR code on the certificate.
          </p>

          {cameraError ? (
            <div className="p-3 border-round-xl text-xs mb-3" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {cameraError}
            </div>
          ) : (
            <div
              id="qr-reader"
              style={{
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid #123B32'
              }}
            />
          )}

          <Button
            label="Cancel Scanning"
            className="p-button-text p-button-secondary font-bold text-xs mt-3"
            onClick={closeScanner}
          />
        </div>
      </Dialog>
    </div>
  );
}
