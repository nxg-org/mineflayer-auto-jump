
const {createBot} = require("mineflayer");
const {loader} = require("../dist/index");


const bot = (createBot)({
    host: "localhost",
    port: 25565,
    username: "test",
    version: "1.21.4",
    auth: "microsoft"
});
bot.loadPlugin(loader);


bot.once("spawn", async () => {
    bot.autoJumper.enable();
    bot.autoJumper.setOpts({debug: true})


    bot.on("chat", (username, message) => {
        if (username === bot.username) return;
        let author = bot.players[username];
      
        let [cmd, ...args] = message.split(' ');
        switch (cmd) {

            case "lookme":
                if (!author || !author.entity) return;
                bot.lookAt(author.entity.position.offset(0, author.entity.height, 0));
                break;


            case "start":
                bot.setControlState("forward", true);
                bot.setControlState("sprint", true);
                break;
            case "stop":
            case "cancel":
            case "end":
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


   await bot.waitForChunksToLoad()

   bot.chat('rocky1928')
});
