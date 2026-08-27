import { useState } from 'react';
import { Home, Users, Building, FileText, Settings, LogOut, ShieldCheck, Activity, Bell, BarChart2, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, DollarSign, Wrench } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Executive Overview Analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-executive-overview'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/analytics/executive-overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data;
    },
    enabled: !!token
  });

  // Properties pending approval
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const navItems = [
    { id: 'overview', label: 'Executive Dashboard', Icon: BarChart2 },
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
              {/* Occupancy Rate */}
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

              {/* GePG Revenue Collected */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Mapato Yaliyokusanywa (GePG)</div>
                <div className="text-2xl font-extrabold text-green-700 mb-2">
                  TZS {(financials?.totalRevenueCollected || 0).toLocaleString()}
                </div>
                <div className="text-xs text-green-600 font-semibold">
                  Ufanisi wa Ukusanyaji: {financials?.collectionEfficiencyRate || 100}%
                </div>
              </div>

              {/* Outstanding Arrears */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Malimbikizo ya Kodi (Arrears)</div>
                <div className="text-2xl font-extrabold text-red-600 mb-2">
                  TZS {(financials?.totalArrearsAmount || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Madeni yaliyopitiliza muda wa kulipa
                </div>
              </div>

              {/* NIDA Verification Rate */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Wapangaji Wenye NIDA</div>
                <div className="text-3xl font-extrabold text-purple-700 mb-2">
                  {governance?.nidaVerificationRate || 0}%
                </div>
                <div className="text-xs text-gray-500">
                  {governance?.verifiedTenants || 0} kati ya {governance?.totalTenants || 0} wamethibitishwa
                </div>
              </div>
            </div>

            {/* Regional Performance & Maintenance Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Regional Estate Breakdown */}
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

              {/* Maintenance Metrics */}
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
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Yanasubiri (Open):</span>
                      <span className="font-bold text-amber-700">{maintenance?.open || 0}</span>
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

            {/* Pending Approvals List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-sm">Majengo Yanayosubiri Idhini (Pending Approvals)</h3>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {allProperties?.length || 0} Majengo
                </span>
              </div>
              {allProperties && allProperties.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {allProperties.map(prop => (
                    <li key={prop.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <Building className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{prop.title}</h4>
                          <p className="text-xs text-gray-500">{prop.address} • {prop.district}, {prop.region}</p>
                          <span className="text-[10px] text-gray-400 font-medium">Aina: {prop.propertyType}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approvePropertyMutation.mutate(prop.id)}
                          disabled={approvePropertyMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Idhinisha (Approve)
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs">
                  Hakuna majengo yanayosubiri idhini kwa sasa.
                </div>
              )}
            </div>
          </>
        )}

        {/* VERIFICATIONS TAB */}
        {activeTab === 'verifications' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Usimamizi wa Uhakiki wa Wapangaji (NIDA Governance)</h2>
            <p className="text-xs text-gray-500 mb-6">
              Uhakiki wa moja kwa moja kupitia NIDA Database kuzuia udanganyifu, wapangaji hewa na upangishaji holela.
            </p>
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex items-center justify-between">
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
