import React, { useState } from 'react';

function UBS() {

    const [deviceInfo, setDeviceInfo] = useState(null);
    const [connected, setConnected] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentBalance, setCurrentBalance] = useState('');
    const [selectedDevice, setSelectedDevice] = useState(null);

    const handleSelectPort = async () => {
        try {
            if (!navigator.usb) {
                setErrorMessage('WebUSB API not supported on this browser.');
                return;
            }

            const device = await navigator.usb.requestDevice({
                filters: [{ vendorId: 0x10c4, productId: 0xea60 }]
            });

            await device.open();
            await device.selectConfiguration(1); // Try configuration 1 (or other configurations)

            // Log device configuration to check available interfaces
            console.log("Device Configuration:", device.configuration); ```javascript```
            const interfaces = device.configuration.interfaces;
            if (interfaces && interfaces.length > 0) {
                console.log("Interfaces found:", interfaces);
                const interfaceToClaim = interfaces[0];  // Assuming interface 0 is what we need
                console.log("Claiming interface:", interfaceToClaim);

                // Now claim the correct interface
                await device.claimInterface(interfaceToClaim.interfaceNumber);
                setSelectedDevice(device);
                setConnected(true);

                setDeviceInfo({
                    deviceName: device.productName,
                    manufacturer: device.manufacturerName,
                    vendorId: device.vendorId,
                    productId: device.productId,
                });
                setErrorMessage('');
            } else {
                setErrorMessage("No interfaces found for this device.");
            }
        } catch (error) {
            console.error('Error while selecting device:', error);
            setErrorMessage('Failed to select device: ' + error.message);
        }
    };




    const handleSendCommand = async () => {
        setCurrentBalance('');
        if (!selectedDevice) {
            alert('Error: Device not connected');
            return;
        }

        const command = new Uint8Array([0x65, 0x04, 0x02, 0x86, 0x00, 0x02, 0x99, 0xBE]);

        try {
            // Send command to device using transferOut (or writer.write())
            await selectedDevice.transferOut(2, command); // Use endpoint 2 for OUT operation

            // Wait for the device to process the command
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Read data from device using transferIn (typically from endpoint 1 for IN operation)
            const result = await selectedDevice.transferIn(1, 64);  // Endpoint 1, 64 bytes buffer

            if (result.data && result.data.byteLength >= 7) {
                const hexData = [
                    result.data.getUint8(3).toString(16).padStart(2, '0'),
                    result.data.getUint8(4).toString(16).padStart(2, '0'),
                    result.data.getUint8(5).toString(16).padStart(2, '0'),
                    result.data.getUint8(6).toString(16).padStart(2, '0')
                ].join('');

                const decimalValue = parseInt(hexData, 16);
                const formattedDecimal = (decimalValue / 100).toFixed(2);

                setCurrentBalance(formattedDecimal);
            } else {
                console.error('Response data is insufficient or malformed:', result.data);
            }
        } catch (error) {
            console.error('Failed to send command or read response:', error);
            setErrorMessage('Error: ' + error.message);
        }
    };



    return (
        <div>
            <h6>USB Device</h6>
            <button onClick={handleSelectPort}>Connect USB Device</button>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            {connected && deviceInfo && (
                <div>
                    <h6>Device Information</h6>
                    <p><strong>Device Name:</strong> {deviceInfo.deviceName}</p>
                    <p><strong>Manufacturer:</strong> {deviceInfo.manufacturer}</p>
                    <p><strong>Vendor ID:</strong> {deviceInfo.vendorId}</p>
                    <p><strong>Product ID:</strong> {deviceInfo.productId}</p>
                </div>
            )}
            {connected && (
                <div>
                    <button onClick={handleSendCommand}>Get Data</button>
                    {currentBalance && <p><strong>Current Balance:</strong> {currentBalance}</p>}
                </div>
            )}
        </div>
    );
}

export default UBS;
