import { llamaCppCompletionUrl, LlamaCppRequestConfig } from './type';

interface LlamaCppResponse {
    content: string;
    stop: boolean;
    tokens_predicted: number;
    tokens_evaluated: number;
}

async function getBasicChatResponseFromLlamaCpp(
    config: LlamaCppRequestConfig
): Promise<LlamaCppResponse> {
    const response = await fetch(llamaCppCompletionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: config.prompt,
            stream: false,
            n_predict: config.nPredict ?? 512,
            temperature: config.temperature ?? 0.7,
        }),
    });

    if (!response.ok) throw new Error(`llama.cpp returned ${response.status}`);
    return response.json() as Promise<LlamaCppResponse>;
}

export default getBasicChatResponseFromLlamaCpp;
