
import { useState, useCallback } from 'react';
import { NeuroLinkDevice } from '../types';

export interface UseNeuroLinkResult {
  isScanning: boolean;
  discoveredDevices: NeuroLinkDevice[];
  error: string | null;
  startScan: () => Promise<void>;
  // Future: connectDevice: (deviceId: string) => Promise<BluetoothDevice | null>;
  // Future: disconnectDevice: () => Promise<void>;
  // Future: connectedDevice: BluetoothDevice | null;
}

export const useNeuroLink = (): UseNeuroLinkResult => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<NeuroLinkDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  // const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);

  const startScan = useCallback(async () => {
    if (!navigator.bluetooth) {
      const msg = 'Web Bluetooth API is not available in this browser.';
      setError(msg);
      console.error(msg);
      return;
    }

    setIsScanning(true);
    setError(null);
    setDiscoveredDevices([]); // Clear previous devices for a new scan result

    try {
      console.log('Requesting Bluetooth device...');
      // For a real application, you would filter by services known to be exposed by your target BCIs.
      // Example filters:
      // const options = {
      //   filters: [
      //     { services: ['brain_computer_interface_service_uuid'] }, // Hypothetical service UUID
      //     { namePrefix: 'Muse' },
      //     { namePrefix: 'Emotiv' },
      //   ],
      //   optionalServices: ['battery_service', 'device_information'] // Common optional services
      // };
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true, // For this PoC, accept all. **In production, MUST filter for security and UX.**
      });

      const foundDevice: NeuroLinkDevice = { id: device.id, name: device.name || 'Unknown Device' };
      console.log('Bluetooth device found:', foundDevice);
      setDiscoveredDevices([foundDevice]); // For PoC, show only the selected device
      
      // Here you would typically attempt to connect:
      // await connectToDevice(device);

    } catch (err) {
      const typedError = err as Error;
      console.error('Bluetooth scan/selection error:', typedError.message, typedError.name);
      if (typedError.name === 'NotFoundError') {
        setError('No Bluetooth devices found or user cancelled selection.');
      } else if (typedError.name === 'SecurityError') {
        setError('Bluetooth access denied. Ensure Bluetooth is enabled and permissions are granted.');
      }
      else {
        setError(`Bluetooth error: ${typedError.message}`);
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Placeholder for future connect logic
  // const connectToDevice = useCallback(async (device: BluetoothDevice) => {
  //   try {
  //     console.log(`Connecting to ${device.name || device.id}...`);
  //     const server = await device.gatt?.connect();
  //     console.log('Connected to GATT server:', server);
  //     setConnectedDevice(device);
  //     setError(null);
  //     // device.addEventListener('gattserverdisconnected', () => { /* handle disconnect */ });
  //     // Discover services and characteristics...
  //   } catch (err) {
  //     const typedError = err as Error;
  //     console.error('Bluetooth connection error:', typedError.message);
  //     setError(`Failed to connect: ${typedError.message}`);
  //     setConnectedDevice(null);
  //   }
  // }, []);


  return { isScanning, discoveredDevices, error, startScan };
};
