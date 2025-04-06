import { useState, useEffect, useRef } from 'react';
import ColorThief from 'colorthief';
import './HorizontalAlbumDisplay.css';

const HorizontalAlbumDisplay = ({ albumArt, title, artist, bitRate, bitDepth, sampleRate }) => {
  const [backgroundColor, setBackgroundColor] = useState('rgb(240, 240, 235)');
  const imgRef = useRef(null);

  const extractColor = () => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(imgRef.current);
       
        // Apply background color - use lighter version for gallery wall
        const lighterColor = color.map(c => Math.min(255, Math.floor(c * 1.3 + 50)));
        setBackgroundColor(`rgb(${lighterColor[0]}, ${lighterColor[1]}, ${lighterColor[2]})`);
      } catch (error) {
        console.error('Error extracting color:', error);
      }
    }
  };
 
  const handleImageLoad = () => {
    // Extract colors when image loads (with a slight delay)
    setTimeout(extractColor, 100);
  };
  

  const formatAudioDetails = () => {
    // Format details while handling invalid values
    try {
      if (!bitRate || !bitDepth || !sampleRate || 
          bitRate === "Unknown" || bitDepth === "0" || sampleRate === "0") {
        return '';
      }
      
      const kbps = isNaN(parseInt(bitRate)) ? `${bitRate}` : `${bitRate} kbps`;
      const depth = isNaN(parseInt(bitDepth)) ? bitDepth : `${bitDepth}-bit`;
      
      // Format sample rate correctly (if it's a number)
      let rate;
      if (isNaN(parseInt(sampleRate))) {
        rate = sampleRate;
      } else {
        // Convert sample rate to kHz if it's in Hz
        const sampleRateNum = parseInt(sampleRate);
        if (sampleRateNum > 1000) {
          rate = `${(sampleRateNum / 1000).toFixed(1)} kHz`;
        } else {
          rate = `${sampleRateNum} kHz`;
        }
      }
      
      return `${kbps} ${depth}/${rate}`;
    } catch (e) {
      console.error('Error formatting audio details:', e);
      return '';
    }
  };
 
  // Format title and artist for small display 
  const formatText = (text, maxLength) => {
    if (!text) return 'Unknown';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  return (
    <div
      className="gallery-display-container"
      style={{ backgroundColor, transition: 'background-color 1s ease' }}
    >
      <div className="gallery-frame">
        <img
          ref={imgRef}
          className="gallery-album-art"
          src={albumArt}
          alt={`${title} by ${artist}`}
          crossOrigin="anonymous"
          onLoad={handleImageLoad}
          onError={(e) => {
            console.error('Image load error:', e);
            // Try to reload the image or set a fallback
            e.target.src = '/images/1.jpg';
          }}
        />
       
        {/* Museum-style exhibit label */}
        <div className="museum-label">
          <h2 className="artwork-title">
            {formatText(title, 30) || 'Unknown Title'}
          </h2>
          <p className="artist-name">
            {formatText(artist, 25) || 'Unknown Artist'}
          </p>
          <div className="label-divider"></div>
          <p className="artwork-details">
            {formatAudioDetails()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HorizontalAlbumDisplay;