"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqProvider = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const rate_limit_manager_1 = require("../limits/rate-limit-manager");
class GroqProvider {
    client;
    model;
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY must be provided in environment variables');
        }
        this.client = new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY });
        this.model = process.env.GROQ_MODEL || 'llama3-8b-8192';
    }
    async analyzeCandidate(context) {
        await rate_limit_manager_1.RateLimitManager.reserveRequest();
        // Standard analysis prompt asking Groq to evaluate the context precisely
        const prompt = `Analyze the following candidate project for a potential pilot of "Nebula" (a project/task management tool).
We ONLY want small, active teams (2-15 active contributors). Target: student teams, tech clubs, hackathons, small SaaS, indie devs, or small open-source.
DO NOT qualify massive/enterprise projects (like VS Code, React, Supabase). If it's a huge corporate or massive open-source project, set qualified=false and include "too_large_for_initial_pilot" in reasons.

Context about the candidate:
${context}

You must return EXACTLY this JSON structure with NO conversational text:
{
  "qualified": boolean,
  "relevance_score": number, // 0 to 100
  "team_type": string, // e.g. "small_saas", "student_team", "indie_open_source"
  "estimated_team_size": number | null,
  "reasons": string[], // why the candidate scored this way (e.g., "too_large_for_initial_pilot")
  "why_nebula_might_fit": string, // brief explanation
  "confidence": number // 0 to 100
}`;
        try {
            const completion = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.model,
                temperature: 0.1,
                response_format: { type: 'json_object' }
            });
            const responseText = completion.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(responseText);
            // Rough usage tracking
            const usage = completion.usage;
            await rate_limit_manager_1.RateLimitManager.recordSuccess(usage?.prompt_tokens, usage?.completion_tokens);
            return {
                qualified: Boolean(parsed.qualified),
                relevance_score: Number(parsed.relevance_score) || 0,
                team_type: String(parsed.team_type || ''),
                estimated_team_size: parsed.estimated_team_size ? Number(parsed.estimated_team_size) : null,
                reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
                why_nebula_might_fit: String(parsed.why_nebula_might_fit || ''),
                confidence: Number(parsed.confidence) || 0
            };
        }
        catch (error) {
            // Groq Rate limits return 429
            if (error.status === 429) {
                await rate_limit_manager_1.RateLimitManager.recordFailure(true);
                // Parse retry-after from headers if it exists
                const retryAfterParam = error.headers?.['retry-after'];
                let delayS = 60; // default 1 min
                if (retryAfterParam) {
                    delayS = parseInt(retryAfterParam, 10);
                }
                throw new rate_limit_manager_1.RateLimitHitError(delayS);
            }
            await rate_limit_manager_1.RateLimitManager.recordFailure(false);
            throw error;
        }
    }
}
exports.GroqProvider = GroqProvider;
