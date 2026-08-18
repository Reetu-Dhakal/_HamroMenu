import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Users, Shield, Loader2, Archive, Clock, Flag, FlagX, FlagCheck, TextSearch, LayoutDashboard, BarChart, Zap, Sparkles, UserPen, Folder, FileText, Clipboard, Eye, EyeOff, Search as SearchIcon, Menu, X, CircleCheck, LoaderRotate } from 'lucide-react';
import { request } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { npr, cx } from '../../lib/format';
import { Spinner, StatusPill, EmptyState, Table, Pills, Pill } from '../../components/ui';

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [editingApplication, setEditingApplication] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ov, apps] = await Promise.all([
          request('/api/super-admin/overview'),
          request('/api/super-admin/applications'),
        ]);
        if (alive) {
          setOverview(ov);
          setApplications(apps);
        }
      } catch (e) {
        toast.error(e.message || 'Failed to load dashboard data');
      } finally {
        if (alive) setLoadingOverview(false);
      }
    })();
    return () => (alive = false);
  }, []);

  const action = (type, id, reason) => {
    if (type === 'approve') {
      // handled inline via table row actions
    } else if (type === 'reject') {
      // handled inline
    } else if (type === 'request-correction') {
      // handled inline
    }
  };

  if (loadingOverview) {
    return <div className="flex justify-center py-24"><Spinner /></div>;
  }

  const pendingApps = applications.filter((a) => a.verificationStatus === 'PENDING');

  return (
    <div className="min-h-dvh bg-cream-50">
      <Helmet>
        <title>Super Admin Dashboard · HamroMenu</title>
      </Helmet>

      <header className="sticky top-0 z-40 border-b border-cream-200/70 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-600 font-display text-lg font-bold text-white">H</span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink">HamroMenu</span>
          </div>
          <nav className="hidden items-center gap-2 text-[13px] font-semibold text-ink-soft md:flex">
            <a href="#applications" className="hover:text-clay-700">Applications</a>
            <a href="#statistics" className="hover:text-clay-700">Statistics</a>
            <a href="#users" className="hover:text-clay-700">Users</a>
            <a href="/auth/logout" className="hover:text-clay-700">Sign out</a>
          </nav>
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-ink-faint">Super Admin</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Statistics Section */}
        <section id="statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {overview && (
            <div className="card p-6 bg-white shadow-sm">
              <h2 className="font-display text-xl font-bold text-ink mb-4">Platform Statistics</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-clay-100 text-clay-700"><TrendingUp size={16} /></div>
                  <div>
                    <p className="font-display text-xl font-black text-ink">{overview.totalRestaurants || 0}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Total Restaurants</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-clay-100 text-clay-700"><Users size={16} /></div>
                  <div>
                    <p className="font-display text-xl font-black text-ink">{overview.totalOrders || 0}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Total Orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-clay-100 text-clay-700"><Shield size={16} /></div>
                  <div>
                    <p className="font-display text-xl font-black text-ink">{overview.activeRestaurants || 0}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Active Restaurants</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-clay-100 text-clay-700"><Clock size={16} /></div>
                  <div>
                    <p className="font-display text-xl font-black text-ink">{overview.pendingApplications || 0}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Pending Applications</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Restaurant Applications Section */}
        <section id="applications" className="mb-8">
          <div className="card p-6 bg-white shadow-sm">
            <h2 className="font-display text-xl font-bold text-ink mb-4">Restaurant Applications</h2>
            {pendingApps.length === 0 ? (
              <EmptyState
                icon={CircleCheck}
                title="No pending applications"
                copy="All restaurant applications have been verified. New restaurants can register using the owner registration flow."
              >
                <ActionButton text="Register New Restaurant" onClick={() => window.location.href = '/auth/register/restaurant-owner'} />
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {pendingApps.map((app) => (
                  <div key={app._id} className="p-4 rounded-xl bg-clay-50 border border-clay-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-ink">{app.name}</h3>
                        <p className="text-[12px] text-clay-600">Owner: {app.ownerName || '—'}</p>
                        <p className="text-[11px] text-clay-500 mb-2">Registration No: {app.businessRegistrationNumber || '—'}</p>
                        <div className="flex gap-2">
                          {[['license', 'pan', 'owner_id'].map((docType) => (
                            <Pill key={docType} className={app.verificationChecks?.documentsUploaded ? 'bg-leaf/20 text-leaf' : 'bg-clay-200 text-clay-500'}>
                              {docType}
                            </Pill>
                          ))}
                        </div>
                        <p className="text-[11px] text-clay-500">Status: <StatusPill status={app.restaurantStatus || app.verificationStatus} /></p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="space-y-2">
                          {[['Approve', () => approveApp(app._id), 'bg-saffron/10 text-saffron-deep'],
                            ['Reject', () => rejectApp(app._id, 'Rejected by super admin'), 'bg-red-100 text-red-800'],
                            ['Request Correction', () => requestCorrection(app._id, 'More information needed'), 'bg-clay-100 text-clay-700']
                          ].map(([label, onClick, className]) => (
                            <button key={label} onClick={onClick} className="btn-soft text-[11px] py-1.5 px-3 rounded">{label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Detailed Application View */}
        {editingApplication && (
          <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sheet flex items-center justify-center">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl">
              <h2 className="font-display text-2xl font-bold text-ink mb-4">Application Detail</h2>
              <button onClick={() => setEditingApplication(null)} className="absolute top-4 right-4 text-clay-500 hover:text-clay-700"><X size={20} /></button>
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-clay-500">Restaurant Name</p>
                  <p className="font-display text-lg text-ink">{editingApplication.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-clay-500">Owner</p>
                  <p className="font-display text-lg text-ink">{editingApplication.ownerName || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-clay-500">Email</p>
                  <p className="font-display text-lg text-ink">{editingApplication.ownerEmail || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-clay-500">Phone</p>
                  <p className="font-display text-lg text-ink">{editingApplication.ownerPhone || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-clay-500">Business Registration Number</p>
                  <p className="font-display text-lg text-ink">{editingApplication.businessRegistrationNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-clay-500">PAN Number</p>
                  <p className="font-display text-lg text-ink">{editingApplication.panNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-clay-500">Verification Status</p>
                  <StatusPill status={editingApplication.verificationStatus} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-clay-500">Restaurant Status</p>
                  <StatusPill status={editingApplication.restaurantStatus} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-clay-500">Verification Notes</p>
                  <p className="text-[12px] text-clay-500">{editingApplication.verificationNote || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-clay-500">Documents</p>
                  <p className="text-[12px] text-clay-500">{editingApplication.documents?.length || 0} uploaded</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setEditingApplication(null)} className="flex-1 btn-ghost">Close</button>
                <button className="flex-1 btn-primary">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Users Section */}
        <section id="users" className="mt-8">
          <div className="card p-6 bg-white shadow-sm">
            <h2 className="font-display text-xl font-bold text-ink mb-4">User Management</h2>
            <p className="text-[12px] text-clay-500 mb-4">Platform has {overview?.totalUsers || 0} registered users across all roles.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-clay-50 rounded-pill py-2">
                <Users size={14} className="text-clay-600" /> <span className="text-[11px] text-clay-700">Customers</span> {overview?.stats?.users || 0}
              </div>
              <div className="flex items-center gap-2 bg-clay-50 rounded-pill py-2">
                <UserPen size={14} className="text-clay-600" /> <span className="text-[11px] text-clay-700">Staff</span> {overview?.stats?.staff || 0}
              </div>
              <div className="flex items-center gap-2 bg-clay-50 rounded-pill py-2">
                <Zap size={14} className="text-clay-600" /> <span className="text-[11px] text-clay-700">Kitchen</span> {overview?.stats?.kitchen || 0}
              </div>
              <div className="flex items-center gap-2 bg-clay-50 rounded-pill py-2">
                <LayoutDashboard size={14} className="text-clay-600" /> <span className="text-[11px] text-clay-700">Admins</span> {overview?.stats?.admins || 0}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ActionButton({ text, onClick }) {
  return (
    <button onClick={onClick} className="btn-primary text-[13px] py-2.5 rounded">
      {text}
    </button>
  );
}