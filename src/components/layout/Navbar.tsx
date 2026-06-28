import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Navbar() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('isRead', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.size));
    return unsub;
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isLanding = location.pathname === '/';

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isLanding ? 'glass-dark shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <span className="text-white font-bold text-sm font-display">C</span>
            </motion.div>
            <div>
              <span className="text-lg font-bold gradient-text font-display">CIVIX</span>
              <span className="text-slate-400 text-xs block leading-none">AI Platform</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {isLanding && (
              <>
                <a href="#features" className="text-slate-300 hover:text-white text-sm transition-colors">Features</a>
                <a href="#how-it-works" className="text-slate-300 hover:text-white text-sm transition-colors">How It Works</a>
                <a href="#impact" className="text-slate-300 hover:text-white text-sm transition-colors">Impact</a>
                <a href="#faq" className="text-slate-300 hover:text-white text-sm transition-colors">FAQ</a>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Bell className="w-5 h-5 text-slate-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} className="w-8 h-8 rounded-lg object-cover" alt="Profile" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                        {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-52 glass-dark rounded-xl shadow-xl overflow-hidden"
                        onMouseLeave={() => setProfileOpen(false)}
                      >
                        <div className="p-3 border-b border-white/5">
                          <p className="text-sm font-medium text-slate-200">{userProfile?.displayName}</p>
                          <p className="text-xs text-slate-500 capitalize">{userProfile?.role}</p>
                        </div>
                        <div className="p-1">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            <User className="w-4 h-4" /> Profile
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm btn-primary text-white rounded-xl font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark border-t border-white/5"
          >
            <div className="px-4 py-4 space-y-2">
              {isLanding && (
                <>
                  <a href="#features" className="block py-2 text-slate-300 text-sm" onClick={() => setMobileOpen(false)}>Features</a>
                  <a href="#how-it-works" className="block py-2 text-slate-300 text-sm" onClick={() => setMobileOpen(false)}>How It Works</a>
                  <a href="#impact" className="block py-2 text-slate-300 text-sm" onClick={() => setMobileOpen(false)}>Impact</a>
                </>
              )}
              {!user && (
                <>
                  <Link to="/login" className="block py-2 text-slate-300 text-sm" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  <Link to="/register" className="block py-2 text-indigo-400 text-sm font-medium" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
