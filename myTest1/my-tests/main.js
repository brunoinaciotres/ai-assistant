import dotenv from "dotenv"
import {fn} from './functions.js'

dotenv.config()

async function main() {
    const userOption = await fn.getUserOption()

    if (userOption == 'pedido') {
        const order = await fn.takeOrder()
        console.log("order -> " + order)
        const adress = fn.takeAdress(order)
    }
}

main()