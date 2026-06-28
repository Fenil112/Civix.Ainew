import { useState, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, FileText, MapPin, Trophy, Bell, User,
  Plus, LogOut, ChevronLeft, ChevronRight,
  Users, BarChart3, ScrollText, Building2
} from 'lucide-react';

interface SidebarProps {
  role: 'citizen' | 'authority' | 'admin';
}

const citizenLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/report', icon: Plus, label: 'Report Issue' },
  { to: '/my-complaints', icon: FileText, label: 'My Complaints' },
  { to: '/nearby', icon: MapPin, label: 'Nearby Issues' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const authorityLinks = [
  { to: '/authority', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/authority/complaints', icon: FileText, label: 'Complaints' },
  { to: '/authority/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/authorities', icon: Building2, label: 'Authorities' },
  { to: '/admin/complaints', icon: FileText, label: 'Complaints' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const Sidebar = memo(function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = role === 'admin' ? adminLinks : role === 'authority' ? authorityLinks : citizenLinks;
  const roleLabel = { citizen: 'Citizen', authority: 'Authority', admin: 'Administrator' };
  const roleColor = { citizen: 'text-indigo-400', authority: 'text-emerald-400', admin: 'text-amber-400' };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen bg-surface-800 border-r border-white/5 flex flex-col fixed left-0 top-0 z-40 shadow-xl"
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-white/5 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-white font-bold text-sm font-display">C</span>
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold gradient-text font-display">CIVIX AI</span>
            <p className={`text-[10px] font-medium ${roleColor[role]}`}>{roleLabel[role]}</p>
          </div>
        )}
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} className="w-8 h-8 rounded-lg object-cover" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{userProfile?.displayName || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                title={collapsed ? link.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`flex-shrink-0 ${isActive ? 'w-5 h-5' : 'w-5 h-5'}`} />
                {!collapsed && <span className="font-medium">{link.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Community Score */}
      {!collapsed && role === 'citizen' && (
        <div className="mx-2 mb-2 p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20">
          <p className="text-xs text-slate-500 mb-1">Community Score</p>
          <p className="text-xl font-bold text-indigo-400">{userProfile?.communityScore || 0}</p>
        </div>
      )}

      {/* Footer */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors mt-1 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
});

export default Sidebar;
