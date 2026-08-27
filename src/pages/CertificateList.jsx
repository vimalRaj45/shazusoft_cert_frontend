import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import toast from 'react-hot-toast';
import { ShieldCheck, Search, Download, QrCode, Mail, Ban, CheckCircle2, Copy, ExternalLink, Activity } from 'lucide-react';
import api, { getApiUrl } from '../services/api';

export default function CertificateList() {
  const [certificates, setCertificates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(15);

  // Dialogs
  const [selectedCert, setSelectedCert] = useState(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [auditVisible, setAuditVisible] = useState(false);
  const [auditLogs, setAuditLogs] = useState({ emailLogs: [], verificationLogs: [] });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.templates || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [search, statusFilter, templateFilter, page, rows]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/certificates', {
        params: {
          search,
          status: statusFilter,
          template_id: templateFilter,
          limit: rows,
          offset: page * rows
        }
      });
      setCertificates(res.data.certificates || []);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = (cert) => {
    confirmDialog({
      message: `Are you sure you want to revoke the certificate for "${cert.recipient_name}" (${cert.unique_code})? The public verification page will display this certificate as revoked.`,
      header: 'Revoke Certificate Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger font-bold',
      acceptLabel: 'Yes, Revoke Certificate',
      rejectLabel: 'Cancel',
      accept: async () => {
        try {
          await api.put(`/certificates/${cert.id}/revoke`);
          toast.success('Certificate marked as revoked');
          fetchCertificates();
        } catch (err) {
          toast.error('Revocation failed');
        }
      }
    });
  };

  const handleReissue = (cert) => {
    confirmDialog({
      message: `Are you sure you want to restore and activate the certificate for "${cert.recipient_name}"?`,
      header: 'Restore Certificate',
      icon: 'pi pi-info-circle',
      acceptClassName: 'p-button-primary font-bold',
      acceptLabel: 'Yes, Restore',
      rejectLabel: 'Cancel',
      accept: async () => {
        try {
          await api.put(`/certificates/${cert.id}/reissue`);
          toast.success('Certificate restored to active status');
          fetchCertificates();
        } catch (err) {
          toast.error('Restore failed');
        }
      }
    });
  };

  const handleResendEmail = async (cert) => {
    const toastId = toast.loading(`Sending email to ${cert.recipient_email}...`);
    try {
      const res = await api.post(`/certificates/${cert.id}/resend-email`);
      if (res.data.success) {
        toast.success(`Email dispatched to ${cert.recipient_email}`, { id: toastId });
      } else {
        toast.error(res.data.message || 'Check email logs', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, { id: toastId });
    }
  };

  const openQrModal = (cert) => {
    setSelectedCert(cert);
    setQrVisible(true);
  };

  const openAuditModal = async (cert) => {
    setSelectedCert(cert);
    try {
      const res = await api.get(`/certificates/${cert.id}`);
      setAuditLogs({
        emailLogs: res.data.emailLogs || [],
        verificationLogs: res.data.verificationLogs || []
      });
      setAuditVisible(true);
    } catch (err) {
      toast.error('Failed to load audit logs');
    }
  };

  const copyVerifyLink = (code) => {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Verification link copied to clipboard');
  };

  return (
    <div className="p-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>

      {/* Header */}
      <div className="flex flex-column sm:flex-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 className="text-900 font-bold text-2xl m-0 flex align-items-center gap-2">
            <ShieldCheck size={24} className="text-indigo-600" />
            Issued Certificates & Credentials
          </h2>
          <p className="text-500 text-sm m-0">
            Search, revoke, re-issue, resend Brevo emails, and monitor verification audit logs.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="surface-card border-1 border-200 border-round-xl p-3 shadow-1 mb-4">
        <div className="flex flex-column sm:flex-row gap-3 justify-content-between align-items-center">
          
          <div className="p-input-icon-left w-full sm:w-24rem">
            <i className="pi pi-search" />
            <InputText
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search recipient name, email, or certificate ID..."
              className="w-full p-inputtext-sm"
            />
          </div>

          <div className="flex flex-wrap align-items-center gap-2 w-full sm:w-auto justify-content-end">
            <Dropdown
              value={templateFilter}
              options={[
                { label: 'All Certificate Types', value: '' },
                ...templates.map((t) => ({ label: t.name, value: t.id }))
              ]}
              onChange={(e) => {
                setTemplateFilter(e.value);
                setPage(0);
              }}
              placeholder="Filter by Certificate Type"
              className="p-inputtext-sm w-full sm:w-16rem"
            />

            <Dropdown
              value={statusFilter}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Active Only', value: 'issued' },
                { label: 'Revoked Only', value: 'revoked' }
              ]}
              onChange={(e) => {
                setStatusFilter(e.value);
                setPage(0);
              }}
              placeholder="Filter by Status"
              className="p-inputtext-sm w-full sm:w-11rem"
            />

            <span className="badge-source font-bold whitespace-nowrap">
              {totalRecords} Records
            </span>
          </div>
        </div>
      </div>

      {/* Main DataTable */}
      <div className="surface-card border-1 border-200 border-round-xl shadow-1 overflow-hidden">
        <DataTable
          value={certificates}
          lazy
          paginator
          first={page * rows}
          rows={rows}
          totalRecords={totalRecords}
          onPage={(e) => {
            setPage(e.page);
            setRows(e.rows);
          }}
          loading={loading}
          responsiveLayout="scroll"
          size="normal"
          emptyMessage="No certificates found matching your search."
        >
          <Column
            field="recipient_name"
            header="Recipient Name"
            className="font-bold text-900"
            body={(r) => (
              <div>
                <div className="font-bold text-900">{r.recipient_name}</div>
                <div className="text-xs text-500">{r.recipient_email}</div>
              </div>
            )}
          />
          <Column
            field="template_name"
            header="Template"
            body={(r) => (
              <span className="text-sm font-medium text-700">{r.template_name || 'Standard'}</span>
            )}
          />
          <Column
            field="unique_code"
            header="Certificate ID"
            body={(r) => (
              <div className="flex align-items-center gap-2">
                <span className="font-monospace text-xs text-indigo-700 bg-indigo-50 px-2 py-1 border-round border-1 border-indigo-100 font-bold">
                  {r.unique_code.substring(0, 10)}...
                </span>
                <button
                  type="button"
                  className="action-btn action-btn-secondary"
                  style={{ width: '28px', height: '28px', minWidth: '28px' }}
                  title="Copy Full Verification URL"
                  onClick={() => copyVerifyLink(r.unique_code)}
                >
                  <Copy size={13} />
                </button>
              </div>
            )}
          />
          <Column
            field="status"
            header="Status"
            body={(r) =>
              r.status === 'issued' ? (
                <Tag severity="success" value="Active" icon="pi pi-check" />
              ) : (
                <Tag severity="danger" value="Revoked" icon="pi pi-times" />
              )
            }
          />
          <Column
            field="verified_count"
            header="Verifications"
            body={(r) => (
              <span className="badge-source font-semibold">{r.verified_count || 0} Hits</span>
            )}
          />
          <Column
            header="Actions"
            headerStyle={{ textAlign: 'center' }}
            body={(r) => (
              <div className="flex align-items-center gap-2">
                {/* Download on demand */}
                <a
                  href={getApiUrl(`/public/certificates/${r.unique_code}/download`)}
                  target="_blank"
                  rel="noreferrer"
                  className="action-btn action-btn-primary"
                  title="Download On-Demand PDF"
                >
                  <Download size={16} />
                </a>

                {/* View QR Code */}
                <button
                  type="button"
                  className="action-btn action-btn-secondary"
                  title="Inspect QR Code"
                  onClick={() => openQrModal(r)}
                >
                  <QrCode size={16} />
                </button>

                {/* Resend Email */}
                <button
                  type="button"
                  className="action-btn action-btn-primary"
                  title="Resend Brevo Email"
                  onClick={() => handleResendEmail(r)}
                >
                  <Mail size={16} />
                </button>

                {/* Audit Logs */}
                <button
                  type="button"
                  className="action-btn action-btn-secondary"
                  title="View Audit Logs"
                  onClick={() => openAuditModal(r)}
                >
                  <Activity size={16} />
                </button>

                {/* Revoke / Restore */}
                {r.status === 'issued' ? (
                  <button
                    type="button"
                    className="action-btn action-btn-danger"
                    title="Revoke Certificate"
                    onClick={() => handleRevoke(r)}
                  >
                    <Ban size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="action-btn action-btn-success"
                    title="Restore to Active"
                    onClick={() => handleReissue(r)}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
              </div>
            )}
          />
        </DataTable>
      </div>

      {/* QR Code Dialog */}
      <Dialog
        header={`Verification QR: ${selectedCert?.recipient_name || ''}`}
        visible={qrVisible}
        style={{ width: '360px' }}
        modal
        onHide={() => setQrVisible(false)}
      >
        {selectedCert && (
          <div className="text-center pt-2">
            <div className="p-3 surface-50 border-round-xl border-1 border-200 inline-block mb-3">
              <img
                src={getApiUrl(`/public/certificates/${selectedCert.unique_code}/qr`)}
                alt="Verification QR Code"
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>
            <p className="text-xs text-500 mb-3">
              Scan with any mobile camera to verify credential authenticity on Neon DB.
            </p>
            <a
              href={`/verify/${selectedCert.unique_code}`}
              target="_blank"
              rel="noreferrer"
              className="p-button p-button-primary p-button-sm w-full no-underline flex justify-content-center align-items-center gap-2"
            >
              <ExternalLink size={14} /> Open Public Verification View
            </a>
          </div>
        )}
      </Dialog>

      {/* Audit Logs Dialog */}
      <Dialog
        header={`Audit Logs: ${selectedCert?.recipient_name || ''}`}
        visible={auditVisible}
        style={{ width: '600px' }}
        modal
        onHide={() => setAuditVisible(false)}
      >
        <div className="pt-2">
          <h4 className="text-sm font-bold text-900 mb-2">Brevo Email Logs</h4>
          {auditLogs.emailLogs.length > 0 ? (
            <div className="flex flex-column gap-2 mb-4">
              {auditLogs.emailLogs.map((log) => (
                <div key={log.id} className="p-2 surface-50 border-round border-1 border-200 text-xs flex justify-content-between">
                  <span>Status: <strong>{log.status}</strong> {log.brevo_message_id ? `(ID: ${log.brevo_message_id})` : ''}</span>
                  <span className="text-500">{new Date(log.sent_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-500 mb-4">No email logs recorded yet.</p>
          )}

          <h4 className="text-sm font-bold text-900 mb-2">Public Verification Hits</h4>
          {auditLogs.verificationLogs.length > 0 ? (
            <div className="flex flex-column gap-2 max-h-12rem overflow-y-auto">
              {auditLogs.verificationLogs.map((v) => (
                <div key={v.id} className="p-2 surface-50 border-round border-1 border-200 text-xs flex justify-content-between">
                  <span>IP: {v.ip}</span>
                  <span className="text-500">{new Date(v.verified_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-500">No public verifications yet.</p>
          )}
        </div>
      </Dialog>

    </div>
  );
}
