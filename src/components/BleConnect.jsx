import React, { useState } from 'react';

const BluetoothCommunication = () => {
  const [device, setDevice] = useState(null);
  const [characteristic, setCharacteristic] = useState(null);
  const [currentBalance, setCurrentBalance] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Function to connect to the Bluetooth device
  const connectToBluetoothDevice = async () => {
    try {
      const newDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['your-service-uuid'] }], // Replace with your device's service UUID
        optionalServices: ['your-service-uuid'] // Replace with your optional service UUIDs if any
      });

      const server = await newDevice.gatt.connect();
      const service = await server.getPrimaryService('your-service-uuid'); // Replace with your service UUID
      const newCharacteristic = await service.getCharacteristic('your-characteristic-uuid'); // Replace with your characteristic UUID

      setDevice(newDevice);
      setCharacteristic(newCharacteristic);

      console.log('Connected to Bluetooth device');
    } catch (error) {
      setErrorMessage(`Error connecting to Bluetooth device: ${error.message}`);
    }
  };

  // Function to send the command and read the response
  const handleGetDataFromMeter = async () => {
    try {
      if (!characteristic) {
        setErrorMessage('Please connect to the Bluetooth device first.');
        return;
      }

      // Example command (adjust based on your specific command)
      const command = new Uint8Array([0x65, 0x04, 0x02, 0x86, 0x00, 0x02, 0x99, 0xBE]);

      // Write the command to the characteristic
      await characteristic.writeValue(command);
      console.log('Command sent:', command);

      // Add a delay to allow the device to respond
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Read the response from the characteristic
      const responseValue = await characteristic.readValue();
      const responseArray = new Uint8Array(responseValue.buffer);

      console.log('Response:', responseArray);

      // Process the response (extracting hexadecimal data, converting to decimal, etc.)
      if (responseArray.length >= 7) {
        const hexData = [
          responseArray[3].toString(16).padStart(2, '0'),
          responseArray[4].toString(16).padStart(2, '0'),
          responseArray[5].toString(16).padStart(2, '0'),
          responseArray[6].toString(16).padStart(2, '0')
        ].join('');

        const decimalValue = parseInt(hexData, 16);
        const formattedDecimal = (decimalValue / 100).toFixed(2);
        setCurrentBalance(formattedDecimal);
      } else {
        setErrorMessage('No valid data received.');
      }

    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
    }
  };

  // Function to send the write time command
  const handleWriteTime = async () => {
    try {
      if (!characteristic) {
        setErrorMessage('Please connect to the Bluetooth device first.');
        return;
      }

      // Example command to write time (modify this command as needed)
      const timeCommand = new Uint8Array([
        0x7F, 0x10, 0x00, 0x1E, 0x00, 0x06, 0x0C, 0x00, 0x0F, 0x00, 0x1E, 0x00,
        0x0F, 0x00, 0x04, 0x00, 0x0A, 0x00, 0x18, 0x2C, 0x21
      ]);

      // Send the write time command
      await characteristic.writeValue(timeCommand);
      console.log('Time command sent:', timeCommand);

    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className='text-center'>
      <h1>Bluetooth Communication</h1>

      {/* Connect button */}
      <button onClick={connectToBluetoothDevice}>
        Connect Bluetooth
      </button>

      {/* Display connection errors */}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {/* Button to get data from the meter */}
      <button onClick={handleGetDataFromMeter} disabled={!characteristic}>
        Get Data from Meter
      </button>

      {/* Display current balance */}
      {currentBalance && <p>Current Balance: {currentBalance}</p>}

      {/* Button to write time */}
      <button onClick={handleWriteTime} disabled={!characteristic}>
        Write Time to Device
      </button>
    </div>
  );
};

export default BluetoothCommunication;
