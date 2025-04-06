import { useState, useEffect, useRef } from 'react';
import AlbumDisplay from '../AlbumDisplay/AlbumDisplay';
import HorizontalAlbumDisplay from '../AlbumDisplay/HorizontalAlbumDisplay';
import StandbyMode from '../StandbyMode/StandbyMode';

const NowPlaying = ({ horizontal = true }) => {
  console.log("NowPlaying component rendering, horizontal:", horizontal);
  const [displayMode, setDisplayMode] = useState('standby'); 
  const [songData, setSongData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track consecutive errors to handle connection loss
  const errorCountRef = useRef(0);
  const mountedRef = useRef(true);
  
  // Improved check for Tidal content - this looks at vendor field and album art
  const checkForTidal = (metaData, playerStatus) => {
    // 1. Check if player has Tidal vendor
    const hasTidalVendor = playerStatus && playerStatus.vendor === "Tidal";
    
    // 2. Check if we have valid metadata with non-empty fields
    const hasValidMetadata = metaData && 
                            metaData.title && 
                            metaData.title !== "" && 
                            metaData.title !== "Unknown" &&
                            metaData.artist && 
                            metaData.artist !== "" && 
                            metaData.artist !== "Unknown";
    
    // 3. Check if album art URL contains Tidal references
    const hasTidalArt = metaData && 
                        metaData.albumArtURI && 
                        (metaData.albumArtURI.includes('tidal.com') || 
                         metaData.albumArtURI.includes('listen.tidal'));
    
    // 4. For WiiM Ultra, it might not set mode=32 even for Tidal Connect
    // Instead, look for any of these indicators
    console.log(`Tidal check: vendor=${hasTidalVendor}, metadata=${hasValidMetadata}, art=${hasTidalArt}`);
    
    // Show NowPlaying if it has Tidal vendor OR Tidal album art AND valid metadata
    return (hasTidalVendor || hasTidalArt) && hasValidMetadata;
  };
  
  // Data fetching function
  const fetchDataAndUpdateDisplay = async () => {
    try {
      // Get player status first to check active state and mode
      const statusResponse = await fetch('/proxy?url=https://192.168.1.167/httpapi.asp?command=getPlayerStatus');
      
      if (!statusResponse.ok) {
        errorCountRef.current += 1;
        console.warn(`API response not OK: ${statusResponse.status}, error count: ${errorCountRef.current}`);
        
        if (errorCountRef.current >= 3) {
          throw new Error(`Connection error: ${statusResponse.status}`);
        }
        
        return;
      }
      
      const playerStatus = await statusResponse.json();
      console.log('Player status:', playerStatus);
      
      // Reset error counter on successful fetch
      errorCountRef.current = 0;
      
      // Check if something is playing
      const isPlaying = playerStatus.status === "play";
      
      // If nothing is playing, go to standby
      if (!isPlaying) {
        console.log('Nothing playing, showing standby');
        if (mountedRef.current) {
          setDisplayMode('standby');
          setLoading(false);
        }
        return;
      }
      
      // Get metadata to check what's playing
      const metaResponse = await fetch('/proxy?url=https://192.168.1.167/httpapi.asp?command=getMetaInfo');
      
      if (!metaResponse.ok) {
        console.warn(`Metadata API response not OK: ${metaResponse.status}`);
        if (mountedRef.current) {
          setDisplayMode('standby');
          setLoading(false);
        }
        return;
      }
      
      const metaData = await metaResponse.json();
      console.log('Metadata:', metaData);
      
      const isTidalContent = checkForTidal(metaData.metaData, playerStatus);
      
      if (isTidalContent) {
        console.log('Tidal content detected, showing NowPlaying');
        if (mountedRef.current) {
          setSongData(metaData.metaData);
          setDisplayMode('nowplaying');
          setLoading(false);
        }
      } else {
        console.log('Non-Tidal content, showing standby');
        if (mountedRef.current) {
          setDisplayMode('standby');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (mountedRef.current) {
        setError(error.message);
        setDisplayMode('standby');
        setLoading(false);
      }
    }
  };
  
  // Setup polling
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchDataAndUpdateDisplay();
    
    // Setup interval
    const interval = setInterval(fetchDataAndUpdateDisplay, 2000);
    
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);
  
  // Force loading to complete after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && mountedRef.current) {
        console.log("Forcing loading to complete after timeout");
        setLoading(false);
        setDisplayMode('standby');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [loading]);
  
  // For debugging
  useEffect(() => {
    console.log(`Display mode changed to: ${displayMode}`);
  }, [displayMode]);
  
  // Render based on display mode
  if (loading) {
    return <StandbyMode />;
  }
  
  if (displayMode === 'standby' || error) {
    return <StandbyMode errorMessage={error} />;
  }
  
  if (displayMode === 'nowplaying' && songData) {
    console.log("Rendering NowPlaying display");
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}>
        {horizontal ? (
          <HorizontalAlbumDisplay 
            albumArt={songData.albumArtURI}
            title={songData.title || "Unknown"}
            artist={songData.artist || "Unknown"}
            bitRate={songData.bitRate || "Unknown"}
            bitDepth={songData.bitDepth || "0"}
            sampleRate={songData.sampleRate || "0"}
          />
        ) : (
          <AlbumDisplay 
            albumArt={songData.albumArtURI}
            title={songData.title || "Unknown"}
            artist={songData.artist || "Unknown"}
          />
        )}
      </div>
    );
  }
  
  // Fallback
  return <StandbyMode />;
};

export default NowPlaying;