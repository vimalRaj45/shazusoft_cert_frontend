import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import toast from 'react-hot-toast';
import { FileUpload } from 'primereact/fileupload';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Layers, Upload, Plus, Move, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import api from '../services/api';
import VisualTemplateEditor from '../components/VisualTemplateEditor';

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorVisible, setEditorVisible] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [activeFields, setActiveFields] = useState([]);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.templates || []);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const openVisualEditor = async (template) => {
    try {
      const res = await api.get(`/templates/${template.id}`);
      setActiveTemplate(res.data.template);
      setActiveFields(res.data.fields || []);
      setEditorVisible(true);
    } catch (err) {
      toast.error('Failed to load template details');
    }
  };

  const createDefaultTemplate = async () => {
    setUploading(true);
    const toastId = toast.loading('Creating built-in certificate template...');
    try {
      const res = await api.post('/templates/create-default', {
        name: `Luxury Gold Certificate #${templates.length + 1}`
      });
      toast.success('Built-in certificate template created!', { id: toastId });
      await fetchTemplates();
      openVisualEditor(res.data.template);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a PNG or JPG certificate template image');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', templateName || selectedFile.name.replace(/\.[^/.]+$/, ""));

    setUploading(true);
    const toastId = toast.loading('Uploading template image...');
    try {
      const res = await api.post('/templates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Template uploaded with starter field mappings!', { id: toastId });
      setUploadVisible(false);
      setSelectedFile(null);
      setTemplateName('');
      await fetchTemplates();
      openVisualEditor(res.data.template);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const deleteTemplate = (template) => {
    confirmDialog({
      message: `Are you sure you want to permanently delete the template "${template.name}"? All associated layout field coordinates will be deleted.`,
      header: 'Delete Certificate Template',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger font-bold',
      acceptLabel: 'Yes, Delete Template',
      rejectLabel: 'Cancel',
      accept: async () => {
        try {
          await api.delete(`/templates/${template.id}`);
          toast.success('Template removed successfully');
          fetchTemplates();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Cannot delete template');
        }
      }
    });
  };

  return (
    <div className="p-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex flex-column sm:flex-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 className="text-900 font-bold text-2xl m-0 flex align-items-center gap-2">
            <Layers size={24} className="text-indigo-600" />
            Certificate Templates
          </h2>
          <p className="text-500 text-sm m-0">
            Upload custom certificate backgrounds and map coordinates visually (% based).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            label="Create Built-in Luxury Template"
            icon={<Sparkles size={16} className="mr-1 text-amber-500" />}
            className="p-button-outlined p-button-indigo"
            onClick={createDefaultTemplate}
            loading={uploading}
          />
          <Button
            label="Upload Custom Template"
            icon={<Upload size={16} className="mr-1" />}
            className="p-button-primary"
            onClick={() => setUploadVisible(true)}
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid">
        {templates.map((tpl) => (
          <div key={tpl.id} className="col-12 md:col-6 lg:col-4">
            <div className="surface-card border-1 border-200 border-round-xl p-3 shadow-1 h-full flex flex-column justify-content-between">
              <div>
                {/* Thumbnail Preview */}
                <div
                  className="w-full border-round-lg overflow-hidden relative mb-3 flex align-items-center justify-content-center"
                  style={{
                    height: '180px',
                    background: tpl.file_url ? `url(${tpl.file_url}) center/cover no-repeat` : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {!tpl.file_url && (
                    <div className="text-center p-3">
                      <div className="cert-title-font text-amber-400 font-bold text-sm tracking-wider">CERTIFICATE OF ACHIEVEMENT</div>
                      <div className="text-xs text-white-alpha-70 mt-1">Executive Navy & Gold Gradient</div>
                    </div>
                  )}
                  <div className="absolute top-0 right-0 m-2">
                    <Tag value={`${tpl.field_count || 0} Dynamic Fields`} severity="info" />
                  </div>
                </div>

                <h3 className="text-900 font-bold text-lg m-0 mb-1">{tpl.name}</h3>
                <div className="text-xs text-500 mb-3 flex gap-3">
                  <span>Resolution: {tpl.width_px} × {tpl.height_px}px</span>
                  <span>Issued: {tpl.cert_count || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-top-1 border-100">
                <Button
                  label="Edit Field Mapping"
                  icon={<Move size={15} className="mr-1" />}
                  className="p-button-primary p-button-sm flex-1"
                  onClick={() => openVisualEditor(tpl)}
                />
                <Button
                  icon={<Trash2 size={15} />}
                  className="p-button-outlined p-button-danger p-button-sm"
                  tooltip="Delete Template"
                  onClick={() => deleteTemplate(tpl)}
                />
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && !loading && (
          <div className="col-12">
            <div className="surface-card border-1 border-200 border-round-2xl p-6 text-center shadow-1">
              <Layers size={48} className="text-indigo-400 mb-3" />
              <h3 className="text-900 font-bold text-xl mb-2">No Certificate Templates Yet</h3>
              <p className="text-600 text-sm max-w-28rem mx-auto mb-4">
                Click below to create a built-in luxury certificate template or upload your organization's custom PNG/JPG background.
              </p>
              <div className="flex justify-content-center gap-3">
                <Button
                  label="Generate Starter Template"
                  icon={<Sparkles size={16} className="mr-1" />}
                  className="p-button-primary"
                  onClick={createDefaultTemplate}
                />
                <Button
                  label="Upload Image"
                  icon={<Upload size={16} className="mr-1" />}
                  className="p-button-outlined p-button-indigo"
                  onClick={() => setUploadVisible(true)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Editor Full Dialog */}
      <Dialog
        header={`Visual Coordinate Mapper: ${activeTemplate?.name || ''}`}
        visible={editorVisible}
        style={{ width: '95vw', maxWidth: '1400px' }}
        maximizable
        modal
        onHide={() => setEditorVisible(false)}
      >
        {activeTemplate && (
          <VisualTemplateEditor
            template={activeTemplate}
            initialFields={activeFields}
            onSaveSuccess={() => {
              fetchTemplates();
            }}
          />
        )}
      </Dialog>

      {/* Upload Custom Image Dialog */}
      <Dialog
        header="Upload Certificate Template Image"
        visible={uploadVisible}
        style={{ width: '480px' }}
        modal
        onHide={() => setUploadVisible(false)}
      >
        <form onSubmit={handleUpload} className="flex flex-column gap-3 pt-2">
          <div>
            <label className="block text-900 font-medium text-sm mb-1">Template Name</label>
            <InputText
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. AI Mastery Course Certificate"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-900 font-bold text-xs uppercase mb-1" style={{ color: '#26322E' }}>Certificate Background Image (PNG/JPG)</label>
            <FileUpload
              mode="basic"
              name="template_file"
              accept="image/png, image/jpeg, image/webp"
              maxFileSize={15000000}
              auto={false}
              chooseLabel={selectedFile ? selectedFile.name : "Select Template Image"}
              onSelect={(e) => {
                if (e.files && e.files[0]) {
                  setSelectedFile(e.files[0]);
                  if (!templateName) {
                    setTemplateName(e.files[0].name.replace(/\.[^/.]+$/, ""));
                  }
                }
              }}
              className="w-full"
            />
            <small className="text-500 block mt-1.5" style={{ fontSize: '11px' }}>
              Recommended standard resolution: 1920×1080px (16:9 Landscape)
            </small>
          </div>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button
              type="button"
              label="Cancel"
              className="p-button-text"
              onClick={() => setUploadVisible(false)}
            />
            <Button
              type="submit"
              label="Upload & Open Mapper"
              icon="pi pi-check"
              className="p-button-primary"
              loading={uploading}
            />
          </div>
        </form>
      </Dialog>

      {/* Confirmation Modal Component */}
      <ConfirmDialog />
    </div>
  );
}
