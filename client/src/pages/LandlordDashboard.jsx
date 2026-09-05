import { useState } from 'react';
import { Home, FileText, Users, Wrench, CreditCard, LogOut, PlusCircle, Building, X, User, Bell, CheckCircle, Clock, AlertTriangle, ShieldCheck, Download, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { API_URL } from '../config/api';

export default function LandlordDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMaintenanceUpdateOpen, setIsMaintenanceUpdateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Form states for Property
  const [formData, setFormData] = useState({
    title: '', description: '', propertyType: 'APARTMENT',
    address: '', region: 'Dar es Salaam', district: '', ward: ''
  });
  const [images, setImages] = useState([]);

  // Maintenance dispatch form
  const [techAssignee, setTechAssignee] = useState('');
  const [techStatus, setTechStatus] = useState('IN_PROGRESS');
  const [techEstimatedCost, setTechEstimatedCost] = useState('');
  const [techNotes, setTechNotes] = useState('');

  // 1. Properties
  const { data: propertiesData, isLoading: propsLoading } = useQuery({
    queryKey: ['landlord-properties'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/properties?limit=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data.properties.filter(p => p.ownerId === user.id);
    },
    enabled: !!token
  });

  // 2. Applications
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['landlord-applications'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/applications/landlord`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data.applications;
    },
    enabled: !!token
  });

  // 3. Payments (GePG & Invoices)
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['landlord-payments'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/payments/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data.payments;
    },
    enabled: !!token
  });

  // 4. Maintenance Tickets
  const { data: maintenanceData, isLoading: maintLoading } = useQuery({
    queryKey: ['landlord-maintenance'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/maintenance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data.requests;
    },
    enabled: !!token
  });

  // Add Property Mutation
  const addPropertyMutation = useMutation({
    mutationFn: async (submitData) => {
      return axios.post(`${API_URL}/properties`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-properties'] });
      setIsAddModalOpen(false);
      setFormData({ title: '', description: '', propertyType: 'APARTMENT', address: '', region: 'Dar es Salaam', district: '', ward: '' });
      setImages([]);
      alert('Jengo limesajiliwa na linasubiri idhini ya Uongozi!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Hitilafu katika kuongeza jengo');
    }
  });

  // Update Maintenance Mutation
  const updateMaintenanceMutation = useMutation({
    mutationFn: async ({ id, status, assignedTo, estimatedCost, technicianNotes }) => {
      return axios.patch(`${API_URL}/maintenance/${id}`, {
        status, assignedTo, estimatedCost, technicianNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-maintenance'] });
      setIsMaintenanceUpdateOpen(false);
      alert('Tiketi ya matengenezo imesasishwa na fundi amepangiwa kazi.');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Hitilafu katika kusasisha tiketi');
    }
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    Array.from(images).forEach(file => submitData.append('images', file));
    addPropertyMutation.mutate(submitData);
  };

  const handleMaintenanceUpdate = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    updateMaintenanceMutation.mutate({
      id: selectedTicket.id,
      status: techStatus,
      assignedTo: techAssignee,
      estimatedCost: techEstimatedCost,
      technicianNotes: techNotes
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const navItems = [
    { id: 'overview', label: 'Overview', Icon: Home },
    { id: 'properties', label: 'Majengo & Units', Icon: Building },
    { id: 'payments', label: 'Mapato & GePG', Icon: CreditCard },
    { id: 'maintenance', label: 'Matengenezo', Icon: Wrench },
    { id: 'applications', label: 'Maombi ya Kupanga', Icon: FileText },
  ];

  const totalCollected = paymentsData?.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.paidAmount || p.amount), 0) || 0;
  const pendingInvoices = paymentsData?.filter(p => p.status !== 'PAID') || [];
  const openMaint = maintenanceData?.filter(m => m.status !== 'RESOLVED' && m.status !== 'CLOSED') || [];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">{user.firstName} {user.lastName}</div>
              <div className="text-[11px] text-emerald-700 font-semibold">Msimamizi wa Kanda (Estate Manager)</div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === id ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className={`h-4 w-4 mr-3 ${activeTab === id ? 'text-white' : 'text-gray-400'}`} />
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 border-t border-gray-200 mt-auto">
          <button onClick={logout} className="flex items-center w-full px-4 py-3 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4 mr-3 text-red-500" />
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
                <h1 className="text-2xl font-bold text-gray-900">Usimamizi wa Majengo ya Kanda</h1>
                <p className="text-xs text-gray-500 mt-0.5">Uratibu wa Upangishaji, Ukusanyaji wa GePG na Matengenezo</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Sajili Jengo Jipya
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Jumla ya Majengo</div>
                <div className="text-2xl font-extrabold text-gray-900 mb-1">{propertiesData?.length || 0}</div>
                <div className="text-xs text-gray-500">Majengo chini ya usimamizi</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Mapato ya GePG Yaliyolipwa</div>
                <div className="text-2xl font-extrabold text-green-700 mb-1">
                  TZS {totalCollected.toLocaleString()}
                </div>
                <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Yameshathibitishwa
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ankara Zinasubiri Malipo</div>
                <div className="text-2xl font-extrabold text-amber-600 mb-1">
                  {pendingInvoices.length}
                </div>
                <div className="text-xs text-gray-500">Control Numbers zimetolewa</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Matengenezo Yanayoendelea</div>
                <div className="text-2xl font-extrabold text-blue-600 mb-1">{openMaint.length}</div>
                <div className="text-xs text-gray-500">Tiketi za mafundi</div>
              </div>
            </div>

            {/* Properties & Pending Applications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-sm">Orodha ya Majengo ya Kanda</h3>
                  <button onClick={() => setActiveTab('properties')} className="text-emerald-700 text-xs font-semibold hover:underline">Tazama Yote</button>
                </div>
                {propertiesData && propertiesData.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {propertiesData.slice(0, 4).map(prop => (
                      <li key={prop.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                            <Building className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{prop.title}</h4>
                            <p className="text-xs text-gray-500">{prop.address} • {prop.district}, {prop.region}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          prop.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {prop.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-xs">
                    Bado hujaongeza majengo. Bonyeza "Sajili Jengo Jipya" kuanza.
                  </div>
                )}
              </div>

              {/* Recent Applications */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm">Maombi ya Upangaji</h3>
                </div>
                {appsData && appsData.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {appsData.slice(0, 5).map(app => (
                      <li key={app.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-gray-900 text-xs">{app.tenant?.firstName} {app.tenant?.lastName}</span>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            {app.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">{app.property?.title}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{app.tenant?.phone}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-gray-500 text-xs">
                    Hakuna maombi mapya ya upangaji.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* PAYMENTS TAB (GePG Collections) */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ukusanyaji wa Mapato & Ankara za GePG</h1>
              <p className="text-xs text-gray-500">Ufuatiliaji wa Control Numbers na Stakabadhi za Kielektroniki</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {paymentsData && paymentsData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3.5">Mpangaji</th>
                        <th className="px-6 py-3.5">Kitengo / Nyumba</th>
                        <th className="px-6 py-3.5">GePG Control No.</th>
                        <th className="px-6 py-3.5">Kiasi (TZS)</th>
                        <th className="px-6 py-3.5">Hali (Status)</th>
                        <th className="px-6 py-3.5">Stakabadhi Namba</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentsData.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {p.tenant?.firstName} {p.tenant?.lastName}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {p.lease?.property?.title} (Unit {p.lease?.unit?.unitNumber})
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">
                            {p.controlNumber || 'HAIJAWEKWA'}
                          </td>
                          <td className="px-6 py-4 font-bold text-green-700">
                            TZS {p.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-500">
                            {p.receiptNumber || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs">
                  Hakuna ankara au malipo yaliyorekodiwa.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAINTENANCE TAB (Technician Dispatch) */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Usimamizi wa Tiketi za Matengenezo & Mafundi</h1>
              <p className="text-xs text-gray-500">Kugawa kazi kwa mafundi, kukadiria gharama na kufuatilia utatuzi</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maintenanceData && maintenanceData.length > 0 ? (
                maintenanceData.map(m => (
                  <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{m.title}</h4>
                          <span className="text-[11px] text-gray-500 block">{m.property?.title} • Unit {m.unit?.unitNumber}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          m.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {m.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">{m.description}</p>
                      
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Mpangaji:</span>
                          <span className="font-semibold text-gray-900">{m.tenant?.firstName} {m.tenant?.lastName} ({m.tenant?.phone})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fundi Aliyepewa:</span>
                          <span className="font-semibold text-emerald-700">{m.assignedTo || 'Bado hajapangiwa'}</span>
                        </div>
                        {m.estimatedCost && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Makadirio ya Gharama:</span>
                            <span className="font-semibold text-gray-900">TZS {m.estimatedCost.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        m.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {m.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTicket(m);
                          setTechAssignee(m.assignedTo || '');
                          setTechStatus(m.status || 'IN_PROGRESS');
                          setTechEstimatedCost(m.estimatedCost || '');
                          setTechNotes(m.technicianNotes || '');
                          setIsMaintenanceUpdateOpen(true);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      >
                        Pangia Fundi / Sasisha
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 text-xs">
                  Hakuna tiketi za matengenezo zinazosubiri.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROPERTIES TAB */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Majengo Yangu</h1>
                <p className="text-xs text-gray-500">Orodha ya majengo na vitengo vyake</p>
              </div>
              <button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm">
                <PlusCircle className="w-4 h-4" /> Sajili Jengo Jipya
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {propertiesData?.map(prop => (
                <div key={prop.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="h-36 bg-gray-100 flex items-center justify-center">
                    <Building className="w-12 h-12 text-gray-300" />
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{prop.title}</h4>
                    <p className="text-xs text-gray-500 mb-3">{prop.address} • {prop.district}</p>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-800 uppercase">
                      {prop.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Maombi ya Upangaji yaliyopokelewa</h2>
            {appsData && appsData.length > 0 ? (
              <div className="space-y-3">
                {appsData.map(app => (
                  <div key={app.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{app.tenant?.firstName} {app.tenant?.lastName}</h4>
                      <p className="text-xs text-gray-500">{app.property?.title}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-lg">
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Hakuna maombi mapya.</p>
            )}
          </div>
        )}

        {/* Dispatch Technician / Update Maintenance Modal */}
        {isMaintenanceUpdateOpen && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 text-base">Pangia Fundi / Sasisha Tiketi</h3>
                <button onClick={() => setIsMaintenanceUpdateOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleMaintenanceUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fundi / Afisa Anayekabidhiwa (Technician Name/Phone) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mfano: Juma Fundi (+255 754 112 233)"
                    value={techAssignee}
                    onChange={e => setTechAssignee(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hali ya Tiketi (Status) *</label>
                  <select
                    value={techStatus}
                    onChange={e => setTechStatus(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 outline-none"
                  >
                    <option value="ACKNOWLEDGED">Imepokelewa (Acknowledged)</option>
                    <option value="IN_PROGRESS">Inafanyiwa Kazi (In Progress)</option>
                    <option value="RESOLVED">Imekamilika (Resolved)</option>
                    <option value="CLOSED">Imefungwa (Closed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Makadirio ya Gharama za Matengenezo (TZS)</label>
                  <input
                    type="number"
                    placeholder="Mfano: 150000"
                    value={techEstimatedCost}
                    onChange={e => setTechEstimatedCost(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Maelekezo / Maoni ya Ukarabati</label>
                  <textarea
                    rows={2}
                    placeholder="Maelekezo kwa mpangaji au fundi..."
                    value={techNotes}
                    onChange={e => setTechNotes(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMaintenanceUpdateOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold"
                  >
                    Ghairi
                  </button>
                  <button
                    type="submit"
                    disabled={updateMaintenanceMutation.isPending}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    {updateMaintenanceMutation.isPending ? 'Inahifadhi...' : 'Hifadhi Mabadiliko'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Property Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">Sajili Jengo Jipya la NHC / Kanda</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jina la Jengo / Mradi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mfano: Samia Housing Estate - Block C"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Maelezo ya Jengo *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Maelezo ya jengo na huduma zilizopo..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Aina ya Jengo *</label>
                    <select
                      value={formData.propertyType}
                      onChange={e => setFormData({ ...formData, propertyType: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-700 outline-none"
                    >
                      <option value="APARTMENT">Ghorofa (Apartment)</option>
                      <option value="HOUSE">Nyumba Binafsi (House)</option>
                      <option value="OFFICE">Ofisi (Commercial Office)</option>
                      <option value="SHOP">Duka / Fremu (Retail Shop)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mkoa (Region) *</label>
                    <input
                      type="text"
                      required
                      value={formData.region}
                      onChange={e => setFormData({ ...formData, region: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Wilaya (District) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Kinondoni"
                      value={formData.district}
                      onChange={e => setFormData({ ...formData, district: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Kata / Mtaa (Ward) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mikocheni"
                      value={formData.ward}
                      onChange={e => setFormData({ ...formData, ward: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Anwani ya Mtaa (Street Address) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mwai Kibaki Road, Plot 14"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold"
                  >
                    Ghairi
                  </button>
                  <button
                    type="submit"
                    disabled={addPropertyMutation.isPending}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    {addPropertyMutation.isPending ? 'Inasajili...' : 'Hifadhi Jengo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
