import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Flag, Users, Award, Home, PlusCircle, Settings, HelpCircle, LogOut, Grid } from 'lucide-react';
import HelpRequestModal from './HelpRequestModal';
import WaffleMenu from './WaffleMenu';
import useAuthStore from '../store/authStore';
import ServiceDisabledOverlay from './ServiceDisabledOverlay';
import { usePlatformStatus } from '../hooks/usePlatformStatus';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOut } = useAuthStore();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showWaffleMenu, setShowWaffleMenu] = useState(false);
  const { status, loading } = usePlatformStatus('cross_country');

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/finish-line', label: 'Finish Line', icon: <Flag size={20} /> },
    { path: '/quick-points', label: 'Quick Points', icon: <PlusCircle size={20} /> },
    { path: '/runners', label: 'Runners', icon: <Users size={20} /> },
    { path: '/results', label: 'Results', icon: <Award size={20} /> },
    { path: '/admin', label: 'Admin', icon: <Settings size={20} /> },
  ];

  const handleSignOut = async () => {
    await signOut();
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
      <header className="bg-blue-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <img 
                src="https://boardingexpo.com.au/wp-content/uploads/TAS_Logo_ExtHoriz_FullCol_RGB.jpg" 
                alt="TAS Logo" 
                className="h-10"
              />
            </Link>
            <h1 className="text-xl font-bold">TAS Cross Country</h1>
          </div>

          <div className="flex items-center space-x-4">
            {session && (
              <span className="text-sm">
                {session.user.email}
              </span>
            )}
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              title="Get Help"
            >
              <HelpCircle size={20} />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowWaffleMenu(!showWaffleMenu)}
                className="p-2 hover:bg-blue-700 rounded-full transition-colors"
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
                  className={`flex items-center px-6 py-3 hover:bg-blue-50 transition-colors ${
                    location.pathname === item.path ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <span className="mr-3 text-blue-600">{item.icon}</span>
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
          &copy; {new Date().getFullYear()} The Armidale School Cross Country System
        </div>
      </footer>

      {/* Help Request Modal */}
      <HelpRequestModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};

export default Layout;