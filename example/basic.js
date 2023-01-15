
const {createBot} = require("mineflayer");
const {loader} = require("../dist/index");


const bot = (createBot)({
    host: "localhost",
    port: 25566,
    username: "autoJumper",
    auth: "offline"
});
bot.loadPlugin(loader);


bot.on("spawn", () => {
    bot.autoJumper.enable();
    bot.autoJumper.setOpts({debug: true})


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
                const opts = {};
                args.map(a => {
                    const [key, val] = a.split("="); return [key, val.toLowerCase() === 'true']
                }).forEach(([key, val]) => opts[key] = val)
    
                bot.autoJumper.setOpts(opts);
                break;
        }
    });
});
