import { db } from '../storage/db';

export class DuplicateDetector {
    static async isDuplicate(githubUrl?: string, website?: string, orgName?: string): Promise<boolean> {
        if (!githubUrl && !website && !orgName) return false;

        // Using OR filters to detect duplicates across any of the dimensions
        let query = db.from('agent_leads').select('id', { count: 'exact' });

        const conditions: string[] = [];
        if (githubUrl) {
            conditions.push(`github_url.eq.${encodeURIComponent(githubUrl)}`);
        }
        if (website) {
            conditions.push(`website.eq.${encodeURIComponent(website)}`);
        }
        if (orgName) {
            // Case-insensitive exact match
            conditions.push(`organization_name.ilike.${encodeURIComponent(orgName)}`);
        }

        if (conditions.length > 0) {
            query = query.or(conditions.join(','));
        }

        const { count, error } = await query;
        if (error) {
            console.error('Error checking duplicate:', error);
            // Default to true on error to avoid duplicate spamming
            return true;
        }

        return (count ?? 0) > 0;
    }
}
