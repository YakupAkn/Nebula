import axios from 'axios';
import { VercelDeploymentResponse } from '../../types';
import { logger } from '../../utils/logger';

export class VercelClient {
    private token: string;
    private projectId: string;
    private teamId: string | undefined;
    private baseUrl = 'https://api.vercel.com';

    constructor() {
        this.token = process.env.VERCEL_TOKEN || '';
        this.projectId = process.env.VERCEL_PROJECT_ID || '';
        this.teamId = process.env.VERCEL_TEAM_ID;

        if (!this.token || !this.projectId) {
            logger.warn('vercel_client_init', 'Vercel API credentials (VERCEL_TOKEN or VERCEL_PROJECT_ID) are missing. Vercel integration will fail.');
        }
    }

    private getHeaders() {
        return {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    private appendTeamId(url: string): string {
        if (this.teamId) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}teamId=${this.teamId}`;
        }
        return url;
    }

    async getDeployments(limit = 10, target = 'production'): Promise<VercelDeploymentResponse[]> {
        try {
            let url = this.appendTeamId(`${this.baseUrl}/v6/deployments?projectId=${this.projectId}&limit=${limit}&target=${target}`);
            const response = await axios.get(url, { headers: this.getHeaders() });
            return response.data.deployments || [];
        } catch (error: any) {
            await logger.error('vercel_api_error', 'Failed to fetch deployments', { error: error.message });
            return [];
        }
    }

    async getDeployment(deploymentId: string): Promise<VercelDeploymentResponse | null> {
        try {
            let url = this.appendTeamId(`${this.baseUrl}/v13/deployments/${deploymentId}`);
            const response = await axios.get(url, { headers: this.getHeaders() });
            return response.data;
        } catch (error: any) {
            await logger.error('vercel_api_error', `Failed to fetch deployment ${deploymentId}`, { error: error.message });
            return null;
        }
    }

    async rollbackProduction(deploymentIdToPromote: string): Promise<boolean> {
        if (process.env.RECOVERY_MODE === 'dry-run') {
            await logger.info('vercel_rollback_dry_run', 'DRY-RUN: Would execute Vercel rollback to ' + deploymentIdToPromote);
            return true;
        }

        try {
            // Note: rolling back in Vercel is often done by updating the "production" alias or re-deploying an existing commit.
            // Using the /v9/projects/{projectId}/promote endpoint or explicitly assigning the primary alias.
            // But usually the most direct way to 'rollback' is to trigger a rollback API or assign the alias.

            // To properly promote an older deployment to production:
            let url = this.appendTeamId(`${this.baseUrl}/v9/projects/${this.projectId}/promote/${deploymentIdToPromote}`);
            await axios.post(url, {}, { headers: this.getHeaders() });

            await logger.info('vercel_rollback_success', `Promoted deployment ${deploymentIdToPromote} to production`);
            return true;
        } catch (error: any) {
            await logger.error('vercel_api_error', `Failed to rollback to ${deploymentIdToPromote}`, { error: error.message, response: error.response?.data });
            return false;
        }
    }
}
