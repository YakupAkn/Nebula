import { CandidateAnalysisResult } from '../types';

export interface AIProvider {
    analyzeCandidate(context: string): Promise<CandidateAnalysisResult>;
}
