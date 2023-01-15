
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
    bot.on("physicsTick", () => {
        if (bot.entity.isHorizontallyCollided) {
            console.log("We're hit!")
        }
    })
    bot.on("chat", (username, message) => {
        const [cmd, ...args] = message.split(' ');
        switch (cmd) {
            case "start":
                bot.setControlState("forward", true);
                bot.setControlState("sprint", true);
                break;
            case "stop":
                bot.setControlState("forward", false);
                bot.setControlState("sprint", false);
                break;
        }
    });
});
