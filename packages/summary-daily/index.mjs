import pkg from 'pg';
import OpenAI from 'openai';
const { Client } = pkg;
import { JSDOM } from 'jsdom';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';

const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/";
const DATABASE_URL = process.env.DATABASE_URL; // PostgreSQL connection string
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // OpenAI API key
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY; // Eleven Labs API key
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'hntldr-audio'; // S3 bucket for storing audio files
const ELEVEN_LABS_VOICE_ID = process.env.ELEVEN_LABS_VOICE_ID || '3DR8c2yd30eztg65o4jV'; // Default to Aaron voice

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Helper function to extract text content from HTML
async function extractContentFromUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch content from ${url}: ${response.status} ${response.statusText}`);
      return "Content unavailable";
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style, nav, footer, header, aside');
    scripts.forEach(script => script.remove());
    
    // Get the main content (prioritize article or main tags)
    let content = '';
    const mainContent = document.querySelector('article, main, .content, #content, .post, .entry');
    
    if (mainContent) {
      content = mainContent.textContent;
    } else {
      // Fallback to body content
      content = document.body.textContent;
    }
    
    // Clean up the text
    content = content.replace(/\s+/g, ' ').trim();
    
    // Limit content length to avoid token limits
    return content.length > 8000 ? content.substring(0, 8000) + '...' : content;
  } catch (error) {
    console.warn(`Error extracting content from ${url}:`, error.message);
    return "Error extracting content";
  }
}

// Helper function to convert text to speech using Eleven Labs API
async function convertTextToSpeech(text, voiceId = ELEVEN_LABS_VOICE_ID) {
  try {
    console.log("Converting text to speech with Eleven Labs API...");
    
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          speed: 1.0,
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.45
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Eleven Labs API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error("Error converting text to speech:", error);
    throw error;
  }
}

// Helper function to upload audio to S3
async function uploadAudioToS3(audioBuffer, filename) {
  try {
    console.log(`Uploading audio file to S3 bucket: ${S3_BUCKET_NAME}, filename: ${filename}`);
    
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: filename,
      Body: Buffer.from(audioBuffer),
      ContentType: 'audio/mpeg'
    };
    
    const command = new PutObjectCommand(params);
    const result = await s3Client.send(command);
    
    console.log("Audio file uploaded successfully:", result);
    
    // Return the public URL of the uploaded file
    return `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${filename}`;
  } catch (error) {
    console.error("Error uploading audio to S3:", error);
    throw error;
  }
}

// Helper function to get past 24 hours
function getPast24Hours() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setHours(now.getHours() - 24);  // Go back 24 hours
  
  return {
    startDate: yesterday.toISOString(),
    endDate: now.toISOString()
  };
}

export const handler = async (event, context) => {
  console.log("Event received:", JSON.stringify(event));
  const client = new Client({ connectionString: DATABASE_URL });
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  try {
    await client.connect();

    // Get date range from parameters or use defaults
    let { startDate, endDate } = event.queryStringParameters || {};
    
    // If dates aren't provided, use past 24 hours
    if (!startDate || !endDate) {
      const defaultRange = getPast24Hours();
      startDate = startDate || defaultRange.startDate;
      endDate = endDate || defaultRange.endDate;
    }

    console.log(`Fetching top stories from the past 24 hours (${startDate} to ${endDate})`);

    // Query to get the top 10 stories of the week based on highest score
    const topStoriesQuery = `
      WITH ranked_stories AS (
        SELECT DISTINCT ON (hn_id) 
          hn_id, 
          score, 
          time,
          fetched_at
        FROM 
          hacker_news_rankings
        WHERE 
          fetched_at BETWEEN $1 AND $2
        ORDER BY 
          hn_id, score DESC
      )
      SELECT * FROM ranked_stories
      ORDER BY score DESC
      LIMIT 3;
    `;

    const result = await client.query(topStoriesQuery, [startDate, endDate]);
    const topStories = result.rows;

    console.log(`Found ${topStories.length} top stories for the week`);

    // Fetch full details for each story from the HN API
    const storiesWithDetails = await Promise.all(
      topStories.map(async (story, index) => {
        const storyResponse = await fetch(`${HN_ITEM_URL}${story.hn_id}.json`);
        const storyDetails = await storyResponse.json();
        return {
          rank: index + 1,
          hn_id: story.hn_id,
          title: storyDetails.title || "No title",
          url: storyDetails.url || `https://news.ycombinator.com/item?id=${story.hn_id}`,
          score: story.score,
          time: story.time,
          by: storyDetails.by || "anonymous",
          descendants: storyDetails.descendants || 0,
        };
      })
    );

    console.log("Fetched details for all top stories");
    
    // Scrape content from each story URL
    console.log("Scraping content from story URLs...");
    const storiesWithContent = await Promise.all(
      storiesWithDetails.map(async (story) => {
        // Skip scraping for HN discussion links (they don't have external content)
        if (story.url.includes('news.ycombinator.com')) {
          return { ...story, content: "HN discussion link - no external content" };
        }
        
        console.log(`Scraping content from: ${story.url}`);
        const content = await extractContentFromUrl(story.url);
        return { ...story, content };
      })
    );
    
    console.log("Completed scraping content for all stories");

    // Format stories for the weekly digest
    const storiesFormatted = storiesWithContent.map(story => {
      return `## ${story.rank}. ${story.title} (${story.score} points, by ${story.by})
      URL: ${story.url}
      HN Discussion: https://news.ycombinator.com/item?id=${story.hn_id}
    
      ### Content
      ${story.content}
      
      `;
      }).join("\n");

    const user_prompt = `
    Here are the top Hacker News stories of the past week:

    ${storiesFormatted}

    Write a news report based on the top stories, focusing on the top 3 stories.
    The report should include a summary of the top stories from Hacker News into a smooth, well-paced podcast script for HNTLDR. 
    The script should be engaging, friendly, and easy to listen to.
    `;

    const system_prompt = `
      You are an engaging and knowledgeable tech newscaster delivering a compelling news report for HNTLDR, a podcast that breaks down the top Hacker News stories.
      Your tone should be friendly, concise, and conversational—like a tech-savvy host guiding listeners through the latest trends. 
      Your goal is to make complex topics easy to grasp and fun to follow, an explain why they matter to your listeners.
      Use the provided story stories to craft a **fluid, ready-to-read script** with:
      
      **An engaging opening**: Hey everyone, welcome to HNTLDR—the podcast that gives you the top stories from Hacker News, fast. I'm Kevin, and here's what's buzzing in tech this week...
      **A quick summary**: A brief overview of the top stories, highlighting key points and why they matter.
      **A well-structured breakdown**: Explain each story clearly with context and why it matters, using smooth transitions.
      **A strong closing**: A quick recap, a teaser for the next episode, and a friendly sign-off.
      
      Keep it crisp, fun, and easy to follow—like a tech-savvy friend keeping the audience in the loop.
    `;

    const speechCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: user_prompt }
        
      ],
      max_tokens: 1500,
    });

    const speech = speechCompletion.choices[0].message.content;

    const cleanedSpeechCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Clean the text to only keep Kevin's speech as shown on a teleprompter. Remove all unnecessary text." },
        { role: "user", content: `
          ### Speech
          ${speech}
        ` }
        
      ],
      max_tokens: 1500,
    });

    const summary = cleanedSpeechCompletion.choices[0].message.content;
    
    // Generate a title using GPT-4o-mini
    const titleCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Generate a short, catchy title for this week's Hacker News summary. The title should be engaging and reflect the main themes discussed. Keep it under 10 words." },
        { role: "user", content: summary }
      ],
      max_tokens: 50,
    });

    const title = titleCompletion.choices[0].message.content.trim();
    
    // Generate a unique filename for the audio file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const audioFilename = `hntldr-${timestamp}.mp3`;
    
    // Convert the summary to speech using Eleven Labs API
    console.log("Converting summary to speech...");
    const audioBuffer = await convertTextToSpeech(summary);
    
    // Upload the audio file to S3
    console.log("Uploading audio to S3...");
    const audioUrl = await uploadAudioToS3(audioBuffer, audioFilename);
    
    // Store the summary and audio URL in the database
    console.log("Storing summary and audio URL in the database...");
    const insertQuery = `
      INSERT INTO summary_daily (start_date, end_date, summary, audio_url, title, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id;
    `;
    
    console.log("Generated title:", title);
    
    const insertResult = await client.query(insertQuery, [
      startDate,
      endDate,
      summary,
      audioUrl,
      title,
    ]);
    
    const summaryId = insertResult.rows[0].id;

    // Store sources in summary_sources table
    console.log("Storing sources in the database...");
    const insertSourceQuery = `
      INSERT INTO summary_sources (summary_id, summary_type, url, title, points, comments_count, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;

    await Promise.all(storiesWithDetails.map(story => 
      client.query(insertSourceQuery, [
        summaryId,
        'daily',
        story.url,
        story.title,
        story.score,
        story.descendants
      ])
    ));

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Weekly HN summary generated and converted to audio", 
        summaryId: summaryId,
        startDate: startDate,
        endDate: endDate,
        summary: summary,
        title: title,
        audioUrl: audioUrl
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  } finally {
    await client.end();
  }
}; 