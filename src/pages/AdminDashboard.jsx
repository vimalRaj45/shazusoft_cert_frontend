import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart } from 'primereact/chart';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import {
  Award,
  ShieldCheck,
  Layers,
  FileSpreadsheet,
  TrendingUp,
  Mail,
  Activity,
  ArrowUpRight,
  PlusCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BarChart3,
  PieChart,
  Users
} from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState({
    kpis: {
      totalIssued: 0,
      activeCerts: 0,
      revokedCerts: 0,
      totalVerified: 0,
      verificationRate: 0,
      totalTemplates: 0,
      totalBatches: 0,
      totalEmails: 0,
      sentEmails: 0,
      emailSuccessRate: 100
    },
    templateDistribution: [],
    trends: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/bi');
      setData(res.data);
    } catch (err) {
      console.error('Error loading BI analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Chart 1: Issuance & Verification Trend (Line / Area) ---
  const trendLabels = data.trends.map((t) => t.label);
  const issuanceCounts = data.trends.map((t) => parseInt(t.issued_count, 10));
  const verificationCounts = data.trends.map((t) => parseInt(t.verified_count, 10));

  const trendChartData = {
    labels: trendLabels.length > 0 ? trendLabels : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
    datasets: [
      {
        label: 'Certificates Issued',
        data: issuanceCounts.length > 0 ? issuanceCounts : [0, 1, 3, 2, 4, 1, 5],
        fill: true,
        borderColor: '#123B32',
        backgroundColor: 'rgba(18, 59, 50, 0.12)',
        tension: 0.4,
        pointBackgroundColor: '#123B32',
        pointRadius: 4
      },
      {
        label: 'Public Verifications',
        data: verificationCounts.length > 0 ? verificationCounts : [0, 2, 5, 4, 8, 3, 10],
        fill: true,
        borderColor: '#C47D4C',
        backgroundColor: 'rgba(196, 125, 76, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#C47D4C',
        pointRadius: 4
      }
    ]
  };

  const trendChartOptions = {
    maintainAspectRatio: false,
    aspectRatio: 1.8,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#26322E',
          font: { weight: 600, size: 12 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        padding: 10,
        backgroundColor: '#123B32',
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      x: {
        ticks: { color: '#527A68', font: { size: 11 } },
        grid: { color: '#E8EFEB' }
      },
      y: {
        ticks: { color: '#527A68', font: { size: 11 }, precision: 0 },
        grid: { color: '#D3DDD7' }
      }
    }
  };

  // --- Chart 2: Distribution by Course / Template (Doughnut) ---
  const tplLabels = data.templateDistribution.map((t) => t.template_name);
  const tplCounts = data.templateDistribution.map((t) => parseInt(t.count, 10));

  const doughnutData = {
    labels: tplLabels.length > 0 ? tplLabels : ['Executive Gold Master', 'General Certification'],
    datasets: [
      {
        data: tplCounts.length > 0 ? tplCounts : [3, 1],
        backgroundColor: ['#123B32', '#2F5B4E', '#527A68', '#C47D4C', '#E8EFEB'],
        hoverBackgroundColor: ['#0f3028', '#254a3f', '#446656', '#a96a3e', '#d5e2da'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#26322E',
          font: { size: 11, weight: 500 },
          usePointStyle: true,
          boxWidth: 8
        }
      }
    },
    cutout: '68%'
  };

  // --- Chart 3: Hostinger Email Delivery Stats ---
  const emailChartData = {
    labels: ['Delivered', 'Failed / Bounced'],
    datasets: [
      {
        data: [
          data.kpis.sentEmails || 1,
          (data.kpis.totalEmails - data.kpis.sentEmails) || 0
        ],
        backgroundColor: ['#123B32', '#f87171'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const emailChartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#26322E',
          font: { size: 11, weight: 500 },
          usePointStyle: true,
          boxWidth: 8
        }
      }
    },
    cutout: '72%'
  };

  if (loading) {
    return (
      <div className="p-3 md:p-5" style={{ maxWidth: '1440px', margin: '0 auto', background: '#F5F3EC' }}>
        {/* Skeleton Top Banner */}
        <div className="border-round-2xl p-4 md:p-5 mb-4 shadow-1 flex justify-content-between align-items-center" style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7' }}>
          <div>
            <Skeleton width="180px" height="18px" className="mb-2" />
            <Skeleton width="320px" height="28px" className="mb-2" />
            <Skeleton width="450px" height="14px" />
          </div>
          <div className="flex gap-2">
            <Skeleton width="120px" height="38px" borderRadius="8px" />
            <Skeleton width="140px" height="38px" borderRadius="8px" />
          </div>
        </div>

        {/* Skeleton KPI Row */}
        <div className="grid mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-12 sm:col-6 lg:col-3">
              <div className="metric-card">
                <div className="flex justify-content-between align-items-center mb-2">
                  <Skeleton width="90px" height="14px" />
                  <Skeleton shape="circle" size="36px" />
                </div>
                <Skeleton width="60px" height="36px" className="mb-2" />
                <Skeleton width="120px" height="16px" />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Charts Row */}
        <div className="grid mb-4">
          <div className="col-12 lg:col-8">
            <div className="border-round-2xl p-4 shadow-1" style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7', height: '360px' }}>
              <Skeleton width="220px" height="20px" className="mb-3" />
              <Skeleton width="100%" height="270px" borderRadius="10px" />
            </div>
          </div>
          <div className="col-12 lg:col-4">
            <div className="border-round-2xl p-4 shadow-1 flex flex-column align-items-center justify-content-center" style={{ background: '#FFFFFF', border: '1.5px solid #D3DDD7', height: '360px' }}>
              <Skeleton width="180px" height="20px" className="mb-4" />
              <Skeleton shape="circle" size="180px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-5" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div className="surface-card border-round-2xl p-4 md:p-5 mb-4 border-1 border-200 shadow-1 flex flex-column md:flex-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="flex align-items-center gap-2 mb-1">
            <span className="badge-source font-bold">System Overview</span>
            <span className="text-xs text-500">Live Sync</span>
          </div>
          <h1 className="text-900 font-bold text-2xl md:text-3xl m-0 mb-1" style={{ letterSpacing: '-0.5px' }}>
            Certificate Overview & Activity
          </h1>
          <p className="text-600 text-sm m-0">
            Track issued certificates, online verifications, and email delivery status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/admin/issue-single" className="no-underline">
            <Button
              label="Issue Single"
              icon="pi pi-plus"
              className="p-button-primary font-bold shadow-1"
            />
          </Link>
          <Link to="/admin/issue-bulk" className="no-underline">
            <Button
              label="Bulk CSV Upload"
              icon="pi pi-upload"
              className="p-button-outlined p-button-indigo font-bold"
            />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid mb-4">
        {/* KPI 1 */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="metric-card h-full flex flex-column justify-content-between">
            <div>
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="text-500 text-xs font-bold uppercase tracking-wider">Total Certificates</span>
                <div className="bg-indigo-50 text-indigo-600 border-round-xl p-2 flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                  <Award size={20} />
                </div>
              </div>
              <div className="text-900 font-bold text-3xl mb-1">{data.kpis.totalIssued}</div>
              <div className="flex align-items-center gap-2 text-xs text-600">
                <Tag severity="success" value={`${data.kpis.activeCerts} Active`} />
                {data.kpis.revokedCerts > 0 && <Tag severity="danger" value={`${data.kpis.revokedCerts} Revoked`} />}
              </div>
            </div>
            <div className="text-xs text-400 mt-3 pt-2 border-top-1 border-100">
              Securely Saved
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="metric-card h-full flex flex-column justify-content-between">
            <div>
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="text-500 text-xs font-bold uppercase tracking-wider">Online Verifications</span>
                <div className="bg-emerald-50 text-emerald-600 border-round-xl p-2 flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className="text-900 font-bold text-3xl mb-1">{data.kpis.totalVerified}</div>
              <div className="text-xs text-emerald-700 font-semibold flex align-items-center gap-1">
                <TrendingUp size={14} />
                <span>{data.kpis.verificationRate}% Verification Ratio</span>
              </div>
            </div>
            <div className="text-xs text-400 mt-3 pt-2 border-top-1 border-100">
              Scanned & Checked Online
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="metric-card h-full flex flex-column justify-content-between">
            <div>
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="text-500 text-xs font-bold uppercase tracking-wider">Email Delivery Rate</span>
                <div className="bg-sky-50 text-sky-600 border-round-xl p-2 flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                  <Mail size={20} />
                </div>
              </div>
              <div className="text-900 font-bold text-3xl mb-1">{data.kpis.emailSuccessRate}%</div>
              <div className="text-xs text-600">
                <span>{data.kpis.sentEmails} of {data.kpis.totalEmails || data.kpis.totalIssued} Delivered</span>
              </div>
            </div>
            <div className="text-xs text-400 mt-3 pt-2 border-top-1 border-100">
              Delivered to Inboxes
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="metric-card h-full flex flex-column justify-content-between">
            <div>
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="text-500 text-xs font-bold uppercase tracking-wider">Designs & Batches</span>
                <div className="bg-amber-50 text-amber-600 border-round-xl p-2 flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                  <Layers size={20} />
                </div>
              </div>
              <div className="text-900 font-bold text-3xl mb-1">{data.kpis.totalTemplates}</div>
              <div className="text-xs text-600 font-medium">
                <span>{data.kpis.totalBatches} Bulk Batches Run</span>
              </div>
            </div>
            <div className="text-xs text-400 mt-3 pt-2 border-top-1 border-100">
              Active Certificate Designs
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid mb-4">
        {/* Chart 1: 7-Day Velocity Trend */}
        <div className="col-12 lg:col-8">
          <div className="surface-card border-round-2xl p-4 border-1 border-200 shadow-1 h-full flex flex-column justify-content-between">
            <div className="flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="text-900 font-bold text-lg m-0 flex align-items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-600" />
                  Issuance & Verification Activity
                </h3>
                <p className="text-500 text-xs m-0">Weekly activity comparing certificates issued vs verified</p>
              </div>
              <Tag severity="info" value="Live Activity" icon="pi pi-sync" />
            </div>

            <div style={{ height: '300px' }}>
              <Chart type="line" data={trendChartData} options={trendChartOptions} style={{ height: '100%' }} />
            </div>
          </div>
        </div>

        {/* Chart 2: Course Distribution Doughnut */}
        <div className="col-12 lg:col-4">
          <div className="surface-card border-round-2xl p-4 border-1 border-200 shadow-1 h-full flex flex-column justify-content-between">
            <div className="mb-3">
              <h3 className="text-900 font-bold text-lg m-0 flex align-items-center gap-2">
                <PieChart size={18} className="text-indigo-600" />
                Certificate Distribution
              </h3>
              <p className="text-500 text-xs m-0">Breakdown by certificate design</p>
            </div>

            <div className="flex justify-content-center align-items-center" style={{ height: '240px' }}>
              <Chart type="doughnut" data={doughnutData} options={doughnutOptions} style={{ width: '220px' }} />
            </div>

            <div className="text-xs text-500 text-center mt-2">
              Top certificate types issued
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Real-time Audit Feed & Hostinger Email Status */}
      <div className="grid">
        {/* Real-time Verification Activity */}
        <div className="col-12 lg:col-8">
          <div className="surface-card border-round-2xl p-4 border-1 border-200 shadow-1 h-full">
            <div className="flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="text-900 font-bold text-lg m-0 flex align-items-center gap-2">
                  <Activity size={18} className="text-indigo-600" />
                  Recent Online Verifications
                </h3>
                <p className="text-500 text-xs m-0">Recent certificate scans and verification checks</p>
              </div>
              <Link to="/admin/certificates" className="text-indigo-600 text-xs font-bold no-underline flex align-items-center gap-1">
                View All Records <ArrowUpRight size={13} />
              </Link>
            </div>

            {data.recentActivity.length > 0 ? (
              <div className="flex flex-column gap-2">
                {data.recentActivity.map((item) => (
                  <div key={item.id} className="p-3 surface-50 border-round-xl border-1 border-200 flex flex-column sm:flex-row justify-content-between align-items-sm-center gap-2 text-sm">
                    <div>
                      <div className="font-bold text-900">{item.recipient_name}</div>
                      <div className="text-xs text-500">{item.template_name}</div>
                    </div>

                    <div className="flex align-items-center gap-3">
                      <span className="font-monospace text-xs text-indigo-700 bg-white px-2 py-1 border-round border-1 border-200 font-bold">
                        {item.unique_code.substring(0, 10)}...
                      </span>
                      <span className="badge-source text-xs">Verified Online</span>
                      <span className="text-xs text-500">{new Date(item.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center text-500 text-sm">
                No verification hits recorded yet. Scan a certificate QR code to see live activity!
              </div>
            )}
          </div>
        </div>

        {/* Hostinger Email Deliverability Card */}
        <div className="col-12 lg:col-4">
          <div className="surface-card border-round-2xl p-4 border-1 border-200 shadow-1 h-full flex flex-column justify-content-between">
            <div>
              <h3 className="text-900 font-bold text-lg m-0 mb-1 flex align-items-center gap-2">
                <Mail size={18} style={{ color: '#123B32' }} />
                Email Delivery Status
              </h3>
              <p className="text-500 text-xs mb-3">Overall email delivery rate</p>

              <div className="flex justify-content-center mb-3" style={{ height: '170px' }}>
                <Chart type="doughnut" data={emailChartData} options={emailChartOptions} style={{ width: '160px' }} />
              </div>

              <div className="flex flex-column gap-2 text-xs">
                <div className="flex justify-content-between p-2 surface-50 border-round">
                  <span className="text-600">Sender:</span>
                  <strong className="text-900 font-monospace" style={{ color: '#123B32' }}>info@shazusofttechnologies.org</strong>
                </div>
                <div className="flex justify-content-between p-2 surface-50 border-round">
                  <span className="text-600">Organization:</span>
                  <strong className="text-900">Shazu Soft Technologies</strong>
                </div>
              </div>
            </div>

            <div className="pt-3 border-top-1 border-100 text-center">
              <Link to="/admin/issue-bulk" className="text-xs font-bold no-underline" style={{ color: '#123B32' }}>
                View Bulk Batches →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
