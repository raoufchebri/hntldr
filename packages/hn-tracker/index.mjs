import pkg from 'pg';
const { Client } = pkg;

const HN_TOP_STORIES_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/";
const DATABASE_URL = process.env.DATABASE_URL; // PostgreSQL connection string

export const handler = async (event, context) => {
  console.log("Event received:", JSON.stringify(event));
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();

    // Fetch top stories
    const response = await fetch(HN_TOP_STORIES_URL);
    const topStoryIds = await response.json();
    const top10Ids = topStoryIds.slice(0, 10);

    const fetch_time = new Date().toISOString();

    // Fetch details for each story
    const stories = await Promise.all(
      top10Ids.map(async (id, index) => {
        const storyResponse = await fetch(`${HN_ITEM_URL}${id}.json`);
        const story = await storyResponse.json();
        return {
          rank: index + 1,
          hn_id: id,
          score: story.score || 0,
          time: new Date(story.time * 1000).toISOString(),
          fetched_at: fetch_time,
        };
      })
    );

    console.log(`Fetched ${stories.length} HN Front Page Stories`);

    // Insert into PostgreSQL
    const insertQuery = `
      INSERT INTO hacker_news_rankings (hn_id, rank, score, time, fetched_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (hn_id, fetched_at) DO NOTHING;
    `;

    for (const story of stories) {
      await client.query(insertQuery, [story.hn_id, story.rank, story.score, story.time, story.fetched_at]);
    }

    console.log("Successfully saved rankings to the database.");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "HN rankings saved", count: stories.length }),
    };
  } catch (error) {
    console.error("Database error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  } finally {
    await client.end();
  }
};
