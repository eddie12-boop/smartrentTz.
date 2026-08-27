import { useState } from 'react';
import { Home, Building, Users, FileText, CreditCard, Wrench, Bell, User, LogOut, PlusCircle, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function AgentDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', propertyType: 'APARTMENT',
    address: '', region: 'Dar es Salaam', district: '', ward: ''
  });
  const [images, setImages] = useState([]);

  const { data: propertiesData, isLoading: propsLoading } = useQuery({
    queryKey: ['agent-properties'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/properties?limit=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data.properties.filter(p => p.agentId === user.id);
    },
    enabled: !!token
  });

  const addPropertyMutation = useMutation({
    mutationFn: async (submitData) => {
      return axios.post(`${API_URL}/properties`, submitData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-properties'] });
      setIsAddModalOpen(false);
      setFormData({ title: '', description: '', propertyType: 'APARTMENT', address: '', region: 'Dar es Salaam', district: '', ward: '' });
      setImages([]);
      alert('Property added successfully! It is pending admin approval.');
    },
    onError: (err) => alert(err.response?.data?.message || 'Error adding property')
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    Array.from(images).forEach(file => submitData.append('images', file));
    addPropertyMutation.mutate(submitData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const navItems = [
    { id: 'overview', label: 'Overview', Icon: Home },
    { id: 'properties', label: 'Managed Properties', Icon: Building },
    { id: 'clients', label: 'Clients', Icon: Users },
    { id: 'leases', label: 'Leases', Icon: FileText },
    { id: 'payments', label: 'Payments', Icon: CreditCard },
    { id: 'maintenance', label: 'Maintenance', Icon: Wrench },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'profile', label: 'Profile', Icon: User },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-primary">{user.firstName} {user.lastName}</div>
              <div className="text-xs text-muted">Real Estate Agent</div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === id ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-primary'}`}
              >
                <Icon className={`h-5 w-5 mr-3 ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`} />
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 border-t border-gray-200 mt-auto">
          <button onClick={logout} className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-5 w-5 mr-3 text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'overview' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-primary">Agent Overview</h1>
              <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm transition-colors">
                <PlusCircle className="h-5 w-5 mr-2" /> Add Property
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-1">Active Listings</div>
                <div className="text-3xl font-bold text-primary mb-2">{propertiesData?.length || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-1">Pending Inquiries</div>
                <div className="text-3xl font-bold text-primary mb-2">0</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-1">Closed Deals</div>
                <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              </div>
            </div>

            {propertiesData && propertiesData.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="font-bold text-primary">My Managed Properties</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {propertiesData.map(prop => (
                    <li key={prop.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {prop.images?.[0] ? <img src={prop.images[0].url} className="h-full w-full object-cover" alt="" /> : <Building className="h-full w-full p-2 text-gray-300" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-primary">{prop.title}</h4>
                          <p className="text-sm text-gray-500">{prop.district}, {prop.region}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${prop.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {prop.status.replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-primary mb-2">Connect with Landlords</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-6">No properties assigned to you yet. Landlords can add you as their agent, or you can add properties directly.</p>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">Add a Property</button>
              </div>
            )}
          </>
        )}

        {activeTab === 'properties' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-primary">Managed Properties</h1>
              <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm transition-colors">
                <PlusCircle className="h-5 w-5 mr-2" /> Add Property
              </button>
            </div>
            {propsLoading ? <div className="text-center text-gray-500 py-8">Loading...</div> : propertiesData && propertiesData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {propertiesData.map(prop => (
                  <div key={prop.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      {prop.images?.[0] ? <img src={prop.images[0].url} className="h-full w-full object-cover" alt="" /> : <div className="h-full flex items-center justify-center"><Building className="h-12 w-12 text-gray-300" /></div>}
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-primary mb-1">{prop.title}</h4>
                      <p className="text-sm text-gray-500 mb-3">{prop.district}, {prop.region}</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${prop.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{prop.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No properties to manage yet.</p>
              </div>
            )}
          </>
        )}

        {['clients', 'leases', 'payments', 'maintenance', 'notifications', 'profile'].includes(activeTab) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <h2 className="text-2xl font-bold text-primary mb-2 capitalize">{activeTab}</h2>
            <p className="text-gray-500">This module is under development. Check back soon!</p>
          </div>
        )}

        {/* Add Property Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-primary">Add New Property</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Spacious 2-BDR Near Beach" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows="3"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      {['APARTMENT','HOUSE','VILLA','OFFICE','SHOP','HOSTEL','COMMERCIAL','LAND'].map(t => <option key={t} value={t}>{t.charAt(0)+t.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                    <input required type="text" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Dar es Salaam" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                    <input required type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Kinondoni" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ward *</label>
                    <input required type="text" value={formData.ward} onChange={e => setFormData({...formData, ward: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Mikocheni" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 123 Mwembechai Street" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Images</label>
                  <input type="file" multiple accept="image/*" onChange={e => setImages(e.target.files)} className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  <p className="text-xs text-gray-500 mt-1">Select multiple images. Max 5MB each.</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={addPropertyMutation.isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
                    {addPropertyMutation.isPending ? 'Saving...' : 'Save Property'}
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
