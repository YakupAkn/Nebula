import { AIProvider } from '../providers/ai-provider';
import { db } from '../storage/db';
import { logger } from '../utils/logger';

export class IncidentAnalyzer {
    private ai: AIProvider;

    constructor(aiProvider: AIProvider) {
        this.ai = aiProvider;
    }

    async analyzeIncident(incidentId: string) {
        await logger.info('ai_analyzer', `Analyzing incident ${incidentId}`);

        const { data: incident } = await db.from('incidents').select('*').eq('id', incidentId).single();
        if (!incident) return;

        const { data: deployment } = await db.from('deployments').select('*').eq('deployment_id', incident.deployment_id).single();
        const { data: recentHealth } = await db.from('health_checks')
            .select('*')
            .eq('deployment_id', incident.deployment_id)
            .order('checked_at', { ascending: false })
            .limit(5);

        // Build prompt context
        const context = `
INCIDENT REPORT
ID: ${incident.id}
Status: ${incident.status}
Cause: ${incident.root_cause}

DEPLOYMENT
ID: ${deployment?.deployment_id}
Branch: ${deployment?.branch}
Commit: ${deployment?.commit_sha}
Error Rate: ${deployment?.error_rate}%

RECENT HEALTH CHECKS
${recentHealth?.map(h => `- Status: ${h.status_code}, Success: ${h.is_successful}, Latency: ${h.latency_ms}ms, Error: ${h.error_message}`).join('\n')}
`;

        try {
            // Groq analyze using the groq provider indirectly (we need to expose a generic method)
            // Existing `ai.analyzeCandidate` is highly bespoke. We will use `ai.ask` or similar if it existed.
            // Oh wait, AIProvider only has `analyzeCandidate`. Let's extend AIProvider or just do raw Groq call here.
            // Rather than breaking AIProvider abstraction deeply, let's just use GroqProvider logic inline or extend AIProvider.

            // To maintain safety, I will implement a custom prompt via Groq API.
            const Groq = (await import('groq-sdk')).default;
            const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

            const completion = await groqClient.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'You are an SRE AI analyzer. Analyze the incident context and return JSON: {"severity": "critical|high", "summary": "...", "possibleCause": "...", "confidence": 0.0-1.0, "recommendedAction": "rollback|wait", "evidence": ["..."]}. Do not output markdown codeblocks, just raw JSON.'
                    },
                    {
                        role: 'user',
                        content: context
                    }
                ],
                model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                response_format: { type: 'json_object' }
            });

            const content = completion.choices[0].message.content;
            if (content) {
                const parsed = JSON.parse(content);

                // Update incident with AI summary
                await db.from('incidents').update({
                    summary: `${incident.summary}\n\nAI Analysis: ${parsed.summary}\nPossible Cause: ${parsed.possibleCause}`,
                }).eq('id', incidentId);

                await logger.info('ai_analyzer', `AI analyzed incident ${incidentId} with confidence ${parsed.confidence}`);
            }

        } catch (e: any) {
            await logger.error('ai_analyzer', `Failed AI analysis for incident ${incidentId}: ${e.message}`);
        }
    }
}
