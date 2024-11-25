
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


export const commandWithCRC =(commandArray)=> {

    const crc = crc16Modbus(commandArray);
    // Swap the CRC bytes
    const crcLow = crc & 0xFF;         // Lower byte
    const crcHigh = (crc >> 8) & 0xFF; // Higher byte (after shifting)
    // Create a new command array with the swapped CRC bytes at the end
    const fullCommand = [...commandArray, crcLow, crcHigh];
    // Return the new Uint8Array
    return new Uint8Array(fullCommand);
}


