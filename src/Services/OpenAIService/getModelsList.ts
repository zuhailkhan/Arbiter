import { OpenAIApi } from 'openai';
import { ApiConfig } from './type';

async function getOpenAIModelsList() {
    const openai = new OpenAIApi(ApiConfig);
    const response = await openai.listModels();
    return response.data;
}

export default getOpenAIModelsList;
