import { useState } from 'react';
import { Home, FileText, Wrench, CreditCard, Bell, LogOut, User, CheckCircle, AlertCircle, Clock, ShieldCheck, Download, PlusCircle, X, ChevronRight, Building, Smartphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function TenantDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  // Form states
  const [nidaInput, setNidaInput] = useState(user.nidaNumber || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergencyContact || '');
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintPriority, setMaintPriority] = useState('MEDIUM');

  const [payMethod, setPayMethod] = useState('MOBILE_MONEY');
  const [payPhone, setPayPhone] = useState(user.phone || '');

  // 1. Fetch Tenant Payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['tenant-payments'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/payments/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data.payments;
    },
    enabled: !!token
  });

  // 2. Fetch Tenant Leases
  const { data: leasesData, isLoading: leasesLoading } = useQuery({
    queryKey: ['tenant-leases'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/leases/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data.leases;
    },
    enabled: !!token
  });

  // 3. Fetch Maintenance Requests
  const { data: maintenanceData, isLoading: maintLoading } = useQuery({
    queryKey: ['tenant-maintenance'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/maintenance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data.requests;
    },
    enabled: !!token
  });

  // 4. Fetch User Profile
  const { data: userProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data.user;
    },
    enabled: !!token
  });

  // Generate Control Number Mutation
  const generateControlNumberMutation = useMutation({
    mutationFn: async (leaseId) => {
      const res = await axios.post(`${API_URL}/payments/generate-control-number`, { leaseId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-payments'] });
      alert(`Control Number Imetengenezwa: ${data.data.controlNumber}\nKiasi: TZS ${data.data.amount.toLocaleString()}`);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Hitilafu katika kutoa Control Number');
    }
  });

  // Pay with Control Number Mutation
  const payMutation = useMutation({
    mutationFn: async ({ controlNumber, paymentMethod, phoneNumber }) => {
      const res = await axios.post(`${API_URL}/payments/pay-control-number`, {
        controlNumber,
        paymentMethod,
        phoneNumber
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-payments'] });
      setIsPayModalOpen(false);
      setCurrentReceipt(data.data.receipt);
      setIsReceiptModalOpen(true);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Hitilafu katika malipo');
    }
  });

  // NIDA Verification Mutation
  const nidaMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${API_URL}/auth/verify-nida`, {
        nidaNumber: nidaInput,
        emergencyContact: emergencyPhone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: (data) => {
      refetchProfile();
      alert('Kitambulisho cha NIDA kimehakikiwa kikamilifu!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Namba ya NIDA si sahihi');
    }
  });

  // Maintenance Request Mutation
  const maintenanceMutation = useMutation({
    mutationFn: async (submitData) => {
      const res = await axios.post(`${API_URL}/maintenance`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-maintenance'] });
      setIsMaintenanceModalOpen(false);
      setMaintTitle('');
      setMaintDesc('');
      alert('Ombi la matengenezo limewasilishwa kwa uongozi.');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Hitilafu katika kutuma ombi');
    }
  });

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    if (!leasesData || leasesData.length === 0) {
      alert('Huna mkataba hai kwa sasa.');
      return;
    }
    const currentLease = leasesData[0];
    maintenanceMutation.mutate({
      propertyId: currentLease.propertyId,
      unitId: currentLease.unitId,
      title: maintTitle,
      description: maintDesc,
      priority: maintPriority
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const activeLease = leasesData?.[0];
  const pendingPayments = paymentsData?.filter(p => p.status !== 'PAID') || [];
  const paidPayments = paymentsData?.filter(p => p.status === 'PAID') || [];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-primary">{user.firstName} {user.lastName}</div>
              <div className="text-xs flex items-center gap-1 font-medium mt-0.5">
                {userProfile?.isNidaVerified ? (
                  <span className="text-green-700 bg-green-100 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> NIDA Verified
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                    Unverified NIDA
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <nav className="space-y-1">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Home className={`h-5 w-5 mr-3 ${activeTab === 'overview' ? 'text-white' : 'text-gray-400'}`} />
              Overview
            </button>
            <button onClick={() => setActiveTab('leases')} className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'leases' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              <FileText className={`h-5 w-5 mr-3 ${activeTab === 'leases' ? 'text-white' : 'text-gray-400'}`} />
              Mkataba (Lease)
            </button>
            <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'payments' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              <div className="flex items-center">
                <CreditCard className={`h-5 w-5 mr-3 ${activeTab === 'payments' ? 'text-white' : 'text-gray-400'}`} />
                Malipo (GePG)
              </div>
              {pendingPayments.length > 0 && (
                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingPayments.length}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('maintenance')} className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'maintenance' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Wrench className={`h-5 w-5 mr-3 ${activeTab === 'maintenance' ? 'text-white' : 'text-gray-400'}`} />
              Matengenezo (Tickets)
            </button>
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              <User className={`h-5 w-5 mr-3 ${activeTab === 'profile' ? 'text-white' : 'text-gray-400'}`} />
              Uhakiki wa NIDA & Profaili
            </button>
          </nav>
        </div>
        <div className="p-6 border-t border-gray-200 mt-auto">
          <button onClick={logout} className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-5 w-5 mr-3 text-red-500" />
            Toka (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Habari, {user.firstName}!</h1>
                <p className="text-sm text-gray-500">Mfumo wa Upangaji na Huduma za Nyumba (SmartRent TZ / NHC Portal)</p>
              </div>

              {activeLease && (
                <button
                  onClick={() => generateControlNumberMutation.mutate(activeLease.id)}
                  disabled={generateControlNumberMutation.isPending}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  {generateControlNumberMutation.isPending ? 'Inatengeneza...' : 'Pata GePG Control Number'}
                </button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Hali ya Malipo ya Sasa</div>
                <div className="text-2xl font-extrabold text-gray-900 mb-2">
                  {pendingPayments.length > 0 ? (
                    <span className="text-amber-600">TZS {pendingPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</span>
                  ) : (
                    <span className="text-green-600">Hakuna Deni</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center font-medium">
                  {pendingPayments.length > 0 ? (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Inasubiri Malipo (GePG)
                    </span>
                  ) : (
                    <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Kodi imelipwa kikamilifu
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Nyumba & Kitengo (Unit)</div>
                <div className="text-2xl font-extrabold text-gray-900 mb-1">
                  {activeLease ? `Unit ${activeLease.unit?.unitNumber}` : 'Hakuna Mkataba'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {activeLease ? `${activeLease.property?.title} • ${activeLease.property?.region}` : 'Omba nyumba mtandaoni'}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Tiketi za Matengenezo</div>
                <div className="text-2xl font-extrabold text-gray-900 mb-1">
                  {maintenanceData?.filter(m => m.status !== 'RESOLVED' && m.status !== 'CLOSED').length || 0}
                </div>
                <button onClick={() => setActiveTab('maintenance')} className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1">
                  Angalia maendeleo <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Invoices Requiring Payment */}
            {pendingPayments.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-amber-950 text-base">Ankara ya Kodi Inasubiri Malipo</h3>
                  </div>
                  <span className="text-xs font-semibold bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full">
                    GePG Automated Billing
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingPayments.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">GePG Control Number</span>
                          <span className="text-sm font-mono font-bold text-primary bg-gray-100 px-2 py-0.5 rounded">
                            {p.controlNumber || 'HAIJATOLEWA'}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 mb-1">
                          TZS {p.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mb-4">
                          Tarehe ya Mwisho: {new Date(p.dueDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        {p.controlNumber ? (
                          <button
                            onClick={() => { setSelectedPayment(p); setIsPayModalOpen(true); }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Smartphone className="w-4 h-4" /> Lipa kwa Control Number
                          </button>
                        ) : (
                          <button
                            onClick={() => generateControlNumberMutation.mutate(p.leaseId)}
                            className="w-full bg-primary hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors"
                          >
                            Tengeneza Control Number
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Property Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Makazi Yangu ya Sasa</h3>
                <button onClick={() => setActiveTab('leases')} className="text-blue-600 text-xs font-semibold hover:underline">Tazama Mkataba Kamili</button>
              </div>
              <div className="p-6">
                {activeLease ? (
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-full md:w-48 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <Building className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{activeLease.property?.title}</h4>
                      <p className="text-xs text-gray-500 mb-4">{activeLease.property?.address}, {activeLease.property?.district}, {activeLease.property?.region}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-400 block mb-0.5">Kitengo (Unit)</span>
                          <span className="font-bold text-gray-900">Unit {activeLease.unit?.unitNumber}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-400 block mb-0.5">Kodi ya Mwezi</span>
                          <span className="font-bold text-gray-900">TZS {activeLease.monthlyRent?.toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-400 block mb-0.5">Mwanzo wa Mkataba</span>
                          <span className="font-bold text-gray-900">{new Date(activeLease.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-400 block mb-0.5">Mwisho wa Mkataba</span>
                          <span className="font-bold text-gray-900">{new Date(activeLease.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    Huna mkataba unaoendelea kwa sasa. Tembelea ukurasa wa nyumba kutafuta makazi mapya.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* PAYMENTS TAB (GePG & Receipts) */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Malipo ya Kodi & Stakabadhi (GePG)</h1>
                <p className="text-sm text-gray-500">Mfumo wa stakabadhi za kidijitali na namba za malipo za Serikali (GePG)</p>
              </div>
              {activeLease && (
                <button
                  onClick={() => generateControlNumberMutation.mutate(activeLease.id)}
                  className="bg-primary hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  Tengeneza Ankara Mpya
                </button>
              )}
            </div>

            {/* Payment History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Historia ya Ankara na Malipo Yote</h3>
              </div>
              {paymentsData && paymentsData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3.5">GePG Control No.</th>
                        <th className="px-6 py-3.5">Kiasi (TZS)</th>
                        <th className="px-6 py-3.5">Tarehe ya Kulipa</th>
                        <th className="px-6 py-3.5">Hali (Status)</th>
                        <th className="px-6 py-3.5">Njia ya Malipo</th>
                        <th className="px-6 py-3.5 text-right">Kitendo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentsData.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">
                            {p.controlNumber || 'HAIJAWEKWA'}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            TZS {p.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : `Due: ${new Date(p.dueDate).toLocaleDateString()}`}
                          </td>
                          <td className="px-6 py-4">
                            {p.status === 'PAID' ? (
                              <span className="bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                                IMELIPWA (PAID)
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                                INASUBIRI MALIPO
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 capitalize">
                            {p.paymentMethod?.replace('_', ' ') || 'Mobile Money'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {p.status === 'PAID' ? (
                              <button
                                onClick={async () => {
                                  const res = await axios.get(`${API_URL}/payments/receipt/${p.receiptNumber || p.id}`);
                                  setCurrentReceipt(res.data.data.receipt);
                                  setIsReceiptModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs bg-blue-50 px-3 py-1 rounded-lg"
                              >
                                <Download className="w-3.5 h-3.5" /> Risiti (E-Receipt)
                              </button>
                            ) : (
                              <button
                                onClick={() => { setSelectedPayment(p); setIsPayModalOpen(true); }}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3 py-1 rounded-lg shadow-sm"
                              >
                                Lipa Sasa
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Hakuna rekodi za malipo zilizopatikana.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAINTENANCE TAB */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tiketi za Matengenezo (Maintenance Requests)</h1>
                <p className="text-sm text-gray-500">Ripoti uharibifu wa miundombinu au ukarabati unaohitajika</p>
              </div>
              <button
                onClick={() => setIsMaintenanceModalOpen(true)}
                className="bg-primary hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Fungua Tiketi Mpya
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maintenanceData && maintenanceData.length > 0 ? (
                maintenanceData.map(m => (
                  <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 text-base">{m.title}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          m.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                          m.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {m.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">{m.description}</p>
                      
                      {m.technicianNotes && (
                        <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700 mb-4 border border-gray-100">
                          <span className="font-semibold text-gray-900 block mb-0.5">Maoni ya Fundi/Msimamizi:</span>
                          {m.technicianNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs">
                      <span className="text-gray-400">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`font-bold px-2.5 py-1 rounded text-[11px] ${
                        m.status === 'RESOLVED' || m.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                        m.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500">
                  <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700">Hakuna tiketi za matengenezo</p>
                  <p className="text-xs text-gray-500 mt-1">Mfumo hauna taarifa za uharibifu unaosubiri kufanyiwa kazi.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NIDA PROFILE & VERIFICATION TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Uhakiki wa Kitambulisho cha Taifa (NIDA)</h2>
            <p className="text-xs text-gray-500 mb-6">
              Kuzuia upangishaji haramu (sub-leasing) na kuthibitisha utambulisho wako rasmi wa serikali.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); nidaMutation.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nambari ya NIDA (NIN - Tarakimu 20) *</label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  placeholder="Mfano: 19940825123450000123"
                  value={nidaInput}
                  onChange={e => setNidaInput(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">Inathibitisha utambulisho moja kwa moja na NIDA API.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nambari ya Simu ya Dharura (Emergency Contact)</label>
                <input
                  type="text"
                  placeholder="Mfano: +255 712 345 678"
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={nidaMutation.isPending}
                  className="bg-primary hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all disabled:opacity-60"
                >
                  {nidaMutation.isPending ? 'Inahakiki...' : 'Hakiki Kitambulisho Sasa'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LEASES TAB */}
        {activeTab === 'leases' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mkataba Rasmi wa Upangaji (Digital Tenancy Lease)</h2>
            {activeLease ? (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">Jengo / Eneo</span>
                      <span className="font-bold text-gray-900">{activeLease.property?.title}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Kitengo (Unit)</span>
                      <span className="font-bold text-gray-900">Unit {activeLease.unit?.unitNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Muda wa Mkataba</span>
                      <span className="font-bold text-gray-900">
                        {new Date(activeLease.startDate).toLocaleDateString()} - {new Date(activeLease.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Kodi ya Mwezi</span>
                      <span className="font-bold text-green-700">TZS {activeLease.monthlyRent?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="prose text-xs text-gray-600">
                  <h4 className="text-sm font-bold text-gray-900">Masharti Makuu ya Upangaji:</h4>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Kodi lazima ilipwe kupitia Control Number ya GePG kabla au ifikapo tarehe ya mwisho ya mwezi.</li>
                    <li>Mpangaji haruhusiwi kupangisha mtu mwingine kinyume cha sheria (Sub-leasing is strictly prohibited).</li>
                    <li>Matengenezo yote ya miundombinu mikuu yataripotiwa kupitia mfumo huu kwa ajili ya kufanyiwa kazi na mafundi walioidhinishwa.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Huna mkataba unaoendelea.</p>
            )}
          </div>
        )}
      </main>

      {/* Pay with Control Number Modal */}
      {isPayModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Lipa Kupitia GePG</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Control Number:</span>
                <span className="font-mono font-bold text-primary">{selectedPayment.controlNumber}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900">
                <span>Kiasi Kinacholipwa:</span>
                <span className="text-green-700">TZS {selectedPayment.amount.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              payMutation.mutate({
                controlNumber: selectedPayment.controlNumber,
                paymentMethod: payMethod,
                phoneNumber: payPhone
              });
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Chagua Njia ya Malipo *</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="MOBILE_MONEY">M-Pesa / Tigo Pesa / Airtel Money</option>
                  <option value="BANK">NMB / CRDB / NBC Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nambari ya Simu ya Mlipaji *</label>
                <input
                  type="text"
                  required
                  value={payPhone}
                  onChange={e => setPayPhone(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none"
                  placeholder="0712345678"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={payMutation.isPending}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-60"
                >
                  {payMutation.isPending ? 'Inathibitisha...' : 'Kamilisha Malipo (Simulate GePG)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {isReceiptModalOpen && currentReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
            <div className="text-center border-b border-gray-200 pb-6 mb-6">
              <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 mx-auto flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">STAKABADHI YA KIELEKTRONIKI (E-RECEIPT)</h2>
              <p className="text-xs text-gray-500 font-mono mt-1">SmartRent TZ & NHC GePG Payment Gateway</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Stakabadhi Namba:</span>
                <span className="font-mono font-bold text-gray-900">{currentReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">GePG Control Number:</span>
                <span className="font-mono font-bold text-gray-900">{currentReceipt.controlNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Mlipaji (Payer):</span>
                <span className="font-semibold text-gray-900">{currentReceipt.payerName || currentReceipt.tenant?.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Kiasi Kilicholipwa:</span>
                <span className="font-bold text-green-700 text-sm">{currentReceipt.formattedAmount || `TZS ${currentReceipt.paidAmount?.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Kumbukumbu ya Muamala:</span>
                <span className="font-mono text-gray-900">{currentReceipt.transactionReference}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500">Tarehe na Muda:</span>
                <span className="text-gray-900">{new Date(currentReceipt.paymentDate).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
              >
                Chapisha (Print)
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Funga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Request Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Fungua Tiketi ya Matengenezo</h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Aina ya Tatizo / Kichwa cha Habari *</label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: Bomba la choo linavuja maji"
                  value={maintTitle}
                  onChange={e => setMaintTitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kiwango cha Dharura (Priority) *</label>
                <select
                  value={maintPriority}
                  onChange={e => setMaintPriority(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="LOW">Kawaida (Low)</option>
                  <option value="MEDIUM">Wastani (Medium)</option>
                  <option value="HIGH">Kikubwa (High)</option>
                  <option value="URGENT">Dharura ya Haraka (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Maelezo ya Kina ya Uharibifu *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Eleza kwa undani eneo lililoharibika..."
                  value={maintDesc}
                  onChange={e => setMaintDesc(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={maintenanceMutation.isPending}
                  className="px-5 py-2 bg-primary hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-60"
                >
                  {maintenanceMutation.isPending ? 'Inatuma...' : 'Wasilisha Ombi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
