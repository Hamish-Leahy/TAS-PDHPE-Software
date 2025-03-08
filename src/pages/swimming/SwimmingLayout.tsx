import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { School as Pool, Timer, Medal, Users, FileText, Shield, Home, LogOut, HelpCircle, Grid } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import WaffleMenu from '../../components/WaffleMenu';
import ServiceDisabledOverlay from '../../components/ServiceDisabledOverlay';
import { usePlatformStatus } from '../../hooks/usePlatformStatus';

interface LayoutProps {
  children: ReactNode;
}

const SwimmingLayout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showWaffleMenu, setShowWaffleMenu] = useState(false);
  const { status, loading } = usePlatformStatus('swimming');

  const navItems = [
    { path: '/swimming', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/swimming/events', label: 'Events', icon: <Pool size={20} /> },
    { path: '/swimming/time-trials', label: 'Time Trials', icon: <Timer size={20} /> },
    { path: '/swimming/results', label: 'Results', icon: <Medal size={20} /> },
    { path: '/swimming/records', label: 'Records', icon: <FileText size={20} /> },
    { path: '/swimming/admin', label: 'Admin', icon: <Shield size={20} /> }
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (status.status === 'disabled') {
    return <ServiceDisabledOverlay message={status.message} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-cyan-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <img 
                src="https://boardingexpo.com.au/wp-content/uploads/TAS_Logo_ExtHoriz_FullCol_RGB.jpg" 
                alt="TAS Logo" 
                className="h-10"
              />
            </Link>
            <h1 className="text-xl font-bold">TAS Swimming Carnival</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              className="p-2 hover:bg-cyan-700 rounded-full transition-colors"
              title="Get Help"
            >
              <HelpCircle size={20} />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-cyan-700 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowWaffleMenu(!showWaffleMenu)}
                className="p-2 hover:bg-cyan-700 rounded-full transition-colors"
                title="TAS Apps"
              >
                <Grid size={20} />
              </button>
              
              <WaffleMenu 
                isOpen={showWaffleMenu} 
                onClose={() => setShowWaffleMenu(false)} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-md">
          <ul className="py-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 hover:bg-cyan-50 transition-colors ${
                    location.pathname === item.path ? 'bg-cyan-100 border-l-4 border-cyan-600' : ''
                  }`}
                >
                  <span className="mr-3 text-cyan-600">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} The Armidale School Swimming Carnival System
        </div>
      </footer>
    </div>
  );
};

export default SwimmingLayout;