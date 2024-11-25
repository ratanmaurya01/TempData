import React from 'react'
import { useSerialPort } from './context/SerialPortContext'
import { useNavigate } from 'react-router-dom';

export default function Header() {
    const navigate = useNavigate();

    const {
        port,
        setPort,
        writer,
        setWriter,
        reader,
        setReader,
        connected,
        setConnected,
        portInfo,
        setPortInfo,
    } = useSerialPort();

    const handleSelectPort = async () => {
        try {
            const selectedPort = await navigator.serial.requestPort();
            if (!selectedPort) {
                console.error('No port selected');
                return;
            }

        
            const deviceName = 'CP2102 USB to UART Bridge Control';
            const portDetails = selectedPort.getInfo();
            const vendorId = portDetails.usbVendorId;
            const productId = portDetails.usbProductId;
            await selectedPort.open({ baudRate: 9600 ,
                dataBits: 8,
             });
            const portWriter = selectedPort.writable.getWriter();
            setWriter(portWriter);
            const readableStream = selectedPort.readable;

            // { mode: "byob" }
            
            const portReader = readableStream.getReader();

            setReader(portReader);
            setPort(selectedPort);
            setConnected(true);
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
                if (writer) {
                    await writer.releaseLock();
                    setWriter(null);
                }
                if (reader) {
                    await reader.releaseLock();
                    setReader(null);
                }

                await port.close();
                setPort(null);
                setPortInfo(null);
                setConnected(false);
            } catch (error) {
                console.error('Failed to disconnect:', error);
            }
        } else {
            console.log('No port to disconnect from');
        }
    };

    const handleNavigate = () => {
        navigate('/BluetoothCommunication');
    }

    const handleNavigateWithAction = (path, action) => {
        navigate(path, { state: { action } });
    };

    return (
        <div className='mt-10'>

            <div className=' flex items-center'>

                {connected ? (
                    <>
                        <div>
                            <button
                                type="button"
                                className="  text-white bg-red-700 hover:bg-red-800 focus:ring-4
                        focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600
                        dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800"

                                onClick={handleDisconnect} disabled={!connected}>
                                Disconnect
                            </button>

                        </div>
                    </>

                ) : (

                    <button

                        type="button"
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4
focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600
dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                        onClick={handleSelectPort}>Connect</button>
                )}

                <div className=''>
                    {portInfo ? (
                        <div>
                            <p>Device Name: {portInfo.deviceName}</p>
                        </div>
                    ) : (
                        <p>No port selected</p>
                    )}
                </div>

            </div>

            <div className=''>
                <div className='px-1 py-1 bg-gray-700 shadow-sm rounded-md'>
                    <div className='flex justify-between m-10 items-start'>
                        <div className='flex space-x-10' >
                            <p
                                className="text-white cursor-pointer hover:text-blue-400"
                                onClick={() => handleNavigateWithAction('/', 'handleInstanceData')}
                            >
                                Instance Data
                            </p>
                            <p
                                className="text-white cursor-pointer hover:text-blue-400"
                                onClick={() => handleNavigateWithAction('/', 'handleCurrentBalance')}
                            >

                            </p>
                            <p
                                className="text-white cursor-pointer hover:text-blue-400"
                                onClick={() => handleNavigateWithAction('/', 'handleRechargeParameter')}
                            >
                                Recharge parameter
                            </p>
                            <p
                                className="text-white cursor-pointer hover:text-blue-400"
                                onClick={() => handleNavigateWithAction('/', 'handleBillingParameter')}
                            >
                                Billing History
                            </p>
                            <p className='text-white cursor-pointer hover:text-blue-400' onClick={handleNavigate}>Writable Data</p>

                            <p className='text-white cursor-pointer hover:text-blue-400'
                                onClick={() => handleNavigateWithAction('/', 'handleTemperedData')}
                            > Temper Data </p>

                            <p className='text-white cursor-pointer hover:text-blue-400'
                                onClick={() => handleNavigateWithAction('/', 'handleDeduction')}
                            >Deduction </p>

                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}


