import pkg from 'pg';
import { Resend } from 'resend';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import fetch from 'node-fetch';
import OpenAI from 'openai';
const { Client } = pkg;

const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/";
const DATABASE_URL = process.env.DATABASE_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'updates@hntldr.news';

// Initialize clients
const resend = new Resend(RESEND_API_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Helper function to generate email subject using OpenAI
async function generateEmailSubject(stories) {
  const storiesText = stories.map(story => 
    `${story.title} (${story.score} points, ${story.descendants} comments)`
  ).join('\n');

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a newsletter subject line writer. Create a short, engaging subject line (max 50 chars) that captures the essence of this week's top Hacker News stories. The subject should be catchy and informative, focusing on the most interesting theme or story.`
      },
      {
        role: "user",
        content: `Here are this week's top stories:\n${storiesText}\n\nCreate a short, engaging subject line.`
      }
    ],
    max_tokens: 50,
    temperature: 0.7
  });

  return completion.choices[0].message.content.replace(/["']/g, '').trim();
}

// Helper function to get default date range (Friday to Thursday)
function getDefaultDateRange() {
  // Use US Eastern timezone
  const timeZone = 'America/New_York';
  
  // Get current time in US Eastern
  const nowUTC = new Date();
  const nowET = utcToZonedTime(nowUTC, timeZone);
  
  // Get day of week in ET (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const todayET = nowET.getDay();
  
  // Calculate days to subtract to get to the last Friday
  const daysToLastFriday = ((todayET + 2) % 7) + 7;
  
  // Get last Friday date in ET
  const lastFridayET = new Date(nowET);
  lastFridayET.setDate(nowET.getDate() - daysToLastFriday);
  lastFridayET.setHours(0, 0, 0, 0);
  
  // Get next Thursday date in ET
  const nextThursdayET = new Date(lastFridayET);
  nextThursdayET.setDate(lastFridayET.getDate() + 6);
  nextThursdayET.setHours(23, 59, 59, 999);
  
  // Convert ET dates back to UTC for database queries
  const startDateUTC = zonedTimeToUtc(lastFridayET, timeZone);
  const endDateUTC = zonedTimeToUtc(nextThursdayET, timeZone);
  
  return {
    startDate: startDateUTC.toISOString(),
    endDate: endDateUTC.toISOString()
  };
}

function generateEmailHtml(stories, startDate, endDate) {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  const storyRows = stories.map(story => `
    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="padding:0 24px;margin:0 0 24px">
      <tbody>
        <tr>
          <td>
            <a href="${story.url}" style="color:#000;text-decoration:none;font-size:18px;font-weight:600;margin-bottom:8px;display:block" target="_blank">${story.title}</a>
            <p style="font-size:14px;line-height:24px;margin:8px 0 0;color:#666666">${story.score} points • ${story.descendants} comments</p>
            <p style="font-size:14px;line-height:24px;margin:4px 0 0;color:#666666">
              <a href="https://news.ycombinator.com/item?id=${story.hn_id}" style="color:#666666" target="_blank">View Discussion</a>
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  `).join('');

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  </head>
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Top stories from Hacker News for the week of ${startDateObj.toLocaleDateString()} - ${endDateObj.toLocaleDateString()}</div>

  <body style="background-color:#f6f6f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:600px;margin:0 auto;padding:20px 0 48px;background-color:#ffffff">
      <tbody>
        <tr style="width:100%">
          <td>
            <h1 style="font-size:32px;line-height:1.3;font-weight:700;text-align:center;color:#000;margin:32px 0 4px">HNTLDR</h1>
            <p style="font-size:16px;line-height:24px;margin:0 0 32px;text-align:center;color:#666666">Weekly Top Stories from Hacker News</p>
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="text-align:center;margin:32px 0">
              <tbody>
                <tr>
                  <td><a href="https://hntldr.news/latest" style="background-color:#f97316;border-radius:4px;color:#fff;font-size:16px;font-weight:600;text-decoration:none;text-align:center;padding:12px 24px 12px 24px;line-height:100%;display:inline-block;max-width:100%" target="_blank">▶ LISTEN TO AUDIO SUMMARY</a></td>
                </tr>
              </tbody>
            </table>
            <hr style="width:100%;border:none;border-top:1px dashed #cccccc;margin:32px 0" />
            <h2 style="font-size:24px;font-weight:600;color:#000;margin:24px 0 16px;padding:0 24px">Top Stories This Week</h2>
            ${storyRows}
            <hr style="width:100%;border:none;border-top:1px dashed #cccccc;margin:32px 0" />
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="text-align:center;padding:0 24px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:14px;line-height:24px;margin:8px 0;color:#666666">You received this email because you subscribed to HNTLDR updates.</p>
                    <a href="https://hntldr.news/unsubscribe?id={{unsubscribeId}}" style="color:#666666;text-decoration:underline;font-size:14px" target="_blank">Unsubscribe</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
  `;
}

export const handler = async (event, context) => {
  console.log("Event received:", JSON.stringify(event));
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();

    // Get date range from parameters or use defaults
    let { startDate, endDate } = event.queryStringParameters || {};
    
    // If dates aren't provided, use default Friday to Thursday range
    if (!startDate || !endDate) {
      const defaultRange = getDefaultDateRange();
      startDate = startDate || defaultRange.startDate;
      endDate = endDate || defaultRange.endDate;
    }

    // Get the week number for the newsletter ID
    const startDateObj = new Date(startDate);
    const weekNumber = Math.ceil((startDateObj.getTime() - new Date(startDateObj.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

    console.log(`Fetching top stories from ${startDate} to ${endDate}`);

    // Query to get the top stories of the week based on highest score
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

    // Generate dynamic subject line
    const subjectLine = await generateEmailSubject(storiesWithDetails);
    console.log(`Generated subject line: ${subjectLine}`);

    // Get subscribers from the database
    const subscribersQuery = `
      SELECT email, id AS unsubscribe_id
      FROM subscribers
      WHERE status = 'active';
    `;
    
    const subscribersResult = await client.query(subscribersQuery);
    const subscribers = subscribersResult.rows;

    console.log(`Sending newsletter #${weekNumber} to ${subscribers.length} subscribers`);

    // Send email to each subscriber
    const emailPromises = subscribers.map(subscriber => {
      const html = generateEmailHtml(
        storiesWithDetails,
        startDate,
        endDate
      ).replace(/{{unsubscribeId}}/g, subscriber.unsubscribe_id);

      return resend.emails.send({
        from: FROM_EMAIL,
        to: subscriber.email,
        subject: `HNTLDR Weekly #${weekNumber}: ${subjectLine}`,
        html: html
      });
    });

    await Promise.all(emailPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Weekly newsletter sent successfully",
        weekNumber,
        subjectLine,
        recipientCount: subscribers.length,
        startDate,
        endDate
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

