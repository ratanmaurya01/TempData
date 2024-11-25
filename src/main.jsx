
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { SerialPortProvider } from './context/SerialPortContext.jsx'

createRoot(document.getElementById('root')).render(

  <SerialPortProvider>
    <App />
  </SerialPortProvider>


)
