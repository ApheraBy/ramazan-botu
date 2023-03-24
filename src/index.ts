import { Bot } from "./Client";

const client = new Bot({
    intents: [
        "Guilds"
    ]
});

client.init();