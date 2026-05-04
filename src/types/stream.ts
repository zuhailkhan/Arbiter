export type StreamMessageType = 'loading' | 'content' | 'blocked' | 'done';

export interface LoadingMessage {
    type: 'loading';
    chars: number;
}

export interface ContentMessage {
    type: 'content';
    segmentId: number;
    text: string;
}

export interface BlockedMessage {
    type: 'blocked';
    segmentId: number;
    chars: number;
}

export interface DoneMessage {
    type: 'done';
}

export type StreamMessage = LoadingMessage | ContentMessage | BlockedMessage | DoneMessage;

export type ModerationVerdict = 'pass' | 'block';
