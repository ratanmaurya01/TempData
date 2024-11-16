import React from "react";
import BluetoothCommunication from "./components/BleConnect";
import ConnectBle from "./components/ConnectBle";
import SerialPortDetection from "./components/PortConnection";
import SerialPortCommunication from "./components/Serial";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UBS from "./components/UBS";
import Wifi from "./components/Wifi";
import Web from "./components/Web";


function App() {
  return (
    <>
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<SerialPortCommunication />} />
            <Route path="/UBS" element={<UBS />} />  
            <Route path="/Wifi" element={<Wifi />} />  

            <Route path="/Web" element={<Web />} />  

          </Routes>
        </div>
      </Router>

      

      {/* <SerialPortCommunication /> */}
      {/* <BluetoothCommunication/> */}
    </>
  );
}

export default App;
