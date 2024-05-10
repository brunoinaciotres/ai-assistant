import OpenAi from "openai";
import dotenv from "dotenv"
import { promptMessage } from "../utils/prompt.js";
import { data } from "./data.js";
import { entrega } from "./entrega.js";
dotenv.config()

const openai = new OpenAi({ apiKey: process.env.OPENAI_API_KEY })
const groq = new OpenAi({baseURL: " https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY })

async function main() {
    //const model = "gpt-4-0125-preview"
    const model = "llama3-8b-8192"

    const tools = [
        {
            "type": "function",
            "function":{
                "name": "get_total_price",
                "description": "Calcula o preço total do pedido. Calcular somente após o usuário ter informado o endereço de entrega",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "items_price": {
                            "type": "array",
                            "description": "Lista com os valores do preço de cada produto do pedido.",
                            "items": {
                                "type": "number"
                            }
                        },
                        "delivery_price":{
                            "type" : "number",
                            "description": "Preço de entrega baseado no bairro do usuário"
                        }
                    },
                    "required": [
                        "items_price",
                        "delivery_price"
                    ]
                }
            }
        },
    ]

    // let messages = [
    //     {
    //         role: "system",
    //         content: "Você é uma assistente virtual inteligente de delivery de uma padaria"
    //             + "Você trata com educação o usuário"
    //             + "Você deve recolher o pedido do usuário"
    //             + "Você deve recolher o endereço de entrega, (Rua, número, bairro)"
    //             + "Você deve confirmar o endereço de entrega"
    //             +" Você pedir o bairro ao usuário se você não tiver certeza do bairro"
    //             + "Você deve calcular o total do pedido somente após recolher o endereço"
    //             + "Você deve recolher a forma de pagamento:dinheiro, cartão ou pix "
    //             + "Se o pagamento for em dinheiro, perguntar: 'Precisa de troco para quanto?'"
    //             + "O pagamento no cartão e pix são realizado na entrega"
    //             + "Enviar resumo no formato especificado: 'Quantidade do produto' - 'nome do produto' - 'valor DO PRODUTO multiplicado pela quantidade' 'taxa de entrega'. Discriminando os valores"
    //             + "Você deve perguntar se o usuário deseja mais algum produto"
    //             + "Você não responde nada que não seja sobre pedidos do delivery e sobre a padaria"
    //             + "Você não altera o preço total após calculado"
    //             + "Você só apresenta o cardápio se o usuário perguntar sobre ele"
    //             + "Esse é o cardápio de produtos disponíveis: " + data
    //             + "O preço da entrega é com base no bairro do usuário, essa é a lista: " + entrega
    //             + "O tempo de entrega para o bairro Centro é de aproximadamente 30 minutos"
    //             + "Não aceitar pedidos fora do cardápio"
    //             + "O tempo de entrega para outros bairros além do Centro é aproximadamente 45 minutos"
    //     }
    // ];

    let messages = [
        {
            role: "system",
            content: "Primeiro você deve dizer ao usuário: 'Escolha uma das opções para prosseguir: 1 - Fazer um pedido de delivery, 2 - Fazer uma encomenda, 3 - Dúvidas'"
            +       "Após o usuário escolher a opção desejada, você deve retornar um JSON no formato {\"opcao\": \"número da opção\"}"
            +       "Não retornar nada além do JSON"
                
        }
    ];
    
    while (true) {

        const text = await promptMessage("Mensagem>");

        messages.push(
            { role: "user", content: text }
        )

        const completion = await groq.chat.completions.create({
            messages,
            model,
            tools,
            temperature: .5
        });

        
        if(completion.choices[0].message.tool_calls){

            const fn = completion.choices[0].message.tool_calls[0].function.name;
            const args = JSON.parse(completion.choices[0].message.tool_calls[0].function.arguments);

            if (fn == "get_total_price"){
                const total_price = await getTotalPrice(args.items_price, args.delivery_price)

                messages.push({
                    role: 'function',
                    name: fn,
                    content: JSON.stringify(total_price)
                })

                const completionFn = await openai.chat.completions.create({
                    messages,
                    tools,
                    model
                })

                messages.push(
                    {role: "assistant", content: completionFn.choices[0].message.content}
                )

                console.log(completionFn.choices[0].message.content)
            }

        } else {

            messages.push(
                {role: "assistant", content: completion.choices[0].message.content}
            )
            console.log(completion.choices[0].message.content);
        }
        console.log("💰 usage", completion.usage);
    }


}

main()

// ----- FUNCTIONS ------- //

function getTotalPrice(items_price, delivery_price){
    console.log(items_price, delivery_price)
    let soma = 0
    for (let i = 0; i <items_price.length; i++){
        soma += items_price[i]
    }

    let valorTotal = soma + delivery_price
   
    return valorTotal
}