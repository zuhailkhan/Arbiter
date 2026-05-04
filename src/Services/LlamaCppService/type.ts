export const llamaCppBaseUrl = process.env.LLAMACPP_URL ?? 'http://localhost:8080';
export const llamaCppCompletionUrl = `${llamaCppBaseUrl}/completion`;

export interface LlamaCppRequestConfig {
    prompt: string;
    nPredict?: number;  // max tokens to generate
    temperature?: number;
}
