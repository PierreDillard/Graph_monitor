// src/components/layout/Header.tsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Pause, Save, Layout, Settings, Download, Upload } from 'lucide-react';
import { RootState } from '../../store';

interface HeaderProps {
  onSaveLayout?: () => void;
  onLoadLayout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSaveLayout, onLoadLayout }) => {
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    // Ici, vous pouvez ajouter la logique pour démarrer/arrêter le monitoring GPAC
  };

  return (
    <header className="h-16 bg-gray-800 border-b border-gray-700 px-4">
      <div className="h-full max-w-screen-2xl mx-auto flex items-center justify-between">
        {/* Logo et titre */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white">GPAC Monitor</h1>
          <div className="h-6 w-px bg-gray-700" /> {/* Séparateur vertical */}
          <span className="text-sm text-gray-400">Dashboard</span>
        </div>

        {/* Actions principales */}
        <div className="flex items-center space-x-4">
          {/* Contrôles de monitoring */}
          <div className="flex items-center bg-gray-700 rounded-lg p-1">
            <button
              onClick={toggleMonitoring}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${isMonitoring 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
                }`}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Monitoring
                </>
              )}
            </button>
          </div>

          {/* Séparateur */}
          <div className="h-6 w-px bg-gray-700" />

          {/* Boutons de layout */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onSaveLayout}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white text-sm"
            >
              <Save className="w-4 h-4" />
              Save Layout
            </button>
            <button
              onClick={onLoadLayout}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white text-sm"
            >
              <Download className="w-4 h-4" />
              Load Layout
            </button>
          </div>

          {/* Séparateur */}
          <div className="h-6 w-px bg-gray-700" />

          {/* Actions supplémentaires */}
          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
              title="Layout Settings"
            >
              <Layout className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
              title="Export Data"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;