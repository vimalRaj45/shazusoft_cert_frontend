import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import toast from 'react-hot-toast';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { UserCheck, Mail, Send, CheckCircle, ExternalLink, Download, Share2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import api, { getApiUrl } from '../services/api';

export default function SingleIssue() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateFields, setTemplateFields] = useState([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [fieldData, setFieldData] = useState({});
  const [sendEmail, setSendEmail] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [issuedCert, setIssuedCert] = useState(null);
  const [successDialog, setSuccessDialog] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      const list = res.data.templates || [];
      setTemplates(list);
      if (list.length > 0) {
        setSelectedTemplateId(list[0].id);
      }
    } catch (err) {
      toast.error('Failed to load templates');
    }
  };

  useEffect(() => {
    if (selectedTemplateId) {
      api.get(`/templates/${selectedTemplateId}`).then((res) => {
        const fields = res.data.fields || [];
        setTemplateFields(fields);
        // Pre-fill default values
        const initial = {};
        fields.forEach((f) => {
          if (f.field_key !== 'recipient_name' && f.field_key !== 'unique_code' && !f.is_qr) {
            if (f.field_key === 'course_title') initial[f.field_key] = res.data.template.name;
            else if (f.field_key === 'issue_date') initial[f.field_key] = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            else initial[f.field_key] = '';
          }
        });
        setFieldData(initial);
      });
    }
  }, [selectedTemplateId]);

  const handleFieldChange = (key, val) => {
    setFieldData((prev) => ({ ...prev, [key]: val }));
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId || !recipientName.trim() || !recipientEmail.trim()) {
      toast.error('Please provide recipient name and email');
      return;
    }

    setIssuing(true);
    const toastId = toast.loading('Generating authenticated certificate...');
    try {
      const payload = {
        template_id: selectedTemplateId,
        recipient_name: recipientName.trim(),
        recipient_email: recipientEmail.trim(),
        field_data: fieldData,
        send_email: sendEmail
      };

      const res = await api.post('/certificates/single', payload);
      setIssuedCert(res.data.certificate);
      setSuccessDialog(true);

      // Trigger Confetti effect
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success(sendEmail ? 'Certificate issued and email dispatched!' : 'Certificate created successfully!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, { id: toastId });
    } finally {
      setIssuing(false);
    }
  };

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="p-4" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="mb-4">
        <h2 className="text-900 font-bold text-2xl m-0 flex align-items-center gap-2">
          <UserCheck size={24} className="text-indigo-600" />
          Single Certificate Issuance
        </h2>
        <p className="text-500 text-sm m-0">
          Issue an authenticated certificate to an individual recipient with automatic email dispatch.
        </p>
      </div>

      <div className="grid">
        <div className="col-12 lg:col-7">
          <div className="surface-card border-1 border-200 border-round-xl p-4 shadow-1">
            <form onSubmit={handleIssue} className="flex flex-column gap-3">
              <div>
                <label className="block text-900 font-medium text-sm mb-1">Select Certificate Template *</label>
                <Dropdown
                  value={selectedTemplateId}
                  options={templates.map((t) => ({ label: t.name, value: t.id }))}
                  onChange={(e) => setSelectedTemplateId(e.value)}
                  placeholder="Choose background layout"
                  className="w-full p-inputtext-sm"
                />
              </div>

              <Divider className="my-1" />

              <div className="grid">
                <div className="col-12 sm:col-6">
                  <label className="block text-900 font-medium text-sm mb-1">Recipient Full Name *</label>
                  <InputText
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Dr. Jane Doe"
                    className="w-full p-inputtext-sm"
                    required
                  />
                </div>
                <div className="col-12 sm:col-6">
                  <label className="block text-900 font-medium text-sm mb-1">Recipient Email *</label>
                  <InputText
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. jane.doe@example.com"
                    className="w-full p-inputtext-sm"
                    required
                  />
                </div>
              </div>

              {templateFields.length > 0 && (
                <div className="surface-50 border-round-lg p-3 border-1 border-200">
                  <span className="text-xs font-bold text-700 uppercase tracking-wider block mb-2">
                    Template Dynamic Fields ({templateFields.length})
                  </span>
                  <div className="grid">
                    {templateFields.map((f) => (
                      <div key={f.id} className="col-12 sm:col-6">
                        <label className="block text-800 text-xs font-medium mb-1">
                          {f.label} {f.is_required && '*'}
                        </label>
                        <InputText
                          value={fieldData[f.field_key] || ''}
                          onChange={(e) => handleFieldChange(f.field_key, e.target.value)}
                          placeholder={`Enter ${f.label.toLowerCase()}`}
                          className="w-full p-inputtext-sm"
                          required={f.is_required}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex align-items-center justify-content-between p-3 surface-50 border-round-lg border-1 border-200">
                <div className="flex align-items-center gap-2">
                  <Mail size={18} className="text-indigo-600" />
                  <div>
                    <div className="text-sm font-bold text-900">Send Official Certificate Email</div>
                    <div className="text-xs text-500">Includes secure link & high-resolution attachment</div>
                  </div>
                </div>
                <InputSwitch checked={sendEmail} onChange={(e) => setSendEmail(e.value)} />
              </div>

              <Button
                type="submit"
                label={sendEmail ? 'Issue & Send Email' : 'Issue Certificate'}
                icon={<Send size={16} className="mr-2" />}
                className="p-button-primary w-full py-3 font-bold text-base mt-2 shadow-2"
                loading={issuing}
              />
            </form>
          </div>
        </div>

        <div className="col-12 lg:col-5">
          <div className="surface-card border-1 border-200 border-round-xl p-4 shadow-1 h-full flex flex-column justify-content-between">
            <div>
              <h4 className="text-900 font-bold m-0 mb-3 flex align-items-center gap-2">
                <CheckCircle size={18} className="text-indigo-600" />
                Live Issuance Summary
              </h4>

              {/* Clean Live Certificate Preview Container (No Dark Overlay) */}
              <div
                className="w-full border-round-xl mb-3 relative overflow-hidden shadow-2 flex justify-content-center align-items-center surface-900"
                style={{
                  minHeight: '230px',
                  aspectRatio: '1.414/1',
                  border: '1.5px solid #D3DDD7'
                }}
              >
                {currentTemplate?.file_url ? (
                  <div className="relative w-full h-full">
                    {/* Real Certificate Artwork Background */}
                    <img
                      src={currentTemplate.file_url}
                      alt={currentTemplate.name}
                      className="w-full h-full object-contain block"
                    />
                    
                    {/* Live Positioned Overlay Fields */}
                    {templateFields && templateFields.length > 0 ? (
                      templateFields.map((f) => {
                        let textVal = '';
                        if (f.field_key === 'recipient_name') textVal = recipientName || 'Recipient Full Name';
                        else if (f.field_key === 'unique_code' || f.field_key === 'certificate_id') textVal = 'CERT-2026-XXXXXX';
                        else if (f.field_key === 'issue_date' || f.field_key === 'date') textVal = fieldData[f.field_key] || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                        else textVal = fieldData[f.field_key] !== undefined && fieldData[f.field_key] !== '' ? String(fieldData[f.field_key]) : (f.label || '');

                        if (f.is_qr) {
                          const baseSize = parseInt(f.font_size, 10) || 32;
                          const qrSize = Math.max(24, Math.round(baseSize * 0.9));
                          return (
                            <div
                              key={f.id}
                              className="absolute flex align-items-center justify-content-center border-round font-bold shadow-1"
                              style={{
                                left: `${f.x}%`,
                                top: `${f.y}%`,
                                transform: 'translate(-50%, -50%)',
                                width: `${qrSize}px`,
                                height: `${qrSize}px`,
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                color: f.font_color || '#123B32',
                                border: '1px solid rgba(0, 0, 0, 0.2)',
                                fontSize: '8px',
                                opacity: f.opacity !== undefined && f.opacity !== null ? parseFloat(f.opacity) : 1
                              }}
                              title="Anti-Tamper QR Code"
                            >
                              QR
                            </div>
                          );
                        }

                        // Text Field
                        const scaledFontSize = Math.max(9, Math.round((parseInt(f.font_size, 10) || 28) * 0.32));
                        return (
                          <div
                            key={f.id}
                            className="absolute whitespace-nowrap text-shadow-sm pointer-events-none"
                            style={{
                              left: `${f.x}%`,
                              top: `${f.y}%`,
                              transform: 'translate(-50%, -50%)',
                              fontFamily: (f.font_family || 'Cinzel').split(',')[0],
                              fontSize: `${scaledFontSize}px`,
                              fontWeight: f.font_weight === 'bold' ? 'bold' : 'normal',
                              color: f.font_color || '#123B32',
                              textAlign: f.align || 'center',
                              textDecoration: f.is_underline ? 'underline' : 'none',
                              textUnderlineOffset: f.is_underline ? '0.25em' : 'auto',
                              opacity: f.opacity !== undefined && f.opacity !== null ? parseFloat(f.opacity) : 1
                            }}
                          >
                            {textVal}
                          </div>
                        );
                      })
                    ) : (
                      // Fallback clean light badge overlay if no fields saved yet
                      <div className="absolute bottom-0 left-0 w-full p-2 text-center surface-0-alpha-90 border-top-1 border-200">
                        <h4 className="text-sm font-bold text-900 m-0">{recipientName || 'Recipient Full Name'}</h4>
                        <div className="text-xs font-semibold text-indigo-700">{fieldData.course_title || currentTemplate.name}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Built-in Default Background Preview
                  <div className="w-full h-full p-4 flex flex-column justify-content-center align-items-center text-center text-white" style={{ background: 'linear-gradient(135deg, #123B32 0%, #2F5B4E 100%)' }}>
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-1">CERTIFICATE OF ACHIEVEMENT</div>
                    <h3 className="text-lg font-bold text-white m-0 mb-1">{recipientName || 'Recipient Full Name'}</h3>
                    <div className="text-amber-300 text-sm font-semibold mb-2">{fieldData.course_title || 'Certificate of Achievement'}</div>
                    <div className="text-xs text-400">ID: Generated automatically on issuance</div>
                  </div>
                )}
              </div>

              <div className="text-xs text-600 flex flex-column gap-1 surface-50 p-3 border-round-lg border-1 border-200">
                <div className="flex justify-content-between"><strong>Template:</strong> <span>{currentTemplate?.name || 'None selected'}</span></div>
                <div className="flex justify-content-between"><strong>Email Dispatch:</strong> <span>{sendEmail ? 'Enabled (Automated Dispatch)' : 'Off'}</span></div>
                <div className="flex justify-content-between"><strong>Registry:</strong> <span>Encrypted Cloud Database</span></div>
                <div className="flex justify-content-between"><strong>Render Pipeline:</strong> <span>On-Demand High-Res Vector PDF</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        header="Certificate Generated & Authenticated! 🎓"
        visible={successDialog}
        style={{ width: '92vw', maxWidth: '560px' }}
        modal
        dismissableMask
        onHide={() => setSuccessDialog(false)}
      >
        {issuedCert && (
          <div className="text-center pt-2">
            {/* Animated Celebration Icon */}
            <div
              className="inline-flex align-items-center justify-content-center border-round-full mb-3 shadow-2"
              style={{
                width: '68px',
                height: '68px',
                background: 'linear-gradient(135deg, #123B32 0%, #2F5B4E 100%)',
                color: '#ffffff'
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h3 className="font-bold text-2xl m-0 mb-1" style={{ color: '#123B32' }}>
              {issuedCert.recipient_name}
            </h3>
            <p className="text-xs font-semibold m-0 mb-3" style={{ color: '#527A68' }}>
              {issuedCert.recipient_email}
            </p>

            {/* Certificate Preview Card */}
            <div
              className="p-3 border-round-xl mb-3 text-center shadow-1"
              style={{
                background: '#E8EFEB',
                border: '1.5px solid #D3DDD7'
              }}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#C47D4C' }}>
                Official Credential Record
              </div>
              <div className="font-bold text-base mb-2" style={{ color: '#123B32' }}>
                {issuedCert.field_data?.course_title || currentTemplate?.name || 'Certificate of Achievement'}
              </div>
              <div
                className="inline-flex align-items-center gap-2 px-3 py-1.5 border-round-lg font-monospace text-xs font-bold"
                style={{ background: '#FFFFFF', color: '#123B32', border: '1px solid #D3DDD7' }}
              >
                <span>ID: {issuedCert.unique_code}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-column gap-2 mt-3">
              <a
                href={getApiUrl(`/public/certificates/${issuedCert.unique_code}/download`)}
                target="_blank"
                rel="noreferrer"
                className="p-button p-button-primary p-button-lg w-full no-underline flex justify-content-center align-items-center gap-2 font-bold text-sm"
                style={{ background: '#123B32', borderColor: '#123B32' }}
              >
                <Download size={18} /> Download High-Resolution PDF
              </a>

              <a
                href={`/verify/${issuedCert.unique_code}`}
                target="_blank"
                rel="noreferrer"
                className="p-button p-button-outlined p-button-lg w-full no-underline flex justify-content-center align-items-center gap-2 font-bold text-sm"
                style={{ color: '#123B32', borderColor: '#123B32', background: '#FFFFFF' }}
              >
                <ExternalLink size={18} /> Open Public Verification Page
              </a>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
