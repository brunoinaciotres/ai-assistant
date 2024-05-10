import dotenv from "dotenv"
import OpenAi from "openai";
import { promptMessage } from "../utils/prompt.js";
import {makeOrder} from './functions/optionOrderFunctions.js'
dotenv.config()

const groq = new OpenAi({ baseURL: " https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY })

async function main() {
    const userOption = await getUserOption()

    if (userOption == 'pedido') {
        const order = await makeOrder.takeOrder()
        const adress = await makeOrder.takeAdress(order)
        makeOrder.finishUserOrder(order,adress)
    } else if (userOption == 'info'){
        console.log("cai aq")
    }
}

main()

async function getUserOption() {
    const model = "llama3-8b-8192"

    let messages = [
        {
            role: "system",
            content: "Você é um atendente de delivery da Padaria Modelo."
                + "Você deve dizer ao usuário somente essa frase: 'Escolha uma das opções para prosseguirmos (digite o número da opção desejada): \n 1 - Fazer pedido de delivery, \n 2 - Fazer encomenda, \n 3 - Informações'"
                + "Você só sabe o que o usuário quer se ele responder o número 1, número 2, ou número 3"
                + "Se ele escolher (1), retorne um JSON no formato {\"option\":\"pedido\"}"
                + "Se ele escolher (2), retorne um JSON no formato {\"option\":\"encomenda\"}"
                + "Se ele escolher (3), retorne um JSON no formato {\"option\":\"info\"}"
                + "Não retornar nada além do JSON após a escolha"
        }
    ];

    while (true) {
        const userInput = await promptMessage("Mensagem>");

        messages.push({ role: "user", content: userInput })

        const completion = await groq.chat.completions.create({
            messages,
            model,
            temperature: .4
        });

        try {
            const modelResponse = completion.choices[0].message.content
            const modelResponseObj = JSON.parse(modelResponse)
            console.log("opcao escolhida :" + JSON.stringify(modelResponseObj))
            return modelResponseObj.option
        } catch (e) {
            const modelResponse = completion.choices[0].message.content
            console.log(modelResponse)
        }
    }

}