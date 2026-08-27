import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Home, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const loginSchema = z.object({
  email: z.string().email({ message: "Barua pepe si sahihi" }),
  password: z.string().min(6, { message: "Nenosiri lazima liwe na angalau herufi 6" })
});

const API_URL = 'http://localhost:5000/api';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCredential, setPendingCredential] = useState(null);
  const [selectedRole, setSelectedRole] = useState('TENANT');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

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
      const response = await axios.post(`${API_URL}/auth/login`, data);
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('storage'));
      
      redirectByRole(user.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Kuingia kumeshindikana. Tafadhali hakiki barua pepe na nenosiri lako.');
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
        setError(err.response?.data?.message || 'Kuingia kwa Google kumeshindikana. Tafadhali jaribu tena.');
      }
    }
  };

  const handleRoleConfirm = () => {
    if (pendingCredential) {
      handleGoogleSuccess(pendingCredential, selectedRole);
    }
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
          Ingia Kwenye Akaunti Yako
        </h2>
        <p className="mt-2 text-center text-xs text-gray-600">
          Huna akaunti bado?{' '}
          <Link to="/register" className="font-bold text-accent hover:underline">
            Fungua Akaunti Hapa (Register)
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {/* Google Sign-In Button */}
          <div className="mb-6">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                useOneTap={false}
                width="360"
                text="signin_with"
                shape="rectangular"
                logo_alignment="center"
              />
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400 font-semibold uppercase">au ingia kwa barua pepe</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold" role="alert">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Barua Pepe (Email)</label>
              <input
                {...register('email')}
                type="email"
                className={`w-full p-2.5 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-xl text-xs focus:ring-2 focus:ring-accent outline-none`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nenosiri (Password)</label>
              <input
                {...register('password')}
                type="password"
                className={`w-full p-2.5 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-xl text-xs focus:ring-2 focus:ring-accent outline-none`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-[11px] text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded mr-2" />
                Nikumbuke
              </label>
              <a href="#" className="font-semibold text-accent hover:underline">Umesahau nenosiri?</a>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-60"
              >
                {isLoading ? 'Inaingia...' : 'Ingia Sasa (Sign In)'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block text-center mb-2">Akaunti za Majaribio (Demo Accounts)</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-center font-mono">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-gray-700 truncate" title="tenant@smartrent.test">
                tenant@smartrent.test
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-gray-700 truncate" title="landlord@smartrent.test">
                landlord@smartrent.test
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-gray-700 truncate" title="agent@smartrent.test">
                agent@smartrent.test
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-gray-700 truncate" title="admin@smartrent.test">
                admin@smartrent.test
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">Nenosiri la akaunti zote: <span className="font-bold text-gray-600">password123</span></p>
          </div>
        </div>
      </div>

      {/* Role Selection Modal for new Google users */}
      {pendingCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Kamilisha Usajili Wako</h2>
              <button onClick={() => setPendingCredential(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-4">Kwa kuwa hii ni mara yako ya kwanza, tafadhali chagua aina ya akaunti:</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { role: 'TENANT', label: 'Mpangaji', desc: 'Kutafuta nyumba', emoji: '🔑' },
                  { role: 'LANDLORD', label: 'Mwenye Nyumba', desc: 'Kusimamia majengo', emoji: '🏠' },
                  { role: 'AGENT', label: 'Wakala', desc: 'Usimamizi wa miradi', emoji: '💼' },
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
