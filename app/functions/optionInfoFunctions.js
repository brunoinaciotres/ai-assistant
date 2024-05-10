import { promptMessage } from "../../utils/prompt.js";
import OpenAi from "openai";
import dotenv from "dotenv"
import { menu } from "../data/menu.js";
import { entrega } from "../data/entrega.js";

dotenv.config()

const openai = new OpenAi({ apiKey: process.env.OPENAI_API_KEY })
const groq = new OpenAi({ baseURL: " https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY })

async function getInfo(){
    console.log('\x1b[34m%s\x1b[0m', "Chamando ---> getInfo()")
   
    let model = "gpt-4-turbo-preview"

    const tools = [
        {
            "type": "function",
            "function": {
                "name": "fazerPedido",
                "description": "inicia processo de fazer pedido para o usuário quando solicitado",
            }
        }
    ]


    let messages = [{
        role: "system",
        content: "Você é um atendente educado do delivery da Padaria Modelo"
            + "Hoje é:" + JSON.stringify(Date.now())
            + "Sua missão é somente fornecer informações sobre o negócio da padaria"
            + "Não responder nada que não tenha relação com a Padaria"
            + "Este é o cardápio " + menu
            + "Você sabe os preços de entrega em cada bairro: " + entrega
            + "O horário de funcionamento da Padaria é de 6h às 21:30h de segunda a sexta"
            + "O horário de funcionamento da Padaria é de 6h às 19:30h no sábado"
            + "O horário de funcionamento da Padaria é de 7h às 15h no domingo"
            + "O horário de funcionamento do almoço é de 11h as 15h"
            + "Finais de semana e feriados serve carne assada (lombo, costela e pernil suíno e coxa e sobrecoxa de frango)"
            + "Carne Suína: R$55,90/kg. Carne de frango: R$41,90/kg"
            + "Serve almoço self-service de segunda a sábado. (R$64,90/kg)"
            + "Domingo o almoço é R$55,90/kg"
            + "Se perguntar sobre contratação, dizer que recolhemos currículos no caixa da padaria para futuras oportunidades"
            + "O endereço é Rua Batista de Oliveira 622, Centro"
            + "Se você não tiver certeza da resposta, pedir para aguardar um momento que você irá verificar"
            + "A padaria realiza encomendas de Coffee Break para empresas"
            
            

    }]

    while (true) {

        const completion = await openai.chat.completions.create({
            messages,
            model,
            temperature: 0.4,
            tools
        })

        if (completion.choices[0].message.tool_calls){
            console.log("inciiar pedido")
            return
        }

        const modelResponse = completion.choices[0].message.content

        messages.push({
            role:"assistant",
            content: modelResponse
        })
        
        console.log(modelResponse)

        const userInput = await promptMessage("Mensagem>")

        messages.push({
            role:"user",
            content: userInput
        })
    }
}

export const Info = {
    getInfo
}