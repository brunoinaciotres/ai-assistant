import OpenAi from "openai";
import dotenv from "dotenv"
import { promptMessage } from "../utils/prompt.js";
import { data } from "./data.js";
import { entrega } from "./entrega.js";
dotenv.config()

const openai = new OpenAi({ apiKey: process.env.OPENAI_API_KEY })
const groq = new OpenAi({ baseURL: " https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY })


async function getUserOption() {
    const model = "llama3-8b-8192"

    let messages = [
        {
            role: "system",
            content: "Diga ao usuário somente isso e aguarde a resposta: 'Escolha uma das opções para prosseguir: 1 - Fazer um pedido de delivery, 2 - Fazer uma encomenda, 3 - Dúvidas'"
                + "Após o usuário escolher a opção desejada, você deve retornar um JSON no formato {\"opcao\": \"número da opção\"}"
                + "Não retornar nada além do JSON"
                + "O usuário deve obrigatoriamente escolher uma das opções acima"

        }
    ];

    while(true){
        const userInput = await promptMessage("Mensagem>");
    
        messages.push({ role: "user", content: userInput })
    
        const completion = await groq.chat.completions.create({
            messages,
            model,
            temperature: .5
        });
    
        try {
            const modelResponse = completion.choices[0].message.content
            const modelResponseObj = JSON.parse(modelResponse)
            console.log("opcao escolhida :" + modelResponseObj)
            return modelResponseObj.opcao
        } catch(e){
            const modelResponse = completion.choices[0].message.content
            console.log(modelResponse)
        }
        
            
            
        

    }



}

async function main(){
    const userOption = await getUserOption()
    console.log("USER OPTION: " + userOption)

    if (userOption == 1){
        console.log("chamar takeOrder()")
    }
}

main()