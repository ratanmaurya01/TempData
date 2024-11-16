import React, { useState } from 'react';
import Preloader from '../Model/Preloader';
import { useNavigate } from 'react-router-dom';


function SerialPortCommunication() {
  const navigate = useNavigate();
  const [portInfo, setPortInfo] = useState(null); // State to store port info
  const [writer, setWriter] = useState(null); // State to store the writer
  const [port, setPort] = useState(null); // State to store the port reference
  const [connected, setConnected] = useState(false); // State to track connection status
  const [reader, setReader] = useState(null); // State to hold the reader
  const [currentBalance, setCurrentBalance] = useState('');
  const [loader, setLoader] = useState(false);
  const [instanceData, setInstanceData] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [error, setError] = useState('');

  const handleSelectPort = async () => {
    try {

      const selectedPort = await navigator.serial.requestPort(); // Request serial port access
      if (!selectedPort) {
        console.error('No port selected');
        return; // Exit if no port was selected
      }

      // Assuming you're using the CP2102 USB to UART Bridge Control
      const deviceName = 'CP2102 USB to UART Bridge Control'; // Static device name

      // Extract vendor and product IDs from the port info
      const portDetails = selectedPort.getInfo();
      const vendorId = portDetails.usbVendorId;
      const productId = portDetails.usbProductId;

      // Open the port
      await selectedPort.open({ baudRate: 9600 }); // Ensure to set the correct baud rate

      // Create a writer for the port
      const portWriter = selectedPort.writable.getWriter();
      setWriter(portWriter); // Store the writer in state

      // Create a reader for the port
      const readableStream = selectedPort.readable; // Get the readable stream
      const portReader = readableStream.getReader();
      setReader(portReader); // Store the reader in state

      setPort(selectedPort); // Store the selected port reference
      setConnected(true); // Update connected state

      // Update port info state with device name and USB details
      setPortInfo({
        deviceName,
        vendorId,
        productId,
      });

    } catch (error) {
      console.error('Error while selecting port:', error);
      alert('Failed to select port: ' + error.message);
    }
  };

  const handleDisconnect = async () => {
    if (port) {
      try {
        // Close the writer
        if (writer) {
          await writer.releaseLock(); // Release the writer lock
          setWriter(null); // Clear writer state
        }

        // Close the reader if it exists
        if (reader) {
          await reader.releaseLock(); // Release the reader lock
          setReader(null); // Clear reader state if applicable
        }

        // Close the port
        await port.close();
        setPort(null); // Clear port state
        setPortInfo(null); // Clear port info state
        setConnected(false); // Update connected state
        // console.log('Disconnected from the port');
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    } else {

      console.log('No port to disconnect from');

    }
  };

  const handleSendCommand = async () => {
    setCurrentBalance('');
    setBillingHistory([]);
    setInstanceData([]);
    setRechargeHistory([]);

    setLoader(true); // Start loader


    if (!writer || !reader) {
      console.error('Error: Port or reader not selected');
      alert('Error: Port or reader not selected');
      return;
    }
    const command = new Uint8Array([0x65, 0x04, 0x02, 0x86, 0x00, 0x02, 0x99, 0xBE]);

    try {
      await writer.write(command); // Send command

      // Wait a bit for the response to arrive
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Read the response using the existing reader
      const { value, done } = await reader.read();


      if (done) {
        console.error('Stream closed');
        return;
      }

      // Ensure response data is sufficient and valid
      if (value && value.length >= 7) {
        const hexData = [
          value[3].toString(16).padStart(2, '0'),
          value[4].toString(16).padStart(2, '0'),
          value[5].toString(16).padStart(2, '0'),
          value[6].toString(16).padStart(2, '0')
        ].join('');

        //   console.log'dsadsadddsdsada', hexData);

        const decimalValue = parseInt(hexData, 16);
        const formattedDecimal = (decimalValue / 100).toFixed(2);
        setCurrentBalance(formattedDecimal);

      } else {
        console.error('Response data is insufficient or malformed:', value);

      }

    } catch (error) {
      console.error('Failed to send command or read response:', error);
    }
    finally {

      setLoader(false); // Stop loader after all commands are processed

    }
  };



  // CRC-16 Modbus calculation function
  const crc16Modbus = (buffer) => {
    let crc = 0xFFFF;
    for (let pos = 0; pos < buffer.length; pos++) {
      crc ^= buffer[pos]; // XOR byte into least significant byte of crc

      for (let i = 8; i !== 0; i--) { // Loop over each bit
        if ((crc & 0x0001) !== 0) { // If the LSB is set
          crc >>= 1; // Shift right and XOR
          crc ^= 0xA001;
        } else {
          crc >>= 1; // Just shift right
        }
      }
    }
    return crc;
  };

  // Convert command and calculate CRC with swapped bytes
  const prepareCommandWithCRC = (commandArray) => {
    const crc = crc16Modbus(commandArray);
    // Swap the CRC bytes
    const crcLow = crc & 0xFF;         // Lower byte
    const crcHigh = (crc >> 8) & 0xFF; // Higher byte (after shifting)
    // Create a new command array with the swapped CRC bytes at the end
    const fullCommand = [...commandArray, crcLow, crcHigh];
    // Return the new Uint8Array
    return new Uint8Array(fullCommand);
  };

  // Commands with corresponding labels
  const commandsWithLabels = [

    { label: " Meter Sr Number :", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x9A, 0x00, 0x02]) },

    { label: "Device ID", command: prepareCommandWithCRC([0x65, 0x03, 0x00, 0x2E, 0x00, 0x01]) },

    { label: "Current Recharge ", command: prepareCommandWithCRC([0x65, 0x04, 0x02, 0x86, 0x00, 0x02]) },

    { label: "Cumulative kWh ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x56, 0x00, 0x02]) },

    { label: "Cumulative kVAh ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x54, 0x00, 0x02]) },

    { label: "Cumulative EB kWh ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x60, 0x00, 0x02]) },

    { label: "Cumulative DG kWh ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x6A, 0x00, 0x02]) },

    { label: "Cumulative EB kVAh ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x56, 0x00, 0x02]) },

    { label: "Cumulative DG kVAh ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x56, 0x00, 0x02]) },

    { label: "Cumulative kVArh (Lag /Lead)", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x56, 0x00, 0x02]) },

    { label: "Cumulative kVArh (Lag /Lead) - EB/DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x56, 0x00, 0x02]) },

    { label: "Current Month EB MD-KW", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xB8, 0x00, 0x02]) },

    { label: "Current Month EB MD-KW - Date", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xBA, 0x00, 0x02]) },

    { label: "Current Month EB MD-KW - Time", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xBC, 0x00, 0x02]) },

    { label: "Current Month DG MD-KW", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xBE, 0x00, 0x02]) },

    { label: "Current Month DG MD-KW - Date", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xC0, 0x00, 0x02]) },

    { label: "Current Month DG MD-KW - Time", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xC2, 0x00, 0x02]) },

    { label: "Average Power Factor current month ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x18, 0x00, 0x02]) },

    { label: "Instantaneous voltage R Phase ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x12, 0x00, 0x02]) },

    { label: "Instantaneous voltage Y Phase ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x14, 0x00, 0x02]) },

    { label: "Instantaneous voltage B Phase ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x16, 0x00, 0x02]) },

    { label: "Instantaneous current R Phase ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x02, 0x00, 0x02]) },

    { label: "Instantaneous current Y Phase ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x04, 0x00, 0x02]) },

    { label: "Instantaneous current B Phase ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x06, 0x00, 0x02]) },

    { label: "Instantaneous Signed power factor R ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x1A, 0x00, 0x02]) },

    { label: "Instantaneous Signed power factor Y ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x1C, 0x00, 0x02]) },

    { label: "Instantaneous Signed power factor B ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x1E, 0x00, 0x02]) },

    { label: "Instantaneous Signed power factor Total PF", command: prepareCommandWithCRC([0x65, 0x04, 0x18, 0x56, 0x00, 0x02]) },

    { label: "Instantaneous Frequency", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x20, 0x00, 0x02]) },

    { label: "Instantaneous Active Load (KW) R ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x32, 0x00, 0x02]) },

    { label: "Instantaneous Active Load (KW) Y ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x3E, 0x00, 0x02]) },

    { label: "Instantaneous Active Load (KW) B ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x4A, 0x00, 0x02]) },

    { label: "Instantaneous Active Load (KW) Sum-phase ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x26, 0x00, 0x02]) },

    { label: "Instantaneous  Apparent  Load  (KVA) R ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x30, 0x00, 0x02]) },

    { label: "Instantaneous  Apparent  Load  (KVA) Y ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x3C, 0x00, 0x02]) },

    { label: "Instantaneous  Apparent  Load  (KVA) B ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x48, 0x00, 0x02]) },

    { label: "Instantaneous  Apparent  Load  (KVA) Sum-phase ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x24, 0x00, 0x02]) },

    { label: "Instantaneous  Reactive  Load  (KVAr) R ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x34, 0x00, 0x02]) },

    { label: "Instantaneous  Reactive  Load  (KVAr) Y ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x40, 0x00, 0x02]) },

    { label: "Instantaneous  Reactive  Load  (KVAr) B ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x4C, 0x00, 0x02]) },

    { label: "Instantaneous  Reactive  Load  (KVAr) sum-phase ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x28, 0x00, 0x02]) },

    { label: "Section Load EB (2+2)", command: prepareCommandWithCRC([0x65, 0x03, 0x00, 0x10, 0x00, 0x02]) },

    { label: "Section Load DG (2+2)", command: prepareCommandWithCRC([0x65, 0x03, 0x00, 0x11, 0x00, 0x02]) },

  ];




  const handleInstanseData = async () => {
    if (!writer || !reader) {
      console.error('Error: Port or reader not selected');
      alert('Port not selected');
      return;
    }

    setBillingHistory([]);
    setInstanceData([]);
    setRechargeHistory([]);
    setCurrentBalance('');
    setLoader(true); // Start loader
    const results = []; // Temporary array to store command results

    try {
      // Iterate through each command with its label
      for (const { label, command } of commandsWithLabels) {
        try {
          await writer.write(command); // Send command

          // Wait a bit for the response to arrive
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Read the response
          const { value, done } = await reader.read();
          if (done) {
            console.error('Stream closed');
            break; // Exit loop if stream is closed
          }

          if (value && value.length >= 7) {

            // console.log('werweweewr', value);

            const hexData = [
              value[3].toString(16).padStart(2, '0'),
              value[4].toString(16).padStart(2, '0'),
              value[5].toString(16).padStart(2, '0'),
              value[6].toString(16).padStart(2, '0')
            ].join('');

            // console.log('hex', hexData);

            const newData = hexData.substring(0, 4);

            // let precessedHex = hexData;

            // if (label === "Device ID") {
            //   precessedHex = hexData.substring(0, 4);
            // }
            const decimalValue = parseInt(newData, 16);
            //  console.log('object', decimalValue);

            // If the label is "Device ID", use the decimal value directly
            // Otherwise, apply (decimalValue / 100).toFixed(2)
            const Data = label === "Device ID" ? decimalValue : (decimalValue / 100).toFixed(2);

            // Print the response with the associated label
            //  console.log(`${label}: ${Data}`);

            // Add the label and data to the results array
            results.push({ label, data: Data });

            // const decimalValue = parseInt(precessedHex, 16);
            // console.log('object', decimalValue)

            // const Data = (decimalValue / 100).toFixed(2);
            // // Print the response with the associated label
            // console.log(`${label}: ${Data}`);

            // // Add the label and data to the results array
            // results.push({ label, data: Data });

          }
        } catch (error) {
          console.error('Failed to send command or read response:', error.message);
        }
      }
      // Update state with the results to display in the table
      setInstanceData(results);

    } finally {
      setLoader(false); // Stop loader after all commands are processed
    }
  };


  // Commands with corresponding labels
  const BillingCommands = [
    { label: "Cumulative Energy kWh- 6 Month ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x88, 0x00, 0x02]) },
    { label: "Cumulative Energy kVAh - 6 Month ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x86, 0x00, 0x02]) },
    { label: "Cumulative Energy kvarh - 6 Month ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x8A, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-1 ", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x10, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-2 ", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x1C, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-3 ", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x28, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-4 ", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x2A, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-5 ", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x2C, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-6 ", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x2E, 0x00, 0x02]) },
  ];


  const handleSendBilling = async () => {
    // Send billing command
    if (!writer || !reader) {
      console.error('Error: Port or reader not selected');
      alert('Port not selected');
      return;
    }

    setBillingHistory([]);
    setInstanceData([]);
    setRechargeHistory([]);
    setCurrentBalance('');
    setLoader(true); // Start loader
    const results = []; // Temporary array to store command results

    try {
      // Iterate through each command with its label
      for (const { label, command } of BillingCommands) {
        try {
          await writer.write(command); // Send command

          // Wait a bit for the response to arrive
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Read the response
          const { value, done } = await reader.read();
          if (done) {
            console.error('Stream closed');
            break; // Exit loop if stream is closed
          }

          if (value && value.length >= 7) {
            const hexData = [
              value[3].toString(16).padStart(2, '0'),
              value[4].toString(16).padStart(2, '0'),
              value[5].toString(16).padStart(2, '0'),
              value[6].toString(16).padStart(2, '0')
            ].join('');

            const decimalValue = parseInt(hexData, 16);
            const Data = (decimalValue / 100).toFixed(2);

            // Print the response with the associated label
            // console.log(`${label}: ${Data}`);

            // Add the label and data to the results array
            results.push({ label, data: Data });
          }
        } catch (error) {
          console.error('Failed to send command or read response:', error.message);
        }
      }

      // Update state with the results to display in the table
      setBillingHistory(results);

    } finally {
      setLoader(false); // Stop loader after all commands are processed
    }
  }






  // Commands with corresponding labels
  const RechargeCommand = [


    // { label: " Tariff rate for EB   ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x9A, 0x00, 0x02]) },

    //  { label: "Tariff rate for  DG  ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x9A, 0x00, 0x02]) },

    //  { label: "Fix charge(Per Day Charges) ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x9A, 0x00, 0x02]) },

    { label: "Current Month Total Deduction ", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x04, 0x00, 0x02]) },

    { label: "Current Month EB Deduction ", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x06, 0x00, 0x02]) },

    { label: "Current Month DG Deduction", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x08, 0x00, 0x02]) },

    // { label: "Current Month Fix charge ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x9A, 0x00, 0x02]) },

    // { label: "Total recharge till date  ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x9A, 0x00, 0x02]) },

  ];


  const handleSendRecharge = async () => {

    // Send billing command
    if (!writer || !reader) {
      console.error('Error: Port or reader not selected');
      alert('Port not selected');
      return;
    }


    setBillingHistory([]);
    setInstanceData([]);
    setRechargeHistory([]);
    setCurrentBalance('');
    setLoader(true); // Start loader
    const results = []; // Temporary array to store command results

    try {
      // Iterate through each command with its label
      for (const { label, command } of RechargeCommand) {
        try {
          await writer.write(command); // Send command

          // Wait a bit for the response to arrive
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Read the response
          const { value, done } = await reader.read();
          if (done) {
            console.error('Stream closed');
            break; // Exit loop if stream is closed
          }

          if (value && value.length >= 7) {
            const hexData = [
              value[3].toString(16).padStart(2, '0'),
              value[4].toString(16).padStart(2, '0'),
              value[5].toString(16).padStart(2, '0'),
              value[6].toString(16).padStart(2, '0')
            ].join('');

            const decimalValue = parseInt(hexData, 16);
            const Data = (decimalValue / 100).toFixed(2);

            // Print the response with the associated label
            // console.log(`${label}: ${Data}`);

            // Add the label and data  to the results array
            results.push({ label, data: Data });
          }
        } catch (error) {

          setError(`Please refresh the page: ${error.message}`);

          // console.error('Failed to send command or read response:', error.message);

        }
      }
      // Update state with the results to display in the table
      setRechargeHistory(results);
    } finally {
      setLoader(false); // Stop loader after all commands are processed
    }
  }


  const handleNavigate = () => {
    navigate('/UBS')
  }

  return (
    <>
      <div className=" mt-10 lg:ml-10 md:ml-10 sm:ml-0">
        <div className=" m-2">
          <div className='mt-10 flex items-center'>
            {!connected ? (
              <button
                type="button"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4
              focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600
              dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                onClick={handleSelectPort}
              >
                Connect
              </button>
            ) : (
              <button
                type="button"
                className="text-white bg-red-700 hover:bg-red-800 focus:ring-4
              focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600
              dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            )}

            {portInfo ? (
              <div>
                <p>Device Name: {portInfo.deviceName} </p>
              </div>
            ) : (
              <p>No port selected</p>
            )}
          </div>
        </div>

        <p>{error}</p>

        <div className='m-2 flex mt-5'>
          <button
            type="button"
            className="text-white bg-green-700 hover:bg-green-800 focus:ring-4
          focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600
          dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
            onClick={handleInstanseData}
          >
            Instance Data
          </button>


          <div className='flex items-center'>

            <button
              type="button"
              className="text-white bg-green-700 hover:bg-green-800 focus:ring-4
              focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600
              dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
              onClick={handleSendCommand}
            >
              Current Balance
            </button>

            <button
              type="button"
              className="text-white bg-green-700 hover:bg-green-800 focus:ring-4
            focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600
            dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
              onClick={handleSendBilling}
            >
              Billing Parameter
            </button>

            <button
              type="button"
              className="text-white bg-green-700 hover:bg-green-800 focus:ring-4
            focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600
            dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
              onClick={handleSendRecharge}
            >
              Recharge Parameter
            </button>


            {/* <button
              type="button"
              className="text-white bg-green-700 hover:bg-green-800 focus:ring-4
            focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600
            dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
              onClick={handleNavigate}
            >
              TEST
            </button> */}



          </div>

        </div>

        <div className='m-2 '>

          {/* <p>{currentBalance}</p> */}

          <div>



            {currentBalance.length > 0 && (
              <table className="min-w-[50%] bg-white mt-5">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-2 px-4">Description</th>
                    <th className="py-2 px-4">Value</th>
                  </tr>
                </thead>
                <tbody>

                  <tr>
                    <td className="border px-4 py-2">Current Balance </td>
                    <td className="border px-4 py-2">{currentBalance}</td>
                  </tr>

                </tbody>
              </table>

            )}


          </div>
          <div>

            {instanceData.length > 0 && (
              <table className="min-w-[50%] bg-white mt-5">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-2 px-4">Description</th>
                    <th className="py-2 px-4">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {instanceData.map((item, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">{item.label}</td>
                      <td className="border px-4 py-2">{item.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>

          <div>
            {billingHistory.length > 0 && (
              <table className="min-w-[50%] bg-white mt-5">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-2 px-4">Description</th>
                    <th className="py-2 px-4">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((item, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">{item.label}</td>
                      <td className="border px-4 py-2">{item.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            {rechargeHistory.length > 0 && (
              <table className="min-w-[50%] bg-white mt-5">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-2 px-4">Description</th>
                    <th className="py-2 px-4">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rechargeHistory.map((item, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">{item.label}</td>
                      <td className="border px-4 py-2">{item.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {loader ? <Preloader /> : null}

    </>
  );
}

export default SerialPortCommunication;


