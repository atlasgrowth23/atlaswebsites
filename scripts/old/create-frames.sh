#!/bin/bash

# Export environment variables from .env.local
export $(grep -v '^#' .env.local | xargs)

# Run the Node.js script
node scripts/create-frames-direct.js