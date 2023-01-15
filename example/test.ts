import {createBot} from "mineflayer"
import {loader} from "../src/index"


const bot = createBot({
    host: "localhost",
    port: 25566,
    username: "autoJumper",
    auth: "offline"
})



bot.loadPlugin(loader);



bot.on("spawn", () => {
    bot.autoJumper.enable();

    bot.on("chat", (username, message) => {
        const [cmd, ...args] = message.split(' ');

        switch(cmd) {
            case "start":
                bot.setControlState("forward", true)
                bot.setControlState("sprint", true)
                break
            case "stop":
                bot.setControlState("forward", false)
                bot.setControlState("sprint", false)
                break
        }
    });
})
