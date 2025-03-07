import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

interface ServiceDisabledOverlayProps {
  message: string;
}

const ServiceDisabledOverlay: React.FC<ServiceDisabledOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-red-900 bg-opacity-95 flex items-center justify-center z-50">
      <div className="max-w-md w-full p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-red-500 rounded-full blur opacity-25"></div>
            <Lock className="relative w-16 h-16 text-red-100" />
          </div>
          <AlertTriangle className="w-12 h-12 text-red-300" />
          <h2 className="text-2xl font-bold text-white">Service Disabled</h2>
          <p className="text-red-100 text-lg">{message}</p>
          <div className="mt-6 p-4 bg-red-950 rounded-lg">
            <p className="text-red-200 text-sm">
              Please contact your system administrator to restore access to this service.
            </p>
            <p className="text-red-300 text-xs mt-2">
              Administrator: hleahy@as.edu.au
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDisabledOverlay;