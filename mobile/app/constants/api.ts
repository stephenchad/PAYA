import Constants from 'expo-constants';

// ⚠️ REPLACE with your computer's LAN IP (e.g. 192.168.1.42)
// You can also set this via app.json `extra.apiUrl` later.
const LAN_IP = '192.168.1.42';

const getBaseUrl = () => {
  // If running on a physical device, use LAN IP
  if (Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${host}:4000`;
  }
  // Fallback
  return `http://${LAN_IP}:4000`;
};

export const API_URL = getBaseUrl();