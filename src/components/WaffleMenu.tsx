import React from 'react';
import { Link } from 'react-router-dom';
import { Flag, Shield, Activity, Dumbbell, Timer, School as Pool, Waves, Mountain, Clock } from 'lucide-react';

interface AppItem {
  path: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
}

interface WaffleMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const apps: AppItem[] = [
  // Row 1
  {
    path: '/',
    name: 'Cross Country',
    description: 'Track races and results',
    icon: <Flag className="w-6 h-6" />,
    iconColor: 'text-blue-600'
  },
  {
    path: '/master-admin',
    name: 'Master Admin',
    description: 'System-wide controls',
    icon: <Shield className="w-6 h-6" />,
    iconColor: 'text-red-600'
  },
  {
    path: '/biometrics',
    name: 'Biometrics',
    description: 'Student fitness tracking',
    icon: <Activity className="w-6 h-6" />,
    iconColor: 'text-green-600'
  },
  // Row 2
  {
    path: '/coach',
    name: 'Coach Dashboard',
    description: 'Team management and training',
    icon: <Dumbbell className="w-6 h-6" />,
    iconColor: 'text-purple-600'
  },
  {
    path: '/athletics',
    name: 'Athletics Carnival',
    description: 'Track & field event management',
    icon: <Timer className="w-6 h-6" />,
    iconColor: 'text-amber-600'
  },
  {
    path: '/swimming',
    name: 'Swimming Carnival',
    description: 'Swimming time trials and events',
    icon: <Pool className="w-6 h-6" />,
    iconColor: 'text-cyan-600'
  },
  // Row 3
  {
    path: '/ocean-swim',
    name: 'Ocean Swim',
    description: 'Ocean swimming program',
    icon: <Waves className="w-6 h-6" />,
    iconColor: 'text-blue-600'
  },
  {
    path: '/city2surf',
    name: 'City2Surf',
    description: 'City2Surf training program',
    icon: <Mountain className="w-6 h-6" />,
    iconColor: 'text-purple-600'
  },
  {
    path: '/19for19',
    name: '19 For 19',
    description: '19-minute daily challenge',
    icon: <Clock className="w-6 h-6" />,
    iconColor: 'text-red-600'
  }
];

const WaffleMenu: React.FC<WaffleMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay to close menu when clicking outside */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      ></div>
      
      {/* Menu */}
      <div className="absolute right-0 mt-2 w-[800px] bg-white rounded-lg shadow-lg z-50">
        <div className="p-4">
          <h3 className="text-gray-900 font-medium mb-4">TAS Apps</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* Row 1 */}
            <div className="col-span-3 grid grid-cols-3 gap-4">
              {apps.slice(0, 3).map((app) => (
                <Link
                  key={app.path}
                  to={app.path}
                  onClick={onClose}
                  className="flex flex-col p-4 rounded-lg hover:bg-blue-50 text-gray-700 border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <div className={`${app.iconColor} mb-2`}>
                    {app.icon}
                  </div>
                  <div className="font-medium">{app.name}</div>
                  <div className="text-sm text-gray-500">{app.description}</div>
                </Link>
              ))}
            </div>
            {/* Row 2 */}
            <div className="col-span-3 grid grid-cols-3 gap-4">
              {apps.slice(3, 6).map((app) => (
                <Link
                  key={app.path}
                  to={app.path}
                  onClick={onClose}
                  className="flex flex-col p-4 rounded-lg hover:bg-blue-50 text-gray-700 border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <div className={`${app.iconColor} mb-2`}>
                    {app.icon}
                  </div>
                  <div className="font-medium">{app.name}</div>
                  <div className="text-sm text-gray-500">{app.description}</div>
                </Link>
              ))}
            </div>
            {/* Row 3 */}
            <div className="col-span-3 grid grid-cols-3 gap-4">
              {apps.slice(6).map((app) => (
                <Link
                  key={app.path}
                  to={app.path}
                  onClick={onClose}
                  className="flex flex-col p-4 rounded-lg hover:bg-blue-50 text-gray-700 border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <div className={`${app.iconColor} mb-2`}>
                    {app.icon}
                  </div>
                  <div className="font-medium">{app.name}</div>
                  <div className="text-sm text-gray-500">{app.description}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WaffleMenu;