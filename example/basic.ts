import {createBot} from "mineflayer"
import {loader} from "../src/index"


const bot = createBot({
    host: "localhost",
    port: 25565,
    username: "autoJumper",
    auth: "offline"
})



bot.loadPlugin(loader);



bot.on("spawn", () => {
    bot.autoJumper.enable();

    // bot.on("physicsTick", () => {
    //     if ((bot.entity as any).isCollidedHorizontally) {
    //         console.log("We're hit!")
    //     }
    // })
    bot.on("chat", (username, message) => {
        let [cmd, ...args] = message.split(' ');
        switch (cmd) {
            case "start":
                bot.setControlState("forward", true);
                bot.setControlState("sprint", true);
                break;
            case "stop":
                bot.setControlState("forward", false);
                bot.setControlState("sprint", false);
                break;

            case "setopts":
                const opts: {[key: string]: boolean} = {};
                args.map(a => {
                    const [key, val] = a.split("="); return [key, val.toLowerCase() === 'true'] as [string, boolean]
                }).forEach(([key, val]) => opts[key] = val)
    
                bot.autoJumper.setOpts(opts);
                break;
        }
    });
});