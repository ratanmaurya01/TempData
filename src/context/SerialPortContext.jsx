import { createContext, useContext, useState } from "react";

const SerialPortContext = createContext();

export const useSerialPort = () => {
    return useContext(SerialPortContext);
}

export const SerialPortProvider = ({ children }) => {
    const [port, setPort] = useState(null);
    const [writer, setWriter] = useState(null);
    const [reader, setReader] = useState(null);
    const [connected, setConnected] = useState(false);
    const [portInfo, setPortInfo] = useState(null);
    return (
        <SerialPortContext.Provider
            value={{
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
            }}
        >
            {children}
        </SerialPortContext.Provider>
    );
}