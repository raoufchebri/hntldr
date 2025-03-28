#!/bin/bash
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
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ -z "$ENV" ]; then
  echo "Please specify environment: --dev or --prod"
  exit 1
fi

# Set variables based on environment
if [ "$ENV" = "dev" ]; then
  STACK_NAME="hacker-news-tracker-dev"
  FUNCTION_NAME="hacker-news-tracker-dev"
  SCHEDULE_NAME="HourlyHackerNewsTrackerScheduleDev"
  DATABASE_VAR="DATABASE_URL_DEV"
else
  STACK_NAME="hacker-news-tracker-prod"
  FUNCTION_NAME="hacker-news-tracker-prod"
  SCHEDULE_NAME="HourlyHackerNewsTrackerScheduleProd"
  DATABASE_VAR="DATABASE_URL_PROD"
fi

# Store the original directory
SCRIPT_DIR="$(pwd)"

# Print working directory
echo "Working directory: $SCRIPT_DIR"

# Read environment variables from .env file
ENV_FILE="../../.env"
echo "Reading environment variables from $ENV_FILE"
if [ -f "$ENV_FILE" ]; then
  # Read the database URL from the .env file
  DATABASE_URL=$(grep "^$DATABASE_VAR=" "$ENV_FILE" | cut -d'=' -f2-)
  if [ -z "$DATABASE_URL" ]; then
    echo "Error: $DATABASE_VAR not found in $ENV_FILE"
    exit 1
  fi
  echo "Using database host: $(echo $DATABASE_URL | sed -E 's/.*@([^/]+).*/\1/')"
else
  echo "Error: $ENV_FILE file not found"
  exit 1
fi

echo "Environment: $ENV"
echo "Using env file: $ENV_FILE"
echo "Using database variable: $DATABASE_VAR"

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
  echo "Error: AWS CLI is not installed"
  exit 1
fi

# Check if S3 bucket exists
S3_BUCKET="hn-tracker-lambda-1742836337"
echo "Checking deployment S3 bucket..."
aws s3api get-bucket-location --bucket $S3_BUCKET

# Create temporary build directory
BUILD_DIR=$(mktemp -d)
echo "Creating build directory..."
echo "Build directory: $BUILD_DIR"

# Create package.json
echo "Creating package.json..."
cat > $BUILD_DIR/package.json << EOL
{
  "name": "hn-tracker",
  "version": "1.0.0",
  "description": "Hacker News tracker Lambda function",
  "main": "index.mjs",
  "dependencies": {
    "pg": "^8.11.3"
  }
}
EOL

# Copy Lambda function code
echo "Copying index.mjs..."
cp index.mjs $BUILD_DIR/

# Install dependencies
echo "Installing dependencies..."
cd $BUILD_DIR
npm install --production

# Create deployment package
echo "Creating deployment package..."
zip -r function.zip .

# Upload to S3
echo "Uploading deployment package to S3..."
aws s3 cp function.zip s3://$S3_BUCKET/function.zip

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file "$SCRIPT_DIR/template.yaml" \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    DatabaseUrl=$DATABASE_URL \
    Environment=$ENV

# Update Lambda function code
echo "Updating Lambda function code..."
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --s3-bucket $S3_BUCKET \
  --s3-key function.zip \
  --region us-east-1

# Clean up
cd $SCRIPT_DIR
rm -rf $BUILD_DIR

echo "Deployment completed successfully!"
echo "Your $ENV tracker function has been deployed with the following details:"
echo "Stack Name: $STACK_NAME"
echo "Function Name: $FUNCTION_NAME"
echo "S3 Bucket: $S3_BUCKET"

# Get and display the function's CloudWatch Logs URL
FUNCTION_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='LambdaFunction'].OutputValue" \
  --output text \
  --region us-east-1)

echo "CloudWatch Logs URL: https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group=/aws/lambda/$FUNCTION_NAME" 