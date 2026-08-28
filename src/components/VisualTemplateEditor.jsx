import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Rect, Group } from 'react-konva';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { ColorPicker } from 'primereact/colorpicker';
import toast from 'react-hot-toast';
import { Move, Type, QrCode, Plus, Trash2, Save, Eye, RefreshCw, Sparkles, Wand2, Download, Pipette, Palette } from 'lucide-react';
import api, { getApiUrl } from '../services/api';

const FONT_FAMILIES = [
  { label: 'Cinzel Classical (Luxury Roman Serif)', value: 'Cinzel' },
  { label: 'Cinzel Decorative (Ornate Heading)', value: 'Cinzel Decorative' },
  { label: 'Playfair Display (Academic Serif)', value: 'Playfair Display' },
  { label: 'Cormorant Garamond (Fine Traditional Serif)', value: 'Cormorant Garamond' },
  { label: 'UnifrakturCook (Gothic / Blackletter)', value: 'UnifrakturCook' },
  { label: 'Great Vibes (Flowing Calligraphy Script)', value: 'Great Vibes' },
  { label: 'Pinyon Script (Royal English Script)', value: 'Pinyon Script' },
  { label: 'Alex Brush (Signature Script)', value: 'Alex Brush' },
  { label: 'Outfit (Modern Clean Brand)', value: 'Outfit' },
  { label: 'Be Vietnam Pro (Modern Geometric Sans)', value: 'Be Vietnam Pro' },
  { label: 'Inter (Clean Minimal)', value: 'Inter' },
  { label: 'Standard Serif', value: 'serif' },
  { label: 'Standard Sans', value: 'sans-serif' }
];

const ALIGN_OPTIONS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' }
];

const PRESET_COLORS = [
  { name: 'Deep Emerald', hex: '#123B32' },
  { name: 'Shazu Green', hex: '#2E7D32' },
  { name: 'Royal Navy', hex: '#0F2C59' },
  { name: 'Classic Gold', hex: '#C47D4C' },
  { name: 'Bright Gold', hex: '#D4AF37' },
  { name: 'Burgundy', hex: '#8B0000' },
  { name: 'Charcoal', hex: '#1A1A1A' },
  { name: 'Slate Gray', hex: '#475569' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Obsidian', hex: '#000000' }
];

export default function VisualTemplateEditor({ template, initialFields = [], onSaveSuccess }) {
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [stageDimensions, setStageDimensions] = useState({ width: 854, height: 480 }); // 16:9 preview
  const containerRef = useRef(null);

  // Template original dimensions
  const origWidth = template?.width_px || 1920;
  const origHeight = template?.height_px || 1080;

  // Scale ratio between original image and preview canvas
  const scale = stageDimensions.width / origWidth;

  // Initialize fields
  useEffect(() => {
    if (initialFields && initialFields.length > 0) {
      setFields(initialFields.map((f, idx) => ({
        ...f,
        id: f.id || `field_${idx}_${Date.now()}`,
        x: parseFloat(f.x) || 50,
        y: parseFloat(f.y) || 50,
        font_size: parseInt(f.font_size, 10) || 28,
        font_color: f.font_color || '#123B32',
        font_family: f.font_family || 'Cinzel',
        font_weight: f.font_weight || 'normal',
        align: f.align || 'center',
        opacity: f.opacity !== undefined && f.opacity !== null ? parseFloat(f.opacity) : 1.0,
        is_required: f.is_required !== undefined ? f.is_required : true,
        is_qr: f.is_qr || f.field_key === 'qr_code'
      })));
      setSelectedFieldId(initialFields[0]?.id || `field_0_${Date.now()}`);
    } else {
      // Default starter fields with high contrast dark font defaults
      const defaults = [
        { id: 'f1', field_key: 'recipient_name', label: 'Recipient Name', x: 50, y: 36, font_size: 42, font_weight: 'bold', font_color: '#123B32', font_family: 'Cinzel', align: 'center', opacity: 1.0, is_required: true, is_qr: false },
        { id: 'f2', field_key: 'course_title', label: 'Course / Achievement', x: 50, y: 48, font_size: 26, font_weight: 'bold', font_color: '#C47D4C', font_family: 'Cinzel', align: 'center', opacity: 1.0, is_required: true, is_qr: false },
        { id: 'f3', field_key: 'issue_date', label: 'Issue Date', x: 28, y: 80, font_size: 18, font_weight: 'normal', font_color: '#334E43', font_family: 'Inter', align: 'center', opacity: 1.0, is_required: true, is_qr: false },
        { id: 'f4', field_key: 'unique_code', label: 'Certificate ID', x: 50, y: 90, font_size: 14, font_weight: 'normal', font_color: '#527A68', font_family: 'Inter', align: 'center', opacity: 1.0, is_required: true, is_qr: false },
        { id: 'f5', field_key: 'qr_code', label: 'Verification QR', x: 80, y: 80, font_size: 32, font_weight: 'normal', font_color: '#0f172a', font_family: 'Inter', align: 'center', opacity: 1.0, is_required: false, is_qr: true }
      ];
      setFields(defaults);
      setSelectedFieldId('f1');
    }
  }, [initialFields, template]);

  // Load Background Image with multi-layer fallback
  useEffect(() => {
    if (!template?.file_url) {
      setBgImage(null);
      return;
    }

    let isMounted = true;
    
    // Candidates to try loading in order:
    // 1. Direct file_url
    // 2. Direct file_url without crossOrigin
    // 3. Backend template image route (/api/templates/:id/image)
    const urlsToTry = [
      template.file_url,
      template.id ? getApiUrl(`/templates/${template.id}/image`) : null
    ].filter(Boolean);

    const tryLoadImage = (urlIndex, useAnonymous) => {
      if (urlIndex >= urlsToTry.length) {
        console.warn('Failed all attempts to load template background image:', template.file_url);
        if (isMounted) setBgImage(null);
        return;
      }

      const currentUrl = urlsToTry[urlIndex];
      const img = new window.Image();
      
      if (useAnonymous) {
        img.crossOrigin = 'Anonymous';
      }

      img.onload = () => {
        if (isMounted) {
          setBgImage(img);
        }
      };

      img.onerror = () => {
        // If Anonymous failed (common with R2 lacking CORS headers), retry same URL without crossOrigin
        if (useAnonymous) {
          tryLoadImage(urlIndex, false);
        } else {
          // Otherwise proceed to next candidate URL (backend proxy)
          tryLoadImage(urlIndex + 1, true);
        }
      };

      img.src = currentUrl;
    };

    tryLoadImage(0, true);

    return () => {
      isMounted = false;
    };
  }, [template]);

  // Resize canvas responsively
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.clientWidth - 40;
        const targetWidth = Math.min(Math.max(parentWidth, 600), 960);
        const targetHeight = (targetWidth * origHeight) / origWidth;
        setStageDimensions({ width: targetWidth, height: targetHeight });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [origWidth, origHeight]);

  const selectedField = fields.find((f) => f.id === selectedFieldId) || fields[0];

  const updateSelectedField = (key, value) => {
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, [key]: value } : f))
    );
  };

  const handlePickColorFromScreen = async () => {
    if (!window.EyeDropper) {
      toast.error('Eyedropper is supported in Chrome, Edge & Brave browsers.');
      return;
    }
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        updateSelectedField('font_color', result.sRGBHex);
        toast.success(`Picked color: ${result.sRGBHex}`);
      }
    } catch (e) {
      // Eyedropper cancelled by user
    }
  };

  const handleDragEnd = (fieldId, e) => {
    const node = e.target;
    // Calculate new percentage relative to stage width/height
    const rawX = node.x();
    const rawY = node.y();

    const percentX = Math.min(100, Math.max(0, (rawX / stageDimensions.width) * 100));
    const percentY = Math.min(100, Math.max(0, (rawY / stageDimensions.height) * 100));

    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, x: parseFloat(percentX.toFixed(2)), y: parseFloat(percentY.toFixed(2)) } : f))
    );
  };

  const addCustomField = () => {
    const newId = `field_${Date.now()}`;
    const newField = {
      id: newId,
      field_key: `custom_field_${fields.length + 1}`,
      label: `Custom Field ${fields.length + 1}`,
      x: 50,
      y: 60,
      font_size: 24,
      font_family: 'sans-serif',
      font_weight: 'normal',
      font_color: '#ffffff',
      align: 'center',
      opacity: 1.0,
      is_required: false,
      is_qr: false
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newId);
  };

  const deleteField = (id) => {
    if (fields.length <= 1) {
      toast.error('At least one field is required');
      return;
    }
    const remaining = fields.filter((f) => f.id !== id);
    setFields(remaining);
    setSelectedFieldId(remaining[0].id);
  };

  const handleAiAnalyze = async () => {
    if (!template?.id) return;
    setAnalyzingAi(true);
    const toastId = toast.loading('AI Assistant is analyzing certificate font & layout...');
    try {
      const res = await api.post(`/templates/${template.id}/ai-analyze`);
      const { font_family, primary_color, secondary_color, fields: aiFields } = res.data;

      if (aiFields && aiFields.length > 0) {
        const mapped = aiFields.map((af, idx) => ({
          id: `ai_field_${idx}_${Date.now()}`,
          field_key: af.field_name || `field_${idx}`,
          label: af.field_label || af.field_name,
          x: parseFloat(af.x_percent) || 50,
          y: parseFloat(af.y_percent) || 50,
          font_size: parseInt(af.font_size, 10) || 28,
          font_family: af.font_family || font_family || 'Cinzel',
          font_color: af.color || primary_color || '#123B32',
          font_weight: af.field_name === 'recipient_name' ? 'bold' : 'normal',
          align: af.align || 'center',
          opacity: 1.0,
          is_required: af.field_name !== 'qr_code',
          is_qr: af.is_qr || af.field_name === 'qr_code'
        }));
        setFields(mapped);
        setSelectedFieldId(mapped[0]?.id);
      }

      toast.success(`Matched Font: "${font_family || 'Cinzel'}". Layout auto-aligned!`, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not analyze template with AI Assistant', { id: toastId });
    } finally {
      setAnalyzingAi(false);
    }
  };

  const saveMappings = async () => {
    setSaving(true);
    try {
      await api.post(`/templates/${template.id}/fields`, { fields });
      toast.success('Field coordinate mappings updated successfully!');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadSampleDoc = () => {
    if (!template?.id) return;
    window.open(getApiUrl(`/templates/${template.id}/sample-pdf`), '_blank');
    toast.success('Downloading sample verification certificate...');
  };

  return (
    <div className="grid">
      {/* Left / Top: Interactive Canvas */}
      <div className="col-12 lg:col-8" ref={containerRef}>
        <div className="surface-card border-1 border-200 border-round-xl p-3 shadow-1">
          <div className="flex flex-column sm:flex-row align-items-sm-center justify-content-between gap-2 mb-3 px-2">
            <div>
              <h3 className="text-900 font-bold m-0 flex align-items-center gap-2">
                <Move size={20} style={{ color: '#123B32' }} />
                Visual Placement Editor
              </h3>
              <p className="text-xs text-500 m-0">
                Drag labels directly onto the certificate. Position is stored as exact <strong>percentages (x%, y%)</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                label="Download Sample PDF"
                icon={<Download size={15} className="mr-1" />}
                className="p-button-outlined p-button-sm font-bold text-xs"
                style={{ color: '#2F5B4E', borderColor: '#D3DDD7', background: '#FFFFFF' }}
                onClick={downloadSampleDoc}
              />
              <Button
                label="AI Auto-Match Font & Layout"
                icon={<Sparkles size={15} className={`mr-1 ${analyzingAi ? 'pi-spin' : ''}`} style={{ color: '#C47D4C' }} />}
                className="p-button-outlined p-button-sm font-bold text-xs"
                style={{ color: '#123B32', borderColor: '#C47D4C', background: '#FFF7ED' }}
                onClick={handleAiAnalyze}
                loading={analyzingAi}
              />
              <Button
                label="Add Field"
                icon={<Plus size={15} className="mr-1" />}
                className="p-button-outlined p-button-sm p-button-secondary font-bold text-xs"
                onClick={addCustomField}
              />
              <Button
                label="Save Layout"
                icon={<Save size={15} className="mr-1" />}
                className="p-button-primary p-button-sm font-bold text-xs"
                onClick={saveMappings}
                loading={saving}
              />
            </div>
          </div>

          {/* Canvas Box */}
          <div className="canvas-container-box flex justify-content-center align-items-center">
            <Stage
              width={stageDimensions.width}
              height={stageDimensions.height}
              style={{
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                background: bgImage ? 'transparent' : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                cursor: 'default'
              }}
            >
              <Layer>
                {/* Background Image if uploaded */}
                {bgImage ? (
                  <KonvaImage image={bgImage} width={stageDimensions.width} height={stageDimensions.height} />
                ) : (
                  // Default decorative border if no custom image
                  <Group>
                    <Rect
                      x={15}
                      y={15}
                      width={stageDimensions.width - 30}
                      height={stageDimensions.height - 30}
                      stroke="#d97706"
                      strokeWidth={4}
                    />
                    <Rect
                      x={22}
                      y={22}
                      width={stageDimensions.width - 44}
                      height={stageDimensions.height - 44}
                      stroke="#fbbf24"
                      strokeWidth={1}
                    />
                    <Text
                      text="CERTIFICATE OF ACHIEVEMENT"
                      x={stageDimensions.width / 2}
                      y={40}
                      align="center"
                      offsetX={200}
                      width={400}
                      fontSize={18}
                      fontFamily="Cinzel, serif"
                      fontStyle="bold"
                      fill="#f8fafc"
                    />
                    <Text
                      text="This is proudly presented to"
                      x={stageDimensions.width / 2}
                      y={65}
                      align="center"
                      offsetX={150}
                      width={300}
                      fontSize={11}
                      fontStyle="italic"
                      fill="#94a3b8"
                    />
                  </Group>
                )}

                {/* Draggable Dynamic Fields */}
                {fields.map((f) => {
                  const posX = (f.x / 100) * stageDimensions.width;
                  const posY = (f.y / 100) * stageDimensions.height;
                  const isSelected = f.id === selectedFieldId;
                  const previewFontSize = Math.max(10, Math.round(f.font_size * scale));

                  if (f.is_qr) {
                    const baseSize = parseInt(f.font_size, 10) || 32;
                    const realQrSize = Math.max(140, Math.round(baseSize * 4.8));
                    const qrBoxSize = Math.max(45, Math.round(realQrSize * scale));
                    return (
                      <Group
                        key={f.id}
                        x={posX}
                        y={posY}
                        opacity={f.opacity !== undefined && f.opacity !== null ? parseFloat(f.opacity) : 1.0}
                        draggable
                        onDragEnd={(e) => handleDragEnd(f.id, e)}
                        onClick={() => setSelectedFieldId(f.id)}
                      >
                        <Rect
                          x={-qrBoxSize / 2}
                          y={-qrBoxSize / 2}
                          width={qrBoxSize}
                          height={qrBoxSize}
                          fill="rgba(0, 0, 0, 0.03)"
                          stroke={isSelected ? '#123B32' : 'rgba(18, 59, 50, 0.4)'}
                          strokeWidth={isSelected ? 2.5 : 1}
                          dash={isSelected ? [] : [3, 3]}
                          cornerRadius={3}
                          shadowBlur={isSelected ? 8 : 0}
                          shadowColor="#123B32"
                        />
                        <Text
                          text="QR CODE"
                          x={-qrBoxSize / 2}
                          y={-7}
                          width={qrBoxSize}
                          align="center"
                          fontSize={Math.max(9, Math.round(qrBoxSize * 0.18))}
                          fontFamily="Inter, sans-serif"
                          fontStyle="bold"
                          fill={f.font_color || '#123B32'}
                        />
                      </Group>
                    );
                  }

                  // Standard Text Field
                  return (
                    <Group
                      key={f.id}
                      x={posX}
                      y={posY}
                      opacity={f.opacity !== undefined && f.opacity !== null ? parseFloat(f.opacity) : 1.0}
                      draggable
                      onDragEnd={(e) => handleDragEnd(f.id, e)}
                      onClick={() => setSelectedFieldId(f.id)}
                    >
                      {/* Selection highlight halo */}
                      {isSelected && (
                        <Rect
                          x={-120}
                          y={-previewFontSize / 2 - 6}
                          width={240}
                          height={previewFontSize + 12}
                          stroke="#4f46e5"
                          strokeWidth={2}
                          dash={[4, 4]}
                          cornerRadius={4}
                        />
                      )}
                      <Text
                        text={`[${f.label}]`}
                        x={-150}
                        y={-previewFontSize / 2}
                        width={300}
                        align={f.align || 'center'}
                        fontSize={previewFontSize}
                        fontFamily={f.font_family || 'sans-serif'}
                        fontStyle={f.font_weight === 'bold' ? 'bold' : 'normal'}
                        fill={f.font_color || '#ffffff'}
                        shadowColor={isSelected ? '#4f46e5' : '#000000'}
                        shadowBlur={isSelected ? 6 : 0}
                      />
                    </Group>
                  );
                })}
              </Layer>
            </Stage>
          </div>

          <div className="flex justify-content-between align-items-center mt-3 text-xs text-500 px-2">
            <span>Canvas resolution: {origWidth} × {origHeight}px</span>
            <span>Active fields: {fields.length}</span>
          </div>
        </div>
      </div>

      {/* Right: Field Properties Inspector */}
      <div className="col-12 lg:col-4">
        <div className="surface-card border-1 border-200 border-round-xl p-4 shadow-1">
          <div className="flex align-items-center justify-content-between mb-3">
            <h4 className="text-900 font-bold m-0 flex align-items-center gap-2">
              <Type size={18} className="text-indigo-600" />
              Field Properties
            </h4>
            {selectedField && (
              <Button
                icon={<Trash2 size={14} />}
                className="p-button-rounded p-button-text p-button-danger p-button-sm"
                tooltip="Delete Field"
                onClick={() => deleteField(selectedField.id)}
              />
            )}
          </div>

          {/* Field Selector Tabs */}
          <div className="flex flex-wrap gap-1 mb-3">
            {fields.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFieldId(f.id)}
                className={`px-3 py-1 text-xs border-round font-medium border-none cursor-pointer transition-all ${
                  f.id === selectedFieldId
                    ? 'bg-indigo-600 text-white shadow-1'
                    : 'surface-100 text-700 hover:surface-200'
                }`}
              >
                {f.is_qr ? '📷 ' : ''}{f.label}
              </button>
            ))}
          </div>

          {selectedField ? (
            <div className="flex flex-column gap-3">
              {/* Label & Key */}
              <div>
                <label className="text-xs font-semibold text-700 block mb-1">Display Label</label>
                <InputText
                  value={selectedField.label}
                  onChange={(e) => updateSelectedField('label', e.target.value)}
                  className="w-full p-inputtext-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-700 block mb-1">Field Key (Data Binding)</label>
                <InputText
                  value={selectedField.field_key}
                  onChange={(e) => updateSelectedField('field_key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  className="w-full p-inputtext-sm font-monospace text-xs"
                />
              </div>

              <Divider className="my-1" />

              {/* Coordinates (x%, y%) */}
              <div className="grid">
                <div className="col-6">
                  <label className="text-xs font-semibold text-700 block mb-1">X Position (%)</label>
                  <InputNumber
                    value={selectedField.x}
                    onValueChange={(e) => updateSelectedField('x', e.value)}
                    min={0}
                    max={100}
                    suffix="%"
                    className="w-full"
                    inputClassName="p-inputtext-sm w-full"
                  />
                </div>
                <div className="col-6">
                  <label className="text-xs font-semibold text-700 block mb-1">Y Position (%)</label>
                  <InputNumber
                    value={selectedField.y}
                    onValueChange={(e) => updateSelectedField('y', e.value)}
                    min={0}
                    max={100}
                    suffix="%"
                    className="w-full"
                    inputClassName="p-inputtext-sm w-full"
                  />
                </div>
              </div>

              {/* QR Toggle */}
              <div className="flex align-items-center justify-content-between p-2 surface-50 border-round">
                <span className="text-sm font-medium text-800 flex align-items-center gap-2">
                  <QrCode size={16} className="text-indigo-600" />
                  Is Verification QR Code
                </span>
                <InputSwitch
                  checked={selectedField.is_qr || false}
                  onChange={(e) => updateSelectedField('is_qr', e.value)}
                />
              </div>

              {selectedField.is_qr ? (
                <div className="grid">
                  <div className="col-12">
                    <label className="text-xs font-semibold text-700 block mb-1">QR Code Scale / Size</label>
                    <InputNumber
                      value={selectedField.font_size || 32}
                      onValueChange={(e) => updateSelectedField('font_size', e.value)}
                      min={20}
                      max={80}
                      suffix=" scale"
                      className="w-full"
                      inputClassName="p-inputtext-sm w-full"
                    />
                    <small className="text-500 block mt-1 text-xs">
                      Adjust scale from 25 (compact) to 45+ (prominent & crisp).
                    </small>
                  </div>
                </div>
              ) : (
                <>
                  {/* Font Size & Weight */}
                  <div className="grid">
                    <div className="col-6">
                      <label className="text-xs font-semibold text-700 block mb-1">Font Size (px)</label>
                      <InputNumber
                        value={selectedField.font_size}
                        onValueChange={(e) => updateSelectedField('font_size', e.value)}
                        min={8}
                        max={120}
                        suffix="px"
                        className="w-full"
                        inputClassName="p-inputtext-sm w-full"
                      />
                    </div>
                    <div className="col-6">
                      <label className="text-xs font-semibold text-700 block mb-1">Font Weight</label>
                      <Dropdown
                        value={selectedField.font_weight}
                        options={[
                          { label: 'Normal', value: 'normal' },
                          { label: 'Bold', value: 'bold' }
                        ]}
                        onChange={(e) => updateSelectedField('font_weight', e.value)}
                        className="w-full p-inputtext-sm"
                      />
                    </div>
                  </div>

                  {/* Font Family & Alignment */}
                  <div className="grid">
                    <div className="col-7">
                      <label className="text-xs font-semibold text-700 block mb-1">Font Family</label>
                      <Dropdown
                        value={selectedField.font_family}
                        options={FONT_FAMILIES}
                        onChange={(e) => updateSelectedField('font_family', e.value)}
                        className="w-full p-inputtext-sm"
                      />
                    </div>
                    <div className="col-5">
                      <label className="text-xs font-semibold text-700 block mb-1">Alignment</label>
                      <Dropdown
                        value={selectedField.align}
                        options={ALIGN_OPTIONS}
                        onChange={(e) => updateSelectedField('align', e.value)}
                        className="w-full p-inputtext-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Enhanced Color Code Picker & Eyedropper Tool */}
              <div className="p-3 surface-50 border-round border-1 border-200">
                <div className="flex align-items-center justify-content-between mb-2">
                  <label className="text-xs font-bold text-800 flex align-items-center gap-1.5">
                    <Palette size={15} style={{ color: '#123B32' }} />
                    {selectedField.is_qr ? 'QR Code Color' : 'Font / Text Color'}
                  </label>
                  {window.EyeDropper && (
                    <button
                      type="button"
                      onClick={handlePickColorFromScreen}
                      className="p-button p-button-outlined p-button-sm px-2 py-1 flex align-items-center gap-1 text-xs font-semibold cursor-pointer border-round transition-all"
                      style={{ color: '#123B32', borderColor: '#123B32', background: '#FFFFFF' }}
                      title="Click to pick exact color directly from your certificate image"
                    >
                      <Pipette size={14} />
                      Pick from Certificate
                    </button>
                  )}
                </div>

                {/* Main Color Picker Box & Hex Input */}
                <div className="flex align-items-center gap-2 mb-2.5">
                  <input
                    type="color"
                    value={selectedField.font_color || '#123B32'}
                    onChange={(e) => updateSelectedField('font_color', e.target.value)}
                    className="cursor-pointer border-1 border-300 border-round shadow-1"
                    style={{ width: '46px', height: '40px', padding: '2px', background: '#fff' }}
                    title="Choose custom color wheel"
                  />
                  <div className="flex-1">
                    <InputText
                      value={selectedField.font_color || '#123B32'}
                      onChange={(e) => updateSelectedField('font_color', e.target.value)}
                      className="w-full p-inputtext-sm font-monospace text-xs font-bold"
                      placeholder="#123B32"
                    />
                  </div>
                  <div
                    className="w-2.5rem h-2.5rem border-round border-1 border-300 shadow-1 flex align-items-center justify-content-center text-xs font-bold"
                    style={{
                      backgroundColor: selectedField.font_color || '#123B32',
                      color: ['#ffffff', '#fff', 'white'].includes((selectedField.font_color || '').toLowerCase()) ? '#000' : '#fff'
                    }}
                    title="Current active color preview"
                  >
                    {selectedField.is_qr ? 'QR' : 'Aa'}
                  </div>
                </div>

                {/* Certificate Palette Swatches */}
                <div>
                  <label className="text-xs font-semibold text-600 block mb-1">Preset Certificate Colors:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => updateSelectedField('font_color', c.hex)}
                        title={`${c.name} (${c.hex})`}
                        className="w-1.75rem h-1.75rem border-round border-1 cursor-pointer transition-all hover:scale-110 shadow-1"
                        style={{
                          backgroundColor: c.hex,
                          borderColor: (selectedField.font_color || '').toLowerCase() === c.hex.toLowerCase() ? '#4f46e5' : 'rgba(0,0,0,0.2)',
                          transform: (selectedField.font_color || '').toLowerCase() === c.hex.toLowerCase() ? 'scale(1.15)' : 'scale(1)',
                          boxShadow: (selectedField.font_color || '').toLowerCase() === c.hex.toLowerCase() ? '0 0 0 2px #4f46e5' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Opacity Control */}
              <div className="p-2 surface-50 border-round border-1 border-200">
                <div className="flex align-items-center justify-content-between mb-1.5">
                  <label className="text-xs font-semibold text-700 flex align-items-center gap-1">
                    Text / Field Opacity: <strong>{Math.round((selectedField.opacity ?? 1.0) * 100)}%</strong>
                  </label>
                  <div className="flex gap-1">
                    {[100, 80, 60, 40, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => updateSelectedField('opacity', pct / 100)}
                        className={`px-1.5 py-0.5 text-xs border-round border-1 cursor-pointer transition-all ${
                          Math.round((selectedField.opacity ?? 1.0) * 100) === pct
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'surface-0 text-700 border-300 hover:surface-200'
                        }`}
                        style={{ fontSize: '10px' }}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex align-items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={Math.round((selectedField.opacity ?? 1.0) * 100)}
                    onChange={(e) => updateSelectedField('opacity', parseInt(e.target.value, 10) / 100)}
                    className="w-full cursor-pointer"
                    style={{ accentColor: '#123B32', height: '6px' }}
                  />
                  <InputNumber
                    value={Math.round((selectedField.opacity ?? 1.0) * 100)}
                    onValueChange={(e) => updateSelectedField('opacity', (e.value ?? 100) / 100)}
                    min={5}
                    max={100}
                    suffix="%"
                    className="w-5rem"
                    inputClassName="p-inputtext-sm text-center font-bold"
                  />
                </div>
              </div>

              {/* Is Required Toggle */}
              <div className="flex align-items-center justify-content-between p-2 surface-50 border-round">
                <span className="text-sm font-medium text-800">Required in Issuance Form</span>
                <InputSwitch
                  checked={selectedField.is_required !== false}
                  onChange={(e) => updateSelectedField('is_required', e.value)}
                />
              </div>
            </div>
          ) : (
            <p className="text-500 text-sm">Select a field on the canvas to configure properties.</p>
          )}
        </div>
      </div>
    </div>
  );
}
