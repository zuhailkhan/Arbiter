import { IModerationQueue, ModerationJob, ModerationResult } from './IQueue';

// Passthrough moderator — swap this implementation for BullMQ + LlamaGuard in Phase 3.
// All segments pass. The queue interface is stable; only this class changes.
export class InMemoryQueue implements IModerationQueue {
    async moderate(job: ModerationJob): Promise<ModerationResult> {
        return { segmentId: job.segmentId, verdict: 'pass' };
    }
}

export const defaultQueue = new InMemoryQueue();
