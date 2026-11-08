-- 6. deployments
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    commit_sha TEXT,
    branch TEXT,
    environment TEXT NOT NULL DEFAULT 'production',
    status TEXT NOT NULL,
    health_status TEXT NOT NULL DEFAULT 'UNKNOWN',
    is_known_good BOOLEAN DEFAULT FALSE,
    error_rate NUMERIC DEFAULT 0,
    avg_latency INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rolled_back_at TIMESTAMPTZ,
    rollback_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_deployments_environment ON deployments(environment);

-- 7. incidents
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    deployment_id TEXT REFERENCES deployments(deployment_id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('DETECTED', 'INVESTIGATING', 'RECOVERING', 'RECOVERED', 'MANUAL_INTERVENTION_REQUIRED')),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    root_cause TEXT,
    summary TEXT,
    actions_taken JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. health_checks
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id TEXT REFERENCES deployments(deployment_id) ON DELETE CASCADE,
    status_code INT,
    latency_ms INT,
    is_successful BOOLEAN NOT NULL,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    response_body TEXT,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON health_checks(checked_at);

-- 9. service_status
CREATE TABLE IF NOT EXISTS service_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('HEALTHY', 'DEGRADED', 'CRITICAL', 'UNKNOWN', 'OFFLINE')),
    last_check_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    details JSONB
);

-- 10. agent_events
CREATE TABLE IF NOT EXISTS agent_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    deployment_id TEXT,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_events_created_at ON agent_events(created_at);
