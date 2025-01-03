#!/bin/bash

# Create necessary directories if they don't exist
mkdir -p app/assets/icons app/assets/images

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  npm install
fi

# Start the development server
npx expo start 