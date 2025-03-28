-- Table: hacker_news_rankings
CREATE TABLE hacker_news_rankings (
    id SERIAL PRIMARY KEY,
    hn_id INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    time TIMESTAMP NOT NULL,
    fetched_at TIMESTAMP DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate entries
ALTER TABLE hacker_news_rankings ADD CONSTRAINT unique_hn_id_fetched_at UNIQUE (hn_id, fetched_at);

-- Table: subscribers
CREATE TABLE subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token UUID DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: summary_daily
CREATE TABLE summary_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    summary TEXT,
    audio_url TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP
);

-- Table: summary_weekly
CREATE TABLE summary_weekly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    summary TEXT,
    audio_url TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP
);

-- Table: summary_sources
CREATE TABLE summary_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_id UUID NOT NULL,
    summary_type VARCHAR(10) NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    points INTEGER,
    comments_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE summary_sources 
ADD CONSTRAINT fk_summary_daily 
FOREIGN KEY (summary_id) 
REFERENCES summary_daily(id) 
ON DELETE CASCADE;

ALTER TABLE summary_sources 
ADD CONSTRAINT fk_summary_weekly 
FOREIGN KEY (summary_id) 
REFERENCES summary_weekly(id) 
ON DELETE CASCADE;

-- Add check constraint for summary_type
ALTER TABLE summary_sources 
ADD CONSTRAINT check_summary_type 
CHECK (summary_type IN ('daily', 'weekly')); 