import { useEffect, useRef } from 'react';
import { getApiBase } from '../utils/apiBase';
import { useTailscale } from './useTailscale';

export const useDeviceRegistration = () => {
  const { connected, tailscaleIp } = useTailscale();
  const registered = useRef(false);

  useEffect(() => {
    if (connected && tailscaleIp && !registered.current) {
      const platform = /android/i.test(navigator.userAgent) ? 'android' 
                     : /ipad|iphone|ipod/i.test(navigator.userAgent) ? 'ios'
                     : /windows/i.test(navigator.userAgent) ? 'windows'
                     : /linux/i.test(navigator.userAgent) ? 'linux'
                     : /mac/i.test(navigator.userAgent) ? 'mac' : 'unknown';
                     
      const device = {
        tailscale_ip: tailscaleIp,
        name: `Device-${Math.floor(Math.random() * 1000)}`,
        platform,
        browser: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height
      };
      
      fetch(`${getApiBase()}/api/v1/devices/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device)
      }).then((res) => {
        if (res.ok) {
          registered.current = true;
        } else {
          console.error("Failed to register device");
        }
      }).catch(console.error);
    }
  }, [connected, tailscaleIp]);
};
