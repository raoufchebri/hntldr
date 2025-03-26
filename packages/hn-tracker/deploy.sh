#!/bin/bash
set -e

# Parse command line arguments
if [ "$1" == "--dev" ]; then
  ENV="dev"
  STACK_NAME="hacker-news-tracker-dev"
  FUNCTION_NAME="hacker-news-tracker-dev"
  SCHEDULE_NAME="HourlyHackerNewsTrackerScheduleDev"
  DB_ENV_VAR="DATABASE_URL_DEV"
elif [ "$1" == "--prod" ]; then
  ENV="prod"
  STACK_NAME="hacker-news-tracker"
  FUNCTION_NAME="hacker-news-tracker"
  SCHEDULE_NAME="HourlyHackerNewsTrackerSchedule"
  DB_ENV_VAR="DATABASE_URL_PROD"
else
  echo "Error: Please specify environment with --dev or --prod"
  exit 1
fi

ENV_FILE="../../.env"
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
else
  echo "Error: $ENV_FILE file not found"
  exit 1
fi

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: $DB_ENV_VAR not found in $ENV_FILE"
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
  echo "Error: AWS CLI is not configured. Please run 'aws configure' first."
  exit 1
fi

# Check if S3 bucket exists and create it if it doesn't
echo "Checking deployment S3 bucket..."
if ! aws s3api head-bucket --bucket "$DEPLOY_BUCKET_NAME" 2>/dev/null; then
  echo "Creating deployment S3 bucket: $DEPLOY_BUCKET_NAME"
  if ! aws s3api create-bucket --bucket "$DEPLOY_BUCKET_NAME" --region "$REGION"; then
    echo "Error: Failed to create deployment S3 bucket. Please check your AWS permissions."
    exit 1
  fi
fi

# Create a temporary build directory
echo "Creating build directory..."
BUILD_DIR=$(mktemp -d)
echo "Build directory: $BUILD_DIR"

# Create a temporary template file with environment-specific names
TEMP_TEMPLATE="$BUILD_DIR/template-$ENV.yaml"
sed "s/hacker-news-tracker/$FUNCTION_NAME/g" template.yaml > "$TEMP_TEMPLATE"
sed -i '' "s/HourlyHackerNewsTrackerSchedule/$SCHEDULE_NAME/g" "$TEMP_TEMPLATE"

# Create package.json with direct dependencies
echo "Creating package.json..."
cat > "$BUILD_DIR/package.json" << EOF
{
  "name": "lambda-hn-tracker",
  "version": "1.0.0",
  "type": "module",
  "main": "index.mjs",
  "dependencies": {
    "pg": "^8.13.3"
  }
}
EOF

# Copy index.mjs
echo "Copying index.mjs..."
cp index.mjs "$BUILD_DIR/index.mjs"

# Install dependencies
cd "$BUILD_DIR"
echo "Installing dependencies..."
npm install --production --no-package-lock

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
zip -r function.zip index.mjs node_modules/

# Move back to original directory
cd "$SCRIPT_DIR"

# Upload to S3
echo "Uploading deployment package to S3..."
if ! aws s3 cp "$BUILD_DIR/function.zip" "s3://$DEPLOY_BUCKET_NAME/function.zip" --region "$REGION"; then
  echo "Error: Failed to upload deployment package to S3. Please check your AWS permissions."
  exit 1
fi

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
if ! aws cloudformation deploy \
  --template-file "$TEMP_TEMPLATE" \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    DatabaseUrl="$DATABASE_URL" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  --region "$REGION"; then
  echo "Error: Failed to deploy CloudFormation stack. Please check the AWS Console for details."
  exit 1
fi

# Force update of Lambda function code
echo "Updating Lambda function code..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --s3-bucket "$DEPLOY_BUCKET_NAME" \
  --s3-key "function.zip" \
  --publish \
  --region "$REGION"

# Clean up build directory
rm -rf "$BUILD_DIR"

echo "Deployment completed successfully!"
echo "Your $ENV tracker function has been deployed with the following details:"
echo "Stack Name: $STACK_NAME"
echo "Function Name: $FUNCTION_NAME"
echo "S3 Bucket: $DEPLOY_BUCKET_NAME"

# Get and display the function's CloudWatch Logs URL
FUNCTION_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='LambdaFunction'].OutputValue" \
  --output text \
  --region "$REGION")

echo "CloudWatch Logs URL: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups/log-group=/aws/lambda/$FUNCTION_NAME" 