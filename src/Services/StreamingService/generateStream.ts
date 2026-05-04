async function generateStream(url: string, model: string, prompt: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      prompt,
      model,
      stream: true,
    }),
  });

  if (response.status !== 200) throw new Error(response.status.toString());
  if (!response.body) throw new Error("Response body does not exist");
  return getIterableStream(response.body);
}

export async function* getIterableStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    const decodedChunk = decoder.decode(value, { stream: true });
    yield decodedChunk;
  }
}

// Parses Ollama NDJSON stream and yields plain text tokens.
// Each Ollama chunk: {"model":"...","response":"token","done":false}
export async function* parseOllamaNDJSON(
  raw: AsyncIterable<string>
): AsyncGenerator<string> {
  for await (const chunk of raw) {
    for (const line of chunk.split('\n')) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line);
        if (data.response && !data.done) yield data.response as string;
      } catch {
        // partial chunk — skip
      }
    }
  }
}

// Parses llama.cpp SSE stream and yields plain text tokens.
// Each llama.cpp SSE line: data: {"content":"token","stop":false}
export async function* parseLlamaCppSSE(
  raw: AsyncIterable<string>
): AsyncGenerator<string> {
  for await (const chunk of raw) {
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.content && !data.stop) yield data.content as string;
      } catch {
        // partial chunk — skip
      }
    }
  }
}

export default generateStream;