export interface ModerationJob {
    segmentId: number;
    text: string;
    userId?: string;
}

export interface ModerationResult {
    segmentId: number;
    verdict: 'pass' | 'block';
}

export interface IModerationQueue {
    moderate(job: ModerationJob): Promise<ModerationResult>;
}
