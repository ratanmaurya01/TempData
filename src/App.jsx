import React from "react";
import BluetoothCommunication from "./components/BleConnect";
import ConnectBle from "./components/ConnectBle";
import SerialPortDetection from "./components/PortConnection";
import SerialPortCommunication from "./components/Serial";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UBS from "./components/UBS";
import Wifi from "./components/Wifi";
import Header from "./Header";
import Test from "./components/Test";


function App() {
  return (
    <>
      <div className="ml-60 mr-60" >
        <Router>
          <div>
          <Header />
          </div>
          <div >
            <Routes>
              <Route path="/" element={<SerialPortCommunication />} />
              <Route path="/UBS" element={<UBS />} />
              <Route path="/Wifi" element={<Wifi />} />

              <Route path="/Test" element={<Test />} />
              
              <Route path="/BluetoothCommunication"
                element={<BluetoothCommunication />} />
            </Routes>
          </div>


         
        </Router>
      </div>
    </>
  );
}

export default App;
