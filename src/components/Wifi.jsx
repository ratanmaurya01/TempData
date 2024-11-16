import React, { useEffect, useState } from "react";

const Wifi = () => {
    const [networks, setNetworks] = useState([]);

    const fetchWifiNetworks = async () => {
        // Simulating a delay and fetching network data from a backend or native app.
        setTimeout(() => {
            const sampleNetworks = [
                { ssid: "Network_1", signalStrength: "Strong" },
                { ssid: "Network_2", signalStrength: "Medium" },
                { ssid: "Network_3", signalStrength: "Weak" }
            ];
            setNetworks(sampleNetworks);
        }, 1000);
    };

    return (
        <div className="ml-10 mt-10">
            <button onClick={fetchWifiNetworks}>Show Wi-Fi Networks</button>
            
            <div className="mt-4">
                {networks.length > 0 ? (
                    <ul>
                        {networks.map((network, index) => (
                            <li key={index}>
                                <strong>{network.ssid}</strong> - Signal: {network.signalStrength}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No networks available</p>
                )}
            </div>
        </div>
    );
};

export default Wifi;
