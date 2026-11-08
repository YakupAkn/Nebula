-- 11. agent_settings (single-row kill switches)
CREATE TABLE IF NOT EXISTS agent_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    github_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    vercel_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    health_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    agent_running BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT
);

INSERT INTO agent_settings (id, github_enabled, vercel_enabled, health_enabled, ai_enabled, agent_running, updated_by)
VALUES ('default', FALSE, TRUE, TRUE, TRUE, TRUE, 'migration')
ON CONFLICT (id) DO NOTHING;
