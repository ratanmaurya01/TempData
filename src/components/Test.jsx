import React, { useState } from 'react';

function Test() {
  const [status, setStatus] = useState('');
  const [receivedData, setReceivedData] = useState('');
  const [port, setPort] = useState(null); // Store the serial port
  const [reader, setReader] = useState(null); // Store the reader to reuse

  // Function to open the serial port
  const openSerialPort = async () => {
    try {
      setStatus('Requesting port...');
      
      // Request a port
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });

      // Set up communication parameters
      setStatus('Port opened. Writing command...');
      
      // Write the command
      const writer = selectedPort.writable.getWriter();
      const command = new Uint8Array([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x02, 0xFB, 0xA5]);
      await writer.write(command);
      writer.releaseLock();

      // Set the port and reader in state to use later
      const portReader = selectedPort.readable.getReader();
      setPort(selectedPort);
      setReader(portReader);

      setStatus('Command sent. Ready to read data.');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  // Function to read data from the port when the button is clicked
  const readData = async () => {
    if (!port || !reader) {
      setStatus('Please open the port first.');
      return;
    }

    try {
      setStatus('Reading response...');
      
      // Read data from the port
      const { value, done } = await reader.read();

      if (!done) {
        // Process the received data
        const receivedHex = Array.from(value).map(byte => byte.toString(16).padStart(2, '0')).join(' ');
        setReceivedData(receivedHex);
      } else {
        setReceivedData('No data received');
      }
      
      // Reset the reader to allow reading new data again
      // We must release the reader lock before setting up the new reader
      reader.releaseLock();
      const newReader = port.readable.getReader();  // Get a fresh reader
      setReader(newReader);  // Set the new reader for future reads

      setStatus('Ready to read again.');
    } catch (error) {
      setStatus(`Error while reading data: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Serial Port Communication</h1>
      <button onClick={openSerialPort}>Open Serial Port</button>
      <button onClick={readData} disabled={!port}>Read Data</button>
      <p>Status: {status}</p>
      <p>Received Data: {receivedData}</p>
    </div>
  );
}

export default Test;
