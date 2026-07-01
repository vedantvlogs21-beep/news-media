
import React, { useState } from 'react';
import ApiService from '../services/apiService';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await ApiService.login(username, password);
      localStorage.setItem('kanosa_auth_token', response.token);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'लॉगिन अयशस्वी. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onCancel}></div>

      <div className="relative w-full max-w-md bg-white rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-[#E31E24] p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">Admin Access</h2>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-xs font-bold animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Admin Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-4 text-sm font-bold outline-none focus:border-[#E31E24] transition-all"
              placeholder="Admin"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-4 text-sm font-bold outline-none focus:border-[#E31E24] transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white font-black uppercase py-4 text-xs tracking-[0.2em] hover:bg-[#E31E24] transition-all shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  VERIFY & ENTER
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full text-gray-400 font-bold uppercase py-2 text-[9px] tracking-widest hover:text-black transition-all"
            >
              Cancel and Return
            </button>
          </div>
        </form>

        <div className="bg-gray-50 p-4 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">
            Kanosa Broadcasting Security System v2.6
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
