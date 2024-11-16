import React, { useEffect, useState } from 'react';

function Web() {
    const [message, setMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false); // Track WebSocket connection status

    useEffect(() => {
        if (isConnected) {
            // Create the WebSocket connection only when the button is clicked
            const ws = new WebSocket('ws://192.168.1.40:81/');

            ws.onopen = () => {
                console.log('WebSocket connection opened');
                // Send the 'm0' command once the connection is open
                ws.send('m0'); 
                console.log('Command m0 sent');
            };

            ws.onmessage = (event) => {
                console.log('Message received:', event.data);
                setMessage(event.data); // Store the received message in state
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed');
                setIsConnected(false); // Update the connection status on close
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            // Store WebSocket instance for sending messages later
            setSocket(ws);

            // Cleanup WebSocket connection on component unmount or when disconnected
            return () => {
                ws.close();
            };
        }
    }, [isConnected]);

    const handleConnect = () => {
        setIsConnected(true); // Initiate the WebSocket connection
    };

    const handleDisconnect = () => {
        if (socket) {
            socket.close(); // Close the WebSocket connection manually
        }
        setIsConnected(false); // Update connection status
    };

    const handleSendCommand = () => {
        console.log('object')
        if (socket && isConnected) {
            socket.send('M0'); // Send the 'm0' command after the connection is open
            console.log('Command m0 sent again');
        }
    };

    return (
        <div className='ml-10'>
            <h1>WebSocket Example</h1>
            <div className='mt-3'>
                {isConnected ? (
                    <button type="button" className="text-white bg-blue-700" onClick={handleDisconnect}>Disconnect</button>
                ) : (
                    <button type="button" className="text-white bg-blue-700" onClick={handleConnect}>Connect</button>
                )}
            </div>

            <div className='mt-3'>
                <button type="button" className="text-white bg-blue-700" onClick={handleSendCommand}>
                    Send Command
                </button>
            </div>

            <div className='mt-5'>
                <button type="button" className="text-white bg-blue-700">
                    Received Data: {message}
                </button>
            </div>
        </div>
    );
}

export default Web;
