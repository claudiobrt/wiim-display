import { useState, useEffect, useRef } from 'react';
import ColorThief from 'colorthief';
import './AlbumDisplay.css'; 

const AlbumDisplay = ({ albumArt, title, artist }) => {
  const [backgroundColor, setBackgroundColor] = useState('rgb(0, 0, 0)');
  const [textColor, setTextColor] = useState('white');
  const imgRef = useRef(null);

  const extractColor = () => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(imgRef.current);
        
        // Apply background color
        setBackgroundColor(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        
        // Determine text color based on brightness
        const brightness = (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000;
        setTextColor(brightness > 128 ? 'black' : 'white');
      } catch (error) {
        console.error('Error extracting color:', error);
      }
    }
  };

  const handleImageLoad = () => {
    // Extract colors when image loads (with a slight delay)
    setTimeout(extractColor, 100);
  };

  return (
    <div 
      className="album-display-container"
      style={{ backgroundColor, transition: 'background-color 1s ease' }}
    >
      <div className="cover-container">
        <img
          ref={imgRef}
          id="album-art"
          src={albumArt}
          alt={`${title} by ${artist}`}
          crossOrigin="anonymous"
          onLoad={handleImageLoad}
        />
      </div>
      
      <div className="text-container">
        <h2 style={{ color: textColor, transition: 'color 1s ease' }}>
          {title || 'Unknown Title'}
        </h2>
        <p style={{ color: textColor, transition: 'color 1s ease' }}>
          {artist || 'Unknown Artist'}
        </p>
      </div>
    </div>
  );
};

export default AlbumDisplay;