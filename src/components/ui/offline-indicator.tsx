import React from 'react';
import { useNetworkStatus } from '@/lib/network-status';
import { Badge } from './badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface OfflineIndicatorProps {
  onSync?: () => void;
  isSyncing?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSync, isSyncing }) => {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isOnline ? "default" : "destructive"} 
        className="flex items-center gap-1"
      >
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>
      
      {isOnline && wasOffline && onSync && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </Button>
      )}
    </div>
  );
};