import React, { useState } from 'react';
import { commandWithCRC } from '../comman/commonFunction';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Preloader from '../Model/Preloader';
import { useSerialPort } from '../context/SerialPortContext';

const BluetoothCommunication = () => {

  const {
    port,
    writer,
    reader,
    connected,
    portInfo,

  } = useSerialPort();

  const operations = [
    'Operation',
    'Per unit Selection S1',
    'Per unit Selection S2',
    'Auto Cut On Zero Balance',
    'Grace Credit',
    'Auto Cut On Maximum Demand',
    'Sanction Load S1',
    'Sanction Load S2',
    'Auto Cut Cycle On Repeated Maximum',
    'Observation Time',
    'Off Time In Each Cycle',
    'Off Time After All Attempts',
    'Front Cover Tempering On / Off',
    'Electricity Charges Per Unit S1',
    'Electricity Charges Per Unit S2',
    'Charges Per Day Fixed',
    'Forceful Deduction Amount',
    'Device ID For Communication',
  ];


  // const [portInfo, setPortInfo] = useState(null); // Port information state
  // const [writer, setWriter] = useState(null); // Serial writer
  // const [port, setPort] = useState(null); // Serial port reference
  // const [connected, setConnected] = useState(false); // Connection status
  // const [reader, setReader] = useState(null); // Serial reader




  const [operationValues, setOperationValues] = useState(
    Array(18).fill('') // Initialize values for operations
  )
  const [selectedOperations, setSelectedOperations] = useState(Array(operations.length).fill(false));
  const [selectAll, setSelectAll] = useState(false);
  const [loader, setLoader] = useState(false);


  // const handleSelectPort = async () => {
  //   try {
  //     const selectedPort = await navigator.serial.requestPort();
  //     if (!selectedPort) {
  //       console.error('No port selected');
  //       return;
  //     }

  //     const portDetails = selectedPort.getInfo();
  //     const vendorId = portDetails.usbVendorId;
  //     const productId = portDetails.usbProductId;

  //     await selectedPort.open({ baudRate: 9600 });

  //     const portWriter = selectedPort.writable.getWriter();
  //     setWriter(portWriter);

  //     const readableStream = selectedPort.readable;
  //     const portReader = readableStream.getReader();
  //     setReader(portReader);

  //     setPort(selectedPort);
  //     setConnected(true);

  //     setPortInfo({
  //       vendorId,
  //       productId,
  //       deviceName: 'CP2102 USB to UART Bridge Control',
  //     });
  //   } catch (error) {
  //     console.error('Error while selecting port:', error);
  //     alert('Failed to select port: ' + error.message);
  //   }
  // };


  // const handleDisconnect = async () => {
  //   if (port) {
  //     try {
  //       if (writer) {
  //         await writer.releaseLock();
  //         setWriter(null);
  //       }

  //       if (reader) {
  //         await reader.releaseLock();
  //         setReader(null);
  //       }

  //       await port.close();
  //       setPort(null);
  //       setPortInfo(null);
  //       setConnected(false);
  //     } catch (error) {
  //       console.error('Failed to disconnect:', error);
  //     }
  //   }
  // };


  const handleInputChange = (index, value) => {
    // Allow only digits, spaces, and the decimal point
    if (/^[0-9.\s]*$/.test(value)) {
      const updatedValues = [...operationValues];
      updatedValues[index] = value;
      setOperationValues(updatedValues);
    }
  };


  // Handle checkbox selection
  const toggleOperationSelection = (index) => {
    const updatedSelections = [...selectedOperations];
    updatedSelections[index] = !updatedSelections[index];
    setSelectedOperations(updatedSelections);
  };



  // Toggle "Select All" checkbox in header
  const handleSelectAll = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setSelectedOperations(Array(operations.length).fill(newState));
  };



  // Helper function to create a command with a 2-byte hexadecimal representation
  const createCommand = (baseCommand, value) => {

    // if (!value || isNaN(value)) {
    //   throw new Error("Invalid input. Please enter a valid number.");
    // }

    // Convert the value to a 2-byte hexadecimal representation
    let hexValue = Number(value).toString(16).toUpperCase();
    if (hexValue.length < 4) {
      hexValue = hexValue.padStart(4, '0'); // Ensure it has at least 4 characters (2 bytes)
    }

    // Split the hexValue into two bytes
    const byte1 = parseInt(hexValue.substring(0, 2), 16);
    const byte2 = parseInt(hexValue.substring(2, 4), 16);

    // Combine the base command with the new bytes
    const command = [...baseCommand, byte1, byte2];
    // Generate the full command with CRC
    return commandWithCRC(command);
  };


  const [isReadButtonDisabled, setIsReadButtonDisabled] = useState(false);
  const [isWriteButtonDisabled, setIsWriteButtonDisabled] = useState(false);

  const handleUpdate = async (index) => {
    if (!connected) {
      alert("Error: Device is not connected. Please connect before updating.");
      return;
    }

    let value = operationValues[index];

    // If the operation is either "Electricity Charges Per Unit S1" or "Electricity Charges Per Unit S2"
    if (operations[index] === "Electricity Charges Per Unit S1" || operations[index] === "Electricity Charges Per Unit S2"
      || operations[index] === "Sanction Load S1" || operations[index] === "Sanction Load S2"
    ) {
      value = (parseInt(value) * 100);
    }

    console.log('fejfekfef', value);

    let fullCommand;

    setLoader(true);
    try {

      setIsWriteButtonDisabled(true);
      setIsReadButtonDisabled(true);

      switch (index) {
        case 0:
          console.log("Performing task for Operation");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x02], value); // Add the corresponding command for Operation
          break;

        case 1:
          console.log("Performing task for Per unit Selection S1");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x04], value);
          break;

        case 2:
          console.log("Performing task for Per unit Selection S2");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x05], value);
          break;

        case 3:
          console.log("Performing task for Auto Cut On Zero Balance");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x08], value);
          break;

        case 4:
          console.log("Performing task for Grace Credit");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x09], value);
          break;

        case 5:
          console.log("Performing task for Auto Cut On Maximum Demand");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x0F], value);
          break;

        case 6:
          console.log("Performing task for Sanction Load S1");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x10], value);
          break;

        case 7:
          console.log("Performing task for Sanction Load S2");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x11], value);
          break;

        case 8:
          console.log("Performing task for Auto Cut Cycle On Repeated Maximum");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x14], value);
          break;

        case 9:
          console.log("Performing task for Observation Time");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x15], value);
          break;

        case 10:
          console.log("Performing task for Off Time In Each Cycle");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x16], value);
          break;

        case 11:
          console.log("Performing task for Off Time After All Attempts");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x17], value);
          break;

        case 12:
          console.log("Performing task for Front Cover Tempering On / Off");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x19], value);
          break;

        case 13:
          console.log("Performing task for Electricity Charges Per Unit S1");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x28], value);
          break;

        case 14:
          console.log("Performing task for Electricity Charges Per Unit S2");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x29], value);
          break;

        case 15:
          console.log("Performing task for Charges Per Day Fixed");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x2C], value);
          break;

        case 16: // Forceful Deduction Amount
          console.log("Performing task for Forceful Deduction Amount");
          fullCommand = createCommand([0x65, 0x06, 0x00, 0x2D], value);
          break;

        case 17: // Device ID For Communication
          console.log("Performing task for Device ID For Communication");
          fullCommand = createCommand([0x7F, 0x06, 0x00, 0x2E], value);
          break;

        default:
          console.log("Performing default task");
          return;
      }


      if (!writer) {
        alert("Error: Writer is not initialized. Please connect to the device.");
        return;
      }

      // Send the command
      console.log('Sending command:', fullCommand);
      await writer.write(fullCommand);

      // Optionally, wait for a short delay to give the device time to process the command
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 500ms (adjust as needed)

      // Read the response
      const response = await reader.read();

      console.log('Received response:', response);

      // setNotification({ type: 'success', message: `Command for "${operations[index]}" sent successfully.` });

      toast.success(`Command for "${operations[index]}" sent successfully.`);

      console.log('Command sent successfully');
    } catch (error) {
      console.error('Error processing task:', error);

      //setNotification({ type: 'error', message: `Failed to process task: ${error.message}` });

      toast.error(`Failed to process task: ${error.message}`);
    }
    finally {

      setLoader(false);
      setIsWriteButtonDisabled(false)
      setIsReadButtonDisabled(false);
    }
  };

  // Handle read button click
  const handleRead = async (index) => {
    if (!connected) {
      toast.error("Error: Device is not connected. Please connect before reading.");
      return;
    }
    let readCommand;
    try {
      setIsReadButtonDisabled(true);
      setIsWriteButtonDisabled(true);

      switch (index) {
        case 0:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x02, 0x00, 0x01]); // Example read command
          break;

        case 1:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x04, 0x00, 0x01]); // Example read command
          break;

        case 2:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x05, 0x00, 0x01]); // Example read command
          break;

        case 3:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x08, 0x00, 0x01]); // Example read command
          break;

        case 4:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x09, 0x00, 0x01]); // Example read command
          break;

        case 5:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x0F, 0x00, 0x01]); // Example read command
          break;

        case 6:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x10, 0x00, 0x01]); // Example read command
          break;

        case 7:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x11, 0x00, 0x01]); // Example read command
          break;

        case 8:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x14, 0x00, 0x01]); // Example read command
          break;

        case 9:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x15, 0x00, 0x01]); // Example read command
          break;

        case 10:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x16, 0x00, 0x01]); // Example read command
          break;

        case 11:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x17, 0x00, 0x01]); // Example read command
          break;

        case 12:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x19, 0x00, 0x01]); // Example read command
          break;

        case 13:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x28, 0x00, 0x01]); // Example read command
          break;

        case 14:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x29, 0x00, 0x01]); // Example read command
          break;

        case 15:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x2C, 0x00, 0x01]); // Example read command
          break;

        case 16:
          readCommand = commandWithCRC([0x65, 0x03, 0x00, 0x2D, 0x00, 0x01]); // Example read command
          break;

        case 17:
          readCommand = commandWithCRC([0x7F, 0x03, 0x00, 0x2E, 0x00, 0x01]); // Example read command
          // console.log('commena', readCommand);
          break;

        default:
          console.log("Invalid command index");
          return;
      }

      if (!writer) {
        toast.error("Error: Writer is not initialized. Please connect to the device.");
        return;
      }

      await writer.write(readCommand);
      // Wait a bit for the response to arrive
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Read the response

      const { value, done } = await reader.read();

      // Extract the entire hex data from the response

      const hexData = Array.from(value) // Take all bytes
        .map(byte => byte.toString(16).padStart(2, '0')) // Convert to hex with padding
        .join('');

      console.log('All hex Values:', hexData);

      // Step 1: Remove the first 6 characters (representing 3 bytes)
      const removedStart = hexData.substring(6);

      // Step 2: Remove the last 4 characters (representing 2 bytes)
      const finalHexData = removedStart.substring(0, removedStart.length - 4);

      console.log('hex Values ', finalHexData);

      let decimalValue = parseInt(finalHexData, 16).toString();

      // If the operation is either "Electricity Charges Per Unit S1" or "Electricity Charges Per Unit S2"
      if (operations[index] === "Electricity Charges Per Unit S1" || operations[index] === "Electricity Charges Per Unit S2"
        || operations[index] === "Sanction Load S1" || operations[index] === "Sanction Load S2"
      ) {
        decimalValue = (parseInt(decimalValue) / 100).toFixed(2);
      }
      console.log('Device id ', decimalValue);
      // Update the input field's value for the specific operation
      setOperationValues((prevValues) => {
        const updatedValues = [...prevValues];
        updatedValues[index] = decimalValue; // Update value for the index
        return updatedValues;
      });
      toast.success(`Read command for "${operations[index]}" sent successfully.`);

    } catch (error) {
      toast.error(`Failed to process read task: ${error.message}`);
    }
    finally {
      setIsReadButtonDisabled(false);
      setIsWriteButtonDisabled(false);
    }
  };



  const WriteCommand = [
    [0x65, 0x06, 0x00, 0x02],
    [0x65, 0x03, 0x00, 0x02],
    [0x65, 0x03, 0x00, 0x04],
    [0x65, 0x03, 0x00, 0x05],
    [0x65, 0x03, 0x00, 0x08],
    [0x65, 0x03, 0x00, 0x09],
    [0x65, 0x03, 0x00, 0x0F],
    [0x65, 0x03, 0x00, 0x10],
    [0x65, 0x03, 0x00, 0x11],
    [0x65, 0x03, 0x00, 0x14],
    [0x65, 0x03, 0x00, 0x15],
    [0x65, 0x03, 0x00, 0x16],
    [0x65, 0x03, 0x00, 0x17],
    [0x65, 0x03, 0x00, 0x19],
    [0x65, 0x03, 0x00, 0x28],
    [0x65, 0x03, 0x00, 0x29],
    [0x65, 0x03, 0x00, 0x2C],
    [0x65, 0x03, 0x00, 0x2D],
    [0x7F, 0x03, 0x00, 0x2E],
  ]



  const handleWriteAllData = async () => {
    // setOperationValues(Array(18).fill(''));

    // Check if any of the selected checkboxes have empty fields

    // Check if any of the selected checkboxes have empty fields or null values


    // const unfilledInputs = selectedOperations.some(
    //   (isSelected, index) =>
    //     isSelected && (operationValues[index] === null || operationValues[index].trim() === '')
    // );

    // if (unfilledInputs) {
    //   toast.error(
    //     "Error: Some selected fields are empty or null. Please fill all selected fields."
    //   );
    //   return;
    // }


    // Check if device is connected
    if (!connected) {
      toast.error("Error: Device is not connected. Please connect before writing.");
      return;
    }

    // Map selected operations to WriteCommand and include values
    const WriteCommand = [
      [0x65, 0x06, 0x00, 0x02],
      [0x65, 0x06, 0x00, 0x04],
      [0x65, 0x06, 0x00, 0x05],
      [0x65, 0x06, 0x00, 0x08],
      [0x65, 0x06, 0x00, 0x09],
      [0x65, 0x06, 0x00, 0x0F],
      [0x65, 0x06, 0x00, 0x10],
      [0x65, 0x06, 0x00, 0x11],
      [0x65, 0x06, 0x00, 0x14],
      [0x65, 0x06, 0x00, 0x15],
      [0x65, 0x06, 0x00, 0x16],
      [0x65, 0x06, 0x00, 0x17],
      [0x65, 0x06, 0x00, 0x19],
      [0x65, 0x06, 0x00, 0x28],
      [0x65, 0x06, 0x00, 0x29],
      [0x65, 0x06, 0x00, 0x2C],
      [0x65, 0x06, 0x00, 0x2D],
      [0x7F, 0x06, 0x00, 0x2E],
    ];


    // Create array of selected operations and their commands
    const selectedData = selectedOperations
      .map((isSelected, index) => {
        if (isSelected) {

          let values = operationValues[index];

          // Skip if value is empty or null
          if (values.trim() === '') {
            return null;  // Skip this operation
          }

          // If the operation is either "Electricity Charges Per Unit S1" or "Electricity Charges Per Unit S2"
          if (operations[index] === "Electricity Charges Per Unit S1" || operations[index] === "Electricity Charges Per Unit S2"
            || operations[index] === "Sanction Load S1" || operations[index] === "Sanction Load S2"
          ) {
            values = (parseInt(values) * 100);
          }

          console.log('vales ', values);

          const command = createCommand(WriteCommand[index], values);
          return {
            operation: operations[index],
            command,
            value: operationValues[index],
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    if (selectedData.length === 0) {
      toast.error("Error: No operations selected. Please select at least one operation.");
      return;
    }

    setLoader(true);

    // Create an array to store all the responses
    const responses = [];

    // Simulate sending each command
    for (const { operation, command, value } of selectedData) {
      try {
        console.log(`Sending command for operation: "${operation}"`);
        // Convert command to Uint8Array for sending
        const fullCommand = new Uint8Array(command);
        console.log('Command: ', fullCommand);

        // Send the command
        await writer.write(fullCommand);

        // Optionally, wait for a short delay to give the device time to process the command
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Read the response
        const response = await reader.read();
        console.log('Received response:', response);

        // Store the response
        responses.push({ operation, response });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Display success message
        // toast.success(`Command for "${operation}" sent successfully.`);

      } catch (error) {
        // Handle any errors during sending
        console.error(`Failed to send command for "${operation}":`, error);
        toast.error(`Error: Failed to send command for "${operation}".`);
      }
    }

    // Once all commands are processed, hide the loader
    setLoader(false);
    toast.success(`All Response sent successfully.`);
    // Optionally, log or process the collected responses
    console.log('All responses:', responses);
  };














  // Define commands here
  const commands = [
    [0x65, 0x03, 0x00, 0x02, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x04, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x05, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x08, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x09, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x0F, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x10, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x11, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x14, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x15, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x16, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x17, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x19, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x28, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x29, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x2C, 0x00, 0x01],
    [0x65, 0x03, 0x00, 0x2D, 0x00, 0x01],
    [0x7F, 0x03, 0x00, 0x2E, 0x00, 0x01],
  ];


  const handleReadAllData = async () => {

    setOperationValues(Array(18).fill(''));

    if (!connected) {
      toast.error("Error: Device is not connected. Please connect before reading.");
      return;
    }


    // Get selected operations
    const selectedIndexes = selectedOperations
      .map((isSelected, index) => (isSelected ? index : null))
      .filter((index) => index !== null);

    if (selectedIndexes.length === 0) {
      toast.error("Error: Please select at least one operation before reading.");
      return;
    }

    setLoader(true);
    let allHexData = []; // To store all hex data from the responses
    let updatedValues = [...operationValues]; // Create a copy of current operation values

    // Process each selected operation
    for (const index of selectedIndexes) {
      const operation = operations[index]; // Get the operation name
      const command = commands[index]; // Get the corresponding command
      const commandWithCrcValue = commandWithCRC(command); // Calculate CRC for the command

      if (!writer) {
        toast.error("Error: Writer is not initialized. Please connect to the device.");
        setLoader(false);  // Ensure loader is hidden if writer is not initialized
        return;
      }

      try {
        // Send the command with CRC
        await writer.write(commandWithCrcValue);

        // Wait a bit for the response to arrive
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Read the response
        const { value, done } = await reader.read();

        if (done) {
          console.log('Reader has finished reading.');
          return;
        }

        // Extract the entire hex data from the response
        const hexData = Array.from(value) // Take all bytes
          .map(byte => byte.toString(16).padStart(2, '0')) // Convert to hex with padding
          .join('');

        // Step 1: Remove the first 6 characters (representing 3 bytes)
        const removedStart = hexData.substring(6);

        // Step 2: Remove the last 4 characters (representing 2 bytes)
        const finalHexData = removedStart.substring(0, removedStart.length - 4);

        console.log('hex Values ', finalHexData);

        const decimalValue = parseInt(finalHexData, 16).toString();
        console.log('Device id ', decimalValue);


        // If the operation is either "Electricity Charges Per Unit S1" or "Electricity Charges Per Unit S2"
        if (operation === "Electricity Charges Per Unit S1" || operation === "Electricity Charges Per Unit S2"
          || operation === "Sanction Load S1" || operation === "Sanction Load S2"

        ) {
          // Divide by 100
          const adjustedValue = (parseFloat(decimalValue) / 100).toFixed(2);
          updatedValues[index] = adjustedValue; // Update value for the index after dividing by 100
        } else {
          updatedValues[index] = decimalValue; // Update value normally for other operations
        }

        // Store the hex data
        allHexData.push(hexData);

      } catch (error) {
        toast.error("Error while reading data from device.");
        console.error(error);
      }
    }

    // Once all operations are processed, update the state at once
    setOperationValues(updatedValues);
    setLoader(false); // Hide loader after all operations are complete

    // Print all collected hex data after processing all operations
    console.log("All Hex Values:", allHexData);
  };


  return (
    <div className=''>

      {/* 
      <div className="m-2 ">
       
       
        <div className="mt-10 flex items-center">
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
              <p>Device Name: {portInfo.deviceName}</p>
            </div>
          ) : (
            <p>No port selected</p>
          )}
        </div>
      </div> */}



      <div className="overflow-x-auto mt-5">
        <table className="table-auto  text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Description
              </th>
              <th scope="col" className="px-6 py-3">
                Enter Values
              </th>
              <th scope="col" className="px-6 py-3">
                Operation 1
              </th>
              <th scope="col" className="px-6 py-3">
                Operation
              </th>
              <th scope="col" className="px-6 py-3 text-center ">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="form-checkbox "
                />
                Select All
              </th>
            </tr>
          </thead>
          <tbody>
            {operations.map((operation, index) => (
              <tr
                key={index}
              >
                <td className="px-6 py-4">{operation}</td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={operationValues[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    maxLength={5}
                    className="border rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-6 py-4">
                  <button
                    className={`text-white ${isReadButtonDisabled ? 'bg-gray-400' : 'bg-blue-600'} 
    hover:${isReadButtonDisabled ? '' : 'bg-blue-700'} focus:ring-4 focus:ring-blue-300 
    font-medium rounded-lg text-sm px-4 py-2 dark:${isReadButtonDisabled ? 'bg-gray-400' : 'bg-blue-500'} 
    dark:hover:${isReadButtonDisabled ? '' : 'bg-blue-600'} dark:focus:ring-blue-800`}
                    disabled={isReadButtonDisabled}
                    onClick={() => handleRead(index)}
                  >
                    Read..
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    className={`text-white ${isWriteButtonDisabled ? 'bg-gray-400' : 'bg-green-600'} 
      hover:${isWriteButtonDisabled ? '' : 'bg-green-700'} focus:ring-4 focus:ring-green-300 
      font-medium rounded-lg text-sm px-4 py-2 dark:${isWriteButtonDisabled ? 'bg-gray-400' : 'bg-green-500'} 
      dark:hover:${isWriteButtonDisabled ? '' : 'bg-green-600'} dark:focus:ring-green-800`}
                    disabled={isWriteButtonDisabled}
                    onClick={() => handleUpdate(index)}
                  >
                    Write
                  </button>
                </td>

                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOperations[index]}
                    onChange={() => toggleOperationSelection(index)}
                    className="form-checkbox"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className='flex justify-center mt-5 mb-10'>

          <div>
            <button
              className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 
                    font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-500 dark:hover:bg-blue-600 
                    dark:focus:ring-blue-800"
              onClick={handleReadAllData}
            >
              Read All
            </button>
          </div>

          <div className='ml-20'>
            <button
              className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 
                    font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-500 dark:hover:bg-blue-600 
                    dark:focus:ring-blue-800"
              onClick={handleWriteAllData}
            >
              Write  All
            </button>
          </div>
        </div>

      </div>

      {loader ? <Preloader /> : null}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

    </div>
  );
};

export default BluetoothCommunication;
