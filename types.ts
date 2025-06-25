import React from 'react';

export interface AppWindowContentProps {
  instanceId: string;
  // Future: isFocused: boolean;
  // Future: requestClose: () => void;
}

export interface AppDefinition {
  id: string; // Unique ID for the app type (e.g., 'mindCLI')
  name: string; // Display name for the app / window title
  icon?: React.ReactNode; // Optional icon for the app
  component: React.FC<AppWindowContentProps>;
  defaultSize: { width: number | string; height: number | string };
  defaultPosition?: { x: number; y: number };
  isDefaultOpen?: boolean; // If true, opens on OS start
  singleton?: boolean; // If true, only one instance can be open
}

export interface OpenAppInstance {
  instanceId: string; // Unique ID for this specific window instance (e.g., mindCLI-1)
  appDefId: string; // ID of the AppDefinition (e.g., 'mindCLI')
  title: string;
  component: React.FC<AppWindowContentProps>;
  position: { x: number; y: number };
  size: { width: number | string; height: number | string };
  zIndex: number;
  isMinimized: boolean;
  // Potentially other state like isMaximized, etc.
}

export interface Message {
  id:string;
  text: string;
  sender: 'user' | 'ai' | 'system' | 'tool_result';
  timestamp: Date;
  toolName?: string; // Optional: for system messages about tool execution
}

// NeuroLink types
export interface NeuroLinkDevice {
    id: string;
    name: string | null;
}

// --- Tool Factory Types ---
export interface ToolParameter {
  name: string; // e.g., "url", "expression"
  type: string; // e.g., "string", "number", "boolean" (for documentation, not strictly enforced at runtime yet)
  description: string; // Description of the parameter
}

export interface ToolDefinition {
  id: string; // Unique ID for the tool, can be toolName if unique
  toolName: string; // Unique camelCase name, e.g., "fetchAndSummarizeUrl", "calculator"
  description: string; // Natural language description of what the tool does
  parameters: ToolParameter[]; // Array of parameters the tool's function accepts
  code: string; // JavaScript code string (body of the function)
}

export interface ToolCallRequest {
  tool_call: {
    name: string;
    arguments: Record<string, any>; // e.g., { "url": "https://example.com" }
  };
}


// --- Web Bluetooth API Type Declarations ---
// These are minimal types for the Web Bluetooth API features used in this application.
// For comprehensive type safety, consider installing `@types/web-bluetooth`
// and configuring `lib: ["dom", "webbluetooth"]` in your tsconfig.json.

type BluetoothServiceUUID = string | number;

interface BluetoothRequestDeviceOptions {
  filters?: Array<{
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
    // manufacturerId?: number; // Example of other filter options
    // Other BluetoothLEScanFilter properties as needed
  }>;
  optionalServices?: BluetoothServiceUUID[];
  acceptAllDevices?: boolean;
}

// Based on the usage in useNeuroLink.ts (device.id, device.name, device.gatt)
interface ActualBluetoothDevice {
  id: string;
  name?: string | null;
  gatt?: BluetoothRemoteGATTServer | null;
  // Add other BluetoothDevice properties/methods if used, e.g.,
  // addEventListener(type: 'gattserverdisconnected', listener: (this: ActualBluetoothDevice, ev: Event) => any): void;
  // removeEventListener(type: 'gattserverdisconnected', listener: (this: ActualBluetoothDevice, ev: Event) => any): void;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  // getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  // Add other BluetoothRemoteGATTServer properties/methods if used
}

/*
// Example for BluetoothRemoteGATTService if needed in the future
interface BluetoothRemoteGATTService {
  readonly device: ActualBluetoothDevice;
  readonly isPrimary: boolean;
  readonly uuid: string;
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  // ... other methods
}

type BluetoothCharacteristicUUID = string | number;

// Example for BluetoothRemoteGATTCharacteristic if needed in the future
interface BluetoothRemoteGATTCharacteristic {
  // ... properties and methods likereadValue(), writeValue(), startNotifications()
}
*/

interface Bluetooth {
  requestDevice(options?: BluetoothRequestDeviceOptions): Promise<ActualBluetoothDevice>;
  getAvailability?(): Promise<boolean>; // Optional: Check if Bluetooth is available
  // getDevices?(): Promise<ActualBluetoothDevice[]>; // Optional: Get paired devices
}

declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
}
