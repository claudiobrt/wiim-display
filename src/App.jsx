import { useState, useEffect } from 'react';
import NowPlaying from './components/NowPlaying/NowPlaying';
import './App.css';

// Global styles directly applied to ensure fullscreen
const forceFullscreen = () => {
  // Apply to document root
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';
  document.documentElement.style.width = '100vw';
  document.documentElement.style.height = '100vh';
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.style.backgroundColor = '#000';
  
  // Apply to body
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.width = '100vw';
  document.body.style.height = '100vh';
  document.body.style.overflow = 'hidden';
  document.body.style.backgroundColor = '#000';
  
  // Apply to root div
  const rootDiv = document.getElementById('root');
  if (rootDiv) {
    rootDiv.style.margin = '0';
    rootDiv.style.padding = '0';
    rootDiv.style.width = '100vw';
    rootDiv.style.height = '100vh';
    rootDiv.style.overflow = 'hidden';
    rootDiv.style.backgroundColor = '#000';
  }
};

// Pre-check for IP configuration
const checkWiimConnection = async () => {
  try {
    // Check if the server is using the correct WiiM IP address
    const response = await fetch('/proxy?url=https://192.168.1.167/httpapi.asp?command=getStatusEx');
    if (response.ok) {
      const data = await response.json();
      console.log('WiiM connection successful:', data.ssid);
      return true;
    }
    return false;
  } catch (error) {
    console.error('WiiM connection failed:', error);
    return false;
  }
};

function App() {
  const [horizontalView, setHorizontalView] = useState(true);
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Check connection on startup
  useEffect(() => {
    const performConnectionCheck = async () => {
      const connected = await checkWiimConnection();
      setIsConnected(connected);
      setConnectionChecked(true);
    };
    
    performConnectionCheck();
  }, []);

  // Force fullscreen styles
  useEffect(() => {
    // Initial application
    forceFullscreen();
    
    // Reapply periodically to ensure nothing overrides
    const styleInterval = setInterval(forceFullscreen, 2000);
    
    // Apply on resize
    window.addEventListener('resize', forceFullscreen);
    
    // Clean up
    return () => {
      clearInterval(styleInterval);
      window.removeEventListener('resize', forceFullscreen);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle between horizontal and vertical view with 'v' key
      if (e.key === 'v') {
        setHorizontalView(prev => !prev);
        console.log('View mode toggled to:', !horizontalView ? 'horizontal' : 'vertical');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [horizontalView]);

  return (
    <div className="App">
      {connectionChecked && (
        <NowPlaying 
          horizontal={horizontalView} 
          connectionError={!isConnected ? 'Could not connect to WiiM device. Please check IP address in proxy-server.js' : null}
        />
      )}
    </div>
  );
}

export default App;