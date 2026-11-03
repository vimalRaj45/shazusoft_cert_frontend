import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import {
  Search,
  QrCode,
  Download,
  ExternalLink,
  Award,
  Copy,
  Check,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../services/api';

export default function RecipientPortal() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('email') || searchParams.get('code') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [downloadingCode, setDownloadingCode] = useState(null);
  const [previewCert, setPreviewCert] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // QR Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const qrScannerRef = useRef(null);

  const navigate = useNavigate();

  // If query is in URL on first mount, auto-search
  useEffect(() => {
    const initialQuery = searchParams.get('email') || searchParams.get('code');
    if (initialQuery && initialQuery.trim()) {
      executeSearch(initialQuery.trim());
    }
  }, []);

  const executeSearch = async (searchQuery) => {
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) {
      toast.error('Please enter your email or certificate ID');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const isEmail = cleanQuery.includes('@');
      const res = await axios.get(getApiUrl('/public/lookup'), {
        params: isEmail ? { email: cleanQuery } : { code: cleanQuery }
      });
      const certs = res.data.certificates || [];
      setResults(certs);

      if (certs.length === 0) {
        toast('No certificates found for this entry', { icon: '🔍' });
      } else {
        toast.success(`Found ${certs.length} certificate${certs.length > 1 ? 's' : ''}!`);
      }
    } catch (err) {
      console.error('Certificate lookup error:', err);
      toast.error('Failed to search certificates. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    executeSearch(query);
  };

  // One-click direct PDF download with visual feedback
  const handleDownload = async (cert) => {
    setDownloadingCode(cert.unique_code);
    try {
      const downloadUrl = getApiUrl(`/public/certificates/${encodeURIComponent(cert.unique_code)}/download`);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeName = (cert.recipient_name || 'Certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `Certificate_${safeName}_${cert.unique_code.substring(0, 8)}.pdf`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Your certificate PDF download has started!');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Download failed. Please try again.');
    } finally {
      setTimeout(() => setDownloadingCode(null), 2500);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success('Certificate ID copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // QR Scanner initialization
  useEffect(() => {
    let html5QrCode = null;

    if (scannerOpen) {
      setCameraError('');
      const timer = setTimeout(() => {
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
              handleQrResult(decodedText);
              html5QrCode.stop().then(() => {
                setScannerOpen(false);
              }).catch(console.error);
            },
            () => {}
          ).catch((err) => {
            console.error('Camera access error:', err);
            setCameraError('Camera access unavailable. Please grant camera permissions or type your code manually.');
          });
        } catch (e) {
          setCameraError('Unable to initialize QR camera scanner.');
        }
      }, 300);

      return () => clearTimeout(timer);
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
    let extractedCode = scannedText.trim();
    if (extractedCode.includes('/verify/')) {
      extractedCode = extractedCode.split('/verify/')[1].split('?')[0].split('#')[0];
    } else if (extractedCode.includes('code=')) {
      try {
        extractedCode = new URL(extractedCode).searchParams.get('code') || extractedCode;
      } catch (e) {}
    }

    if (extractedCode) {
      setQuery(extractedCode);
      executeSearch(extractedCode);
    }
  };

  const closeScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().catch(() => {});
    }
    setScannerOpen(false);
  };

  return (
    <div className="min-h-screen py-5 px-3 md:px-5" style={{ background: '#F5F3EC' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="inline-flex align-items-center justify-content-center p-2 mb-2">
            <img
              src="/logo.png"
              alt="Shazu Soft Technologies Logo"
              style={{ maxHeight: '56px', width: 'auto', display: 'block' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <h1 className="font-bold text-2xl md:text-4xl m-0" style={{ color: '#123B32', letterSpacing: '-0.5px' }}>
            Download Your Certificate
          </h1>
          <p className="text-xs md:text-sm font-semibold mt-2" style={{ color: '#527A68', maxWidth: '580px', margin: '8px auto 0' }}>
            Enter the email address provided to us to find and download your certificate.
          </p>
        </div>

        {/* Search Card */}
        <div
          className="border-round-2xl shadow-2 p-4 md:p-5 mb-4"
          style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7' }}
        >
          <form onSubmit={handleSearch} className="flex flex-column gap-3">
            <label className="font-bold text-xs text-uppercase tracking-wider" style={{ color: '#123B32' }}>
              Email Address
            </label>

            <div className="flex flex-column sm:flex-row gap-2">
              <div className="p-input-icon-left flex-1">
                <i className="pi pi-envelope text-500" />
                <InputText
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. name@example.com or Certificate ID"
                  className="w-full text-sm py-3 font-medium"
                  style={{ borderRadius: '10px' }}
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  label={loading ? 'Searching...' : 'Find Certificate'}
                  icon={<Search size={16} className="mr-1.5" />}
                  className="p-button-primary font-bold text-sm px-4 py-3"
                  style={{
                    background: '#123B32',
                    borderColor: '#123B32',
                    borderRadius: '10px',
                    whiteSpace: 'nowrap'
                  }}
                  loading={loading}
                />

                <Button
                  type="button"
                  icon={<QrCode size={18} style={{ color: '#C47D4C' }} />}
                  tooltip="Scan QR Code"
                  tooltipOptions={{ position: 'top' }}
                  className="p-button-outlined font-bold"
                  style={{
                    color: '#123B32',
                    borderColor: '#D3DDD7',
                    background: '#E8EFEB',
                    borderRadius: '10px',
                    padding: '0 16px'
                  }}
                  onClick={() => setScannerOpen(true)}
                  aria-label="Scan QR Code"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {results.length > 0 ? (
          <div className="flex flex-column gap-3 mb-5">
            <div className="flex align-items-center justify-content-between px-1">
              <h2 className="font-bold text-base md:text-lg m-0" style={{ color: '#123B32' }}>
                Found {results.length} Authenticated Credential{results.length > 1 ? 's' : ''}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 border-round-lg" style={{ background: '#E8EFEB', color: '#123B32' }}>
                {query}
              </span>
            </div>

            {results.map((cert) => {
              const isRevoked = cert.status === 'revoked';
              const courseTitle =
                cert.field_data?.course_title ||
                cert.field_data?.course ||
                cert.template_name ||
                'Certificate of Completion';
              const isDownloading = downloadingCode === cert.unique_code;

              return (
                <div
                  key={cert.id}
                  className="border-round-2xl p-4 md:p-4 shadow-2 transition-all"
                  style={{
                    background: '#FFFFFF',
                    border: isRevoked ? '1.5px solid #FECACA' : '1.5px solid #D3DDD7',
                    position: 'relative'
                  }}
                >
                  <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
                    
                    {/* Left Details */}
                    <div className="flex-1">
                      <div className="flex align-items-center gap-2 mb-2 flex-wrap">
                        <Tag
                          severity={isRevoked ? 'danger' : 'success'}
                          value={isRevoked ? 'Revoked' : 'Verified & Authentic'}
                          className="font-bold text-xs"
                          style={{
                            background: isRevoked ? '#FEE2E2' : '#E8EFEB',
                            color: isRevoked ? '#DC2626' : '#123B32',
                            border: `1px solid ${isRevoked ? '#FCA5A5' : '#B8D5C8'}`
                          }}
                        />

                        {/* Certificate Unique ID */}
                        <div
                          className="inline-flex align-items-center gap-1.5 px-2 py-0.5 border-round-md cursor-pointer hover:surface-100"
                          style={{ background: '#F5F3EC', border: '1px solid #D3DDD7' }}
                          onClick={() => copyToClipboard(cert.unique_code)}
                          title="Click to copy Certificate ID"
                        >
                          <span className="text-xs font-monospace font-bold" style={{ color: '#123B32' }}>
                            {cert.unique_code}
                          </span>
                          {copiedCode === cert.unique_code ? (
                            <Check size={12} className="text-green-600" />
                          ) : (
                            <Copy size={12} className="text-500" />
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-lg md:text-xl m-0" style={{ color: '#123B32', letterSpacing: '-0.3px' }}>
                        {cert.recipient_name}
                      </h3>

                      <div className="font-bold text-sm md:text-base mt-1 flex align-items-center gap-1.5" style={{ color: '#527A68' }}>
                        <Award size={16} />
                        <span>{courseTitle}</span>
                      </div>

                      <div className="text-xs text-500 mt-2 flex align-items-center gap-3 flex-wrap">
                        <span>
                          📅 Issued:{' '}
                          <strong>
                            {cert.issued_at
                              ? new Date(cert.issued_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Verified'}
                          </strong>
                        </span>
                        {cert.recipient_email && (
                          <span>
                            ✉️ Registered Email: <strong>{cert.recipient_email}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                      
                      {/* Preview Button */}
                      <Button
                        type="button"
                        label="Quick Preview"
                        icon={<Eye size={15} className="mr-1" />}
                        className="p-button-outlined font-bold text-xs py-2 px-3 flex-1 sm:flex-none justify-content-center"
                        style={{ color: '#123B32', borderColor: '#D3DDD7', background: '#F9FAF7' }}
                        onClick={() => setPreviewCert(cert)}
                      />

                      {/* Verify Link */}
                      <Link
                        to={`/verify/${cert.unique_code}`}
                        className="p-button p-button-outlined no-underline font-bold text-xs py-2 px-3 flex-1 sm:flex-none align-items-center justify-content-center"
                        style={{ color: '#123B32', borderColor: '#123B32' }}
                      >
                        <ExternalLink size={14} className="mr-1" />
                        <span>Verify Online</span>
                      </Link>

                      {/* Download PDF Button */}
                      {!isRevoked ? (
                        <Button
                          type="button"
                          label={isDownloading ? 'Preparing PDF...' : 'Download PDF'}
                          icon={<Download size={15} className="mr-1" />}
                          className="p-button-primary font-bold text-xs py-2 px-3.5 flex-1 sm:flex-none justify-content-center"
                          style={{
                            background: '#123B32',
                            borderColor: '#123B32',
                            boxShadow: '0 4px 12px rgba(18, 59, 50, 0.2)'
                          }}
                          loading={isDownloading}
                          onClick={() => handleDownload(cert)}
                        />
                      ) : (
                        <Tag severity="danger" value="Cannot Download (Revoked)" className="font-bold text-xs" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : searched && !loading ? (
          <div
            className="border-round-2xl p-4 md:p-5 text-center shadow-1 mb-5"
            style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7' }}
          >
            <div
              className="inline-flex align-items-center justify-content-center border-round-circle mb-2"
              style={{ width: '44px', height: '44px', background: '#FEF2F2', color: '#DC2626' }}
            >
              <AlertCircle size={22} />
            </div>
            <h3 className="font-bold text-base md:text-lg m-0" style={{ color: '#123B32' }}>
              No Certificate Found
            </h3>
            <p className="text-xs md:text-sm font-semibold mt-2 mb-0" style={{ color: '#527A68' }}>
              We couldn't find any certificate for "<strong>{query}</strong>". Please check your email spelling and try again.
            </p>
          </div>
        ) : null}

      </div>

      {/* Quick Certificate Preview Dialog */}
      <Dialog
        header={previewCert ? `Preview: ${previewCert.recipient_name}` : 'Certificate Preview'}
        visible={!!previewCert}
        style={{ width: '820px', maxWidth: '96vw' }}
        modal
        onHide={() => setPreviewCert(null)}
      >
        {previewCert && (
          <div className="text-center">
            <div
              className="border-round-xl overflow-hidden shadow-2 mb-3"
              style={{ background: '#000000', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <img
                src={getApiUrl(`/public/certificates/${encodeURIComponent(previewCert.unique_code)}/preview`)}
                alt="Certificate Preview"
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '70vh', objectFit: 'contain' }}
                loading="lazy"
              />
            </div>

            <div className="flex justify-content-center gap-2">
              <Button
                type="button"
                label="Close Preview"
                className="p-button-outlined p-button-secondary font-bold text-xs"
                onClick={() => setPreviewCert(null)}
              />
              <Button
                type="button"
                label="Download Official PDF"
                icon={<Download size={14} className="mr-1" />}
                className="p-button-primary font-bold text-xs"
                onClick={() => {
                  handleDownload(previewCert);
                }}
              />
            </div>
          </div>
        )}
      </Dialog>

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
            Point your camera at the anti-tamper QR code on the certificate.
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
