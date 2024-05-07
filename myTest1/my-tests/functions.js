import { promptMessage } from "../utils/prompt.js";
import OpenAi from "openai";
import dotenv from "dotenv"
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
async function takeOrder() {
    console.log("chamando takeOrder()")
    const tools = [
        {
            "type": "function",
            "function": {
                "name": "getUserOrder",
                "description": "pega os produtos do pedido de delivery do usuário após confirmação",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "products": {
                            "type": "array",
                            "description": "Array de objetos com nome do produto e quantidade",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "nome_produto": { "type": "string" },
                                    "quantidade": { "type": "number" }
                                }
                            }
                        }
                    },
                    "required": ["products"],
                },
            }
        }
    ]
    let model = "gpt-4-turbo-preview"

    let messages = [{
        role: "system",
        content: "Você é um atendente educado do delivery da Padaria Modelo"
            + "Sua missão é recolher o pedido do usuário"
            + "Não responder nada que não tenha relação com a Padaria"
            + "Não oferecer ou adicionar pedidos que estão fora do cardápio"
            + "Este é o cardápio disponível: " + data
            + "Não enviar o cardápio sem ser solicitado pelo usuário"
            + "Quando o usuário fechar o pedido, envie o pedido formatado em lista para confirmação do usuário"
            + "Você segue estas regras: Para pedidos com mais de 10 unidades, diga que irá verificar a disponibilidade e peça para o cliente aguardar um momento"
            + "Verificar se o usuário deseja mais um produto antes de fechar o pedido"


    }]

    while (true) {
        console.log("chamando modelo: " + model)

        const completion = await openai.chat.completions.create({
            messages,
            model,
            temperature: 0.4,
            tools
        })

        const modelResponse = completion.choices[0].message.content

        if (completion.choices[0].message.tool_calls) {

            const args = JSON.parse(completion.choices[0].message.tool_calls[0].function.arguments)
            const fn = completion.choices[0].message.tool_calls[0].function.name

            if (fn == 'getUserOrder') {
                const order = await getUserOrder(args)

                return order
            }

        } else {

            messages.push({
                role: "assistant",
                content: modelResponse
            })

            console.log(modelResponse)

            const userInput = await promptMessage("Mensagem>")

            messages.push({
                role: "user",
                content: userInput
            })
        }
    }


}
async function takeAdress(order) {
    let model = "gpt-4-turbo-preview"

    const tools = [
        {
            "type": "function",
            "function": {
                "name": "getUserAdress",
                "description": "pega o endereço fornecido pelo usuário",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "adress": {
                            "type": "object",
                            "description": "Objeto com dados do endereço do usuário",
                            "properties": {
                                "street": {"type":"string"},
                                "number": {"type":"number"},
                                "neighborhood": {"type":"string"},
                                "reference": {"type":"string"},
                                "complement": {"type":"string"}
                            }
                        }
                    },
                    "required": ["adress"],
                },
            }
        }
    ]

    let messages = [{
        role: "system",
        content: "Você é um atendente educado do delivery da Padaria Modelo"
            + "Sua missão é recolher o endereço de entrega do usuário"
            + "O usuário já estava falando com você antes, não precisa de dizer olá"
            + "O usuário já fez esse pedido: " + JSON.stringify(order)
            + "Não responder nada que não tenha relação com a Padaria"
            + "Perguntar qual a rua, o numero, o bairro e um ponto de referência"
    }]

    while (true) {

        const completion = await openai.chat.completions.create({
            messages,
            model,
            tools,
            temperature: 0.4,
        })

        if (completion.choices[0].message.tool_calls) {

            const args = JSON.parse(completion.choices[0].message.tool_calls[0].function.arguments)
            const fn = completion.choices[0].message.tool_calls[0].function.name

            getUserAdress(args)
        }

        const modelResponse = completion.choices[0].message.content

        messages.push({ role: "assistant", content: modelResponse })
        console.log(modelResponse)
        const userInput = await promptMessage("Mensagem>")

        messages.push({
            role: "user",
            content: userInput
        })
    }
}


// TOOLS Functions
async function getUserOrder(products) {
    const items = products.products
    return items
}

async function getUserAdress(adress){
    console.log("ENDEREÇO -> " + JSON.stringify(adress))
}

export const fn = {
    getUserOption,
    takeOrder,
    takeAdress
}


