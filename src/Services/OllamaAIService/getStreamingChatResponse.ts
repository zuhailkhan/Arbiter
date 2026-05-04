import { Response } from "express";
import { BasicChatRequestConfig, ollamaUrl } from "./type";
import { getIterableStream, parseOllamaNDJSON } from "../StreamingService/generateStream";
import { StreamBuffer } from "../BufferService/StreamBuffer";
import { defaultQueue } from "../ModerationQueue/InMemoryQueue";

async function getStreamingChatResponseFromOllama(
  config: BasicChatRequestConfig,
  res: Response
): Promise<void> {
  const { prompt, model } = config;

  const response = await fetch(ollamaUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: true }),
  });

  if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
  if (!response.body) throw new Error("Ollama response body is empty");

  const rawStream = getIterableStream(response.body);
  const tokenStream = parseOllamaNDJSON(rawStream);
  const buffer = new StreamBuffer(res, defaultQueue);
  await buffer.process(tokenStream);
}

export default getStreamingChatResponseFromOllama;
