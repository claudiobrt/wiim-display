import { useState, useEffect, useRef } from 'react';

// Simple inline styles
const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    zIndex: 100
  },
  image: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    objectFit: 'cover',
    margin: 0,
    padding: 0,
    backgroundColor: '#000'
  },
  loading: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    color: '#fff',
    fontSize: '24px'
  },
  error: {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '14px',
    zIndex: 10000
  }
};

const StandbyMode = ({ errorMessage }) => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  
  // Load images
  useEffect(() => {
    mountedRef.current = true;
    
    const loadImages = async () => {
      try {
        console.log('Loading images for standby mode');
        const response = await fetch('/images-list');
        
        if (!response.ok) {
          throw new Error(`Image list request failed: ${response.status}`);
        }
        
        const imageList = await response.json();
        console.log(`Found ${imageList.length} images`);
        
        if (imageList && imageList.length > 0) {
          // Add path prefix to each image
          const imagesWithPath = imageList.map(img => `/images/${img}`);
          
          if (mountedRef.current) {
            setImages(imagesWithPath);
            setLoading(false);
          }
        } else {
          // Fallback to numbered images
          const fallbackImages = [];
          for (let i = 1; i <= 10; i++) {
            fallbackImages.push(`/images/${i}.jpg`);
          }
          
          if (mountedRef.current) {
            setImages(fallbackImages);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading images:', error);
        
        // Use fallback
        const fallbackImages = [];
        for (let i = 1; i <= 5; i++) {
          fallbackImages.push(`/images/${i}.jpg`);
        }
        
        if (mountedRef.current) {
          setImages(fallbackImages);
          setLoading(false);
        }
      }
    };
    
    loadImages();
    
    // Force loading to complete after timeout
    const loadingTimer = setTimeout(() => {
      if (mountedRef.current && loading) {
        setLoading(false);
      }
    }, 3000);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(loadingTimer);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Setup image rotation
  useEffect(() => {
    if (images.length === 0) return;
    
    // Start rotation timer
    timerRef.current = setInterval(() => {
      if (mountedRef.current) {
        setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
      }
    }, 30000); // 30 seconds
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [images]);
  
  // Loading state
  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }
  
  // No images
  if (images.length === 0) {
    return (
      <div style={styles.loading}>
        <p>No images available</p>
      </div>
    );
  }
  
  // Show current image
  return (
    <div style={styles.container}>
      <img 
        src={images[currentIndex]} 
        alt="Standby" 
        style={styles.image}
        onError={(e) => {
          console.error('Error loading image:', e);
          // Try to advance to next image on error
          if (images.length > 1) {
            setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
          }
        }}
      />
      
      {errorMessage && (
        <div style={styles.error}>
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default StandbyMode;