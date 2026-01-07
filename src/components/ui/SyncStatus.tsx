import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SyncStatusProps {
  isSyncing: boolean;
  lastSync: number | null;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ isSyncing, lastSync }) => {
  const [online, setOnline] = useState(navigator.onLine);
  const [timeSinceSync, setTimeSinceSync] = useState('');

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateTimeSinceSync = () => {
      if (!lastSync) {
        setTimeSinceSync('Never');
        return;
      }

      const seconds = Math.floor((Date.now() - lastSync) / 1000);
      
      if (seconds < 60) {
        setTimeSinceSync(`${seconds}s ago`);
      } else if (seconds < 3600) {
        setTimeSinceSync(`${Math.floor(seconds / 60)}m ago`);
      } else if (seconds < 86400) {
        setTimeSinceSync(`${Math.floor(seconds / 3600)}h ago`);
      } else {
        setTimeSinceSync(`${Math.floor(seconds / 86400)}d ago`);
      }
    };

    updateTimeSinceSync();
    const interval = setInterval(updateTimeSinceSync, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastSync]);

  const getStatusColor = () => {
    if (!online) return 'bg-red-100 text-red-800';
    if (isSyncing) return 'bg-yellow-100 text-yellow-800';
    if (!lastSync || Date.now() - lastSync > 3600000) { // More than 1 hour
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStatusIcon = () => {
    if (!online) return <CloudOff size={14} />;
    if (isSyncing) return <RefreshCw size={14} className="animate-spin" />;
    if (!lastSync || Date.now() - lastSync > 3600000) {
      return <AlertCircle size={14} />;
    }
    return <CheckCircle size={14} />;
  };

  const getStatusText = () => {
    if (!online) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (!lastSync) return 'Not synced yet';
    if (Date.now() - lastSync > 3600000) return 'Sync required';
    return 'Synced';
  };

  return (
    <div className={`fixed bottom-4 right-4 px-3 py-2 rounded-lg shadow-lg ${getStatusColor()} flex items-center gap-2 text-sm z-50`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {lastSync && (
        <span className="ml-2 text-xs opacity-75">
          Last sync: {timeSinceSync}
        </span>
      )}
    </div>
  );
};

export default SyncStatus;