"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, AlertCircle, Eye, EyeOff, Mail, Lock, User, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Failed to create account.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8eaff] via-[#f0f4ff] to-[#f8f9ff] flex flex-col font-sans relative">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(165,180,252,0.15),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(165,180,252,0.15),transparent_50%)] pointer-events-none"></div>

      {/* Header */}
      <header className="w-full flex items-center justify-between p-6 md:px-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            L
          </div>
          <span className="font-extrabold text-blue-700 text-xl tracking-tight">Learn-Sphere AI</span>
        </div>
        <div className="hidden md:block text-sm font-medium text-slate-600">
          Academic excellence through intelligence
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10">
        <div className="max-w-[1100px] w-full bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row min-h-[650px]">
          
          {/* Left Panel */}
          <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#f8f9ff] to-[#e6e9fc] p-12 flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-5xl font-bold leading-tight text-slate-900 mb-2">
                Elevate your<br />
                <span className="text-blue-600">intellectual journey.</span>
              </h1>
              <p className="text-slate-600 mt-6 text-base leading-relaxed max-w-sm">
                Access cutting-edge academic AI tools designed for researchers and lifelong learners.
              </p>
              
              <div className="mt-12 inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/40 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-slate-800">Trusted by 50,000+ Researchers</span>
              </div>

              <div className="mt-8 flex items-center">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/150?img=1" alt="Avatar" /></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-green-100 flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/150?img=2" alt="Avatar" /></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/150?img=3" alt="Avatar" /></div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    +12k
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Signup Form */}
          <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
            
            {/* Toggle Switch */}
            <div className="bg-slate-100 p-1 rounded-full flex items-center max-w-[240px] mx-auto md:mx-0 mb-10 border border-slate-200/60 shadow-sm">
              <Link href="/login" className="flex-1 text-center py-2 text-xs font-bold rounded-full text-slate-500 hover:text-slate-700 transition-all">
                Login
              </Link>
              <Link href="/signup" className="flex-1 text-center py-2 text-xs font-bold rounded-full bg-white text-blue-600 shadow-sm transition-all">
                Sign Up
              </Link>
            </div>

            <div className="space-y-2 mb-8 text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
              <p className="text-slate-500 text-sm">Please enter your details to join our platform.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-slate-900 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    type="email" 
                    required
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-slate-900 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-slate-900 transition-all font-mono"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#004ce6] disabled:opacity-50 hover:bg-[#003bb3] text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Sign Up</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs font-medium text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-[#004ce6] hover:underline font-bold">
                Log In
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex flex-col md:flex-row items-center justify-between p-6 md:px-12 text-sm text-slate-500 bg-white/50 backdrop-blur-sm border-t border-slate-200/50 relative z-10 mt-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-2 text-center md:text-left mb-4 md:mb-0">
          <span className="font-bold text-blue-700">Learn-Sphere AI</span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span>&copy; 2024 Learn-Sphere AI. Academic excellence through intelligence.</span>
        </div>
        <div className="flex items-center gap-6 font-medium">
          <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Help Center</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Contact Us</a>
        </div>
      </footer>
    </div>
  );
}
