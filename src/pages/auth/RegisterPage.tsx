import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, CheckCircle, Phone, Shield } from 'lucide-react';
import type { UserRole } from '../../types';

export default function RegisterPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'citizen' as UserRole,
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required';
    if (!form.email) return 'Email is required';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) return toast.error(error);

    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name, form.role, form.phone);
      toast.success('Account created! Please verify your email.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : err.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Account created with Google!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];

  const perks = [
    'Track all your complaints in real-time',
    'AI-powered issue categorization',
    'Earn community badges & rewards',
    'Push notifications on updates',
  ];

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-surface-900 to-indigo-900/60" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 40% 40%, rgba(168,85,247,0.25) 0%, transparent 60%), radial-gradient(circle at 60% 70%, rgba(99,102,241,0.2) 0%, transparent 60%)'
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold font-display">C</span>
            </div>
            <span className="text-xl font-bold gradient-text font-display">CIVIX AI</span>
          </Link>

          <div>
            <h2 className="text-4xl font-bold text-white font-display mb-4 leading-tight">
              Join thousands of<br />active citizens
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Make your voice heard. Report issues that matter in your community.
            </p>

            <div className="space-y-3">
              {perks.map((perk, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{perk}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-sm">© 2024 CIVIX AI</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-1 text-slate-500 text-sm hover:text-slate-300 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <div className="glass rounded-2xl p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white font-display mb-2">Create Account</h1>
              <p className="text-slate-400 text-sm">Start reporting civic issues in your community</p>
            </div>

            {/* Google Sign Up */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 glass border border-white/10 rounded-xl text-slate-300 text-sm font-medium hover:border-indigo-500/30 hover:text-white transition-all mb-6 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="relative flex items-center mb-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="px-3 text-xs text-slate-600">or register with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={update('name')}
                    placeholder="Your full name"
                    className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="you@example.com"
                    className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder="+91 99999 99999"
                    className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Register As</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={form.role}
                    onChange={update('role')}
                    className="w-full input-dark rounded-xl pl-10 pr-10 py-3 text-sm appearance-none bg-[#0b0f19] border border-white/10"
                    required
                  >
                    <option value="citizen">Citizen</option>
                    <option value="authority">Authority</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={update('password')}
                    placeholder="Min. 8 characters"
                    className="w-full input-dark rounded-xl pl-10 pr-10 py-3 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength indicator */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i <= strength ? strengthColor[strength] : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{strengthLabel[strength]} password</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={update('confirmPassword')}
                    placeholder="Repeat your password"
                    className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-sm"
                    required
                  />
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 btn-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Sign in
              </Link>
            </p>

            <p className="text-center text-xs text-slate-600 mt-4">
              By signing up, you agree to our{' '}
              <a href="#" className="text-slate-500 hover:text-slate-300">Terms</a> and{' '}
              <a href="#" className="text-slate-500 hover:text-slate-300">Privacy Policy</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
