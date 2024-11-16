import { useState, useEffect } from 'react';

function SerialPortDetection() {
  const [ports, setPorts] = useState([]);
  const [connectedPort, setConnectedPort] = useState(null);

  // Function to get a list of available serial ports
  const getSerialPorts = async () => {
    try {
      const serialPorts = await navigator.serial.getPorts();
      setPorts(serialPorts);
    } catch (error) {
      console.error("Error getting serial ports: ", error);
    }
  };

  // Function to connect to the selected serial port
  const connectSerial = async () => {
    try {
      const serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate: 9600 });
      setConnectedPort(serialPort);
      console.log('Serial port connected:', serialPort);
    } catch (err) {
      console.error('Failed to connect to serial port:', err);
    }
  };

  // Detect when a serial device is connected
  useEffect(() => {
    getSerialPorts();

    // Event listener for when a serial device is connected
    navigator.serial.addEventListener('connect', (event) => {
      console.log('Serial device connected:', event.target);
      setPorts((prevPorts) => [...prevPorts, event.target]);
    });

    // Event listener for when a serial device is disconnected
    navigator.serial.addEventListener('disconnect', (event) => {
      console.log('Serial device disconnected:', event.target);
      setPorts((prevPorts) =>
        prevPorts.filter((port) => port !== event.target)
      );
    });

    return () => {
      navigator.serial.removeEventListener('connect', () => {});
      navigator.serial.removeEventListener('disconnect', () => {});
    };
  }, []);

  return (
    <div>
      <h1>Serial Port Detection</h1>
      <button onClick={connectSerial}>Request Serial Port</button>
      {connectedPort && <p>Connected to: {connectedPort.getInfo().usbVendorId}</p>}

      <h2>Available Serial Ports:</h2>
      <ul>
        {ports.map((port, index) => (
          <li key={index}>Serial Port {index + 1}: {port.getInfo().usbVendorId}</li>
        ))}
      </ul>
    </div>
  );
}

export default SerialPortDetection;
