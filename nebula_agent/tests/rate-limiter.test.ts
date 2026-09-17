import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitManager, SafetyLimitReachedError } from '../src/limits/rate-limit-manager';

// Mock DB interactions
let testDbState = { ai_requests: 49 };

vi.mock('../src/storage/db', () => ({
    db: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => Promise.resolve({ data: testDbState, error: null }))
    }
}));

// Mock logger
vi.mock('../src/utils/logger', () => ({ logger: { warn: vi.fn() } }));

describe('RateLimitManager', () => {
    beforeEach(() => {
        process.env.AGENT_MAX_AI_REQUESTS_PER_DAY = '50';
    });

    it('allows requests when under limit', async () => {
        testDbState = { ai_requests: 10 };
        await expect(RateLimitManager.reserveRequest()).resolves.toBeUndefined();
    });

    it('throws SafetyLimitReachedError when over limit', async () => {
        testDbState = { ai_requests: 50 };
        await expect(RateLimitManager.reserveRequest()).rejects.toThrow(SafetyLimitReachedError);
    });
});
