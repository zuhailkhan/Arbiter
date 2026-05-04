import { Response } from 'express';
import { llamaCppCompletionUrl, LlamaCppRequestConfig } from './type';
import { getIterableStream, parseLlamaCppSSE } from '../StreamingService/generateStream';
import { StreamBuffer } from '../BufferService/StreamBuffer';
import { defaultQueue } from '../ModerationQueue/InMemoryQueue';

async function getStreamingChatResponseFromLlamaCpp(
    config: LlamaCppRequestConfig,
    res: Response
): Promise<void> {
    const response = await fetch(llamaCppCompletionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: config.prompt,
            stream: true,
            n_predict: config.nPredict ?? 512,
            temperature: config.temperature ?? 0.7,
        }),
    });

    if (!response.ok) throw new Error(`llama.cpp returned ${response.status}`);
    if (!response.body) throw new Error('llama.cpp response body is empty');

    const rawStream = getIterableStream(response.body);
    const tokenStream = parseLlamaCppSSE(rawStream);
    const buffer = new StreamBuffer(res, defaultQueue);
    await buffer.process(tokenStream);
}

export default getStreamingChatResponseFromLlamaCpp;
