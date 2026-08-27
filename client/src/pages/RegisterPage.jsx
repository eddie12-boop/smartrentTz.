import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Home, X, Key, Building2, Briefcase, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const API_URL = 'http://localhost:5000/api';

const registerSchema = z.object({
  firstName: z.string().min(2, "Jina la kwanza linahitajika (angalau herufi 2)"),
  lastName: z.string().min(2, "Jina la mwisho linahitajika (angalau herufi 2)"),
  email: z.string().email("Barua pepe si sahihi"),
  phone: z.string().min(10, "Namba ya simu inahitajika (angalau tarakimu 10)"),
  password: z.string().min(6, "Nenosiri lazima liwe na angalau herufi 6"),
  nidaNumber: z.string().optional(),
  role: z.enum(['TENANT', 'LANDLORD', 'AGENT', 'ADMIN'])
});

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCredential, setPendingCredential] = useState(null);
  const [selectedRole, setSelectedRole] = useState('TENANT');
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'TENANT' }
  });

  const currentRole = watch('role');

  const redirectByRole = (role) => {
    if (role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'LANDLORD') {
      navigate('/landlord/dashboard', { replace: true });
    } else if (role === 'AGENT') {
      navigate('/agent/dashboard', { replace: true });
    } else {
      navigate('/tenant/dashboard', { replace: true });
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data);
      const { token, user } = response.data.data;
      
      // Save credentials to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Trigger storage event for UI reactivity
      window.dispatchEvent(new Event('storage'));
      
      // Redirect accurately to specific dashboard
      redirectByRole(user.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Usajili umeshindikana. Tafadhali jaribu tena.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse, roleOverride = null) => {
    setError('');
    try {
      const payload = { credential: credentialResponse.credential };
      if (roleOverride) payload.role = roleOverride;
      
      const response = await axios.post(`${API_URL}/auth/google`, payload);
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('storage'));
      
      setPendingCredential(null);
      redirectByRole(user.role);
    } catch (err) {
      const code = err.response?.data?.errorCode;
      if (code === 'ROLE_REQUIRED') {
        setPendingCredential(credentialResponse);
      } else {
        setError(err.response?.data?.message || 'Usajili wa Google umeshindikana.');
      }
    }
  };

  const handleRoleConfirm = () => {
    if (pendingCredential) handleGoogleSuccess(pendingCredential, selectedRole);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-primary p-3.5 rounded-2xl shadow-lg flex items-center justify-center">
            <Home className="h-8 w-8 text-accent" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-2xl font-extrabold text-gray-900">
          Fungua Akaunti Mpya (SmartRent TZ)
        </h2>
        <p className="mt-2 text-center text-xs text-gray-600">
          Tayari una akaunti?{' '}
          <Link to="/login" className="font-bold text-accent hover:underline">
            Ingia Hapa (Sign in)
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          {/* Google Sign-Up */}
          <div className="mb-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-up failed. Please try again.')}
              width="400"
              text="signup_with"
              shape="rectangular"
              logo_alignment="center"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400 font-semibold uppercase">au jiunge kwa barua pepe</span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Role Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Chagua Aina ya Akaunti (Role) *</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', 'TENANT')}
                  className={`flex flex-col items-center justify-center p-3.5 border-2 rounded-xl text-center transition-all ${
                    currentRole === 'TENANT'
                      ? 'border-accent bg-emerald-50 text-primary font-bold shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                  }`}
                >
                  <Key className={`w-5 h-5 mb-1.5 ${currentRole === 'TENANT' ? 'text-accent' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold">Mpangaji</span>
                  <span className="text-[10px] text-gray-400">Tenant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', 'LANDLORD')}
                  className={`flex flex-col items-center justify-center p-3.5 border-2 rounded-xl text-center transition-all ${
                    currentRole === 'LANDLORD'
                      ? 'border-accent bg-emerald-50 text-primary font-bold shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                  }`}
                >
                  <Building2 className={`w-5 h-5 mb-1.5 ${currentRole === 'LANDLORD' ? 'text-accent' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold">Mwenye Nyumba</span>
                  <span className="text-[10px] text-gray-400">Landlord / NHC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('role', 'AGENT')}
                  className={`flex flex-col items-center justify-center p-3.5 border-2 rounded-xl text-center transition-all ${
                    currentRole === 'AGENT'
                      ? 'border-accent bg-emerald-50 text-primary font-bold shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                  }`}
                >
                  <Briefcase className={`w-5 h-5 mb-1.5 ${currentRole === 'AGENT' ? 'text-accent' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold">Wakala / Dalali</span>
                  <span className="text-[10px] text-gray-400">Agent</span>
                </button>
              </div>
              <input type="hidden" {...register('role')} />
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Jina la Kwanza *</label>
                <input
                  {...register('firstName')}
                  type="text"
                  placeholder="Mfano: Juma"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-accent outline-none"
                />
                {errors.firstName && <p className="mt-1 text-[11px] text-red-600">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Jina la Ukoo *</label>
                <input
                  {...register('lastName')}
                  type="text"
                  placeholder="Mfano: Masawe"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-accent outline-none"
                />
                {errors.lastName && <p className="mt-1 text-[11px] text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Barua Pepe (Email) *</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="juma@example.com"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-accent outline-none"
                />
                {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nambari ya Simu *</label>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="0712345678"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-accent outline-none"
                />
                {errors.phone && <p className="mt-1 text-[11px] text-red-600">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nenosiri (Password) *</label>
              <input
                {...register('password')}
                type="password"
                placeholder="Angalau herufi 6"
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-accent outline-none"
              />
              {errors.password && <p className="mt-1 text-[11px] text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nambari ya Kitambulisho cha NIDA (Hiari / Optional)
              </label>
              <input
                {...register('nidaNumber')}
                type="text"
                maxLength={24}
                placeholder="Tarakimu 20 za NIDA (NIN)"
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-accent outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-60"
              >
                {isLoading ? 'Inafungua Akaunti...' : 'Kamilisha Usajili (Create Account)'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Role Selection Modal for new Google users */}
      {pendingCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Chagua Aina ya Akaunti Yako</h2>
              <button onClick={() => setPendingCredential(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-4">Utautumiaje mfumo wa SmartRent TZ?</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { role: 'TENANT', label: 'Mpangaji', desc: 'Kutafuta na kupanga nyumba', emoji: '🔑' },
                  { role: 'LANDLORD', label: 'Mwenye Nyumba', desc: 'Kupangisha na kusimamia majengo', emoji: '🏠' },
                  { role: 'AGENT', label: 'Wakala', desc: 'Kusimamia wateja na miradi', emoji: '💼' },
                ].map(({ role, label, desc, emoji }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`flex flex-col items-center p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedRole === role ? 'border-accent bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mb-1.5">{emoji}</span>
                    <span className="font-bold text-gray-900 text-xs">{label}</span>
                    <span className="text-[10px] text-gray-400 mt-1 text-center">{desc}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRoleConfirm}
                className="w-full py-2.5 bg-accent hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                Endelea kama {selectedRole === 'TENANT' ? 'Mpangaji' : selectedRole === 'LANDLORD' ? 'Mwenye Nyumba' : 'Wakala'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
