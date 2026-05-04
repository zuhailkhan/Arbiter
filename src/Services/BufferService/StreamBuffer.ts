import { Response } from 'express';
import { IModerationQueue } from '../ModerationQueue/IQueue';
import { StreamMessage } from '../../types/stream';

interface BufferOptions {
    minChars?: number;  // minimum chars before a sentence boundary triggers a flush
    maxChars?: number;  // maximum chars before a forced flush
}

export class StreamBuffer {
    private buffer = '';
    private segmentId = 0;
    private backtickCount = 0;  // tracks ``` occurrences — odd = inside code block

    private readonly minChars: number;
    private readonly maxChars: number;

    constructor(
        private readonly res: Response,
        private readonly queue: IModerationQueue,
        options: BufferOptions = {}
    ) {
        this.minChars = options.minChars ?? 80;
        this.maxChars = options.maxChars ?? 500;
    }

    async process(tokenStream: AsyncIterable<string>): Promise<void> {
        try {
            for await (const token of tokenStream) {
                this.buffer += token;
                this.updateCodeBlockState(token);
                this.send({ type: 'loading', chars: this.buffer.length });
                await this.checkBoundary();
            }

            if (this.buffer.trim().length > 0) {
                await this.flushSegment();
            }
        } finally {
            this.send({ type: 'done' });
            this.res.end();
        }
    }

    private updateCodeBlockState(token: string): void {
        const matches = token.match(/```/g);
        if (matches) this.backtickCount += matches.length;
    }

    private get inCodeBlock(): boolean {
        return this.backtickCount % 2 === 1;
    }

    private async checkBoundary(): Promise<void> {
        if (this.inCodeBlock) return;

        // code block just closed — the closing ``` is already in buffer
        const codeBlockClosed = this.backtickCount > 0 && this.backtickCount % 2 === 0
            && this.buffer.includes('```');

        if (codeBlockClosed) {
            // only flush if the closing ``` is at the tail of the buffer
            if (/```\s*$/.test(this.buffer)) {
                await this.flushSegment();
                return;
            }
        }

        const atNewline = this.buffer.endsWith('\n');
        // period followed by space and uppercase = confident sentence boundary
        const atSentence = /[.!?]\s+[A-Z]/.test(this.buffer.slice(-5));

        if ((atNewline || atSentence) && this.buffer.length >= this.minChars) {
            await this.flushSegment();
            return;
        }

        if (this.buffer.length >= this.maxChars) {
            await this.flushSegment();
        }
    }

    private async flushSegment(): Promise<void> {
        const text = this.buffer;
        this.buffer = '';
        const id = this.segmentId++;

        const result = await this.queue.moderate({ segmentId: id, text });

        if (result.verdict === 'pass') {
            this.send({ type: 'content', segmentId: id, text });
        } else {
            this.send({ type: 'blocked', segmentId: id, chars: text.length });
        }
    }

    private send(message: StreamMessage): void {
        this.res.write(JSON.stringify(message) + '\n');
    }
}
