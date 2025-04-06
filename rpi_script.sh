#!/bin/bash

# WiiM Display - Raspberry Pi Installation Script
# This script automates the installation of WiiM Display on a Raspberry Pi

# Exit on error
set -e

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               WiiM Display Installer                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
section() {
    echo -e "${GREEN}\n► $1${NC}"
    echo -e "${GREEN}──────────────────────────────────────────────────${NC}"
}

# Function to print status messages
status() {
    echo -e "${YELLOW}   • $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Please do not run this script as root or with sudo.${NC}"
    exit 1
fi

# Get username
USERNAME=$(whoami)
USER_HOME=$(eval echo ~$USERNAME)

# Check if Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    echo -e "${YELLOW}Warning: This doesn't appear to be a Raspberry Pi.${NC}"
    echo -e "This script is designed for Raspberry Pi OS. Proceed with caution."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 1
    fi
fi

section "Updating System Packages"
status "Updating package lists..."
sudo apt update

status "Upgrading installed packages..."
sudo apt upgrade -y

section "Installing Required Software"
status "Installing Node.js and npm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    status "Node.js is already installed. Skipping..."
fi

status "Installing Git..."
sudo apt install -y git

status "Installing browser and X server packages..."
sudo apt install -y chromium-browser xserver-xorg x11-xserver-utils xinit openbox

status "Installing display manager..."
sudo apt install -y lightdm

section "Setting Up WiiM Display"
status "Creating application directory..."
mkdir -p $USER_HOME/apps

status "Cloning WiiM Display repository..."
cd $USER_HOME/apps
if [ -d "wiim-display" ]; then
    status "Repository already exists. Updating..."
    cd wiim-display
    git pull
else
    git clone https://github.com/yourusername/wiim-display.git
    cd wiim-display
fi

status "Installing Node.js dependencies..."
npm install

status "Building the application..."
npm run build

section "Finding WiiM Device"
status "Installing network utilities..."
sudo apt install -y nmap

status "Scanning network for WiiM devices..."
echo "This may take a minute..."
SUBNET=$(ip -o -f inet addr show | grep -v "127.0.0.1" | awk '{print $4}' | head -n 1)
echo "Scanning subnet: $SUBNET"

nmap -sn $SUBNET | grep -B 2 -i "linkplay\|wiim" || true

echo ""
read -p "Enter your WiiM device IP address: " WIIM_IP

if [[ ! $WIIM_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}Invalid IP address format.${NC}"
    echo "Using default IP address (192.168.1.167) - you'll need to update this manually later."
    WIIM_IP="192.168.1.167"
fi

status "Updating proxy server with WiiM IP: $WIIM_IP"
# Create a backup of the original file
cp proxy-server.js proxy-server.js.bak

# Replace the IP address in the file
sed -i "s/192\.168\.1\.167/$WIIM_IP/g" proxy-server.js

section "Creating Systemd Service"
status "Creating wiim-display service..."
SERVICE_FILE="[Unit]
Description=WiiM Display Proxy Server
After=network.target

[Service]
Type=simple
User=$USERNAME
WorkingDirectory=$USER_HOME/apps/wiim-display
ExecStart=/usr/bin/node proxy-server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target"

echo "$SERVICE_FILE" | sudo tee /etc/systemd/system/wiim-display.service > /dev/null

status "Enabling and starting service..."
sudo systemctl enable wiim-display.service
sudo systemctl start wiim-display.service

section "Setting Up Auto-Start Browser"
status "Creating openbox autostart configuration..."
mkdir -p $USER_HOME/.config/openbox
AUTOSTART_FILE="# Wait for network and services to be fully up
sleep 15

# Start Chromium in kiosk mode
chromium-browser --kiosk --disable-restore-session-state --disable-session-crashed-bubble --disable-infobars --app=http://localhost:3000 &

# Disable screen blanking and screensaver
xset s off
xset s noblank
xset -dpms"

echo "$AUTOSTART_FILE" > $USER_HOME/.config/openbox/autostart
chmod +x $USER_HOME/.config/openbox/autostart

section "Installing Samba for Image Management"
status "Installing Samba..."
sudo apt install -y samba samba-common-bin

# Create images directory if it doesn't exist
mkdir -p $USER_HOME/apps/wiim-display/public/images

# Create a backup of the original smb.conf file
sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.bak

# Add our configuration to smb.conf
SAMBA_CONFIG="

[slideshow]
path = $USER_HOME/apps/wiim-display/public/images
writeable = yes
guest ok = yes
create mask = 0777
directory mask = 0777
browseable = yes"

echo "$SAMBA_CONFIG" | sudo tee -a /etc/samba/smb.conf > /dev/null

status "Setting up Samba password..."
echo "Please enter a password for Samba access to your slideshow folder:"
sudo smbpasswd -a $USERNAME

status "Restarting Samba service..."
sudo systemctl restart smbd

section "Enabling Auto-Start on Boot"
status "Enabling display manager to start on boot..."
sudo systemctl enable lightdm

section "Installation Complete!"
echo ""
echo -e "${GREEN}WiiM Display has been successfully installed!${NC}"
echo ""
echo -e "Your Samba share for adding slideshow images is available at:"
echo -e "  • Windows: \\\\$(hostname -I | awk '{print $1}')\\slideshow"
echo -e "  • Mac: smb://$(hostname -I | awk '{print $1}')/slideshow"
echo ""
echo -e "To complete setup:"
echo -e "1. Add your slideshow images to the shared folder"
echo -e "2. Reboot your Raspberry Pi with: ${YELLOW}sudo reboot${NC}"
echo ""
echo -e "After rebooting, the WiiM Display should start automatically."
echo -e "If you need to modify the WiiM IP address later, edit this file:"
echo -e "${YELLOW}$USER_HOME/apps/wiim-display/proxy-server.js${NC}"
echo ""

read -p "Would you like to reboot now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Rebooting..."
    sudo reboot
fi