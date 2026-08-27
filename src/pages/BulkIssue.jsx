import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import toast from 'react-hot-toast';
import { InputSwitch } from 'primereact/inputswitch';
import { FileUpload } from 'primereact/fileupload';
import { FileSpreadsheet, Upload, CheckCircle, AlertTriangle, Play, RefreshCw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';

const SAMPLE_CSV = `Recipient Name,Recipient Email,Course Title,Grade,Issue Date
Alice Johnson,alice.johnson@example.com,Full Stack AI Architecture,Distinction,2026-08-27
Bob Smith,bob.smith@example.com,Advanced React & Fastify Masterclass,Merit,2026-08-27
Charlie Brown,charlie.brown@example.com,Cloud Engineering with Neon & S3,Pass with Honors,2026-08-27
Diana Prince,diana.prince@example.com,Cybersecurity & Identity Systems,High Distinction,2026-08-27
Evan Wright,evan.wright@example.com,Full Stack AI Architecture,Distinction,2026-08-27`;

export default function BulkIssue() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateFields, setTemplateFields] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [validatedData, setValidatedData] = useState([]);
  const [sendEmail, setSendEmail] = useState(true);

  // Batch progress state
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const pollIntervalRef = useRef(null);

  useEffect(() => {
    fetchTemplates();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
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
        setTemplateFields(res.data.fields || []);
      });
    }
  }, [selectedTemplateId]);

  const handleFileUpload = (e) => {
    const file = e.files ? e.files[0] : (e.target?.files ? e.target.files[0] : null);
    if (!file) return;
    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processParsedData(results.data, results.meta.fields || []);
      }
    });
  };

  const loadSampleCSV = () => {
    Papa.parse(SAMPLE_CSV, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processParsedData(results.data, results.meta.fields || []);
        toast.success('Loaded 5 sample recipients');
      }
    });
  };

  const processParsedData = (rows, headers) => {
    setParsedRows(rows);
    setCsvHeaders(headers);

    // Auto-match headers to field keys
    const autoMap = {};
    headers.forEach((h) => {
      const norm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm.includes('name')) autoMap[h] = 'recipient_name';
      else if (norm.includes('email') || norm.includes('mail')) autoMap[h] = 'recipient_email';
      else if (norm.includes('course') || norm.includes('title')) autoMap[h] = 'course_title';
      else if (norm.includes('date')) autoMap[h] = 'issue_date';
      else if (norm.includes('grade')) autoMap[h] = 'grade';
      else autoMap[h] = norm;
    });
    setColumnMapping(autoMap);
    validateRows(rows, autoMap);
  };

  const handleMappingChange = (header, mappedKey) => {
    const updated = { ...columnMapping, [header]: mappedKey };
    setColumnMapping(updated);
    validateRows(parsedRows, updated);
  };

  const validateRows = (rows, mapping) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validated = rows.map((row, idx) => {
      const item = { _index: idx + 1, _errors: [] };
      const fieldData = {};

      Object.entries(mapping).forEach(([csvCol, fieldKey]) => {
        if (!fieldKey || fieldKey === 'ignore') return;
        const val = row[csvCol]?.trim() || '';
        if (fieldKey === 'recipient_name') {
          item.recipient_name = val;
        } else if (fieldKey === 'recipient_email') {
          item.recipient_email = val;
        } else {
          fieldData[fieldKey] = val;
        }
      });

      item.field_data = fieldData;

      if (!item.recipient_name) item._errors.push('Missing recipient name');
      if (!item.recipient_email) {
        item._errors.push('Missing recipient email');
      } else if (!emailRegex.test(item.recipient_email)) {
        item._errors.push('Invalid email format');
      }

      item.valid = item._errors.length === 0;
      return item;
    });

    setValidatedData(validated);
  };

  const confirmAndStartBatch = () => {
    const validRecords = validatedData.filter((r) => r.valid);
    if (validRecords.length === 0) {
      toast.error('Please fix validation errors before proceeding');
      return;
    }

    confirmDialog({
      message: `Are you sure you want to issue ${validRecords.length} certificates in bulk? This will generate official certificates and ${sendEmail ? 'dispatch notification emails' : 'save them to your registry'}.`,
      header: 'Confirm Bulk Certificate Generation',
      icon: 'pi pi-send',
      acceptClassName: 'p-button-primary font-bold',
      acceptLabel: 'Yes, Issue All',
      rejectLabel: 'Review List',
      accept: () => startBatchIssuance()
    });
  };

  const startBatchIssuance = async () => {
    const validRecords = validatedData.filter((r) => r.valid);
    if (validRecords.length === 0) return;

    setProcessing(true);
    setProgressPercent(0);

    try {
      const payload = {
        template_id: selectedTemplateId,
        filename: csvFile?.name || 'sample_bulk.csv',
        records: validRecords.map((r) => ({
          recipient_name: r.recipient_name,
          recipient_email: r.recipient_email,
          field_data: r.field_data
        })),
        send_email: sendEmail
      };

      const res = await api.post('/certificates/bulk', payload);
      const batch = res.data.batch;
      setActiveBatchId(batch.id);

      toast.success(`Processing ${validRecords.length} certificates in background...`);

      // Poll batch progress
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await api.get(`/batches/${batch.id}/status`);
          const current = statusRes.data.batch;
          setBatchStatus(current);
          const percent = Math.round((current.processed_records / Math.max(1, current.total_records)) * 100);
          setProgressPercent(percent);

          if (current.status === 'completed' || current.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            setProcessing(false);
            if (current.status === 'completed') {
              confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
              toast.success(`All ${current.total_records} certificates generated & sent!`);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 1200);

    } catch (err) {
      setProcessing(false);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const validCount = validatedData.filter((r) => r.valid).length;
  const errorCount = validatedData.length - validCount;

  return (
    <div className="p-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-column sm:flex-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 className="text-900 font-bold text-2xl m-0 flex align-items-center gap-2">
            <FileSpreadsheet size={24} className="text-indigo-600" />
            Bulk CSV Certificate Issuance
          </h2>
          <p className="text-500 text-sm m-0">
            Upload CSV list of recipients, auto-map columns, validate rows, and queue Brevo transactional dispatches.
          </p>
        </div>
        <Button
          label="Load Sample CSV (5 Recipients)"
          icon={<Sparkles size={16} className="mr-1 text-amber-500" />}
          className="p-button-outlined p-button-indigo"
          onClick={loadSampleCSV}
        />
      </div>

      {/* Step 1 & 2 Config Row */}
      <div className="grid mb-4">
        <div className="col-12 md:col-6">
          <div className="surface-card border-1 border-200 border-round-xl p-4 shadow-1 h-full">
            <h4 className="text-900 font-bold text-base m-0 mb-2">1. Select Certificate Template</h4>
            <Dropdown
              value={selectedTemplateId}
              options={templates.map((t) => ({ label: t.name, value: t.id }))}
              onChange={(e) => setSelectedTemplateId(e.value)}
              placeholder="Select a Template"
              className="w-full mb-3"
            />

            <div className="flex align-items-center justify-content-between p-3 surface-50 border-round-lg border-1 border-200">
              <span className="text-sm font-bold text-900">Send Emails via Brevo</span>
              <InputSwitch
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.value)}
              />
            </div>
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="surface-card border-1 border-200 border-round-xl p-4 shadow-1 h-full flex flex-column justify-content-between">
            <div>
              <h4 className="text-900 font-bold text-base m-0 mb-2">2. Upload Recipients CSV</h4>
              <FileUpload
                mode="basic"
                name="recipients_csv"
                accept=".csv"
                maxFileSize={10000000}
                auto={false}
                chooseLabel={csvFile ? csvFile.name : "Select Recipients CSV"}
                onSelect={handleFileUpload}
                className="w-full mb-2"
              />
              <small className="text-500 block mt-2" style={{ fontSize: '11.5px' }}>
                Supported columns: Recipient Name, Recipient Email, Course Title, Issue Date, Grade, etc.
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Column Mapping & Data Grid Preview */}
      {parsedRows.length > 0 && (
        <div className="surface-card border-1 border-200 border-round-xl p-4 shadow-1 mb-4">
          <div className="flex flex-column md:flex-row justify-content-between align-items-md-center gap-3 mb-3">
            <div>
              <h3 className="text-900 font-bold text-lg m-0">3. Column Mapping & Row Validation</h3>
              <p className="text-500 text-xs m-0">Map each CSV column to the corresponding certificate data field.</p>
            </div>

            <div className="flex align-items-center gap-3">
              <Tag severity="success" value={`${validCount} Valid`} icon="pi pi-check" />
              {errorCount > 0 && <Tag severity="danger" value={`${errorCount} Errors`} icon="pi pi-times" />}
              <Button
                label={`Issue ${validCount} Certificates`}
                icon={<Play size={16} className="mr-1" />}
                className="p-button-primary"
                disabled={validCount === 0 || processing}
                loading={processing}
                onClick={confirmAndStartBatch}
              />
            </div>
          </div>

          {/* Column Mapping Selectors */}
          <div className="surface-50 p-3 border-round-lg border-1 border-200 mb-3">
            <div className="text-xs font-bold text-700 uppercase mb-2">Column Data Mappings:</div>
            <div className="grid">
              {csvHeaders.map((header) => (
                <div key={header} className="col-12 sm:col-6 md:col-3">
                  <label className="text-xs font-semibold text-600 block mb-1 font-monospace">{header}</label>
                  <Dropdown
                    value={columnMapping[header]}
                    options={[
                      { label: 'Recipient Name *', value: 'recipient_name' },
                      { label: 'Recipient Email *', value: 'recipient_email' },
                      { label: 'Course Title', value: 'course_title' },
                      { label: 'Issue Date', value: 'issue_date' },
                      { label: 'Grade / Honors', value: 'grade' },
                      { label: 'Instructor Name', value: 'instructor_name' },
                      { label: '— Ignore Column —', value: 'ignore' }
                    ]}
                    onChange={(e) => handleMappingChange(header, e.value)}
                    className="w-full p-inputtext-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar during Batch processing */}
          {processing && (
            <div className="mb-4 p-4 surface-50 border-round-xl border-1 border-indigo-200">
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="font-bold text-sm text-indigo-900 flex align-items-center gap-2">
                  <RefreshCw size={16} className="pi-spin text-indigo-600" />
                  Dispatching Batch via Brevo Queue...
                </span>
                <span className="font-bold text-sm text-indigo-700">{progressPercent}%</span>
              </div>
              <ProgressBar value={progressPercent} showValue={false} style={{ height: '12px' }} />
              <div className="text-xs text-500 mt-2">
                Processed {batchStatus?.processed_records || 0} of {batchStatus?.total_records || validCount} recipients
              </div>
            </div>
          )}

          {/* Validation DataTable */}
          <DataTable
            value={validatedData}
            paginator
            rows={10}
            responsiveLayout="scroll"
            size="small"
            emptyMessage="No CSV data loaded."
          >
            <Column field="_index" header="#" style={{ width: '50px' }} />
            <Column field="recipient_name" header="Recipient Name" className="font-semibold" />
            <Column field="recipient_email" header="Email Address" />
            <Column
              header="Dynamic Fields"
              body={(r) => (
                <span className="text-xs text-600">
                  {Object.entries(r.field_data || {})
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' | ') || '—'}
                </span>
              )}
            />
            <Column
              header="Status"
              body={(r) =>
                r.valid ? (
                  <Tag severity="success" value="Ready" icon="pi pi-check" />
                ) : (
                  <Tag severity="danger" value={r._errors.join(', ')} icon="pi pi-exclamation-triangle" />
                )
              }
            />
          </DataTable>
        </div>
      )}
    </div>
  );
}
