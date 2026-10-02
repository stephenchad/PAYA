import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

export function useBiometricLock() {
  const [isLocked, setIsLocked] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsSupported(hasHardware && enrolled);
      if (!hasHardware || !enrolled) {
        setIsLocked(false); // no biometrics → don't lock
      }
    })();
  }, []);

  const unlock = useCallback(async () => {
    if (!isSupported) {
      setIsLocked(false);
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock PAYA',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [isSupported]);

  return { isLocked, isSupported, unlock };
}