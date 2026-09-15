import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { InputSwitch } from 'primereact/inputswitch';
import { confirmDialog } from 'primereact/confirmdialog';
import toast from 'react-hot-toast';
import {
  KeyRound,
  Network,
  Code2,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Send,
  RefreshCw,
  Terminal,
  BookOpen,
  Check,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

export default function ApiIntegrationManager() {
  const [activeTab, setActiveTab] = useState(0); // 0: Mappings, 1: API Keys, 2: SDK & Sandbox

  // Association Mappings State
  const [mappings, setMappings] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingMappings, setLoadingMappings] = useState(true);
  const [mappingDialogVisible, setMappingDialogVisible] = useState(false);
  const [newMapping, setNewMapping] = useState({
    association_name: '',
    template_id: '',
    default_course_title: '',
    default_issuer_name: 'Shazu Soft Technologies'
  });
  const [savingMapping, setSavingMapping] = useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [keyDialogVisible, setKeyDialogVisible] = useState(false);
  const [newKeyName, setNewKeyName] = useState('Company External Site');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [createdKeyData, setCreatedKeyData] = useState(null);

  // Interactive Tester State
  const [testMode, setTestMode] = useState('association'); // 'association' | 'template_id' | 'template_name'
  const [testPayload, setTestPayload] = useState({
    recipient_name: 'Jane Doe',
    recipient_email: 'recipient@example.com',
    association_name: '',
    template_id: '',
    template_name: '',
    course_title: 'Full-Stack Developer Certification',
    send_email: true
  });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchMappings();
    fetchTemplates();
    fetchApiKeys();
  }, []);

  const fetchMappings = async () => {
    setLoadingMappings(true);
    try {
      const res = await api.get('/association-mappings');
      setMappings(res.data.mappings || []);
    } catch (err) {
      toast.error('Failed to load association mappings');
    } finally {
      setLoadingMappings(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.templates || []);
      if (res.data.templates?.length > 0) {
        setNewMapping((prev) => ({
          ...prev,
          template_id: prev.template_id || res.data.templates[0].id
        }));
        setTestPayload((prev) => ({
          ...prev,
          template_id: prev.template_id || res.data.templates[0].id,
          template_name: prev.template_name || res.data.templates[0].name
        }));
      }
    } catch (err) {
      console.warn('Failed to load templates for mapping dropdown');
    }
  };

  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await api.get('/api-keys');
      setApiKeys(res.data.keys || []);
    } catch (err) {
      toast.error('Failed to load API keys');
    } finally {
      setLoadingKeys(false);
    }
  };

  // Mappings Actions
  const handleSaveMapping = async (e) => {
    e.preventDefault();
    if (!newMapping.association_name.trim()) {
      toast.error('Association name is required');
      return;
    }
    if (!newMapping.template_id) {
      toast.error('Please select a template');
      return;
    }

    setSavingMapping(true);
    try {
      await api.post('/association-mappings', newMapping);
      toast.success(`Association "${newMapping.association_name}" mapped successfully!`);
      setMappingDialogVisible(false);
      setNewMapping({
        association_name: '',
        template_id: templates[0]?.id || '',
        default_course_title: '',
        default_issuer_name: 'Shazu Soft Technologies'
      });
      fetchMappings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create association mapping');
    } finally {
      setSavingMapping(false);
    }
  };

  const handleDeleteMapping = (mapping) => {
    confirmDialog({
      message: `Are you sure you want to remove the mapping for "${mapping.association_name}"?`,
      header: 'Delete Mapping Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger font-bold',
      acceptLabel: 'Delete Mapping',
      rejectLabel: 'Cancel',
      accept: async () => {
        try {
          await api.delete(`/association-mappings/${mapping.id}`);
          toast.success('Mapping deleted successfully');
          fetchMappings();
        } catch (err) {
          toast.error('Failed to delete mapping');
        }
      }
    });
  };

  // API Key Actions
  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Key name is required');
      return;
    }
    setGeneratingKey(true);
    try {
      const res = await api.post('/api-keys', { name: newKeyName.trim() });
      setCreatedKeyData(res.data);
      fetchApiKeys();
      toast.success('API Key generated!');
    } catch (err) {
      toast.error('Failed to generate API Key');
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleToggleKey = async (key) => {
    try {
      const res = await api.put(`/api-keys/${key.id}/toggle`);
      toast.success(res.data.message);
      fetchApiKeys();
    } catch (err) {
      toast.error('Failed to toggle API key');
    }
  };

  const handleDeleteKey = (key) => {
    confirmDialog({
      message: `Permanently delete API Key "${key.name}" (${key.key_prefix}...)? External integrations using this key will be blocked immediately.`,
      header: 'Revoke & Delete API Key',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger font-bold',
      acceptLabel: 'Revoke & Delete',
      rejectLabel: 'Keep Key',
      accept: async () => {
        try {
          await api.delete(`/api-keys/${key.id}`);
          toast.success('API Key deleted permanently');
          fetchApiKeys();
        } catch (err) {
          toast.error('Failed to delete API key');
        }
      }
    });
  };

  const copyToClipboard = (text, message = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    toast.success(message);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Interactive Test Execution
  const handleRunTest = async () => {
    if (!testPayload.recipient_name.trim() || !testPayload.recipient_email.trim()) {
      toast.error('Recipient name and valid email are required for test');
      return;
    }

    const payload = {
      recipient_name: testPayload.recipient_name.trim(),
      recipient_email: testPayload.recipient_email.trim(),
      course_title: testPayload.course_title.trim(),
      send_email: testPayload.send_email
    };

    if (testMode === 'association') {
      const assoc = testPayload.association_name || mappings[0]?.association_name;
      if (!assoc) {
        toast.error('Please configure or select an association name');
        return;
      }
      payload.association_name = assoc;
    } else if (testMode === 'template_id') {
      payload.template_id = testPayload.template_id;
    } else if (testMode === 'template_name') {
      payload.template_name = testPayload.template_name;
    }

    setTesting(true);
    setTestResult(null);

    // Pick active API key if available
    const activeKey = apiKeys.find((k) => k.is_active);
    const headers = activeKey
      ? { 'X-API-Key': createdKeyData?.apiKey || activeKey.key_prefix + '...' }
      : {};

    try {
      const res = await api.post('/v1/external/certificates/issue', payload, { headers });
      setTestResult(res.data);
      toast.success('Test certificate generated successfully!');
    } catch (err) {
      setTestResult(err.response?.data || { error: err.message });
      toast.error('API test returned an error response');
    } finally {
      setTesting(false);
    }
  };

  // Generate Sample Snippet
  const getSampleSnippet = (lang) => {
    const activeKey =
      createdKeyData?.apiKey ||
      (apiKeys[0] ? `${apiKeys[0].key_prefix}xxxxxxxx` : 'cv_live_your_api_key_here');
    const apiUrl =
      (window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin) +
      '/api/v1/external/certificates/issue';

    const assoc = mappings[0]?.association_name || 'IEEE Student Chapter';

    if (lang === 'curl') {
      return `curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${activeKey}" \\
  -d '{
    "recipient_name": "Aravind Kumar",
    "recipient_email": "aravind@example.com",
    "association_name": "${assoc}",
    "course_title": "AI & Cloud Symposium 2026",
    "send_email": true
  }'`;
    }

    if (lang === 'javascript') {
      return `// Node.js (Fetch API)
const response = await fetch("${apiUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${activeKey}"
  },
  body: JSON.stringify({
    recipient_name: "Aravind Kumar",
    recipient_email: "aravind@example.com",
    association_name: "${assoc}",
    course_title: "AI & Cloud Symposium 2026",
    send_email: true
  })
});

const result = await response.json();
console.log("Certificate URL:", result.data.verification_url);
console.log("Download PDF:", result.data.download_url);`;
    }

    if (lang === 'python') {
      return `import requests

url = "${apiUrl}"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${activeKey}"
}
payload = {
    "recipient_name": "Aravind Kumar",
    "recipient_email": "aravind@example.com",
    "association_name": "${assoc}",
    "course_title": "AI & Cloud Symposium 2026",
    "send_email": True
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Verification URL:", data.get("data", {}).get("verification_url"))
print("PDF Download:", data.get("data", {}).get("download_url"))`;
    }

    return '';
  };

  return (
    <div className="p-3 sm:p-5" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner Header */}
      <div
        className="surface-card p-4 sm:p-5 border-round-2xl border-1 surface-border shadow-1 mb-4 flex flex-column md:flex-row md:align-items-center justify-content-between gap-4"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F3EC 100%)',
          borderLeft: '5px solid #123B32'
        }}
      >
        <div className="flex align-items-center gap-3">
          <div
            className="flex align-items-center justify-content-center border-round-xl flex-shrink-0 shadow-1"
            style={{ width: '48px', height: '48px', background: '#123B32', color: '#FFFFFF' }}
          >
            <Zap size={26} />
          </div>
          <div>
            <div className="flex align-items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold m-0" style={{ color: '#123B32' }}>
                API & External Integrations
              </h1>
              <Tag value="v1 REST API" severity="success" className="text-xs font-bold" />
            </div>
            <p className="text-xs sm:text-sm m-0 mt-1" style={{ color: '#527A68' }}>
              Connect external websites, map associations dynamically to templates, and automate certificate issuance via REST API.
            </p>
          </div>
        </div>

        <div className="flex align-items-center gap-2 flex-wrap">
          <Button
            label="Map Association"
            icon={<Plus size={16} className="mr-1.5" />}
            onClick={() => setMappingDialogVisible(true)}
            style={{ background: '#123B32', borderColor: '#123B32' }}
            className="font-bold text-xs sm:text-sm shadow-1 py-2 px-3"
          />
          <Button
            label="Generate API Key"
            icon={<KeyRound size={16} className="mr-1.5" />}
            onClick={() => {
              setCreatedKeyData(null);
              setKeyDialogVisible(true);
            }}
            className="p-button-outlined font-bold text-xs sm:text-sm py-2 px-3"
            style={{ borderColor: '#123B32', color: '#123B32' }}
          />
        </div>
      </div>

      {/* CUSTOM SEGMENTED TAB NAVIGATOR (Replaces broken PrimeReact TabView) */}
      <div
        className="p-1.5 border-round-xl border-1 surface-border surface-card shadow-1 mb-4 flex flex-wrap align-items-center gap-2"
        style={{ background: '#FFFFFF' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className="flex align-items-center gap-2 px-3.5 py-2.5 border-round-lg font-bold text-xs sm:text-sm transition-all border-none cursor-pointer"
          style={{
            background: activeTab === 0 ? '#123B32' : 'transparent',
            color: activeTab === 0 ? '#FFFFFF' : '#527A68',
            boxShadow: activeTab === 0 ? '0 2px 8px rgba(18, 59, 50, 0.2)' : 'none'
          }}
        >
          <Network size={16} />
          <span>Association Mappings</span>
          <span
            className="text-xs px-2 py-0.5 border-round-full font-bold"
            style={{
              background: activeTab === 0 ? '#2F5B4E' : '#E8EFEB',
              color: activeTab === 0 ? '#FFFFFF' : '#123B32'
            }}
          >
            {mappings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className="flex align-items-center gap-2 px-3.5 py-2.5 border-round-lg font-bold text-xs sm:text-sm transition-all border-none cursor-pointer"
          style={{
            background: activeTab === 1 ? '#123B32' : 'transparent',
            color: activeTab === 1 ? '#FFFFFF' : '#527A68',
            boxShadow: activeTab === 1 ? '0 2px 8px rgba(18, 59, 50, 0.2)' : 'none'
          }}
        >
          <KeyRound size={16} />
          <span>API Keys</span>
          <span
            className="text-xs px-2 py-0.5 border-round-full font-bold"
            style={{
              background: activeTab === 1 ? '#2F5B4E' : '#E8EFEB',
              color: activeTab === 1 ? '#FFFFFF' : '#123B32'
            }}
          >
            {apiKeys.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(2)}
          className="flex align-items-center gap-2 px-3.5 py-2.5 border-round-lg font-bold text-xs sm:text-sm transition-all border-none cursor-pointer"
          style={{
            background: activeTab === 2 ? '#123B32' : 'transparent',
            color: activeTab === 2 ? '#FFFFFF' : '#527A68',
            boxShadow: activeTab === 2 ? '0 2px 8px rgba(18, 59, 50, 0.2)' : 'none'
          }}
        >
          <Code2 size={16} />
          <span>Integration Code & Live Sandbox</span>
          <span
            className="text-xs px-2 py-0.5 border-round-full font-bold"
            style={{
              background: activeTab === 2 ? '#2F5B4E' : '#E8EFEB',
              color: activeTab === 2 ? '#FFFFFF' : '#123B32'
            }}
          >
            Interactive
          </span>
        </button>
      </div>

      {/* TAB CONTENT 0: ASSOCIATION MAPPINGS */}
      {activeTab === 0 && (
        <div className="surface-card p-4 sm:p-5 border-round-2xl border-1 surface-border shadow-1">
          <div className="flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom-1 surface-border">
            <div>
              <h2 className="text-lg font-bold m-0" style={{ color: '#123B32' }}>
                Association-to-Template Dynamic Routing
              </h2>
              <p className="text-xs text-500 m-0 mt-0.5">
                When external systems pass an association name, the engine automatically selects the template mapped below.
              </p>
            </div>
            <div className="flex align-items-center gap-2">
              <Button
                label="Refresh"
                icon={<RefreshCw size={14} className="mr-1.5" />}
                onClick={fetchMappings}
                className="p-button-outlined p-button-sm text-xs font-bold"
                style={{ borderColor: '#D3DDD7', color: '#123B32' }}
              />
              <Button
                label="New Mapping"
                icon={<Plus size={14} className="mr-1.5" />}
                onClick={() => setMappingDialogVisible(true)}
                className="p-button-sm font-bold text-xs"
                style={{ background: '#123B32', borderColor: '#123B32' }}
              />
            </div>
          </div>

          {loadingMappings ? (
            <div className="text-center py-6 text-500 font-medium">Loading mappings...</div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-8 border-1 surface-border border-round-xl surface-50">
              <Network size={44} className="text-400 mb-3" />
              <h4 className="text-base font-bold m-0 text-700">No Association Mappings Configured</h4>
              <p className="text-xs text-500 mt-1 mb-4">
                Map your first association name (e.g., "IEEE", "CSI", "Robotics Club") to a certificate template.
              </p>
              <Button
                label="Map First Association"
                icon={<Plus size={16} className="mr-2" />}
                onClick={() => setMappingDialogVisible(true)}
                className="p-button-sm font-bold"
                style={{ background: '#123B32', borderColor: '#123B32' }}
              />
            </div>
          ) : (
            <div className="grid">
              {mappings.map((m) => (
                <div key={m.id} className="col-12 md:col-6 xl:col-4 p-2">
                  <div
                    className="surface-card p-4 border-round-xl border-1 surface-border h-full flex flex-column justify-content-between transition-all hover:shadow-2"
                    style={{ borderLeft: '4px solid #123B32' }}
                  >
                    <div>
                      <div className="flex align-items-start justify-content-between gap-2 mb-3">
                        <div>
                          <Tag
                            value={m.is_active ? 'Active' : 'Inactive'}
                            severity={m.is_active ? 'success' : 'warning'}
                            className="text-xs font-bold mb-2"
                          />
                          <h4 className="text-base font-bold m-0" style={{ color: '#123B32' }}>
                            {m.association_name}
                          </h4>
                        </div>
                        <Button
                          icon={<Trash2 size={15} />}
                          className="p-button-rounded p-button-text p-button-danger p-button-sm"
                          onClick={() => handleDeleteMapping(m)}
                          tooltip="Delete Mapping"
                        />
                      </div>

                      <div className="p-3 surface-50 border-round-lg mb-3">
                        <span className="text-xs text-500 block font-semibold mb-1">MAPPED TEMPLATE:</span>
                        <div className="flex align-items-center gap-2">
                          <Layers size={15} style={{ color: '#123B32' }} />
                          <span className="text-sm font-bold" style={{ color: '#123B32' }}>
                            {m.template_name}
                          </span>
                        </div>
                        {m.default_course_title && (
                          <div className="mt-2 pt-2 border-top-1 surface-border">
                            <span className="text-xs text-500 block font-semibold">DEFAULT PROGRAM:</span>
                            <span className="text-xs font-medium text-700">{m.default_course_title}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex align-items-center justify-content-between pt-2 border-top-1 surface-border text-xs text-500">
                      <span>Created {new Date(m.created_at).toLocaleDateString()}</span>
                      <span className="font-mono text-xs">TPL: {m.template_id?.substring(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 1: API KEYS */}
      {activeTab === 1 && (
        <div className="surface-card p-4 sm:p-5 border-round-2xl border-1 surface-border shadow-1">
          <div className="flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom-1 surface-border">
            <div>
              <h2 className="text-lg font-bold m-0" style={{ color: '#123B32' }}>
                Machine-to-Machine API Keys
              </h2>
              <p className="text-xs text-500 m-0 mt-0.5">
                Pass these secret keys in the <code className="font-bold">X-API-Key</code> header of your external company site requests.
              </p>
            </div>
            <Button
              label="Generate New API Key"
              icon={<Plus size={14} className="mr-1.5" />}
              onClick={() => {
                setCreatedKeyData(null);
                setKeyDialogVisible(true);
              }}
              className="p-button-sm font-bold text-xs"
              style={{ background: '#123B32', borderColor: '#123B32' }}
            />
          </div>

          {loadingKeys ? (
            <div className="text-center py-6 text-500 font-medium">Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 border-1 surface-border border-round-xl surface-50">
              <KeyRound size={44} className="text-400 mb-3" />
              <h4 className="text-base font-bold m-0 text-700">No API Keys Generated</h4>
              <p className="text-xs text-500 mt-1 mb-4">
                Generate an API key to allow external company applications to authenticate requests.
              </p>
              <Button
                label="Generate First API Key"
                icon={<Plus size={16} className="mr-2" />}
                onClick={() => {
                  setCreatedKeyData(null);
                  setKeyDialogVisible(true);
                }}
                className="p-button-sm font-bold"
                style={{ background: '#123B32', borderColor: '#123B32' }}
              />
            </div>
          ) : (
            <div className="border-1 surface-border border-round-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="surface-100 text-xs font-bold text-700" style={{ borderBottom: '1px solid #D3DDD7' }}>
                      <th className="p-3">KEY NAME</th>
                      <th className="p-3">KEY PREFIX</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">LAST USED</th>
                      <th className="p-3">CREATED</th>
                      <th className="p-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="border-bottom-1 surface-border text-sm hover:surface-50">
                        <td className="p-3 font-bold" style={{ color: '#123B32' }}>
                          {k.name}
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-xs px-2 py-1 surface-200 border-round font-bold">
                            {k.key_prefix}••••••••••••••••
                          </span>
                        </td>
                        <td className="p-3">
                          <Tag
                            value={k.is_active ? 'Active' : 'Revoked'}
                            severity={k.is_active ? 'success' : 'danger'}
                            className="text-xs font-bold"
                          />
                        </td>
                        <td className="p-3 text-xs text-600">
                          {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
                        </td>
                        <td className="p-3 text-xs text-500">
                          {new Date(k.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex align-items-center justify-content-end gap-2">
                            <Button
                              label={k.is_active ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleKey(k)}
                              className={`p-button-xs font-bold ${
                                k.is_active
                                  ? 'p-button-outlined p-button-warning'
                                  : 'p-button-outlined p-button-success'
                              }`}
                            />
                            <Button
                              icon={<Trash2 size={14} />}
                              onClick={() => handleDeleteKey(k)}
                              className="p-button-rounded p-button-text p-button-danger p-button-sm"
                              tooltip="Revoke & Delete"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: DEVELOPER SDK & LIVE SANDBOX */}
      {activeTab === 2 && (
        <div className="grid">
          {/* Left Column: Interactive Live Sandbox */}
          <div className="col-12 lg:col-6 p-2">
            <div className="surface-card p-4 sm:p-5 border-round-2xl border-1 surface-border shadow-1 h-full flex flex-column justify-content-between">
              <div>
                <div className="flex align-items-center gap-2 mb-2">
                  <Terminal size={20} style={{ color: '#123B32' }} />
                  <h2 className="text-lg font-bold m-0" style={{ color: '#123B32' }}>
                    Live API Request Sandbox
                  </h2>
                </div>
                <p className="text-xs text-500 mb-4">
                  Simulate calling the certificate issuance API in real time.
                </p>

                {/* Template Selection Mode Switcher */}
                <div className="mb-4">
                  <label className="text-xs font-bold block mb-2 text-700">
                    Template Selection Mode:
                  </label>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => setTestMode('association')}
                      className="col p-2 text-xs font-bold border-round-lg cursor-pointer transition-all border-none"
                      style={{
                        background: testMode === 'association' ? '#123B32' : '#E8EFEB',
                        color: testMode === 'association' ? '#FFFFFF' : '#123B32'
                      }}
                    >
                      By Association
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestMode('template_id')}
                      className="col p-2 text-xs font-bold border-round-lg cursor-pointer transition-all border-none"
                      style={{
                        background: testMode === 'template_id' ? '#123B32' : '#E8EFEB',
                        color: testMode === 'template_id' ? '#FFFFFF' : '#123B32'
                      }}
                    >
                      By Template ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestMode('template_name')}
                      className="col p-2 text-xs font-bold border-round-lg cursor-pointer transition-all border-none"
                      style={{
                        background: testMode === 'template_name' ? '#123B32' : '#E8EFEB',
                        color: testMode === 'template_name' ? '#FFFFFF' : '#123B32'
                      }}
                    >
                      By Template Name
                    </button>
                  </div>
                </div>

                {/* Dynamic Selector Input */}
                {testMode === 'association' && (
                  <div className="mb-3">
                    <label className="text-xs font-bold block mb-1 text-700">Association Name:</label>
                    {mappings.length > 0 ? (
                      <Dropdown
                        value={testPayload.association_name || mappings[0]?.association_name}
                        options={mappings.map((m) => ({
                          label: `${m.association_name} (➔ ${m.template_name})`,
                          value: m.association_name
                        }))}
                        onChange={(e) => setTestPayload({ ...testPayload, association_name: e.value })}
                        placeholder="Select mapped association"
                        className="w-full p-inputtext-sm font-semibold"
                      />
                    ) : (
                      <InputText
                        value={testPayload.association_name}
                        onChange={(e) => setTestPayload({ ...testPayload, association_name: e.target.value })}
                        placeholder="e.g. IEEE Student Chapter"
                        className="w-full p-inputtext-sm"
                      />
                    )}
                  </div>
                )}

                {testMode === 'template_id' && (
                  <div className="mb-3">
                    <label className="text-xs font-bold block mb-1 text-700">Target Template:</label>
                    <Dropdown
                      value={testPayload.template_id}
                      options={templates.map((t) => ({
                        label: `${t.name} (${t.id.substring(0, 8)}...)`,
                        value: t.id
                      }))}
                      onChange={(e) => setTestPayload({ ...testPayload, template_id: e.value })}
                      placeholder="Select certificate template"
                      className="w-full p-inputtext-sm font-semibold"
                    />
                  </div>
                )}

                {testMode === 'template_name' && (
                  <div className="mb-3">
                    <label className="text-xs font-bold block mb-1 text-700">Template Name:</label>
                    <Dropdown
                      value={testPayload.template_name}
                      options={templates.map((t) => ({ label: t.name, value: t.name }))}
                      onChange={(e) => setTestPayload({ ...testPayload, template_name: e.value })}
                      placeholder="Select template name"
                      className="w-full p-inputtext-sm font-semibold"
                    />
                  </div>
                )}

                <div className="grid">
                  <div className="col-12 sm:col-6 py-1">
                    <label className="text-xs font-bold block mb-1 text-700">Recipient Name:</label>
                    <InputText
                      value={testPayload.recipient_name}
                      onChange={(e) => setTestPayload({ ...testPayload, recipient_name: e.target.value })}
                      placeholder="e.g. Jane Doe"
                      className="w-full p-inputtext-sm font-semibold"
                    />
                  </div>
                  <div className="col-12 sm:col-6 py-1">
                    <label className="text-xs font-bold block mb-1 text-700">Recipient Email:</label>
                    <InputText
                      value={testPayload.recipient_email}
                      onChange={(e) => setTestPayload({ ...testPayload, recipient_email: e.target.value })}
                      placeholder="e.g. recipient@example.com"
                      className="w-full p-inputtext-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="mt-2 mb-3">
                  <label className="text-xs font-bold block mb-1 text-700">Course / Event Title:</label>
                  <InputText
                    value={testPayload.course_title}
                    onChange={(e) => setTestPayload({ ...testPayload, course_title: e.target.value })}
                    placeholder="e.g. Full-Stack Developer Certification"
                    className="w-full p-inputtext-sm"
                  />
                </div>

                <div className="flex align-items-center gap-3 p-3 surface-50 border-round-xl border-1 surface-border mb-4">
                  <InputSwitch
                    checked={testPayload.send_email}
                    onChange={(e) => setTestPayload({ ...testPayload, send_email: e.value })}
                  />
                  <div className="text-xs">
                    <span className="font-bold block" style={{ color: '#123B32' }}>
                      Deliver via Official Email
                    </span>
                    <span className="text-500">
                      Dispatches email with high-res PDF download & verification link
                    </span>
                  </div>
                </div>
              </div>

              <Button
                label={testing ? 'Processing Request...' : 'Dispatch Live Test Request'}
                icon={<Send size={16} className="mr-2" />}
                loading={testing}
                onClick={handleRunTest}
                className="w-full font-bold shadow-1 py-3"
                style={{ background: '#123B32', borderColor: '#123B32' }}
              />
            </div>
          </div>

          {/* Right Column: Code Snippets & Response Viewer */}
          <div className="col-12 lg:col-6 p-2">
            <div className="surface-card p-4 sm:p-5 border-round-2xl border-1 surface-border shadow-1 h-full flex flex-column">
              <div className="flex flex-column sm:flex-row sm:align-items-center justify-content-between gap-2 mb-3">
                <div className="flex align-items-center gap-2">
                  <BookOpen size={20} style={{ color: '#123B32' }} />
                  <h2 className="text-lg font-bold m-0" style={{ color: '#123B32' }}>
                    Ready-to-Copy SDK Code
                  </h2>
                </div>
                <div className="flex gap-1.5 surface-100 p-1 border-round-lg border-1 surface-border">
                  {['curl', 'javascript', 'python'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setCodeLanguage(lang)}
                      className="px-2.5 py-1 text-xs font-bold border-round cursor-pointer transition-all border-none"
                      style={{
                        background: codeLanguage === lang ? '#123B32' : 'transparent',
                        color: codeLanguage === lang ? '#FFFFFF' : '#527A68'
                      }}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Snippet Box (Custom Dark Slate Terminal) */}
              <div
                className="relative border-round-xl p-4 mb-4 flex-grow-1"
                style={{
                  background: '#0B132B',
                  border: '1.5px solid #1C2541',
                  minHeight: '260px',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div className="flex align-items-center justify-content-between pb-2 mb-2 border-bottom-1" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 border-round-full inline-block" style={{ background: '#EF4444' }} />
                    <span className="w-2.5 h-2.5 border-round-full inline-block" style={{ background: '#F59E0B' }} />
                    <span className="w-2.5 h-2.5 border-round-full inline-block" style={{ background: '#10B981' }} />
                    <span className="text-xs font-mono ml-2 font-semibold" style={{ color: '#64748B' }}>
                      {codeLanguage.toUpperCase()} Request
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(getSampleSnippet(codeLanguage), 'Code snippet copied!')}
                    className="flex align-items-center gap-1.5 px-2 py-1 border-round font-semibold text-xs border-none cursor-pointer transition-all"
                    style={{
                      background: copiedCode ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF'
                    }}
                  >
                    {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <pre
                  className="m-0 font-mono text-xs overflow-x-auto leading-relaxed"
                  style={{
                    color: '#E2E8F0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '280px'
                  }}
                >
                  {getSampleSnippet(codeLanguage)}
                </pre>
              </div>

              {/* Test Execution Output Box */}
              {testResult && (
                <div
                  className="p-3 border-round-xl border-1"
                  style={{
                    background: testResult.success ? '#F0FDF4' : '#FEF2F2',
                    borderColor: testResult.success ? '#BBF7D0' : '#FECACA'
                  }}
                >
                  <div className="flex align-items-center justify-content-between mb-2">
                    <div className="flex align-items-center gap-1.5">
                      <span className="text-xs font-bold" style={{ color: testResult.success ? '#166534' : '#991B1B' }}>
                        {testResult.success ? '✅ HTTP 201 CREATED' : '❌ API ERROR RESPONSE'}
                      </span>
                    </div>

                    {testResult.data?.verification_url && (
                      <a
                        href={testResult.data.verification_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold flex align-items-center gap-1 no-underline"
                        style={{ color: '#123B32' }}
                      >
                        <span>Open Verification Page</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {testResult.data && (
                    <div className="grid text-xs mb-2 p-2 border-round surface-card border-1 surface-border">
                      <div className="col-6 py-1">
                        <span className="text-500">Certificate ID:</span>{' '}
                        <strong className="font-mono">{testResult.data.unique_code}</strong>
                      </div>
                      <div className="col-6 py-1">
                        <span className="text-500">Email Delivery:</span>{' '}
                        <strong className="capitalize">{testResult.data.email_delivery?.status}</strong>
                      </div>
                      <div className="col-12 py-1">
                        <a
                          href={testResult.data.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold flex align-items-center gap-1 no-underline"
                          style={{ color: '#123B32' }}
                        >
                          <span>Direct PDF Download</span>
                          <ArrowRight size={13} />
                        </a>
                      </div>
                    </div>
                  )}

                  <pre
                    className="m-0 text-xs font-mono p-2 border-round overflow-x-auto surface-card border-1 surface-border"
                    style={{ maxHeight: '140px', color: '#1E293B' }}
                  >
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE ASSOCIATION MAPPING */}
      <Dialog
        visible={mappingDialogVisible}
        onHide={() => setMappingDialogVisible(false)}
        header="Map Association to Certificate Template"
        style={{ width: '90vw', maxWidth: '520px' }}
        className="p-fluid"
      >
        <form onSubmit={handleSaveMapping} className="p-3">
          <div className="mb-3">
            <label className="text-xs font-bold block mb-1 text-700">Association / Event Name *</label>
            <InputText
              value={newMapping.association_name}
              onChange={(e) => setNewMapping({ ...newMapping, association_name: e.target.value })}
              placeholder="e.g. IEEE Student Chapter, CSI, Python Bootcamp"
              required
              className="p-inputtext-sm font-semibold"
            />
            <small className="text-500 block mt-1">
              Exact string your external website will send in the payload.
            </small>
          </div>

          <div className="mb-3">
            <label className="text-xs font-bold block mb-1 text-700">Select Certificate Template *</label>
            <Dropdown
              value={newMapping.template_id}
              options={templates.map((t) => ({ label: t.name, value: t.id }))}
              onChange={(e) => setNewMapping({ ...newMapping, template_id: e.value })}
              placeholder="Choose a template"
              required
              className="p-inputtext-sm font-semibold"
            />
          </div>

          <div className="mb-3">
            <label className="text-xs font-bold block mb-1 text-700">
              Default Course / Program Title (Optional)
            </label>
            <InputText
              value={newMapping.default_course_title}
              onChange={(e) => setNewMapping({ ...newMapping, default_course_title: e.target.value })}
              placeholder="e.g. Annual Technical Excellence Award"
              className="p-inputtext-sm"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold block mb-1 text-700">Default Issuer Name</label>
            <InputText
              value={newMapping.default_issuer_name}
              onChange={(e) => setNewMapping({ ...newMapping, default_issuer_name: e.target.value })}
              placeholder="Shazu Soft Technologies"
              className="p-inputtext-sm"
            />
          </div>

          <div className="flex align-items-center justify-content-end gap-2 pt-3 border-top-1 surface-border">
            <Button
              label="Cancel"
              type="button"
              onClick={() => setMappingDialogVisible(false)}
              className="p-button-text p-button-sm font-bold text-600"
            />
            <Button
              label={savingMapping ? 'Saving...' : 'Save Mapping'}
              icon={<CheckCircle2 size={16} className="mr-2" />}
              loading={savingMapping}
              type="submit"
              className="p-button-sm font-bold"
              style={{ background: '#123B32', borderColor: '#123B32' }}
            />
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: GENERATE NEW API KEY */}
      <Dialog
        visible={keyDialogVisible}
        onHide={() => setKeyDialogVisible(false)}
        header={createdKeyData ? 'New API Key Created' : 'Generate External API Key'}
        style={{ width: '90vw', maxWidth: '540px' }}
      >
        <div className="p-3">
          {createdKeyData ? (
            <div>
              <div className="p-3 surface-100 border-round-xl border-1 surface-border mb-3">
                <span className="text-xs font-bold text-600 block mb-1">
                  YOUR SECRET API KEY (COPIED ONCE):
                </span>
                <div className="flex align-items-center gap-2">
                  <span className="font-mono text-xs font-bold p-2 surface-card border-round border-1 surface-border flex-1 overflow-x-auto text-900 select-all">
                    {createdKeyData.apiKey}
                  </span>
                  <Button
                    icon={<Copy size={16} />}
                    onClick={() => copyToClipboard(createdKeyData.apiKey, 'API Key copied!')}
                    className="p-button-sm font-bold"
                    style={{ background: '#123B32', borderColor: '#123B32' }}
                    tooltip="Copy Key"
                  />
                </div>
              </div>

              <div
                className="p-3 border-round-lg mb-4 text-xs"
                style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}
              >
                ⚠️ <strong>Important Security Note:</strong> Please store this key in a secure vault or
                your external website's <code>.env</code> file. It is hashed in the database and cannot
                be retrieved again.
              </div>

              <Button
                label="I Have Stored My API Key"
                onClick={() => setKeyDialogVisible(false)}
                className="w-full font-bold"
                style={{ background: '#123B32', borderColor: '#123B32' }}
              />
            </div>
          ) : (
            <div>
              <p className="text-xs text-600 mb-3">
                Create a high-entropy secret key for your external site backend to authenticate
                certificate requests.
              </p>
              <div className="mb-4">
                <label className="text-xs font-bold block mb-1 text-700">Application / Site Name:</label>
                <InputText
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Main Company Website, LMS Portal"
                  className="w-full p-inputtext-sm font-semibold"
                />
              </div>

              <div className="flex align-items-center justify-content-end gap-2 pt-3 border-top-1 surface-border">
                <Button
                  label="Cancel"
                  type="button"
                  onClick={() => setKeyDialogVisible(false)}
                  className="p-button-text p-button-sm font-bold text-600"
                />
                <Button
                  label={generatingKey ? 'Generating...' : 'Generate Key'}
                  icon={<KeyRound size={16} className="mr-2" />}
                  loading={generatingKey}
                  onClick={handleGenerateKey}
                  className="p-button-sm font-bold"
                  style={{ background: '#123B32', borderColor: '#123B32' }}
                />
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
