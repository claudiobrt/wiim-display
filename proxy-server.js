import express from 'express';
import cors from 'cors';
import axios from 'axios';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Create an https.Agent to ignore SSL certificate errors
const agent = new https.Agent({
  rejectUnauthorized: false  // Disable certificate validation (use only for local development)
});

// Serve static files from the dist directory after build
app.use(express.static(path.join(__dirname, 'dist')));

// Serve images from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Create images directory for local album art
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('Created images directory at:', imagesDir);
}

// Create a cache directory for Tidal images
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('Created cache directory at:', cacheDir);
}

// Utility to create hash for cache filenames
function createImageHash(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

// Route to proxy requests to the WiiM Ultra API
app.get('/proxy', async (req, res) => {
  const url = req.query.url;  // The API URL you want to access

  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    console.log(`Fetching data from: ${url}`);  // Log the URL being fetched

    // Fetch data from WiiM Ultra API with the agent that ignores SSL errors
    const response = await axios.get(url, { httpsAgent: agent });

    // Modify the response for specific API calls
    if (url.includes('getMetaInfo') && response.data && response.data.metaData && response.data.metaData.albumArtURI) {
      const originalUrl = response.data.metaData.albumArtURI;
      
      // Upgrade to 1280x1280 if it's a Tidal image
      if (originalUrl.includes('tidal.com/images') && originalUrl.includes('/640x640.jpg')) {
        const highResUrl = originalUrl.replace('/640x640.jpg', '/1280x1280.jpg');
        console.log('Upgraded album art URL in API response:', highResUrl);
        response.data.metaData.albumArtURI = highResUrl;
      }
    }

    // Set the necessary CORS headers in the response
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Send the response back to the client
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from WiiM Ultra:', error);
    res.status(500).json({ error: 'Error fetching data', message: error.message });
  }
});

// Images list endpoint
app.get('/images-list', (req, res) => {
  try {
    // Check if directory exists
    if (!fs.existsSync(imagesDir)) {
      console.log(`Images directory does not exist: ${imagesDir}`);
      fs.mkdirSync(imagesDir, { recursive: true });
      console.log(`Created images directory at: ${imagesDir}`);
      return res.json([]);
    }
    
    // Read directory contents
    const files = fs.readdirSync(imagesDir);
    
    // Filter for image files
    const imageFiles = files.filter(file => {
      try {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
      } catch (err) {
        console.error(`Error processing file ${file}:`, err);
        return false;
      }
    });
    
    console.log(`Found ${imageFiles.length} images in ${imagesDir}`);
    return res.json(imageFiles);
  } catch (error) {
    console.error('Error listing images:', error);
    // Return empty array instead of error to prevent app from breaking
    return res.json([]);
  }
});

// Image proxy endpoint
app.get('/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).send('Missing image URL parameter');
  }

  try {
    console.log(`Fetching image from: ${imageUrl}`);

    // Create a hash of the URL for caching
    const imageHash = createImageHash(imageUrl);
    const cachePath = path.join(cacheDir, `${imageHash}.jpg`);

    // Check if we have this image cached
    if (fs.existsSync(cachePath)) {
      console.log(`Serving cached image for: ${imageUrl}`);
      
      // Read the cached file
      const cachedImage = fs.readFileSync(cachePath);
      
      // Set content type
      res.set('Content-Type', 'image/jpeg');
      res.set('Access-Control-Allow-Origin', '*');
      
      // Send the cached image
      return res.send(cachedImage);
    }

    // Get the image as a binary stream with browser-like headers
    const response = await axios.get(imageUrl, {
      httpsAgent: agent,
      responseType: 'arraybuffer',  // Use arraybuffer for binary data
      timeout: 5000,  // 5 second timeout to prevent long hangs
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://listen.tidal.com/',
        'Origin': 'https://listen.tidal.com',
        'Cache-Control': 'no-cache'
      }
    });

    // Set the content type header to match the image type
    const contentType = response.headers['content-type'];
    if (contentType) {
      res.set('Content-Type', contentType);
    } else {
      // Default to jpeg if content type is not provided
      res.set('Content-Type', 'image/jpeg');
    }
    
    // Set CORS headers for the image
    res.set('Access-Control-Allow-Origin', '*');
    
    // Cache the image for future requests
    try {
      fs.writeFileSync(cachePath, response.data);
      console.log(`Cached image at: ${cachePath}`);
    } catch (cacheError) {
      console.error('Error caching image:', cacheError);
    }
    
    // Send the binary data
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching image:', error.message);
    
    // If all else fails, try to serve a default image
    try {
      const defaultImagePath = path.join(imagesDir, 'cover1.jpg');
      if (fs.existsSync(defaultImagePath)) {
        console.log('Serving default image as fallback');
        const defaultImage = fs.readFileSync(defaultImagePath);
        res.set('Content-Type', 'image/jpeg');
        return res.send(defaultImage);
      } else {
        // Try to find any image in the images directory
        const files = fs.readdirSync(imagesDir).filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        });
        
        if (files.length > 0) {
          const anyImagePath = path.join(imagesDir, files[0]);
          console.log('Serving alternative image:', anyImagePath);
          const altImage = fs.readFileSync(anyImagePath);
          res.set('Content-Type', 'image/jpeg');
          return res.send(altImage);
        }
      }
    } catch (fallbackError) {
      console.error('Error serving fallback image:', fallbackError);
    }
    
    // If all else fails, send a 500 error
    res.status(500).send('Error fetching image');
  }
});

// Catch all other routes and serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
    console.log(`Image proxy endpoint: http://0.0.0.0:${port}/image-proxy`);
  });