import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import {
  ShieldCheck,
  ShieldAlert,
  Download,
  Share2,
  Copy,
  Check,
  Award,
  Calendar,
  Building,
  Hash,
  Eye,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { getApiUrl } from '../services/api';
import TurnstileWidget from '../components/TurnstileWidget';

export default function PublicVerify() {
  const { code } = useParams();
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [turnstileVerified, setTurnstileVerified] = useState(false);

  useEffect(() => {
    fetchVerification();
  }, [code]);

  const handleTurnstileVerify = (token) => {
    setTurnstileVerified(true);
    if (certData?.valid) {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.5 }
      });
    }
  };

  const fetchVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(getApiUrl(`/public/verify/${code}`));
      setCertData(res.data);
      if (res.data && !res.data.valid) {
        setError(res.data.message || 'This credential is no longer valid.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate not found or verification expired.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-5 px-3 md:px-5" style={{ background: '#F5F3EC' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Skeleton Header */}
          <div className="text-center mb-4 pt-2 flex flex-column align-items-center">
            <Skeleton shape="circle" size="48px" className="mb-2" />
            <Skeleton width="280px" height="28px" className="mb-2" />
            <Skeleton width="380px" height="18px" />
          </div>

          {/* Skeleton Main Card */}
          <div className="border-round-2xl shadow-2 overflow-hidden mb-4" style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7' }}>
            <div className="p-4 flex justify-content-between align-items-center" style={{ background: '#123B32' }}>
              <div className="flex align-items-center gap-3">
                <Skeleton shape="circle" size="40px" />
                <div>
                  <Skeleton width="180px" height="20px" className="mb-2" />
                  <Skeleton width="120px" height="14px" />
                </div>
              </div>
              <Skeleton width="100px" height="28px" borderRadius="16px" />
            </div>

            <div className="p-4 md:p-5">
              <div className="grid">
                <div className="col-12 md:col-8">
                  <Skeleton width="120px" height="14px" className="mb-2" />
                  <Skeleton width="85%" height="32px" className="mb-4" />

                  <div className="grid">
                    <div className="col-12 sm:col-6 mb-3">
                      <Skeleton width="90px" height="12px" className="mb-1" />
                      <Skeleton width="160px" height="20px" />
                    </div>
                    <div className="col-12 sm:col-6 mb-3">
                      <Skeleton width="90px" height="12px" className="mb-1" />
                      <Skeleton width="160px" height="20px" />
                    </div>
                    <div className="col-12 sm:col-6 mb-3">
                      <Skeleton width="90px" height="12px" className="mb-1" />
                      <Skeleton width="160px" height="20px" />
                    </div>
                    <div className="col-12 sm:col-6 mb-3">
                      <Skeleton width="90px" height="12px" className="mb-1" />
                      <Skeleton width="160px" height="20px" />
                    </div>
                  </div>
                </div>

                <div className="col-12 md:col-4 flex flex-column align-items-center justify-content-center p-3">
                  <Skeleton width="150px" height="150px" borderRadius="12px" className="mb-3" />
                  <Skeleton width="140px" height="16px" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-top-1 border-100 flex flex-wrap gap-2 justify-content-center">
                <Skeleton width="180px" height="40px" borderRadius="8px" />
                <Skeleton width="180px" height="40px" borderRadius="8px" />
              </div>
            </div>
          </div>

          {/* Skeleton Certificate Image Frame */}
          <div className="border-round-2xl p-4 shadow-2" style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7' }}>
            <Skeleton width="100%" height="450px" borderRadius="12px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !certData || !certData.certificate) {
    return (
      <div className="flex flex-column align-items-center justify-content-center min-h-screen p-4 surface-ground">
        <div className="surface-card border-round-2xl p-6 shadow-4 text-center border-1 border-red-200" style={{ maxWidth: '520px', background: '#ffffff' }}>
          <div className="inline-flex align-items-center justify-content-center bg-red-100 text-red-600 border-round-full mb-3" style={{ width: '64px', height: '64px' }}>
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-900 font-bold text-2xl mb-2">Invalid Certificate</h2>
          <p className="text-600 text-sm mb-4">{error || certData?.message || 'This credential could not be verified in our records.'}</p>
          <div className="p-3 surface-50 border-round font-monospace text-xs text-500 mb-4 border-1 border-200">
            Code: {code}
          </div>
          <Link to="/" className="no-underline">
            <Button label="Return to Home" icon="pi pi-home" className="p-button-outlined" />
          </Link>
        </div>
      </div>
    );
  }

  const certificate = certData.certificate || {};
  const status = certData.status || certificate.status || 'issued';
  const isRevoked = status === 'revoked';

  // LinkedIn Add to Profile URL
  const courseEncoded = encodeURIComponent(certificate.course_title || 'Certificate of Achievement');
  const orgNameEncoded = encodeURIComponent(certificate.issuer || 'Shazu Soft Technologies');
  const issueDateObj = new Date(certificate.issued_at || Date.now());
  const issueYear = issueDateObj.getFullYear();
  const issueMonth = issueDateObj.getMonth() + 1;
  const verifyUrl = window.location.href;

  const linkedinAddUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${courseEncoded}&organizationName=${orgNameEncoded}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${certificate.unique_code || code}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`🎓 Verified Credential: Check out my certified achievement for "${certificate.course_title || 'Certificate of Achievement'}" authenticated by ${certificate.issuer || 'Shazu Soft Technologies'}: ${verifyUrl}`)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Proud to share my verified certificate for "${certificate.course_title || 'Certificate of Achievement'}" issued by ${certificate.issuer || 'Shazu Soft Technologies'}! 🎓`)}&url=${encodeURIComponent(verifyUrl)}`;

  return (
    <div className="min-h-screen py-5 px-3 md:px-5" style={{ background: '#F5F3EC' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Top Header Card */}
        <div className="text-center mb-4 pt-2">
          <div className="inline-flex align-items-center justify-content-center p-2 mb-2">
            <img
              src="/logo.png"
              alt="Shazu Soft Technologies"
              style={{ maxHeight: '55px', width: 'auto', display: 'block' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="font-bold text-2xl md:text-3xl m-0 tracking-tight" style={{ color: '#123B32', letterSpacing: '-0.5px' }}>
            Official Credential Verification
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: '#334E43' }}>
            Authenticated and permanently recorded by <strong>{certificate.issuer || 'Shazu Soft Technologies'}</strong>
          </p>
        </div>

        {/* Security Gate or Verified Content */}
        {!turnstileVerified ? (
          <div className="border-round-2xl shadow-3 p-5 text-center my-4" style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7' }}>
            <div className="inline-flex align-items-center justify-content-center border-round-full p-3 mb-3" style={{ background: '#E8EFEB', color: '#123B32' }}>
              <Lock size={32} />
            </div>
            <h2 className="font-bold text-xl md:text-2xl m-0 mb-2" style={{ color: '#123B32' }}>
              Security Verification Required
            </h2>
            <p className="text-xs md:text-sm font-semibold mb-4" style={{ color: '#527A68', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
              Please complete the Cloudflare Turnstile security check below to verify and view official certificate credentials.
            </p>
            <TurnstileWidget onVerify={handleTurnstileVerify} />
          </div>
        ) : (
          <>
            {/* Main Certificate Verification Card */}
            <div className="border-round-2xl shadow-3 overflow-hidden mb-4" style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7' }}>
              
              {/* Status Header Banner */}
              <div
                className="p-4 text-white flex flex-column sm:flex-row align-items-center justify-content-between gap-3"
                style={{
                  background: isRevoked
                    ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                    : 'linear-gradient(135deg, #123B32 0%, #2F5B4E 100%)'
                }}
              >
                <div className="flex align-items-center gap-3">
                  <div className="bg-white-alpha-20 border-round-full p-2 flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    {isRevoked ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold m-0 text-white">
                      {isRevoked ? 'Certificate Revoked' : 'Verified Authentic Credential'}
                    </h2>
                    <p className="text-xs text-white-alpha-90 m-0 mt-1">
                      {isRevoked
                        ? 'This certificate has been revoked by the issuing organization.'
                        : 'Cryptographically registered and authenticated in the Official Verification Registry.'}
                    </p>
                  </div>
                </div>

                <div className="flex align-items-center gap-2">
                  <div className="bg-white-alpha-20 px-3 py-1.5 border-round-lg text-xs font-bold flex align-items-center gap-1.5 text-white">
                    <CheckCircle2 size={14} className="text-emerald-300" />
                    <span>Turnstile Verified</span>
                  </div>
                  <div className="bg-white-alpha-20 px-3 py-1.5 border-round-lg text-xs font-bold flex align-items-center gap-1.5 text-white">
                    <Eye size={14} />
                    <span>{certificate.verified_count} Verifications</span>
                  </div>
                </div>
              </div>

              {/* Body Section */}
              <div className="p-4 md:p-5" style={{ background: '#ffffff' }}>
                <div className="mb-4">
                  <span className="badge-source mb-2 inline-block">Recipient</span>
                  <h2 className="text-900 font-bold text-3xl m-0 mb-1" style={{ letterSpacing: '-0.5px', color: '#123B32' }}>
                    {certificate.recipient_name}
                  </h2>
                  <p className="font-bold text-lg m-0" style={{ color: '#C47D4C' }}>
                    {certificate.course_title}
                  </p>
                </div>

                {/* Metadata Box - Clean Full Width Grid */}
                <div className="surface-50 border-round-xl p-4 border-1 border-200 mb-4">
                  <div className="grid text-sm">
                    <div className="col-12 sm:col-4 mb-2">
                      <span className="text-500 text-xs font-semibold block mb-1 flex align-items-center gap-1.5" style={{ color: '#527A68' }}>
                        <Building size={15} style={{ color: '#123B32' }} /> Issuing Organization
                      </span>
                      <strong className="text-900 font-bold text-base" style={{ color: '#123B32' }}>
                        {certificate.issuer || 'Shazu Soft Technologies'}
                      </strong>
                    </div>

                    <div className="col-12 sm:col-4 mb-2">
                      <span className="text-500 text-xs font-semibold block mb-1 flex align-items-center gap-1.5" style={{ color: '#527A68' }}>
                        <Calendar size={15} style={{ color: '#123B32' }} /> Issue Date
                      </span>
                      <strong className="text-900 font-bold text-base" style={{ color: '#123B32' }}>
                        {new Date(certificate.issued_at || Date.now()).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </strong>
                    </div>

                    <div className="col-12 sm:col-4 mb-2">
                      <span className="text-500 text-xs font-semibold block mb-1 flex align-items-center gap-1.5" style={{ color: '#527A68' }}>
                        <Hash size={15} style={{ color: '#123B32' }} /> Verification ID
                      </span>
                      <span className="font-monospace text-sm bg-white px-3 py-1.5 border-round-lg border-1 border-300 font-bold select-all inline-block shadow-sm" style={{ color: '#123B32' }}>
                        {certificate.unique_code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Download PDF Button */}
                {!isRevoked && (
                  <div className="mb-4 text-center">
                    <a
                      href={getApiUrl(`/public/certificates/${certificate.unique_code}/download`)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-button p-button-primary p-button-lg w-full sm:w-auto px-5 no-underline inline-flex justify-content-center align-items-center gap-2 shadow-2 font-bold py-3 text-base"
                    >
                      <Download size={20} /> Download Official PDF Certificate
                    </a>
                    <small className="text-500 block text-center mt-2">
                      Rendered on-demand in high-resolution vector PDF format
                    </small>
                  </div>
                )}

                {/* Social Share & LinkedIn Section */}
                {!isRevoked && (
                  <div className="mt-4 pt-4 border-top-1 border-200">
                    <div className="text-center mb-3">
                      <h3 className="text-900 font-bold text-base m-0 mb-1 flex align-items-center justify-content-center gap-2">
                        <Share2 size={18} className="text-indigo-600" />
                        Share & Add to Professional Profile
                      </h3>
                      <p className="text-500 text-xs m-0">
                        Broadcast your authenticated credential to LinkedIn, networks, and employers.
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-content-center gap-2">
                      {/* LinkedIn Add to Profile */}
                      <a
                        href={linkedinAddUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-button btn-share-linkedin no-underline flex align-items-center gap-2 text-sm font-semibold px-4 py-2 border-round-lg shadow-1"
                      >
                        <i className="pi pi-linkedin" style={{ fontSize: '1.1rem' }}></i> Add to LinkedIn Profile
                      </a>

                      {/* LinkedIn Share */}
                      <a
                        href={linkedinShareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-button p-button-outlined p-button-indigo no-underline flex align-items-center gap-2 text-sm font-semibold px-3 py-2 border-round-lg"
                      >
                        <i className="pi pi-linkedin" style={{ fontSize: '1.1rem' }}></i> Share
                      </a>

                      {/* WhatsApp */}
                      <a
                        href={whatsappShareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-button btn-share-whatsapp no-underline flex align-items-center gap-2 text-sm font-semibold px-3 py-2 border-round-lg text-white"
                      >
                        <i className="pi pi-whatsapp" style={{ fontSize: '1.1rem' }}></i> WhatsApp
                      </a>

                      {/* Twitter / X */}
                      <a
                        href={twitterShareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-button btn-share-x no-underline flex align-items-center gap-2 text-sm font-semibold px-3 py-2 border-round-lg text-white"
                      >
                        <i className="pi pi-twitter" style={{ fontSize: '1.1rem' }}></i> Post to X
                      </a>

                      {/* Copy Link */}
                      <Button
                        icon={copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        label={copied ? 'Link Copied!' : 'Copy Link'}
                        className="p-button-outlined p-button-secondary text-sm font-semibold"
                        onClick={copyLink}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live On-Demand Image Inspection Frame */}
            {!isRevoked && (
              <div className="border-round-2xl shadow-3 border-1 border-200 p-4 mb-4" style={{ background: '#ffffff' }}>
                <h3 className="text-900 font-bold text-lg mb-3 flex align-items-center gap-2">
                  <Eye size={18} className="text-indigo-600" />
                  Certificate Visual Inspection
                </h3>
                <div className="border-round-xl overflow-hidden border-1 border-300 shadow-2 p-1" style={{ background: '#0f172a' }}>
                  <img
                    src={getApiUrl(`/public/certificates/${certificate.unique_code}/preview`)}
                    alt="Official Certificate"
                    style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
