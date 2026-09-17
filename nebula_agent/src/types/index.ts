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
