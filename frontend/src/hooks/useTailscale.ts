import { useState, useEffect, useRef } from 'react';
import { getApiBase, getWsBase } from '../utils/apiBase';
import { OfflineQueue } from '../utils/offlineQueue';

export const useTailscale = () => {
  const [connected, setConnected] = useState(false);
  const [tailscaleIp, setTailscaleIp] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [peers, setPeers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>({});
  const [systemStats, setSystemStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: any;
    let pollInterval: any;

    const connectWs = () => {
      const ws = new WebSocket(`${getWsBase()}/api/v1/ws/tailscale`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        if (pollInterval) clearInterval(pollInterval);
        
        // Drain offline queue if any
        const items = OfflineQueue.getItems();
        if (items.length > 0) {
          fetch(`${getApiBase()}/api/v1/sync/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
          }).then((res) => {
            if (res.ok) {
              OfflineQueue.clear();
            } else {
              console.error('Failed to push offline queue to backend');
            }
          }).catch(console.error);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'tailscale_status') {
            setConnected(data.payload.connected);
            setTailscaleIp(data.payload.tailscale_ip);
            setRemoteUrl(data.payload.frontend_url);
            setPeers(data.payload.peers || []);
            setIsLoading(false);
          } else if (data.type === 'health_update') {
            setHealth(data.payload);
          } else if (data.type === 'system_stats') {
            setSystemStats(data.payload);
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        reconnectTimer = setTimeout(connectWs, 5000);
        // Fallback polling
        startFallbackPolling();
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    const startFallbackPolling = () => {
      if (pollInterval) clearInterval(pollInterval);
      const poll = async () => {
        try {
          const res = await fetch(`${getApiBase()}/api/v1/tailscale/status`);
          const data = await res.json();
          setConnected(data.connected);
          setTailscaleIp(data.tailscale_ip);
          setRemoteUrl(data.frontend_url);
          setPeers(data.peers || []);
          setIsLoading(false);
        } catch (e) {
          console.error("Polling error", e);
        }
      };
      poll();
      pollInterval = setInterval(poll, 10000);
    };

    connectWs();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  return { connected, tailscaleIp, remoteUrl, peers, health, systemStats, isLoading, wsStatus };
};
