#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check required environment variables
required_vars=(
  "DATABASE_URL"
  "OPENAI_API_KEY"
  "ELEVEN_LABS_API_KEY"
  "RESEND_API_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    exit 1
  fi
done

# Install dependencies
echo "Installing dependencies..."
npm install

# Deploy functions in order
echo "Deploying HN Tracker..."
cd packages/hn-tracker && ./deploy.sh
cd ../..

echo "Deploying Story Summarizer..."
cd packages/story-summarizer && ./deploy.sh
cd ../..

echo "Deploying Newsletter..."
cd packages/newsletter && ./deploy.sh
cd ../..

echo "All functions deployed successfully!" 