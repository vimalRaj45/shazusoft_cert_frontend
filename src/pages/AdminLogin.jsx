import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ShieldCheck, Mail, KeyRound, ArrowRight, ArrowLeft, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AdminLogin() {
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP
  const [email, setEmail] = useState('admin@shazusoft.com');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await requestOtp(email);
      setSuccessMsg(res.message || 'Verification code sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(email, otp);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await requestOtp(email);
      setSuccessMsg('A new verification code has been dispatched to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const selectAllowedEmail = (em) => {
    setEmail(em);
    setError('');
  };

  return (
    <div className="flex align-items-center justify-content-center min-h-screen px-3 py-6" style={{ background: '#F5F3EC' }}>
      <div className="w-full" style={{ maxWidth: '440px' }}>
        
        {/* Brand Header */}
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
          <h1 className="text-2xl md:text-3xl font-bold m-0" style={{ color: '#123B32', letterSpacing: '-0.5px' }}>
            CertiVerify
          </h1>
          <p className="text-xs md:text-sm font-semibold mt-1" style={{ color: '#527A68' }}>
            Shazu Soft Technologies — Enterprise Security
          </p>
        </div>

        {/* Login Card */}
        <div
          className="border-round-2xl p-4 md:p-5 shadow-2"
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #D3DDD7'
          }}
        >
          <div className="text-center mb-4">
            <div className="inline-flex align-items-center justify-content-center border-round-full p-2 mb-2" style={{ background: '#E8EFEB', color: '#123B32' }}>
              {step === 1 ? <Mail size={22} /> : <KeyRound size={22} />}
            </div>
            <h2 className="font-bold text-lg md:text-xl m-0" style={{ color: '#123B32' }}>
              {step === 1 ? 'Admin Secure Login' : 'Enter Verification Code'}
            </h2>
            <p className="text-xs mt-1" style={{ color: '#527A68' }}>
              {step === 1
                ? 'Only authorized administrator emails are permitted.'
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {error && <Message severity="error" text={error} className="w-full mb-3 text-xs" />}
          {successMsg && <Message severity="success" text={successMsg} className="w-full mb-3 text-xs" />}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="flex flex-column gap-3">
              <div>
                <label className="block font-bold text-xs uppercase mb-1" style={{ color: '#26322E', letterSpacing: '0.04em' }}>
                  Authorized Admin Email
                </label>
                <div className="p-input-icon-left w-full">
                  <i className="pi pi-envelope" />
                  <InputText
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@shazusoft.com"
                    className="w-full"
                    type="email"
                    required
                  />
                </div>
              </div>

              <Button
                label="Send Verification Code"
                icon="pi pi-send"
                type="submit"
                className="p-button-primary w-full mt-2 font-bold py-2.5 text-sm"
                loading={loading}
              />
            </form>
          )}

          {/* STEP 2: Enter 6-Digit OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="flex flex-column gap-3">
              <div>
                <label className="block font-bold text-xs uppercase mb-1 text-center" style={{ color: '#26322E', letterSpacing: '0.04em' }}>
                  6-Digit OTP Code
                </label>
                <InputText
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full text-center font-bold font-monospace"
                  style={{ fontSize: '1.6rem', letterSpacing: '8px', padding: '0.6rem' }}
                  maxLength={6}
                  autoFocus
                  required
                />
                <small className="text-500 block text-center mt-1.5" style={{ fontSize: '11px' }}>
                  Expires in 5 minutes • Check spam if not in inbox
                </small>
              </div>

              <Button
                label="Verify & Access Console"
                icon="pi pi-check"
                type="submit"
                className="p-button-primary w-full mt-2 font-bold py-2.5 text-sm"
                loading={loading}
                disabled={otp.length !== 6}
              />

              <div className="flex justify-content-between align-items-center mt-2 pt-2 border-top-1 border-100">
                <Button
                  type="button"
                  label="Change Email"
                  icon={<ArrowLeft size={13} className="mr-1" />}
                  className="p-button-text p-button-sm p-0 text-xs font-bold"
                  style={{ color: '#527A68' }}
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError('');
                  }}
                />

                <Button
                  type="button"
                  label="Resend Code"
                  icon={<RefreshCw size={13} className={`mr-1 ${resending ? 'pi-spin' : ''}`} />}
                  className="p-button-text p-button-sm p-0 text-xs font-bold"
                  style={{ color: '#123B32' }}
                  onClick={handleResend}
                  loading={resending}
                />
              </div>
            </form>
          )}
        </div>

        {/* Bottom Recipient Link */}
        <div className="text-center mt-4">
          <Link
            to="/lookup"
            className="text-xs font-bold no-underline inline-flex align-items-center gap-1"
            style={{ color: '#2F5B4E' }}
          >
            Recipient Credential Lookup <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
