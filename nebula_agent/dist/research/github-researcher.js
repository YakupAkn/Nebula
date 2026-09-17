"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubResearcher = void 0;
const logger_1 = require("../utils/logger");
class GithubResearcher {
    token;
    constructor() {
        this.token = process.env.GITHUB_TOKEN || '';
    }
    async searchForCandidates() {
        if (!this.token) {
            await logger_1.logger.warn('github_search', 'GITHUB_TOKEN is missing. Skipping search.');
            return [];
        }
        const rawCandidates = await this.fetchRecentActiveRepos();
        const filtered = this.deterministicFilter(rawCandidates);
        await logger_1.logger.info('github_search', `Found ${rawCandidates.length} raw candidates, filtered to ${filtered.length}`, {
            raw: rawCandidates.length,
            filtered: filtered.length
        });
        return filtered;
    }
    async fetchRecentActiveRepos() {
        // We use the REST Search API to find recent TS/JS repositories created or updated recently.
        // Important: Filter OUT massive projects by setting an upper bound on stars to prevent VSCode/React type leads.
        try {
            const dateStr = new Date();
            dateStr.setDate(dateStr.getDate() - 7); // Active in last 7 days
            const formattedDate = dateStr.toISOString().split('T')[0];
            // deterministic query rules: small, but active.
            // stars between 5 and 500, has issues enabled.
            const languages = ['TypeScript', 'JavaScript', 'Python', 'Go'];
            const randomLang = languages[Math.floor(Math.random() * languages.length)];
            const q = `language:${randomLang} pushed:>${formattedDate} stars:5..500`;
            const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=50`;
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Nebula-Agent-Worker'
                }
            });
            if (!res.ok) {
                await logger_1.logger.error('github_api_error', `API returned ${res.status}`);
                return [];
            }
            const data = await res.json();
            return data.items || [];
        }
        catch (e) {
            await logger_1.logger.error('github_fetch_fail', e.message);
            return [];
        }
    }
    deterministicFilter(repos) {
        // Implement rules:
        // - No forks
        // - size > 100 (non-trivial)
        // - stars < 1000 (exclude massive apps that slipped through)
        // - has open issues (indicates coordination needs)
        // - requires descriptive text
        return repos
            .filter(r => !r.fork)
            .filter(r => r.stargazers_count >= 5 && r.stargazers_count < 1000)
            .filter(r => r.size > 200) // basic proxy for complexity
            .filter(r => r.has_issues === true && r.open_issues_count > 0) // needs task coordination
            .filter(r => r.description && r.description.length > 15) // needs a description to evaluate
            .map(r => ({
            owner: r.owner.login,
            repoName: r.name,
            url: r.html_url,
            description: r.description,
            stars: r.stargazers_count,
            language: r.language
        }));
    }
}
exports.GithubResearcher = GithubResearcher;
