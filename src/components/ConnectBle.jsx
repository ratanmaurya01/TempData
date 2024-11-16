import React, { useState } from "react";

export default function ConnectBle() {
  const [device, setDevice] = useState(null);
  const [error, setError] = useState(null);
  const [server, setServer] = useState(null); // Store GATT server

  const connectToDevice = async () => {
    try {
      // Request Bluetooth device without specific services
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true, // Accept all Bluetooth devices
      });

      // Connect to the device
      const server = await device.gatt.connect();
      setDevice(device);
      setServer(server); // Save the GATT server
      console.log("Connected to", device.name);
    } catch (err) {
      setError(err.message);
      console.error("Connection failed", err);
    }
  };

  const unpairDevice = () => {
    if (device && device.gatt.connected) {
      // Disconnect the device
      device.gatt.disconnect();
      console.log("Device disconnected");
      setDevice(null); // Clear the device from state
      setServer(null); // Clear the GATT server
    } else {
      console.log("No device connected");
    }
  };

  return (
    <>
      <div className="mt-10 ml-10">
        <div className="ml-10">
          <button
            type="button"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4
         focus:ring-blue-300 font-medium
          rounded-lg text-sm px-5 py-2.5 me-2 mb-2
           dark:bg-blue-600 dark:hover:bg-blue-700 
           focus:outline-none dark:focus:ring-blue-800"
            onClick={connectToDevice}
          >
            Connect to Bluetooth Device
          </button>

          {/* Unpair button */}
          {device && (
            <button
              type="button"
              className="text-white bg-red-700 hover:bg-red-800 focus:ring-4
           focus:ring-red-300 font-medium
            rounded-lg text-sm px-5 py-2.5 me-2 mb-2
             dark:bg-red-600 dark:hover:bg-red-700 
             focus:outline-none dark:focus:ring-red-800"
              onClick={unpairDevice}
            >
              Unpair Bluetooth Device
            </button>
          )}

          {/* Show connected device */}
          {device && <p>Connected to: {device.name}</p>}

          {/* Show error */}
          {error && <p style={{ color: "red" }}>Error: {error}</p>}
        </div>
      </div>
    </>
  );
}
