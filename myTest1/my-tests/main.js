import dotenv from "dotenv"
import {fn} from './functions.js'

dotenv.config()

async function main() {
    const userOption = await fn.getUserOption()

    if (userOption == 'pedido') {
        const order = await fn.takeOrder()
        const adress = await fn.takeAdress(order)
        fn.finishUserOrder(order,adress)
    }
}

main()