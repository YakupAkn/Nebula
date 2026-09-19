export interface AgentRun {
    id: string;
    status: 'running' | 'completed' | 'failed';
    started_at: string;
    completed_at: string | null;
    source: string;
    candidates_found: number;
    candidates_filtered: number;
    candidates_analyzed: number;
    error_count: number;
    summary: string | null;
    created_at: string;
}

export interface AgentJob {
    id: string;
    run_id: string | null;
    job_type: 'analyze_candidate' | 'research_github' | string;
    status: 'pending' | 'locked' | 'completed' | 'failed';
    priority: number;
    payload: any;
    attempts: number;
    max_attempts: number;
    available_at: string;
    locked_at: string | null;
    completed_at: string | null;
    last_error: string | null;
    created_at: string;
}

export interface AgentLead {
    id: string;
    name: string;
    organization_name: string | null;
    website: string | null;
    github_url: string | null;
    source: string;
    source_url: string | null;
    team_type: string | null;
    estimated_team_size: number | null;
    description: string | null;
    relevance_score: number | null;
    relevance_reason: string | null;
    status: string;
    first_seen_at: string;
    last_checked_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CandidateAnalysisResult {
    qualified: boolean;
    relevance_score: number;
    team_type: string;
    estimated_team_size: number | null;
    reasons: string[];
    why_nebula_might_fit: string;
    confidence: number;
}

// === Monitoring Types ===

export interface Deployment {
    id?: string;
    deployment_id: string;
    url: string;
    commit_sha: string | null;
    branch: string | null;
    environment: string;
    status: string;
    health_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
    is_known_good: boolean;
    error_rate: number;
    avg_latency: number | null;
    created_at?: string;
    updated_at?: string;
    rolled_back_at?: string | null;
    rollback_reason?: string | null;
}

export interface Incident {
    id?: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    deployment_id: string | null;
    status: 'DETECTED' | 'INVESTIGATING' | 'RECOVERING' | 'RECOVERED' | 'MANUAL_INTERVENTION_REQUIRED';
    detected_at?: string;
    resolved_at?: string | null;
    root_cause?: string | null;
    summary?: string | null;
    actions_taken?: any;
    created_at?: string;
}

export interface HealthCheck {
    id?: string;
    deployment_id: string;
    status_code: number | null;
    latency_ms: number | null;
    is_successful: boolean;
    checked_at?: string;
    response_body: string | null;
    error_message: string | null;
}

export interface VercelDeploymentResponse {
    uid: string;
    id?: string;
    url: string;
    state: string;
    readyState?: string;
    name: string;
    target?: string;
    alias?: string[];
    created: number;
    createdAt?: string;
    meta?: {
        githubCommitSha?: string;
        githubCommitRef?: string;
    };
}