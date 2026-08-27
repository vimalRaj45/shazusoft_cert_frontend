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
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-900 font-bold text-2xl m-0 flex align-items-center gap-2">
          <UserCheck size={24} className="text-indigo-600" />
          Single Certificate Issuance
        </h2>
        <p className="text-500 text-sm m-0">
          Issue an authenticated certificate to an individual recipient and trigger Brevo transactional email.
        </p>
      </div>

      <div className="grid">
        {/* Form Column */}
        <div className="col-12 md:col-7">
          <div className="surface-card border-1 border-200 border-round-xl p-4 shadow-1">
            <form onSubmit={handleIssue} className="flex flex-column gap-3">
              {/* Template Selector */}
              <div>
                <label className="block text-900 font-bold text-sm mb-1">Select Certificate Template</label>
                <Dropdown
                  value={selectedTemplateId}
                  options={templates.map((t) => ({ label: t.name, value: t.id }))}
                  onChange={(e) => setSelectedTemplateId(e.value)}
                  placeholder="Select a Template"
                  className="w-full"
                  required
                />
              </div>

              <Divider className="my-1" />

              {/* Recipient Standard Info */}
              <div>
                <label className="block text-900 font-bold text-sm mb-1">Recipient Full Name *</label>
                <InputText
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-900 font-bold text-sm mb-1">Recipient Email Address *</label>
                <InputText
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="jane.doe@example.com"
                  className="w-full"
                  required
                />
              </div>

              {/* Dynamic Template Fields */}
              {templateFields
                .filter((f) => f.field_key !== 'recipient_name' && f.field_key !== 'unique_code' && !f.is_qr)
                .map((field) => (
                  <div key={field.id || field.field_key}>
                    <label className="block text-900 font-medium text-sm mb-1">
                      {field.label} {field.is_required && '*'}
                    </label>
                    <InputText
                      value={fieldData[field.field_key] || ''}
                      onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                      placeholder={`Enter ${field.label}`}
                      className="w-full"
                      required={field.is_required}
                    />
                  </div>
                ))}

              <Divider className="my-1" />

              {/* Brevo Email Dispatch Option */}
              <div className="flex align-items-center justify-content-between p-3 surface-50 border-round-lg border-1 border-200">
                <div className="flex align-items-center gap-2">
                  <Mail size={20} className="text-indigo-600" />
                  <div>
                    <div className="text-sm font-bold text-900">Send Email via Brevo</div>
                    <div className="text-xs text-500">Delivers download button & verification links</div>
                  </div>
                </div>
                <InputSwitch
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.value)}
                />
              </div>

              <Button
                type="submit"
                label={sendEmail ? 'Issue & Send Brevo Email' : 'Issue Certificate'}
                icon="pi pi-send"
                className="p-button-primary w-full mt-3 py-3 font-bold"
                loading={issuing}
              />
            </form>
          </div>
        </div>

        {/* Live Summary Preview Column */}
        <div className="col-12 md:col-5">
          <div className="surface-card border-1 border-200 border-round-xl p-4 shadow-1">
            <h4 className="text-900 font-bold text-base m-0 mb-3 flex align-items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              Live Certificate Preview
            </h4>

            {currentTemplate && (
              <div
                className="border-round-xl p-4 text-center mb-3 relative overflow-hidden shadow-2 flex flex-column justify-content-center"
                style={{
                  background: currentTemplate.file_url ? `url(${currentTemplate.file_url}) center/cover no-repeat` : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                  minHeight: '220px',
                  border: '1.5px solid #cbd5e1'
                }}
              >
                <div className="cert-title-font text-amber-400 font-bold text-xs tracking-wider mb-2">CERTIFICATE OF ACHIEVEMENT</div>
                <div className="text-white font-bold text-xl mb-1">{recipientName || 'Recipient Full Name'}</div>
                <div className="text-amber-300 text-sm font-semibold mb-3">{fieldData.course_title || currentTemplate.name}</div>
                <div className="text-white-alpha-70 text-xs font-monospace">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              </div>
            )}

            <div className="text-xs text-700 flex flex-column gap-2 bg-indigo-50 p-3 border-round-lg border-1 border-indigo-100">
              <div className="flex justify-content-between"><strong>Template:</strong> <span>{currentTemplate?.name || 'None'}</span></div>
              <div className="flex justify-content-between"><strong>Email Dispatch:</strong> <span>{sendEmail ? 'Brevo API (Transactional)' : 'Off'}</span></div>
              <div className="flex justify-content-between"><strong>Database:</strong> <span>Neon Postgres</span></div>
              <div className="flex justify-content-between"><strong>Render Pipeline:</strong> <span>On-Demand High-Res Vector PDF</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Celebration Dialog */}
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
