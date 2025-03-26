#!/bin/bash
set -e

# Parse command line arguments
if [ "$1" == "--dev" ]; then
  ENV="dev"
  ENV_FILE="../../.env"
  STACK_NAME="hacker-news-story-summarizer-dev"
  FUNCTION_NAME="hacker-news-story-summarizer-dev"
  SCHEDULE_NAME="WeeklyStorySummarizerScheduleDev"
  DB_ENV_VAR="DATABASE_URL_DEV"
elif [ "$1" == "--prod" ]; then
  ENV="prod"
  ENV_FILE="../../.env"
  STACK_NAME="hacker-news-story-summarizer"
  FUNCTION_NAME="hacker-news-story-summarizer"
  SCHEDULE_NAME="WeeklyStorySummarizerSchedule"
  DB_ENV_VAR="DATABASE_URL_PROD"
else
  echo "Error: Please specify environment with --dev or --prod"
  exit 1
fi

# Configuration
REGION="us-east-1"
DEPLOY_BUCKET_NAME="hn-tracker-lambda-1742836337"

# Ensure we're in the correct directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "Working directory: $(pwd)"

# Read environment variables directly from file
if [ -f "$ENV_FILE" ]; then
  echo "Reading environment variables from $ENV_FILE"
  # Extract DATABASE_URL based on environment, handling both quoted and unquoted values
  DATABASE_URL=$(grep "^$DB_ENV_VAR=" "$ENV_FILE" | sed -E "s/^$DB_ENV_VAR=//;s/^\"//;s/\"$//")
  OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" "$ENV_FILE" | sed -E "s/^OPENAI_API_KEY=//;s/^\"//;s/\"$//")
  ELEVEN_LABS_API_KEY=$(grep "^ELEVEN_LABS_API_KEY=" "$ENV_FILE" | sed -E "s/^ELEVEN_LABS_API_KEY=//;s/^\"//;s/\"$//")
  S3_BUCKET_NAME=$(grep "^S3_BUCKET_NAME=" "$ENV_FILE" | sed -E "s/^S3_BUCKET_NAME=//;s/^\"//;s/\"$//" || echo "hntldr-audio")
else
  echo "Error: $ENV_FILE file not found"
  exit 1
fi

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: $DB_ENV_VAR not found in $ENV_FILE"
  exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY not found in $ENV_FILE"
  exit 1
fi

if [ -z "$ELEVEN_LABS_API_KEY" ]; then
  echo "Error: ELEVEN_LABS_API_KEY not found in $ENV_FILE"
  exit 1
fi

# Print the database URL being used (without exposing sensitive parts)
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
echo "Using database host: $DB_HOST"
echo "Environment: $ENV"
echo "Using env file: $ENV_FILE"
echo "Using database variable: $DB_ENV_VAR"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
  echo "Error: AWS CLI is not configured. Please configure it first."
  exit 1
fi

# Check deployment S3 bucket
echo "Checking deployment S3 bucket..."
if ! aws s3api head-bucket --bucket "$DEPLOY_BUCKET_NAME" 2>/dev/null; then
  echo "Creating S3 bucket for deployment..."
  aws s3 mb "s3://$DEPLOY_BUCKET_NAME" --region "$REGION"
  aws s3api wait bucket-exists --bucket "$DEPLOY_BUCKET_NAME"
fi

aws s3api get-bucket-location --bucket "$DEPLOY_BUCKET_NAME"

# Create a temporary build directory
echo "Creating build directory..."
BUILD_DIR=$(mktemp -d)
echo "Build directory: $BUILD_DIR"

# Create package.json with required dependencies
echo "Creating package.json..."
cat > "$BUILD_DIR/package.json" << EOL
{
  "name": "story-summarizer",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "pg": "^8.11.3",
    "openai": "^4.28.0",
    "jsdom": "^24.0.0",
    "@aws-sdk/client-s3": "^3.525.0",
    "node-fetch": "^3.3.2"
  }
}
EOL

# Copy Lambda function code
echo "Copying index.mjs..."
cp index.mjs "$BUILD_DIR/"

# Install dependencies
cd "$BUILD_DIR"
echo "Installing dependencies..."
npm install --production

# Create deployment package
echo "Creating deployment package..."
zip -r function.zip index.mjs node_modules/

# Upload to S3
echo "Uploading deployment package to S3..."
aws s3 cp function.zip "s3://$DEPLOY_BUCKET_NAME/function.zip"

# Change back to script directory for CloudFormation deployment
cd "$SCRIPT_DIR"

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides \
    DatabaseUrl="$DATABASE_URL" \
    OpenAIApiKey="$OPENAI_API_KEY" \
    ElevenLabsApiKey="$ELEVEN_LABS_API_KEY" \
    S3BucketName="$S3_BUCKET_NAME" \
    FunctionName="$FUNCTION_NAME" \
    ScheduleName="$SCHEDULE_NAME" \
  --capabilities CAPABILITY_NAMED_IAM

# Force update of Lambda function code
echo "Updating Lambda function code..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --s3-bucket "$DEPLOY_BUCKET_NAME" \
  --s3-key "function.zip" \
  --publish

# Clean up
cd "$SCRIPT_DIR"
rm -rf "$BUILD_DIR"

echo "Deployment completed successfully!"
echo "Your $ENV story summarizer function has been deployed with the following details:"
echo "Stack Name: $STACK_NAME"
echo "Function Name: $FUNCTION_NAME"
echo "S3 Bucket: $DEPLOY_BUCKET_NAME"
echo "CloudWatch Logs URL: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups/log-group=/aws/lambda/$FUNCTION_NAME" 