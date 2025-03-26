# HNTLDR - Hacker News Audio Summaries

A Next.js application that displays podcast episodes generated from the HN Story Summarizer project. This application allows users to listen to audio summaries of top Hacker News stories.

## Features

- Display a list of podcast episodes
- Play audio summaries directly in the browser
- View transcripts of each episode
- Responsive design for all devices

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- AWS S3 (for audio storage)
- React Audio Player

## Getting Started

### Prerequisites

- Node.js (version 18.16.0 or higher)
- PostgreSQL database with the HN Story Summarizer schema

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hntldr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   DATABASE_URL=your_database_connection_string_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Schema

The application expects a PostgreSQL database with a `hacker_news_summaries` table that has the following columns:

- `id` (integer): Primary key
- `start_date` (timestamp): Start date of the summary period
- `end_date` (timestamp): End date of the summary period
- `summary` (text): Transcript of the audio summary
- `audio_url` (text): URL to the audio file stored in S3
- `created_at` (timestamp): When the summary was created

## Deployment

This application can be deployed to Vercel or any other hosting platform that supports Next.js applications.

## License

This project is licensed under the MIT License.
