# WiiM Display Customization Guide

This guide explains how to customize various aspects of your WiiM Display to match your preferences and setup.

## Table of Contents

1. [Visual Display Options](#1-visual-display-options)
2. [Slideshow Configuration](#2-slideshow-configuration)
3. [Color Theme Customization](#3-color-theme-customization)
4. [Layout Modifications](#4-layout-modifications)
5. [Adding Custom Fonts](#5-adding-custom-fonts)
6. [Hardware-Specific Optimizations](#6-hardware-specific-optimizations)
7. [Advanced: Supporting Additional Services](#7-advanced-supporting-additional-services)

## 1. Visual Display Options

### Toggle Between Horizontal and Vertical Layouts

The default layout is horizontal, which works well for standard widescreen displays. You can toggle between layouts:

- **Keyboard Shortcut**: Press the 'v' key when the application is running
- **Default Setting**: Change the default in `src/App.jsx`:
  ```javascript
  // Change to false for vertical layout
  const [horizontalView, setHorizontalView] = useState(true);
  ```

### Changing the Appearance of the Now Playing Screen

The display layout is defined in the following files:

- **Horizontal Layout**: `src/components/AlbumDisplay/HorizontalAlbumDisplay.jsx` and its CSS file `src/components/AlbumDisplay/HorizontalAlbumDisplay.css`
- **Vertical Layout**: `src/components/AlbumDisplay/AlbumDisplay.jsx` and its CSS file `src/components/AlbumDisplay/AlbumDisplay.css`

You can modify these files to change spacing, sizes, fonts, and other visual elements.

Example: To change the label style in horizontal layout, edit `HorizontalAlbumDisplay.css`:

```css
/* Example: Modify the museum-style label */
.museum-label {
  position: relative;
  width: 20%; /* Adjust width as needed */
  padding: 15px 20px; /* Increase padding */
  background-color: white;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12); /* More pronounced shadow */
  text-align: left;
}

/* Make artist name larger */
.artist-name {
  font-size: 1.2em; /* Increase from default */
  font-weight: normal;
  margin-bottom: 8px;
}
```

### Modify Background Color Adaptation

The display adapts its background color based on the album art. You can modify this behavior in either `HorizontalAlbumDisplay.jsx` or `AlbumDisplay.jsx`:

```javascript
// In the extractColor function:
const lighterColor = color.map(c => Math.min(255, Math.floor(c * 1.3 + 50)));
// Increase 1.3 for lighter backgrounds, decrease for darker backgrounds
// Adjust 50 to change the baseline brightness
```

## 2. Slideshow Configuration

### Changing Slideshow Timing

To adjust how long each image displays during the slideshow:

1. Open `src/components/StandbyMode/StandbyMode.jsx`
2. Find the interval setting:
   ```javascript
   // Change 30000 (30 seconds) to your desired value in milliseconds
   timerRef.current = setInterval(() => {
     // ...
   }, 30000);
   ```

### Slideshow Transition Effects

To add or modify image transition effects:

1. Open `src/components/StandbyMode/StandbyMode.jsx`
2. Find the style definitions:
   ```javascript
   const styles = {
     // ...
     image: {
       // ...
       transition: 'opacity 0.5s ease-in', // Modify this line
     }
   };
   ```

Options for transitions:
- Fade: `transition: 'opacity 0.5s ease-in'`
- Zoom: `transform: 'scale(1.05)', transition: 'opacity 0.5s ease-in, transform 0.5s ease-in'`
- Slide: `transform: 'translateX(0)', transition: 'opacity 0.5s ease-in, transform 0.5s ease-in'`

### Image Fit Options

To change how images fit the screen:

1. Open `src/components/StandbyMode/StandbyMode.jsx`
2. Find the image style:
   ```javascript
   styles: {
     // ...
     image: {
       // ...
       objectFit: 'cover', // Changes how the image fills the container
     }
   }
   ```

Options include:
- `cover`: Fills the entire area, cropping if needed (good for photos)
- `contain`: Shows the entire image, may have empty space
- `fill`: Stretches the image to fill the area (may distort)
- `none`: Original size, may crop or leave empty space

## 3. Color Theme Customization

### Background Color for Standby Mode

To change the base background color for the slideshow:

1. Open `src/components/StandbyMode/StandbyMode.jsx`
2. Find the container style:
   ```javascript
   const styles = {
     container: {
       // ...
       backgroundColor: '#000', // Change to your preferred color
     }
   };
   ```

### Modify Text Colors

To change the color of text elements:

1. Open the CSS files for the display components
2. Find and modify the text color properties:
   ```css
   .artwork-title {
     /* ... */
     color: rgb(30, 30, 30) !important; /* Change to your preferred color */
   }
   ```

### Modifying the Color Extraction Algorithm

The display automatically extracts colors from album art. To modify how these colors are used:

1. Open either `AlbumDisplay.jsx` or `HorizontalAlbumDisplay.jsx`
2. Find the `extractColor` function:
   ```javascript
   const extractColor = () => {
     if (imgRef.current && imgRef.current.complete) {
       try {
         const colorThief = new ColorThief();
         const color = colorThief.getColor(imgRef.current);
         // Modify how colors are used here
       } catch (error) {
         console.error('Error extracting color:', error);
       }
     }
   };
   ```

## 4. Layout Modifications

### Modify the Museum Label Style (Horizontal Mode)

To change the information panel in horizontal mode:

1. Open `src/components/AlbumDisplay/HorizontalAlbumDisplay.css`
2. Find and customize the museum label styles:
   ```css
   .museum-label {
     /* Change position, size, borders, etc. */
   }
   ```

### Change Album Art Size and Position

To adjust how large the album art appears:

1. Open the respective CSS file for your layout
2. For horizontal layout, modify:
   ```css
   .gallery-album-art {
     max-width: 85%; /* Adjust size */
     max-height: 98%; /* Adjust size */
     border: 8px solid white; /* Modify border */
     box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* Adjust shadow */
   }
   ```

### Add Custom Decorative Elements

You can add decorative elements like a frame or background pattern:

1. Open the respective CSS file
2. Add new style rules, for example:
   ```css
   /* Add a decorative pattern background */
   .gallery-frame::before {
     content: '';
     position: absolute;
     top: 0;
     left: 0;
     width: 100%;
     height: 100%;
     background-image: url('/images/pattern.png');
     opacity: 0.05;
     pointer-events: none;
   }
   ```

## 5. Adding Custom Fonts

To use custom fonts in your display:

1. Add the font files to the `public` folder (create a `fonts` subdirectory)
2. Create or modify `src/index.css` to include your font:
   ```css
   @font-face {
     font-family: 'MyCustomFont';
     src: url('/fonts/CustomFont.woff2') format('woff2'),
          url('/fonts/CustomFont.woff') format('woff');
     font-weight: normal;
     font-style: normal;
   }
   ```
3. Use the font in your CSS files:
   ```css
   .artwork-title {
     font-family: 'MyCustomFont', serif;
     /* other styles */
   }
   ```

## 6. Hardware-Specific Optimizations

### Display Size Optimization

For specific display resolutions:

1. Open the CSS files for your layouts
2. Add media queries for your specific display:
   ```css
   /* For a 1280x800 display */
   @media (width: 1280px) and (height: 800px) {
     .gallery-album-art {
       max-width: 80%;
       max-height: 90%;
     }
     
     .museum-label {
       width: 18%;
       padding: 10px;
     }
   }
   ```

### Touch Screen Support

If your display has a touch screen:

1. Open `src/App.jsx`
2. Add touch gestures to toggle display modes:
   ```javascript
   useEffect(() => {
     const handleTouch = (e) => {
       // Toggle on double tap
       if (e.touches.length === 1) {
         const now = Date.now();
         if (now - lastTap.current < 300) {
           setHorizontalView(prev => !prev);
         }
         lastTap.current = now;
       }
     };
     
     document.addEventListener('touchstart', handleTouch);
     return () => document.removeEventListener('touchstart', handleTouch);
   }, []);
   ```

### Low-Powered Devices (Raspberry Pi Zero, etc.)

For less powerful devices:

1. Simplify the display by removing animations:
   ```css
   /* Remove transitions */
   .gallery-display-container {
     transition: none !important;
   }
   ```

2. Reduce image sizes for the slideshow:
   - Resize your images to match your display resolution before uploading

## 7. Advanced: Supporting Additional Services

### Adding Support for Other Music Services

To display other music services in the NowPlaying view:

1. Open `src/components/NowPlaying/NowPlaying.jsx`
2. Find the `checkForTidal` function and modify it to support other services:
   ```javascript
   const checkForMusicService = (metaData, playerStatus) => {
     // Check for Tidal
     const isTidal = (playerStatus.vendor === "Tidal") || 
                    (metaData.albumArtURI && metaData.albumArtURI.includes('tidal.com'));
     
     // Check for Qobuz (example)
     const isQobuz = (playerStatus.vendor === "Qobuz") || 
                    (metaData.albumArtURI && metaData.albumArtURI.includes('qobuz.com'));
     
     // Return true for any supported service
     return (isTidal || isQobuz) && hasValidMetadata(metaData);
   };
   ```

### Creating Different Visual Styles for Different Services

To show different visual styles based on the service:

1. First, identify the service:
   ```javascript
   const getServiceType = (metaData, playerStatus) => {
     if (playerStatus.vendor === "Tidal" || 
         (metaData.albumArtURI && metaData.albumArtURI.includes('tidal.com'))) {
       return 'tidal';
     } else if (playerStatus.vendor === "Qobuz" ||
               (metaData.albumArtURI && metaData.albumArtURI.includes('qobuz.com'))) {
       return 'qobuz';
     }
     return 'other';
   };
   ```

2. Then use this to select different styles:
   ```jsx
   const serviceType = getServiceType(songData, playerStatus);
   
   return (
     <div className={`service-${serviceType}`}>
       {horizontal ? (
         <HorizontalAlbumDisplay 
           serviceType={serviceType}
           albumArt={songData.albumArtURI}
           title={songData.title || "Unknown"}
           artist={songData.artist || "Unknown"}
         />
       ) : (
         // ...
       )}
     </div>
   );
   ```

3. Add CSS styles for each service in your CSS files:
   ```css
   .service-tidal .artwork-title {
     color: #00ffff;
   }
   
   .service-qobuz .artwork-title {
     color: #ff5500;
   }
   ```

---

This guide covers the most common customization options for Wiim Display. For more advanced modifications, refer to the React documentation or create a feature request on the GitHub repository.