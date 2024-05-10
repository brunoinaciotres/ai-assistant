import { promptMessage } from "../../utils/prompt.js";
import OpenAi from "openai";
import dotenv from "dotenv"
import { menu } from "../data/menu.js";
import { entrega } from "../data/entrega.js";

dotenv.config()

const openai = new OpenAi({ apiKey: process.env.OPENAI_API_KEY })
const groq = new OpenAi({ baseURL: " https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY })