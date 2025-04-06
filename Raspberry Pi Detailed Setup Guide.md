# Raspberry Pi Setup Guide for WiiM Display

This guide provides detailed instructions for setting up WiiM Display on a Raspberry Pi, allowing you to create a dedicated display for your WiiM streaming device.

## Hardware Requirements

- Raspberry Pi (3B+ or newer recommended)
- MicroSD card (16GB+ recommended)
- Power supply
- Display device (monitor, TV, or touchscreen)
- Network connection (Wi-Fi or Ethernet)
- Optional: Case with mounting solution

## 1. Initial Raspberry Pi Setup

### 1.1. Flash Raspberry Pi OS

1. Download and install the [Raspberry Pi Imager](https://www.raspberrypi.com/software/) on your computer
2. Insert your MicroSD card into your computer
3. Launch Raspberry Pi Imager
4. Click "CHOOSE OS" and select "Raspberry Pi OS Lite (64-bit)" - this is a headless version without desktop
5. Click "CHOOSE STORAGE" and select your MicroSD card
6. Click the gear icon (⚙️) to access advanced options:
   - Set hostname: `wiim-display` (or your preferred name)
   - Enable SSH
   - Set username and password (remember these!)
   - Configure your Wi-Fi (if not using Ethernet)
   - Set your locale settings
7. Click "WRITE" and wait for the process to complete
8. Remove the SD card from your computer

### 1.2. Boot and Connect to Your Raspberry Pi

1. Insert the MicroSD card into your Raspberry Pi
2. Connect the display, keyboard, and power
3. Wait for the Raspberry Pi to boot
4. Find your Pi's IP address using one of these methods:
   - Check your router's connected devices
   - Use a network scanner app on your phone
   - Connect a monitor to see the IP address during boot
5. From your computer, open a terminal or command prompt
6. Connect to your Pi using SSH:
   ```bash
   ssh username@your-pi-ip-address
   ```
   (Replace with the username and IP address of your Pi)
7. Accept the security prompt and enter your password

### 1.3. Update Your System

After logging in via SSH, update your system:

```bash
sudo apt update
sudo apt upgrade -y
```

## 2. Automated Installation (Recommended)

For most users, the automated installation script is the easiest way to set up WiiM Display:

```bash
# Download the installation script
wget https://raw.githubusercontent.com/yourusername/wiim-display/main/install.sh

# Make it executable
chmod +x install.sh

# Run the installation script
./install.sh
```

The script will guide you through the installation process, including finding your WiiM device on the network and configuring all necessary services.

## 3. Manual Installation (Advanced)

If you prefer to perform the installation manually or if the automated script doesn't work for your setup, follow these steps:

### 3.1. Install Required Software

```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install browser and X server components
sudo apt install -y chromium-browser
sudo apt install -y xserver-xorg x11-xserver-utils xinit openbox

# Install display manager
sudo apt install -y lightdm
```

### 3.2. Install the WiiM Display Application

```bash
# Create directory for the application
mkdir -p ~/apps
cd ~/apps

# Clone the repository
git clone https://github.com/yourusername/wiim-display.git
cd wiim-display

# Install dependencies
npm install

# Build the application
npm run build
```

### 3.3. Find Your WiiM Device IP Address

Find your WiiM device on the network:

```bash
# Install nmap for network scanning
sudo apt install -y nmap

# Scan your network (adjust the IP range if needed)
nmap -sn 192.168.1.0/24 | grep -B 2 -A 2 -i wiim
```

Look for your WiiM device in the results and note its IP address.

### 3.4. Update the WiiM IP Address in the Code

```bash
# Edit the proxy-server.js file
nano ~/apps/wiim-display/proxy-server.js
```

Find all instances of `192.168.1.167` and replace them with your WiiM device's IP address. Save and exit the editor (Ctrl+X, then Y, then Enter).

### 3.5. Create a Service for the WiiM Display

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/wiim-display.service
```

Add the following content (replace `your_username` with your actual username):

```
[Unit]
Description=WiiM Display Proxy Server
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/home/your_username/apps/wiim-display
ExecStart=/usr/bin/node proxy-server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable wiim-display.service
sudo systemctl start wiim-display.service
```

### 3.6. Configure Auto-Start Browser

Create the Openbox autostart file:

```bash
mkdir -p ~/.config/openbox
nano ~/.config/openbox/autostart
```

Add the following content:

```bash
# Wait for network
sleep 15

# Start Chromium in kiosk mode
chromium-browser --kiosk --disable-restore-session-state --disable-session-crashed-bubble --disable-infobars --app=http://localhost:3000 &

# Disable screen blanking and screensaver
xset s off
xset s noblank
xset -dpms
```

Make it executable:

```bash
chmod +x ~/.config/openbox/autostart
```

### 3.7. Set Up Samba for Image Management

Install Samba for easy image file management:

```bash
sudo apt install -y samba samba-common-bin
sudo nano /etc/samba/smb.conf
```

Add this to the end of the file (replace `your_username` with your username):

```
[slideshow]
path = /home/your_username/apps/wiim-display/public/images
writeable = yes
guest ok = yes
create mask = 0777
directory mask = 0777
browseable = yes
```

Set up a Samba password:

```bash
sudo smbpasswd -a your_username
```

Restart Samba:

```bash
sudo systemctl restart smbd
```

### 3.8. Enable Auto-Start on Boot

```bash
sudo systemctl enable lightdm
```

### 3.9. Reboot and Test

```bash
sudo reboot
```

## 4. Adding Images for the Slideshow

The slideshow feature displays images when you're not playing music from Tidal. Add your images using one of these methods:

### Using Samba (Recommended)

From your computer, access the Samba share:

- **Windows**: Open File Explorer and navigate to `\\your-pi-ip-address\slideshow`
- **macOS**: In Finder, select Go -> Connect to Server and enter `smb://your-pi-ip-address/slideshow`
- **Linux**: Open your file manager and connect to `smb://your-pi-ip-address/slideshow`

Then simply drag and drop image files into this folder.

### Using SCP (Advanced)

From your computer, transfer files using scp:

```bash
scp /path/to/your/images/* username@your-pi-ip-address:/home/username/apps/wiim-display/public/images/
```

## 5. Advanced Configuration

### 5.1. Display Configuration

If needed, you can adjust the configuration of your display:

```bash
sudo raspi-config
```

Navigate to "Display Options" to:
- Set resolution
- Configure overscan
- Adjust orientation

### 5.2. Auto-Login Configuration

```bash
sudo raspi-config
```

Navigate to "System Options" -> "Boot / Auto Login" -> "Desktop Autologin"

### 5.3. Changing Display Mode

The default layout is horizontal. To toggle between horizontal and vertical:

- Press the 'v' key when the application is running
- Or change the default in src/App.jsx:
  ```javascript
  const [horizontalView, setHorizontalView] = useState(true); // Change to false for vertical
  ```
  Then rebuild the application:
  ```bash
  cd ~/apps/wiim-display
  npm run build
  ```

## 6. Troubleshooting

### 6.1. The Display Shows a Terminal Instead of the Application

Check if the service is running:

```bash
sudo systemctl status wiim-display.service
```

If there are errors, check the logs:

```bash
journalctl -u wiim-display.service
```

### 6.2. The Browser Launches But Shows an Error Page

1. Check if the proxy server is running:
   ```bash
   sudo systemctl status wiim-display.service
   ```

2. Test if the server is accessible:
   ```bash
   curl http://localhost:3000
   ```

3. Check if the WiiM IP is correct:
   ```bash
   nano ~/apps/wiim-display/proxy-server.js
   ```

### 6.3. No Images in Slideshow

Check that images exist in the correct folder:

```bash
ls -la ~/apps/wiim-display/public/images
```

Make sure they have the correct permissions:

```bash
chmod -R 644 ~/apps/wiim-display/public/images/*
```

### 6.4. Screen Goes Blank/Screensaver Activates

Edit the autostart file:

```bash
nano ~/.config/openbox/autostart
```

Ensure these lines are present and not commented out:

```bash
xset s off
xset s noblank
xset -dpms
```

### 6.5. Raspberry Pi Performance Issues

Improve performance:

1. Allocate less memory to GPU:
   ```bash
   sudo raspi-config
   ```
   Navigate to "Performance Options" -> "GPU Memory" and set to 128MB

2. Consider overclocking (Raspberry Pi 4 only):
   ```bash
   sudo raspi-config
   ```
   Navigate to "Performance Options" -> "Overclock"

## 7. Additional Tips

### 7.1. Remote Management

For headless management:

```bash
# Install VNC server
sudo apt install -y realvnc-vnc-server

# Enable VNC
sudo raspi-config
# Navigate to Interface Options -> VNC -> Enable
```

### 7.2. Updating the Application

```bash
cd ~/apps/wiim-display
git pull
npm install
npm run build
sudo systemctl restart wiim-display.service
```

### 7.3. Setting Up a Fixed IP Address

For consistent access to your Raspberry Pi:

```bash
sudo raspi-config
```

Navigate to "System Options" -> "Network Options" -> "Network Interface" and configure a static IP address.

### 7.4. Power Management

To avoid data corruption from power loss:

1. Use a good quality power supply
2. Consider a UPS for the Raspberry Pi
3. Set up safe shutdown in case of power loss:
   ```bash
   sudo apt install watchdog
   ```

## 8. Support

If you encounter issues:

1. Check the GitHub repository issues section
2. Create a new issue with detailed information
3. Include your Raspberry Pi model, OS version, and error messages

---

Happy listening with your new WiiM Display!