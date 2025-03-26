# HNTLDR Newsletter System

This document provides instructions for setting up and using the HNTLDR newsletter system.

## Overview

The HNTLDR newsletter system sends automated emails to subscribers when new episodes are published. The emails include a play button that links to the latest episode on hntldr.news/latest.

## Setup

### 1. Install Dependencies

```bash
npm install resend
```

### 2. Configure Environment Variables

Create or update your `.env` file with the following variables:

```
# Resend API key (get from https://resend.com)
RESEND_API_KEY=re_123456789

# API key for newsletter sending (create your own secure key)
NEWSLETTER_API_KEY=your-secure-api-key

# Optional: Custom API URL for the newsletter endpoint
# NEWSLETTER_API_URL=https://yourdomain.com/api/send-newsletter
```

### 3. Make the Script Executable (Unix/Linux/Mac)

```bash
chmod +x scripts/send-newsletter.js
```

## Usage

### Sending a Newsletter

You can send a newsletter in several ways:

#### 1. Using the Script

```bash
# Basic usage (uses latest episode number and today's date)
node scripts/send-newsletter.js

# Specify episode number and date
node scripts/send-newsletter.js --episode=42 --date="June 15, 2023"

# Specify API key (overrides environment variable)
node scripts/send-newsletter.js --key=your-api-key
```

#### 2. Using the API Directly

You can also trigger the newsletter by making a POST request to the API endpoint:

```bash
curl -X POST https://yourdomain.com/api/send-newsletter \
  -H "Content-Type: application/json" \
  -d '{"episodeNumber":"42","episodeDate":"June 15, 2023","apiKey":"your-api-key"}'
```

### Automating Newsletter Sending

You can automate newsletter sending using various methods:

#### 1. GitHub Actions

Create a GitHub Actions workflow to send newsletters automatically when new episodes are published:

```yaml
# .github/workflows/send-newsletter.yml
name: Send Newsletter

on:
  # Trigger manually from GitHub
  workflow_dispatch:
    inputs:
      episodeNumber:
        description: 'Episode number'
        required: true
      episodeDate:
        description: 'Episode date'
        required: true
        default: 'June 15, 2023'

jobs:
  send-newsletter:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Send Newsletter
        run: |
          node scripts/send-newsletter.js \
            --episode=${{ github.event.inputs.episodeNumber }} \
            --date="${{ github.event.inputs.episodeDate }}" \
            --key=${{ secrets.NEWSLETTER_API_KEY }} \
            --url=${{ secrets.NEWSLETTER_API_URL }}
        env:
          NEWSLETTER_API_KEY: ${{ secrets.NEWSLETTER_API_KEY }}
          NEWSLETTER_API_URL: ${{ secrets.NEWSLETTER_API_URL }}
```

#### 2. Cron Job

Set up a cron job on your server to check for new episodes and send newsletters:

```bash
# Check for new episodes and send newsletter every day at 9 AM
0 9 * * * cd /path/to/hntldr && node scripts/check-and-send-newsletter.js
```

## Customizing the Email Template

The email template is defined in `src/components/EmailTemplate.tsx`. You can customize the design by editing this file.

Key elements you might want to customize:

- Colors and styling
- Email content and messaging
- Play button appearance
- Footer information

## Testing

To test the newsletter system without sending real emails, you can use Resend's test mode or create a test subscriber list.

### Using Resend Test Mode

In test mode, emails are not delivered to real recipients but are available in your Resend dashboard.

```
# .env.test
RESEND_API_KEY=re_test_123456789
```

### Creating Test Subscribers

You can create a test version of the subscribe endpoint that stores emails in a separate list for testing.

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check your Resend API key and make sure it's correctly configured.
2. **API errors**: Verify that your API endpoint is accessible and correctly configured.
3. **Script errors**: Make sure the script has the correct permissions and dependencies are installed.

### Debugging

To enable verbose logging, set the `DEBUG` environment variable:

```bash
DEBUG=true node scripts/send-newsletter.js
```

## Production Considerations

For production use:

1. **Use a database**: Store subscribers in a proper database instead of in-memory storage.
2. **Implement unsubscribe functionality**: Make sure the unsubscribe link in emails works correctly.
3. **Set up email authentication**: Configure SPF, DKIM, and DMARC for better deliverability.
4. **Monitor deliverability**: Use Resend's analytics to monitor email deliverability and engagement.
5. **Implement rate limiting**: Prevent abuse by implementing rate limiting on the subscribe endpoint. 