import { promptMessage } from "../../utils/prompt.js";
import OpenAi from "openai";
import dotenv from "dotenv"
import { menu } from "../data/menu.js";
import { entrega } from "../data/entrega.js";

dotenv.config()

const openai = new OpenAi({ apiKey: process.env.OPENAI_API_KEY })


async function takeOrder() {
    console.log('\x1b[34m%s\x1b[0m', "Chamando ---> takeOrder()")
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
            +"Um chamado de pedido foi aberto"
            + "Não responder nada que não tenha relação com a Padaria"
            + "Não oferecer ou adicionar pedidos que estão fora do cardápio"
            + "Este é o cardápio disponível: " + menu
            + "Não enviar o cardápio sem ser solicitado pelo usuário"
            + "Não fechar pedidos acima de 10 unidades. Dizer que vai Verificar disponibilidade antes e pedir para aguardar"
            + "Verificar se o usuário deseja mais um produto antes de fechar o pedido"
            + "Quando o usuário fechar o pedido, envie o pedido formatado em lista para confirmação dos produtos ao usuário"
            + "Não encerrar o chamado antes de coletar o endereço"
            

    }]

    while (true) {


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
                console.log('\x1b[32m%s\x1b[0m', "Pedido retirado ---> " + JSON.stringify(order))
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
    console.log('\x1b[34m%s\x1b[0m', "Chamando ---> takeAdress()")
    let model = "gpt-4-turbo-preview"

    const tools = [
        {
            "type": "function",
            "function": {
                "name": "getUserAdress",
                "description": "pega o endereço fornecido pelo usuário após confirmação",
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
            + "Perguntar qual a rua, o numero, complemento, o bairro e um ponto de referência"
            + "O ponto de referência é opcional"
            + "Se a pessoa não informar complemento ou ponto de referência, não pergunte se há algum"
            + "Você deve confirmar o endereço com o usuário"
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
            const adress = await getUserAdress(args)
            console.log('\x1b[32m%s\x1b[0m', "Endereço Retirado ---> " + JSON.stringify(adress))
            return adress
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

async function finishUserOrder(order, adress){
    console.log('\x1b[34m%s\x1b[0m', "Chamando ---> finishUserOrder()")
    let model = "gpt-4-turbo-preview"

    let messages = [{
        role: "system",
        content: "Você é um atendente educado do delivery da Padaria Modelo"
            + "Sua missão é finalizar o pedido do usuário informando um resumo do pedido"
            + "O usuário já estava falando com você antes"
            + "O usuário já fez esse pedido: " + JSON.stringify(order)
            + "O usuário já informou esse endereço de entrega: " + JSON.stringify(adress)
            + "Não responder nada que não tenha relação com a Padaria"
            + "Gerar um resumo do pedido com os dados: produtos e preços "
            + "O preço de entrega é em relação ao bairro, esta é a lista: " + entrega
            + "Cardápio de produtos com os preços: " + menu
            + "Antes de finalizar o pedido, você pedir qual o método de pagamento, podendo ser cartão, dinheiro ou pix"
            + "Se o usuário escolher método de pagamento dinheiro, você deve perguntar se precisa de troco e para quanto"
    }]

    while (true) {

        const completion = await openai.chat.completions.create({
            messages,
            model,
            temperature: 0.4,
        })

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
    return adress
}

export const MakeOrder = {
    takeOrder,
    takeAdress,
    finishUserOrder
}


