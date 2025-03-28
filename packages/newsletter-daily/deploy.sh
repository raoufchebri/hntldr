#!/bin/bash

# Exit on error
set -e

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dev)
      ENV="dev"
      shift
      ;;
    --prod)
      ENV="prod"
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Validate environment
if [ -z "$ENV" ]; then
  echo "Error: Environment not specified. Use --dev or --prod"
  exit 1
fi

# Configuration
STACK_NAME="hacker-news-newsletter-daily-${ENV}"
FUNCTION_NAME="hntldr-newsletter-daily-${ENV}"
REGION="us-east-1"
DEPLOY_BUCKET_NAME="hn-tracker-lambda-1742836337"
FUNCTION_ZIP="newsletter-daily.zip"

# Ensure we're in the correct directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "Working directory: $(pwd)"

# Load environment variables from root .env file
ENV_FILE="../../.env"
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from root .env file"
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "Error: .env file not found in project root"
  exit 1
fi

# Check if required environment variables are set
if [ "$ENV" = "dev" ]; then
  DATABASE_URL="$DATABASE_URL_DEV"
else
  DATABASE_URL="$DATABASE_URL_PROD"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL_${ENV^^} environment variable is not set"
  exit 1
fi

if [ -z "$RESEND_API_KEY" ]; then
  echo "Error: RESEND_API_KEY environment variable is not set"
  exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY environment variable is not set"
  exit 1
fi

# Create S3 bucket if it doesn't exist
echo "Checking if S3 bucket exists..."
if ! aws s3 ls "s3://$DEPLOY_BUCKET_NAME" 2>&1 > /dev/null; then
  echo "Creating S3 bucket: $DEPLOY_BUCKET_NAME"
  aws s3 mb "s3://$DEPLOY_BUCKET_NAME" --region "$REGION"
else
  echo "S3 bucket already exists"
fi

# Create a temporary build directory
echo "Creating build directory..."
BUILD_DIR=$(mktemp -d)
echo "Build directory: $BUILD_DIR"

# Copy necessary files to build directory
cp index.mjs package.json "$BUILD_DIR/"

# Install production dependencies in the build directory
cd "$BUILD_DIR"
echo "Installing production dependencies..."
npm install --production

# Check if files exist before zipping
if [ ! -f "index.mjs" ]; then
  echo "Error: index.mjs not found in build directory"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Error: node_modules directory not found in build directory"
  exit 1
fi

# Create deployment package
echo "Creating deployment package..."
zip -r "$FUNCTION_ZIP" index.mjs node_modules/

# Move back to original directory
cd "$SCRIPT_DIR"

# Upload to S3
echo "Uploading deployment package to S3..."
aws s3 cp "$BUILD_DIR/$FUNCTION_ZIP" "s3://$DEPLOY_BUCKET_NAME/" --force

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides \
    Environment="$ENV" \
    DatabaseUrl="$DATABASE_URL" \
    ResendApiKey="$RESEND_API_KEY" \
    OpenAiApiKey="$OPENAI_API_KEY" \
    FromEmail="${FROM_EMAIL:-updates@hntldr.com}" \
    DeploymentBucket="$DEPLOY_BUCKET_NAME" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset

# Force update of Lambda function code
echo "Updating Lambda function code..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --s3-bucket "$DEPLOY_BUCKET_NAME" \
  --s3-key "$FUNCTION_ZIP" \
  --publish

# Clean up build directory
rm -rf "$BUILD_DIR"

echo "Deployment completed successfully!"
echo "Your daily newsletter function is now scheduled to run every day at 17:00 UTC (except Fridays)." 