import React from 'react';
import { 
  Home, PlusCircle, List, BarChart3, Settings, 
  LogOut, User, Shield, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'records' | 'add' | 'settings') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, userProfile, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'records', label: 'Records', icon: <List size={20} /> },
    { id: 'add', label: 'New Record', icon: <PlusCircle size={20} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-gray-900 text-white min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield size={24} />
          PurchaseTracker
        </h1>
        <p className="text-gray-400 text-sm mt-1">Professional Purchase Management</p>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <p className="font-medium">{userProfile?.name || 'User'}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Notifications & Logout */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
          <Bell size={20} />
          <span>Notifications</span>
          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
        </button>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-red-600 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-400">
          v2.0.0 • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;