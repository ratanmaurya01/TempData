import React, { useState, useEffect } from 'react';
import Preloader from '../Model/Preloader';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSerialPort } from '../context/SerialPortContext';


function SerialPortCommunication() {

  const {
    port,
    writer,
    reader,
    connected,
    portInfo,

  } = useSerialPort();


  const location = useLocation();
  const navigate = useNavigate();
  // const [portInfo, setPortInfo] = useState(null); // State to store port info
  // const [writer, setWriter] = useState(null); // State to store the writer
  // const [port, setPort] = useState(null); // State to store the port reference
  // const [connected, setConnected] = useState(false); // State to track connection status
  // const [reader, setReader] = useState(null); // State to hold the reader
  const [currentBalance, setCurrentBalance] = useState('');
  const [loader, setLoader] = useState(false);
  const [instanceData, setInstanceData] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [temperedData, setTemperedData] = useState([]);
  const [deductionData, setDeductionData] = useState([]);

  useEffect(() => {
    const action = location.state?.action;
    if (action) {
      switch (action) {
        case 'handleInstanceData':
          handleInstanseData();
          break;
        case 'handleCurrentBalance':
          handleSendCommand();
          break;
        case 'handleRechargeParameter':
          handleSendRecharge();
          break;
        case 'handleBillingParameter':
          handleSendBilling();
          break;

        case 'handleTemperedData':
          handleTemperedData();
          break;

        case 'handleDeduction':
          handleDeductionData();
          break;

        default:
          console.error('Unknown action:', action);
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);



  // const handleSelectPort = async () => {
  //   try {
  //     const selectedPort = await navigator.serial.requestPort(); // Request serial port access
  //     if (!selectedPort) {
  //       console.error('No port selected');
  //       return; // Exit if no port was selected
  //     }

  //     // Assuming you're using the CP2102 USB to UART Bridge Control
  //     const deviceName = 'CP2102 USB to UART Bridge Control'; // Static device name

  //     // Extract vendor and product IDs from the port info
  //     const portDetails = selectedPort.getInfo();
  //     const vendorId = portDetails.usbVendorId;
  //     const productId = portDetails.usbProductId;

  //     // Open the port
  //     await selectedPort.open({ baudRate: 9600 }); // Ensure to set the correct baud rate

  //     // Create a writer for the port
  //     const portWriter = selectedPort.writable.getWriter();
  //     setWriter(portWriter); // Store the writer in state

  //     // Create a reader for the port
  //     const readableStream = selectedPort.readable; // Get the readable stream
  //     const portReader = readableStream.getReader();
  //     setReader(portReader); // Store the reader in state

  //     setPort(selectedPort); // Store the selected port reference
  //     setConnected(true); // Update connected state

  //     // Update port info state with device name and USB details
  //     setPortInfo({
  //       deviceName,
  //       vendorId,
  //       productId,
  //     });

  //   } catch (error) {
  //     console.error('Error while selecting port:', error);
  //     alert('Failed to select port: ' + error.message);
  //   }
  // };


  // const handleDisconnect = async () => {
  //   if (port) {
  //     try {
  //       // Close the writer
  //       if (writer) {
  //         await writer.releaseLock(); // Release the writer lock
  //         setWriter(null); // Clear writer state
  //       }

  //       // Close the reader if it exists
  //       if (reader) {
  //         await reader.releaseLock(); // Release the reader lock
  //         setReader(null); // Clear reader state if applicable
  //       }

  //       // Close the port
  //       await port.close();
  //       setPort(null); // Clear port state
  //       setPortInfo(null); // Clear port info state
  //       setConnected(false); // Update connected state
  //       // console.log('Disconnected from the port');
  //     } catch (error) {
  //       console.error('Failed to disconnect:', error);
  //     }
  //   } else {

  //     console.log('No port to disconnect from');

  //   }
  // };


  const handleSendCommand = async () => {
    setCurrentBalance('');
    setBillingHistory([]);
    setInstanceData([]);
    setRechargeHistory([]);


    if (!writer || !reader) {
      console.error('Error: Port or reader not selected');
      alert('Error: Port or reader not selected');
      return;
    }
    const command = new Uint8Array([0x65, 0x04, 0x02, 0x86, 0x00, 0x02, 0x99, 0xBE]);

    setLoader(true); // Start loader
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

    { label: "Status", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xD0, 0x00, 0x02]) },

    { label: "Remainig Balance ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xD2, 0x00, 0x02]) },
    { label: "Meter Sr Number", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x9A, 0x00, 0x02]) },
    { label: "Model Number", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x9C, 0x00, 0x02]) },
    { label: "firmware Number", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x9E, 0x00, 0x02]) },
    { label: "Device ID", command: prepareCommandWithCRC([0x65, 0x03, 0x00, 0x2E, 0x00, 0x02]) },


    { label: "Current Recharge ", command: prepareCommandWithCRC([0x65, 0x04, 0x02, 0x86, 0x00, 0x02]) },
    { label: "Cumulative kWh ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x56, 0x00, 0x02]) },
    { label: "Cumulative kVAh ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x54, 0x00, 0x02]) },
    { label: "Cumulative EB kWh ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x60, 0x00, 0x02]) },
    { label: "Cumulative DG kWh ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x6A, 0x00, 0x02]) },

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

    { label: "Current Phase 1", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x02, 0x00, 0x02]) },
    { label: "Current Phase 2", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x04, 0x00, 0x02]) },
    { label: "Current Phase 3", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x06, 0x00, 0x02]) },

    { label: "Line To Neutral Phase 1", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x12, 0x00, 0x02]) },
    { label: "Line To Neutral Phase 2", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x14, 0x00, 0x02]) },
    { label: "Line To Neutral Phase 3", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x16, 0x00, 0x02]) },

    { label: "Frequency, Hz", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x20, 0x00, 0x02]) },
    { label: "Source running", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x22, 0x00, 0x02]) },

    { label: "Fwd Apparent Power", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x24, 0x00, 0x02]) },
    { label: "Fwd Active Power", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x26, 0x00, 0x02]) },
    { label: "Fwd Reactive Power", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x28, 0x00, 0x02]) },
    { label: "Rev Apparent Power", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x2A, 0x00, 0x02]) },
    { label: "Rev Active Power", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x2C, 0x00, 0x02]) },
    { label: "Rev Reactive Power", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x2E, 0x00, 0x02]) },

    { label: "Fwd Apparent Power Phase 1", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x30, 0x00, 0x02]) },
    { label: "Fwd Active Power Phase 1", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x32, 0x00, 0x02]) },
    { label: "Fwd Reactive Power Phase 1", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x34, 0x00, 0x02]) },
    { label: "Rev Apparent Power Phase 1", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x36, 0x00, 0x02]) },
    { label: "Rev Active Power Phase 1", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x38, 0x00, 0x02]) },
    { label: "Rev Reactive Power Phase 1", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x3A, 0x00, 0x02]) },

    { label: "Fwd Apparent Power Phase 2", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x3C, 0x00, 0x02]) },
    { label: "Fwd Active Power Phase 2", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x3E, 0x00, 0x02]) },
    { label: "Fwd Reactive Power Phase 2", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x40, 0x00, 0x02]) },
    { label: "Rev Apparent Power Phase 2", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x42, 0x00, 0x02]) },
    { label: "Rev Active Power Phase 2", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x44, 0x00, 0x02]) },
    { label: "Rev Reactive Power Phase 2", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x46, 0x00, 0x02]) },

    { label: "Fwd Apparent Power Phase 3", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x48, 0x00, 0x02]) },
    { label: "Fwd Active Power Phase 3", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x4A, 0x00, 0x02]) },
    { label: "Fwd Reactive Power Phase 3", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x4C, 0x00, 0x02]) },
    { label: "Rev Apparent Power Phase 3", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x4E, 0x00, 0x02]) },
    { label: "Rev Active Power Phase 3", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x50, 0x00, 0x02]) },
    { label: "Rev Reactive Power Phase 3", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x52, 0x00, 0x02]) },

    { label: "Maximum Demand EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xB8, 0x00, 0x02]) },
    { label: "Maximum Demand Time EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xBA, 0x00, 0x02]) },
    { label: "Maximum Demand Date EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xBC, 0x00, 0x02]) },

    { label: "Maximum Demand DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xBE, 0x00, 0x02]) },
    { label: "Maximum Demand Time DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xC0, 0x00, 0x02]) },
    { label: "Maximum Demand Date DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xC2, 0x00, 0x02]) },

    { label: "Section Load EB (2+2)", command: prepareCommandWithCRC([0x65, 0x03, 0x00, 0x10, 0x00, 0x02]) },
    { label: "Section Load DG (2+2)", command: prepareCommandWithCRC([0x65, 0x03, 0x00, 0x11, 0x00, 0x02]) },

    { label: "KVArh Lead", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0xA2, 0x00, 0x02]) },
    { label: "KVArh leg", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0xA4, 0x00, 0x02]) },
    { label: "KVArh lead EB", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0xA6, 0x00, 0x02]) },
    { label: "KVArh leg EB", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0xA8, 0x00, 0x02]) },
    { label: "KVArh lead DG", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0xAA, 0x00, 0x02]) },
    { label: "KVArh leg DG", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0xAC, 0x00, 0x02]) },

  ];

  //⛔⛔  Second Updattion 

  const handleInstanseData = async () => {
    if (!writer || !reader) {
      console.error('Error: Port or reader not selected');
      alert('Port not selected');
      return;
    }
    // Reset states before starting
    setBillingHistory([]);
    setInstanceData([]);
    setRechargeHistory([]);
    setCurrentBalance('');
    setTemperedData([]);
    setDeductionData([]);
    setLoader(true); // Start loader

    const results = []; // Temporary array to store command results

    try {
      // Iterate through each command with its label
      for (const { label, command } of commandsWithLabels) {
        try {
          // Send the command
          await writer.write(command);

          // Wait a bit for the response to arrive
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Read the response
          const { value, done } = await reader.read();

          if (done || !value || value.length < 7) {
            console.error(`Invalid or no response for ${label}`);
            results.push({ label, data: "No response" }); // Push no response message

            continue;
          }

          // Extract hex data from response
          const hexData = Array.from(value.slice(3, 7)) // Take bytes 3 to 6
            .map(byte => byte.toString(16).padStart(2, '0')) // Convert to hex with padding
            .join('');

          console.log(`${label} Hex Data:`, hexData);

          let processedData;

          if (label === "Meter Sr Number") {
            const decimalData = parseInt(hexData, 16);
            processedData = decimalData.toString(); // Convert to string for consistency
          } else if (label === "Status") {
            const decimalData = parseInt(hexData, 16);
            processedData = decimalData.toString(); // Convert to string for consistency
          }
          else if (label === "Device ID") {
            const newData = hexData.substring(0, 4); // Take the first 4 characters of hexData
            const decimalValue = parseInt(newData, 16);
            // console.log(`${label} Decimal Value:`, decimalValue);
            processedData = decimalValue; // Keep as a number for specific handling
          } else if (label === "Section Load EB (2+2)" || label === "Section Load DG (2+2)") {

            // For Section Load EB (2+2), take the last 4 digits of the hex data
            const last4Hex = hexData.slice(-4); // Get the last 4 characters
            const decimalValue = parseInt(last4Hex, 16); // Convert to decimal
            // console.log(`${label} Decimal Value (last 4 digits):`, decimalValue);
            processedData = (decimalValue / 100).toFixed(2); // Format to two decimal places

          }
          else if (label === "Current Month EB MD-KW - Time") {
            // Process this label without dividing by 100
            processedData = parseInt(hexData, 16); // Convert to decimal without formatting

          }
          else {
            const decimalValue = parseInt(hexData, 16); // Convert to decimal
            //  console.log(`${label} Decimal Value:`, decimalValue);
            processedData = (decimalValue / 100).toFixed(2); // Format to two decimal places
          }

          // Push the processed data with its label to results
          results.push({ label, data: processedData });
        } catch (error) {
          console.error(`Failed to process command ${label}:`, error.message);
          results.push({ label, data: "No response" }); // Push no response in case of failure

          // Push an entry to results with the error message dynamically
          results.push({ label, data: `Data: ${error.message}` });
        }
      }

      // Update state with the results to display in the table
      setInstanceData(results);
    } catch (error) {

      console.error('Unexpected error during command processing:', error.message);
    } finally {
      setLoader(false); // Stop loader after all commands are processed
    }
  };


  // ⛔⛔⛔⛔ Thirds Updattion 
  // ✔➰🗯🗯✔✔   ok but some changes 

  // const handleInstanseData = async () => {
  //   if (!writer || !reader) {
  //     console.error('Error: Port or reader not selected');
  //     alert('Port not selected');
  //     return;
  //   }

  //   // Reset states before starting
  //   setBillingHistory([]);
  //   setInstanceData([]);
  //   setRechargeHistory([]);
  //   setCurrentBalance('');
  //   setLoader(true); // Start loader

  //   const results = []; // Temporary array to store command results

  //   try {
  //     // Iterate through each command with its label
  //     for (const { label, command } of commandsWithLabels) {
  //       try {
  //         // Send the command
  //         await writer.write(command);

  //         // Wait a bit for the response to arrive
  //         await new Promise(resolve => setTimeout(resolve, 1000));

  //         // Read the response
  //         const { value, done } = await reader.read();

  //         if (done || !value || value.length < 7) {
  //           console.error(`Invalid or no response for ${label}`);
  //           continue;
  //         }

  //         // Extract hex data from response
  //         const hexData = Array.from(value.slice(3, 7)) // Take bytes 3 to 6
  //           .map(byte => byte.toString(16).padStart(2, '0')) // Convert to hex with padding
  //           .join('');

  //         console.log(`${label} Hex Data:`, hexData);

  //         let processedData;

  //         if (label === "Device ID") {
  //           // Specific handling for "Device ID"
  //           const newData = hexData.substring(0, 4); // Take first 4 characters
  //           const decimalValue = parseInt(newData, 16); // Convert to decimal
  //           console.log(`${label} Decimal Value:`, decimalValue);
  //           processedData = decimalValue; // No division for "Device ID"
  //         } else {
  //           // General handling for all other labels
  //           const decimalData = parseInt(hexData, 16); // Convert full hexData to decimal
  //           console.log(`${label} Decimal Data:`, decimalData);
  //           processedData = decimalData.toString(); // Convert to string
  //         }

  //         // Push the processed data with its label to results
  //         results.push({ label, data: processedData });
  //       } catch (error) {
  //         console.error(`Failed to process command ${label}:`, error.message);
  //       }
  //     }

  //     // Update state with the results to display in the table
  //     setInstanceData(results);
  //   } catch (error) {
  //     console.error('Unexpected error during command processing:', error.message);
  //   } finally {
  //     setLoader(false); // Stop loader after all commands are processed
  //   }
  // };


  const BillingCommands = [

    { label: "Cumulative Energy kWh- 6 Month", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x88, 0x00, 0x02]) },
    { label: "Cumulative Energy kVAh - 6 Month", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x86, 0x00, 0x02]) },
    { label: "Cumulative Energy kvarh - 6 Month", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x8A, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-1", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x10, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-2", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x1C, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-3", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x28, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-4", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x2A, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-5", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x2C, 0x00, 0x02]) },
    { label: "Previous Total Deduction Month-6", command: prepareCommandWithCRC([0x65, 0x04, 0x01, 0x2E, 0x00, 0x02]) },

    { label: "Apparent Power Consumed Total", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x54, 0x00, 0x02]) },
    { label: "Active Power Consumed Total", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x56, 0x00, 0x02]) },
    { label: "Reactive Power Consumed Total", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x58, 0x00, 0x02]) },
    { label: "Current month power on time (S1+S2+S3+S4)", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x5C, 0x00, 0x02]) },
    { label: "Current Month Run Hours Total (S1+S2+S3+S4)", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x5C, 0x00, 0x02]) },


    { label: "Apparent Power Consumed EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x5E, 0x00, 0x02]) },
    { label: "Active Power Consumed EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x60, 0x00, 0x02]) },
    { label: "Reactive Power Consumed EB ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x62, 0x00, 0x02]) },
    { label: "On Hours EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x64, 0x00, 0x02]) },
    { label: "Run Hours Total EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x66, 0x00, 0x02]) },


    { label: "Apparent Power Consumed DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x68, 0x00, 0x02]) },
    { label: "Active Power Consumed DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x6A, 0x00, 0x02]) },
    { label: "Reactive Power Consumed DG ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x6C, 0x00, 0x02]) },
    { label: "On Hours DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x6E, 0x00, 0x02]) },
    { label: "Run Hours Total DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x70, 0x00, 0x02]) },

    { label: "Old Active Power Consumed Total", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x88, 0x00, 0x02]) },
    { label: "Old On Hours Total (S1+S2+S3+S4)", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x8C, 0x00, 0x02]) },
    { label: "Old Run Hours Total (S1+S2+S3+S4)", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x8E, 0x00, 0x02]) },

    { label: "Old Apparent Power Consumed EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x90, 0x00, 0x02]) },
    { label: "Old Active Power Consumed EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x92, 0x00, 0x02]) },
    { label: "Old Reactive Power Consumed EB ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x94, 0x00, 0x02]) },
    { label: "Old On Hours EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x96, 0x00, 0x02]) },
    { label: "Old Run Hours Total EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x98, 0x00, 0x02]) },

    { label: "Old Apparent Power Consumed DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x9A, 0x00, 0x02]) },
    { label: "Old Active Power Consumed DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x9C, 0x00, 0x02]) },
    { label: "Old Reactive Power Consumed DG ", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0x9E, 0x00, 0x02]) },
    { label: "Old On Hours DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xA0, 0x00, 0x02]) },
    { label: "Old Run Hours Total DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xA2, 0x00, 0x02]) },


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
    setTemperedData([]);
    setDeductionData([]);
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
            console.log(`${label}: ${Data}`);

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
    setTemperedData([]);
    setDeductionData([]);
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
            console.log(`${label}: ${Data}`);

            // Add the label and data to the results array
            results.push({ label, data: Data });
          }
        } catch (error) {
          console.error('Failed to send command or read response:', error.message);
        }
      }
      // Update state with the results to display in the table

      setRechargeHistory(results);

    } finally {

      setLoader(false); // Stop loader after all commands are processed

    }
  }

  // const TemperedCommend = [

  //   //{ label: "C-Open temper ", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x01]) },

  //   { label: "Magent temper ", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x02]) },

  //    { label: "Reverse temper", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0x0E8, 0x00, 0x03]) },

  //    { label: "CT-Bypass temper", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x04]) },

  //   // { label: "Neutaral disturbance", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x05]) },

  //   // { label: "R phase petential missing ", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x06]) },

  //   //  { label: "B phase petential missing ", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0x38, 0x00, 0x07]) },

  //   // { label: "Y phase petential missing ", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x08]) },

  //   // { label: "Power fail event", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x09]) },

  // ];


  // const handleTemperedData = async () => {
  //   if (!writer || !reader) {
  //     console.error('Error: Port or reader not selected');
  //     alert('Port not selected');
  //     return;
  //   }
  //   setBillingHistory([]);
  //   setInstanceData([]);
  //   setRechargeHistory([]);
  //   setDeductionData([]);
  //   setCurrentBalance('');
  //   setLoader(true); // Start loader


  //   try {

  //     for (const { label, command } of TemperedCommend) {

  //       try {
  //         //console.log("Sending Command:", label, command);

  //         // Send command
  //         await writer.write(command);

  //         await new Promise((resolve) => setTimeout(resolve, 1000));
  //         const buffer = new Uint8Array(145); 

  //         try {

  //           const response = await reader.read();

  //           console.log("Received Response:", response);

  //           const { value, done } = response;
  //           if (done) {
  //             console.error("Stream closed");
  //             break; // Exit if stream is closed
  //           }

  //           if (value) {

  //             console.log(`Response for "${label}":`, Array.from(value));

  //             setLoader(false);

  //           } else {
  //             //console.warn(`Command "${label}" received an empty response.`);
  //           }
  //         } finally {
  //           setLoader(false);
  //         }




  //       } catch (error) {
  //         console.error(`Error with Command "${label}":`, error.message);
  //         setLoader(false);
  //       }

  //     }



  //   } catch (error) {
  //     console.log('Error in handleTemperedData');
  //     setLoader(false)
  //   }
  // };



  async function sendCommandWithFullResponse(command, expectedLength) {
    // console.log("Sending Command:", Array.from(command));
    await writer.write(command);

    const response = await readCompleteResponse(expectedLength);
    //  console.log("Complete Response:", response);
    return response;
  }

  const commands = [

    { label: "C-Open temper", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x01]), expectedLength: 19 },
    { label: "Magent temper", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x02]), expectedLength: 145 },
    // { label: "Reverse temper", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0x0E8, 0x00, 0x03]), expectedLength: 145 },
    // { label: "CT-Bypass temper", command: prepareCommandWithCRC([0x7F, 0x04, 0x03, 0xE8, 0x00, 0x04]), expectedLength: 145 }

  ];

  async function handleTemperedData() {
    for (const { label, command, expectedLength } of commands) {
      const response = await sendCommandWithFullResponse(command, expectedLength);
      console.log("Received Full Response:", response.length);
      console.log("Received Full Response:", response);
      console.log(`Label: ${label}`);

      if (label === "C-Open temper") {
        if (response.length === 19) {

          // Remove the first 3 and last 2 digits, and convert the result into a regular array
          const processedData = Array.from(response.slice(3, -2)); // Convert Uint8Array to a regular array
          console.log("Processed Data (14 digits):", processedData);
          //Convert hex values to decimal
          const processedDataDecimal = processedData.map(hex => parseInt(hex.toString(16), 16));
          console.log("Processed Data in Decimal:", processedDataDecimal);
          // Extract sr, date, and time values as per your description
          // Assuming the data is in the format:
          // sr = 1 digit, date = 3 digits, time = 3 digits, sr = 1 digit, date = 3 digits, time = 3 digits
          const sr1 = processedDataDecimal[0];
          const date1 = processedDataDecimal.slice(1, 4);
          const time1 = processedDataDecimal.slice(4, 7);
          const sr2 = processedDataDecimal[7];
          const date2 = processedDataDecimal.slice(8, 11);
          const time2 = processedDataDecimal.slice(11, 14);
          console.log("SR 1:", sr1);
          console.log("Date 1:", date1);
          console.log("Time 1:", time1);
          console.log("SR 2:", sr2);
          console.log("Date 2:", date2);
          console.log("Time 2:", time2);
        }
      }
      if (response.length === 145) {
        // Remove the first 3 and last 2 digits, and convert the result into a regular array
        const processedData = Array.from(response.slice(3, -2)); // Convert Uint8Array to a regular array
        console.log("Processed Data (14 digits):", processedData);

        //Convert hex values to decimal
        const processedDataDecimal = processedData.map(hex => parseInt(hex.toString(16), 16));
        console.log("Processed Data in Decimal:", processedDataDecimal);

        // Total groups (14 groups of 10 elements each)
        const groups = [];
        for (let i = 0; i < processedDataDecimal.length; i += 14) {
          groups.push(processedDataDecimal.slice(i, i + 10));
        }

        // Print the 14 groups (10 elements per group)
        groups.forEach((group, index) => {
          console.log(`Group ${index + 1}:`, group);
        });


      }


    }
  }

  async function readCompleteResponse(expectedLength) {
    let completeResponse = [];
    let done = false;

    while (!done) {
      const { value, done: isDone } = await reader.read();

      if (value) {
        completeResponse.push(...value);
        // console.log(`Received Chunk: ${value.length} bytes`);
      }

      // Check if the full response has been received
      if (completeResponse.length >= expectedLength) {
        done = true;
      }

      if (isDone) {
        console.warn("Stream closed unexpectedly");
        break;
      }
    }

    return new Uint8Array(completeResponse);
  }








  const DeductionCommand = [

    { label: "Current Recharge ", command: prepareCommandWithCRC([0x65, 0x04, 0x02, 0x86, 0x00, 0x02]) },

    { label: "Current Day Deduction Total", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xD4, 0x00, 0x02]) },
    { label: "Current Day Deduction EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xD6, 0x00, 0x02]) },
    { label: "Current Day Deduction DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xD8, 0x00, 0x02]) },

    { label: "Previous Day Deduction Total", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xE0, 0x00, 0x02]) },
    { label: "Previous Day Deduction EB", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xE2, 0x00, 0x02]) },
    { label: "Previous Day Deduction DG", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xE4, 0x00, 0x02]) },
    { label: "Previous Day Deduction Fixed Charges", command: prepareCommandWithCRC([0x65, 0x04, 0x00, 0xEA, 0x00, 0x02]) },

    { label: "Current Month Deduction Total", command: prepareCommandWithCRC([0x65, 0x04, 0x10, 0x04, 0x00, 0x02]) },
    { label: "Current Month Deduction EB", command: prepareCommandWithCRC([0x65, 0x04, 0x10, 0x06, 0x00, 0x02]) },
    { label: "Current Month Deduction DG", command: prepareCommandWithCRC([0x65, 0x04, 0x10, 0x08, 0x00, 0x02]) },
    { label: "Current Month Deduction Fixed Charges", command: prepareCommandWithCRC([0x65, 0x04, 0x10, 0x0E, 0x00, 0x02]) },

    { label: "Previous Month Deduction Total", command: prepareCommandWithCRC([0x65, 0x04, 0x11, 0x00, 0x00, 0x02]) },
    { label: "Previous Month Deduction EB", command: prepareCommandWithCRC([0x65, 0x04, 0x11, 0x02, 0x00, 0x02]) },
    { label: "Previous Month Deduction DG", command: prepareCommandWithCRC([0x65, 0x04, 0x11, 0x04, 0x00, 0x02]) },
    { label: "Previous Month Deduction Fixed Charges", command: prepareCommandWithCRC([0x65, 0x04, 0x11, 0x0A, 0x00, 0x02]) },

    { label: "Two Previous Month Deduction Total", command: prepareCommandWithCRC([0x65, 0x04, 0x11, 0x0C, 0x00, 0x02]) },
    { label: "Two Previous Month Deduction EB", command: prepareCommandWithCRC([0x65, 0x04, 0x11, 0x0E, 0x00, 0x02]) },
    { label: "Two Previous Month Deduction DG", command: prepareCommandWithCRC([0x65, 0x04, 0x12, 0x00, 0x00, 0x02]) },
    { label: "Two Previous Month Deduction Fixed Charges", command: prepareCommandWithCRC([0x65, 0x04, 0x12, 0x06, 0x00, 0x02]) },

    { label: "3rd Month Deduction Total", command: prepareCommandWithCRC([0x65, 0x04, 0x12, 0x08, 0x00, 0x02]) },
    { label: "4th Month Deduction Total", command: prepareCommandWithCRC([0x65, 0x04, 0x12, 0x0A, 0x00, 0x02]) },
    { label: "5th Month Deduction Total", command: prepareCommandWithCRC([0x65, 0x04, 0x12, 0x0C, 0x00, 0x02]) },

    { label: "Forcefull Deduction Amount 1", command: prepareCommandWithCRC([0x65, 0x04, 0x16, 0x06, 0x00, 0x02]) },
    { label: "Forcefull Deduction Time 1", command: prepareCommandWithCRC([0x65, 0x04, 0x16, 0x08, 0x00, 0x02]) },
    { label: "Forcefull Deduction Date 1", command: prepareCommandWithCRC([0x65, 0x04, 0x16, 0x0A, 0x00, 0x02]) },

    { label: "Forcefull Deduction Amount 2", command: prepareCommandWithCRC([0x65, 0x04, 0x16, 0x0C, 0x00, 0x02]) },
    { label: "Forcefull Deduction Time 2", command: prepareCommandWithCRC([0x65, 0x04, 0x16, 0x0E, 0x00, 0x02]) },
    { label: "Forcefull Deduction Date 2", command: prepareCommandWithCRC([0x65, 0x04, 0x17, 0x00, 0x00, 0x02]) },

    { label: "Forcefull Deduction Amount 3", command: prepareCommandWithCRC([0x65, 0x04, 0x17, 0x02, 0x00, 0x02]) },
    { label: "Forcefull Deduction time 3", command: prepareCommandWithCRC([0x65, 0x04, 0x17, 0x04, 0x00, 0x02]) },
    { label: "Forcefull Deduction Date 3", command: prepareCommandWithCRC([0x65, 0x04, 0x17, 0x06, 0x00, 0x02]) },

    { label: "Forcefull Deduction Amount 4", command: prepareCommandWithCRC([0x65, 0x04, 0x17, 0x08, 0x00, 0x02]) },
    { label: "Forcefull Deduction time 4", command: prepareCommandWithCRC([0x65, 0x04, 0x17, 0x0A, 0x00, 0x02]) },
    { label: "Forcefull Deduction Date 4", command: prepareCommandWithCRC([0x65, 0x04, 0x17, 0x0C, 0x00, 0x02]) },

  ];

  const handleDeductionData = async () => {
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
    setTemperedData([]);
    setDeductionData([]);
    setLoader(true); // Start loader
    const results = []; // Temporary array to store command results
    try {
      // Iterate through each command with its label
      for (const { label, command } of DeductionCommand) {

        console.log('object', command);
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
            console.log(`${label}: ${Data}`);

            // Add the label and data to the results array
            results.push({ label, data: Data });
          }
        } catch (error) {
          console.error('Failed to send command or read response:', error.message);
        }
      }

      // Update state with the results to display in the table
      setDeductionData(results);

    } finally {
      setLoader(false); // Stop loader after all commands are processed
    }


  }


  return (
    <>
      <div className="  lg:ml-10 md:ml-10 sm:ml-0">
        <div className='m-2 flex'>
        </div>
        <div className='m-2 '>

          <div>
            {currentBalance.length > 0 && (
              <>
                <p>Currect Balance </p>
                <table className="min-w-[50%] bg-white">
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
              </>
            )}
          </div>

          <div>
            {instanceData.length > 0 && (
              <>
                <p>Instance Data</p>
                <table className="min-w-[50%] bg-white ">
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
              </>
            )}

          </div>

          <div>
            {billingHistory.length > 0 && (
              <>
                <p>Billing History </p>
                <table className="min-w-[50%] bg-white">
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
              </>
            )}
          </div>


          <div>
            {rechargeHistory.length > 0 && (
              <>
                <p>Recharge Parameter</p>
                <table className="min-w-[50%] bg-white ">
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
              </>
            )}
          </div>

          <div>
            {temperedData.length > 0 && (
              <>
                <p>Tempered Data</p>
                <table className="min-w-[50%] bg-white ">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="py-2 px-4">Description</th>
                      <th className="py-2 px-4">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {temperedData.map((item, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2">{item.label}</td>
                        <td className="border px-4 py-2">{item.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>


          <div>
            {deductionData.length > 0 && (
              <>
                <p>Deduction</p>
                <table className="min-w-[50%] bg-white ">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="py-2 px-4">Description</th>
                      <th className="py-2 px-4">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductionData.map((item, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2">{item.label}</td>
                        <td className="border px-4 py-2">{item.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>


        </div>
      </div>

      {loader ? <Preloader /> : null}

    </>
  );
}

export default SerialPortCommunication;


