import express from "express";
import ChatController from "../controllers/ChatController";
import authenticator from "../middlewares/authenticator";

const ChatRoute = express.Router();

ChatRoute.get('/health', authenticator, ChatController.healthCheck);

// OpenAI
ChatRoute.post('/talkBasic', authenticator, ChatController.basicResponse);
ChatRoute.post('/talkStream', authenticator, ChatController.streamResponse);
ChatRoute.get('/listModels/openAi', authenticator, ChatController.listModels);

// Ollama
ChatRoute.post('/talk/:mode', authenticator, ChatController.getResponseFromModel);
ChatRoute.get('/listModels', authenticator, ChatController.getChatModelsList);

// llama.cpp
ChatRoute.post('/llamaCpp/:mode', authenticator, ChatController.getResponseFromLlamaCpp);

export default ChatRoute;
