import { useState } from 'react';
import { Home, Users, Building, FileText, Settings, LogOut, ShieldCheck, Activity, Bell, BarChart2, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, DollarSign, Wrench, Search, Filter, Lock, Unlock, UserCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // 1. Executive Overview Analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['admin-executive-overview'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/analytics/executive-overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data;
    },
    enabled: !!token
  });

  // 2. Properties pending approval
  const { data: allProperties } = useQuery({
    queryKey: ['admin-pending-properties'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/properties?limit=all&status=PENDING_APPROVAL`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data.properties;
    },
    enabled: !!token
  });

  // 3. Registered Users List (Admin Management)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-all-users', userRoleFilter, userSearchQuery],
    queryFn: async () => {
      const params = {};
      if (userRoleFilter) params.role = userRoleFilter;
      if (userSearchQuery) params.search = userSearchQuery;

      const res = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return res.data.data;
    },
    enabled: !!token && (activeTab === 'users' || activeTab === 'verifications')
  });

  // Approve property mutation
  const approvePropertyMutation = useMutation({
    mutationFn: async (id) => {
      return axios.patch(`${API_URL}/properties/${id}/status`, { status: 'PUBLISHED' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-executive-overview'] });
      alert('Jengo limeidhinishwa na kuchapishwa kikamilifu!');
    }
  });

  // Toggle user active/suspend status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      return axios.patch(`${API_URL}/auth/users/${id}/status`, { isActive }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      alert(res.data.message);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Hitilafu katika kusasisha akaunti');
    }
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const navItems = [
    { id: 'overview', label: 'Executive Dashboard', Icon: BarChart2 },
    { id: 'users', label: 'Watumiaji (Manage Users)', Icon: Users },
    { id: 'properties', label: 'Usimamizi wa Majengo', Icon: Building },
    { id: 'verifications', label: 'Uhakiki wa NIDA', Icon: ShieldCheck },
    { id: 'financials', label: 'Mapato ya GePG', Icon: Activity },
    { id: 'settings', label: 'Mipangilio', Icon: Settings },
  ];

  const occupancy = analyticsData?.occupancy;
  const financials = analyticsData?.financials;
  const governance = analyticsData?.governance;
  const maintenance = analyticsData?.maintenance;
  const regionalBreakdown = analyticsData?.regionalBreakdown || [];

  const usersList = usersData?.users || [];
  const tenantCount = usersList.filter(u => u.role === 'TENANT').length;
  const landlordCount = usersList.filter(u => u.role === 'LANDLORD').length;
  const agentCount = usersList.filter(u => u.role === 'AGENT').length;
  const verifiedCount = usersList.filter(u => u.isNidaVerified).length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-white">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100">{user.firstName} {user.lastName}</div>
              <div className="text-[11px] text-purple-300 font-medium">Uongozi Mkuu (NHC Executive)</div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === id ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 mr-3 ${activeTab === id ? 'text-white' : 'text-slate-400'}`} />
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 border-t border-slate-800 mt-auto">
          <button onClick={logout} className="flex items-center w-full px-4 py-3 text-xs font-semibold rounded-xl text-red-400 hover:bg-slate-800 transition-colors">
            <LogOut className="h-4 w-4 mr-3" />
            Toka (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* EXECUTIVE DASHBOARD TAB */}
        {activeTab === 'overview' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Dashibodi ya Kiutendaji & Takwimu za Taasisi</h1>
                <p className="text-xs text-gray-500 mt-0.5">Ufuatiliaji wa Milki, Mapato ya GePG, na Ufanisi wa Huduma za NHC</p>
              </div>
              <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-200">
                <ShieldCheck className="w-4 h-4" /> NHC Institutional Gateway Active
              </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Kiwango cha Upangaji</div>
                <div className="text-3xl font-extrabold text-gray-900 mb-2">
                  {occupancy?.occupancyRate || 0}%
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>{occupancy?.occupiedUnits || 0} Yamepangishwa</span>
                  <span className="font-semibold">{occupancy?.totalUnits || 0} Units Jumla</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Mapato Yaliyokusanywa (GePG)</div>
                <div className="text-2xl font-extrabold text-green-700 mb-2">
                  TZS {(financials?.totalRevenueCollected || 0).toLocaleString()}
                </div>
                <div className="text-xs text-green-600 font-semibold">
                  Ufanisi wa Ukusanyaji: {financials?.collectionEfficiencyRate || 100}%
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Malimbikizo ya Kodi (Arrears)</div>
                <div className="text-2xl font-extrabold text-red-600 mb-2">
                  TZS {(financials?.totalArrearsAmount || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Madeni yaliyopitiliza muda wa kulipa
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer" onClick={() => setActiveTab('users')}>
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Jumla ya Watumiaji (Users)</div>
                <div className="text-3xl font-extrabold text-purple-700 mb-2">
                  {governance?.totalTenants || 0}
                </div>
                <div className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Tazama Watumiaji Wote →
                </div>
              </div>
            </div>

            {/* Regional Performance & Maintenance Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-sm">Mgawanyo wa Units kwa Mikoa (Regional Breakdown)</h3>
                  <span className="text-xs text-gray-400">Kanda Zote</span>
                </div>
                <div className="p-6">
                  {regionalBreakdown.length > 0 ? (
                    <div className="space-y-4">
                      {regionalBreakdown.map((reg, idx) => {
                        const occPct = reg.totalUnits > 0 ? Math.round((reg.occupiedUnits / reg.totalUnits) * 100) : 0;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-gray-900">{reg.region}</span>
                              <span className="text-gray-500">{reg.occupiedUnits} / {reg.totalUnits} Units ({occPct}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${occPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      Hakuna data ya kutosha ya kanda kwa sasa.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-4">Ufanisi wa Matengenezo</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Jumla ya Maombi:</span>
                      <span className="font-bold text-gray-900">{maintenance?.totalRequests || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Yaliyokamilika (Resolved):</span>
                      <span className="font-bold text-green-700">{maintenance?.resolved || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Yanaendelea (In Progress):</span>
                      <span className="font-bold text-blue-700">{maintenance?.inProgress || 0}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Gharama za Matengenezo:</span>
                      <span className="font-bold text-gray-900">TZS {(maintenance?.totalCost || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full inline-block">
                    Kiwango cha Utatuzi: {maintenance?.resolutionRate || 100}%
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MANAGE USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Usimamizi wa Watumiaji (Manage Users)</h1>
                <p className="text-xs text-gray-500">Orodha ya akaunti zote zilizosajiliwa na ufuatiliaji wa NIDA</p>
              </div>
            </div>

            {/* Quick User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Jumla ya Akaunti</span>
                <span className="text-2xl font-extrabold text-gray-900">{usersList.length}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Wapangaji (Tenants)</span>
                <span className="text-2xl font-extrabold text-emerald-700">{tenantCount}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Wamiliki / NHC Officers</span>
                <span className="text-2xl font-extrabold text-blue-700">{landlordCount}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-xs text-gray-400 font-bold uppercase block mb-1">NIDA Verified Users</span>
                <span className="text-2xl font-extrabold text-purple-700">{verifiedCount}</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Tafuta kwa jina, barua pepe, au NIDA..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={userRoleFilter}
                  onChange={e => setUserRoleFilter(e.target.value)}
                  className="p-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-600 outline-none"
                >
                  <option value="">Wadhifa Wote (All Roles)</option>
                  <option value="TENANT">Wapangaji (Tenants)</option>
                  <option value="LANDLORD">Wamiliki / NHC (Landlords)</option>
                  <option value="AGENT">Mawakala (Agents)</option>
                  <option value="ADMIN">Viongozi (Admins)</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {usersLoading ? (
                <div className="p-12 text-center text-gray-500 text-xs">Inapakia watumiaji...</div>
              ) : usersList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3.5">Mtumiaji</th>
                        <th className="px-6 py-3.5">Mawasiliano</th>
                        <th className="px-6 py-3.5">Wadhifa (Role)</th>
                        <th className="px-6 py-3.5">Kitambulisho cha NIDA</th>
                        <th className="px-6 py-3.5">Hali ya Akaunti</th>
                        <th className="px-6 py-3.5 text-right">Vitendo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {usersList.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm">
                                {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{u.firstName} {u.lastName}</div>
                                <div className="text-[10px] text-gray-400">Id: {u.id.substring(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{u.email}</div>
                            <div className="text-[11px] text-gray-500">{u.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                              u.role === 'LANDLORD' ? 'bg-blue-100 text-blue-800' :
                              u.role === 'AGENT' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.isNidaVerified ? (
                              <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> {u.nidaNumber || 'Verified'}
                              </span>
                            ) : (
                              <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[10px]">
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {u.isActive ? (
                              <span className="text-green-800 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="text-red-800 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold">
                                SUSPENDED
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.id !== user.id && (
                              <button
                                onClick={() => toggleUserStatusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                                disabled={toggleUserStatusMutation.isPending}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto ${
                                  u.isActive
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                              >
                                {u.isActive ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                {u.isActive ? 'Sitisha (Suspend)' : 'Rejesha (Activate)'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs">
                  Hakuna watumiaji walopatikana.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VERIFICATIONS TAB */}
        {activeTab === 'verifications' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Usimamizi wa Uhakiki wa NIDA (Identity Governance)</h2>
            <p className="text-xs text-gray-500 mb-6">
              Uhakiki wa moja kwa moja kupitia NIDA Database kuzuia udanganyifu, wapangaji hewa na upangishaji holela.
            </p>
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex items-center justify-between mb-6">
              <div>
                <h4 className="font-bold text-purple-950 text-sm">Kiwango cha Uthibitishaji wa NIDA</h4>
                <p className="text-xs text-purple-700 mt-0.5">Wapangaji wote waliosajiliwa wanatakiwa kuwasilisha tarakimu 20 za NIN.</p>
              </div>
              <span className="text-2xl font-extrabold text-purple-700">
                {governance?.nidaVerificationRate || 0}%
              </span>
            </div>
          </div>
        )}

        {/* FINANCIALS TAB */}
        {activeTab === 'financials' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Mfumo wa Ukusanyaji wa Mapato (GePG Gateway)</h2>
            <p className="text-xs text-gray-500 mb-6">
              Muunganisho na mifumo ya M-Pesa, Tigo Pesa, Airtel Money na Benki za Biashara kupitia Control Numbers za tarakimu 12.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                <span className="text-xs text-green-700 font-bold uppercase block mb-1">Jumla ya Mapato Yaliyothibitishwa</span>
                <span className="text-2xl font-extrabold text-green-900">TZS {(financials?.totalRevenueCollected || 0).toLocaleString()}</span>
              </div>
              <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                <span className="text-xs text-red-700 font-bold uppercase block mb-1">Malimbikizo ya Kodi (Arrears)</span>
                <span className="text-2xl font-extrabold text-red-900">TZS {(financials?.totalArrearsAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {['properties', 'settings'].includes(activeTab) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">{activeTab}</h2>
            <p className="text-gray-500 text-xs">Moduli hii inaendelea kuendeshwa kwa ushirikiano wa mifumo ya kitaasisi.</p>
          </div>
        )}
      </main>
    </div>
  );
}
