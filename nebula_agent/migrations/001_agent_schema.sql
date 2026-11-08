-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. agent_runs
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    source TEXT,
    candidates_found INT DEFAULT 0,
    candidates_filtered INT DEFAULT 0,
    candidates_analyzed INT DEFAULT 0,
    error_count INT DEFAULT 0,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. agent_jobs
CREATE TABLE IF NOT EXISTS agent_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'locked', 'completed', 'failed')),
    priority INT DEFAULT 0,
    payload JSONB NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_status_available ON agent_jobs(status, available_at);

-- 3. agent_leads
CREATE TABLE IF NOT EXISTS agent_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    organization_name TEXT,
    website TEXT,
    github_url TEXT,
    source TEXT NOT NULL,
    source_url TEXT,
    team_type TEXT,
    estimated_team_size INT,
    description TEXT,
    relevance_score INT,
    relevance_reason TEXT,
    status TEXT DEFAULT 'new',
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_leads_github_url ON agent_leads(github_url) WHERE github_url IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_leads_website ON agent_leads(website) WHERE website IS NOT NULL;

-- 4. agent_usage_daily
CREATE TABLE IF NOT EXISTS agent_usage_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usage_date DATE UNIQUE NOT NULL,
    ai_requests INT DEFAULT 0,
    successful_requests INT DEFAULT 0,
    rate_limit_hits INT DEFAULT 0,
    failed_requests INT DEFAULT 0,
    input_tokens BIGINT DEFAULT 0,
    output_tokens BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. agent_logs
CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
    level TEXT NOT NULL,
    event TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at);
