import { Request, Response } from 'express';
import getBasicChatResponse from '../Services/OpenAIService/getBasicChatResponse';
import getStreamingChatResponse from '../Services/OpenAIService/getStreamingChatResponse';
import getOpenAIModelsList from '../Services/OpenAIService/getModelsList';
import getBasicChatResponseFromOllama from '../Services/OllamaAIService/getBasicChatResponse';
import getStreamingChatResponseFromOllama from '../Services/OllamaAIService/getStreamingChatResponse';
import getBasicChatResponseFromLlamaCpp from '../Services/LlamaCppService/getBasicChatResponse';
import getStreamingChatResponseFromLlamaCpp from '../Services/LlamaCppService/getStreamingChatResponse';
import getChatModelsList from '../Services/OllamaAIService/getInstalledModelList';

const healthCheck = async (req: Request, res: Response) => {
    res.status(200).json({ status: true, message: 'Health Check Successful' });
};

const basicResponse = async (req: Request, res: Response) => {
    const messages = req.body.messages;
    try {
        const response = await getBasicChatResponse(messages);
        return res.status(200).json(response.data);
    } catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
};

const streamResponse = async (req: Request, res: Response) => {
    const messages = req.body.messages;
    try {
        await getStreamingChatResponse(res, { messages });
    } catch (error: unknown) {
        console.error(error);
        return res.status(500).json(error);
    }
};

const listModels = async (req: Request, res: Response) => {
    try {
        const models = await getOpenAIModelsList();
        return res.status(200).json(models);
    } catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
};

// Ollama: POST /Chat/talk/:mode
const getResponseFromModel = async (req: Request, res: Response) => {
    const { prompt, model } = req.body;
    const { mode } = req.params;

    try {
        const modelsList = await getChatModelsList();

        if (modelsList.length === 0) {
            return res.status(200).json({ message: 'No models available', code: 'NO_MODEL_AVAILABLE' });
        }
        if (!modelsList.map(m => m.name).includes(model)) {
            return res.status(400).json({ message: `Model ${model} is not available`, code: 'BAD_REQUEST' });
        }

        if (mode === 'basic') {
            const response = await getBasicChatResponseFromOllama({ model, prompt });
            return res.status(200).json(response);
        }
        if (mode === 'stream') {
            await getStreamingChatResponseFromOllama({ model, prompt }, res);
            return;
        }

        return res.status(400).json({ message: 'mode must be basic or stream', code: 'BAD_REQUEST' });
    } catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
};

// llama.cpp: POST /Chat/llamaCpp/:mode
const getResponseFromLlamaCpp = async (req: Request, res: Response) => {
    const { prompt, nPredict, temperature } = req.body;
    const { mode } = req.params;

    if (!prompt) {
        return res.status(400).json({ message: 'prompt is required', code: 'BAD_REQUEST' });
    }

    try {
        if (mode === 'basic') {
            const response = await getBasicChatResponseFromLlamaCpp({ prompt, nPredict, temperature });
            return res.status(200).json(response);
        }
        if (mode === 'stream') {
            await getStreamingChatResponseFromLlamaCpp({ prompt, nPredict, temperature }, res);
            return;
        }

        return res.status(400).json({ message: 'mode must be basic or stream', code: 'BAD_REQUEST' });
    } catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
};

export default {
    healthCheck,
    basicResponse,
    streamResponse,
    listModels,
    getChatModelsList,
    getResponseFromModel,
    getResponseFromLlamaCpp,
};
