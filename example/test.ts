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

    bot.on("physicsTick", () => {
        if ((bot.entity as any).isCollidedHorizontally) {
            console.log("We're hit!")
        }
    })
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
                const raw: [string, boolean][] = args.map(a => {
                    const [key, val] = a.split("="); return [key, val.toLowerCase() === 'true']
                })
                const opts: {[key: string]: boolean} = {};
                for (let i = 0; i < raw.length; i++) {
                    opts[raw[i][0]] = raw[i][1]
                }
                bot.autoJumper.setOpts(opts);
                break;
        }
    });
});