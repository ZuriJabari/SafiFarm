#!/bin/bash

# Create directories if they don't exist
mkdir -p app/assets/icons

# Download app icons
curl "https://via.placeholder.com/1024x1024.png?text=SafiFarm" > app/assets/icon.png
curl "https://via.placeholder.com/512x512.png?text=SafiFarm" > app/assets/adaptive-icon.png
curl "https://via.placeholder.com/48x48.png?text=SF" > app/assets/favicon.png
curl "https://via.placeholder.com/2048x2048.png?text=SafiFarm" > app/assets/splash.png

# Download navigation icons
curl "https://via.placeholder.com/32x32.png?text=CA" > app/assets/icons/crop-analysis.png
curl "https://via.placeholder.com/32x32.png?text=EQ" > app/assets/icons/equipment.png
curl "https://via.placeholder.com/32x32.png?text=MP" > app/assets/icons/marketplace.png
curl "https://via.placeholder.com/32x32.png?text=PF" > app/assets/icons/profile.png

# Download placeholder images
curl "https://via.placeholder.com/200x200.png?text=Equipment" > app/assets/icons/equipment-placeholder.png
curl "https://via.placeholder.com/200x200.png?text=Product" > app/assets/icons/product-placeholder.png
curl "https://via.placeholder.com/200x200.png?text=Profile" > app/assets/icons/profile-placeholder.png 