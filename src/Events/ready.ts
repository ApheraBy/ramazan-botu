import { EmbedBuilder, Guild, GuildTextBasedChannel } from "discord.js";
import { Events } from "../Interfaces";
import db from "croxydb";

export const Event: Events = {
    name: "ready",
    once: true,

    async execute(client) {
        console.success("I have successfully logged into Discord");

       function convertIsoToTimestamp(isoDate: string): number {
            return Date.parse(isoDate);
        }

        function capitalizeFirstLetter(sentence: string): string {
            const words = sentence.split(' ');
            const capitalizedWords = [];
          
            for (let i = 0; i < words.length; i++) {
              const word = words[i];
              const capitalizedWord = word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1).toLocaleLowerCase("tr-TR");
              capitalizedWords.push(capitalizedWord);
            }
          
            return capitalizedWords.join(' ');
          }  

        const iftarKontrol = async (guild: Guild) => {
            let iftarVeri: { channelId: string, cityName: string } = db.fetch(`iftarKanal_${guild?.id}`);

            if(iftarVeri) {
                let channel = guild.channels.cache.get(iftarVeri.channelId) as GuildTextBasedChannel;

                if(channel && channel.isTextBased()) {
                    const getRemainingTime = (endTimeStr: Date) => {
                        const now = new Date()
                        const lastDate = new Date(convertIsoToTimestamp(endTimeStr.toString()));

                        lastDate.setSeconds(lastDate.getSeconds() + client.config.ramazan["refreshTime"]);

                        if(now >= endTimeStr && now <= lastDate) {
                            channel.send({
                                content: `${client.config.ramazan["everyMention"] ? "@everyone" : "  "}`,
                                embeds: [
                                    new EmbedBuilder()
                                    .setColor("Blue")
                                    .setAuthor({ name: `${client.user.tag}`, iconURL: `${client.user.displayAvatarURL()}` })
                                    .setTitle("Allah-u ekber! (ezan sesi)")
                                    .setDescription(`> **${capitalizeFirstLetter(iftarVeri.cityName)}** şehri için ezan okunuyor..`)
                                    .setFooter({ text: `discord.gg/altyapilar - %100 tamamlandı.`, iconURL: `${client.user.displayAvatarURL()}` })
                                    .setTimestamp()
                                ],
                            })
                        }
                    }

                    interface Ramazan {
                        success: boolean
                        result: {
                            saat: string
                            vakit: "İmsak" | "Güneş" | "Öğle" | "İkindi" | "Akşam" | "Yatsı"
                        }[]
                    }

                    ((await fetch(`https://api.collectapi.com/pray/all?data.city=${iftarVeri.cityName}`, {
                        headers: {
                            "authorization": `apikey ${client.config.ramazan["api_key"]}`,
                            "content-type": "application/json"
                        }
                    })).json()).then((iftarBilgi: Ramazan) => {
            
                        let iftarSehir = iftarBilgi["result"].filter((city) => city.vakit === "Akşam")[0];
                        var endTime = new Date(`${new Date().toISOString().split("T")[0]}T${iftarSehir.saat}:00`)

                        getRemainingTime(endTime);
                    })
                }
            }
        }

        const algılayıcıKontrol = () => {
            client.guilds.cache.forEach((guild) => {
                iftarKontrol(guild);
            });
        }

        setInterval(() => algılayıcıKontrol(), client.config.ramazan["refreshTime"])
    },
}