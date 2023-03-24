import { ChannelType, EmbedBuilder, channelMention, codeBlock } from "discord.js";
import { Commands } from "../../Interfaces";
import db from "croxydb";

export const Command: Commands = {
    name: "iftar",
    description: "İftar komutları",
    options: [
        {
            type: 1,
            name: "kur",
            description: "Bir kanal girerek iftar bildirim sistemini sunucuya kurabilirsiniz.",
            options: [
                {
                    type: 7,
                    name: "kanal",
                    description: "Bir kanal ID'si giriniz.",
                    channel_types: [ChannelType.GuildText],
                    required: true
                },
                {
                    type: 3,
                    name: "şehir",
                    description: "Bir şehir giriniz.",
                    required: true
                }
            ]
        },
        {
            type: 1,
            name: "sorgu",
            description: "Bir şehir girerek iftarının ne zaman yapılacağını görebilirsiniz.",
            options: [
                {
                    type: 3,
                    name: "şehir",
                    description: "Bir şehir giriniz (81 şehir).",
                    required: true
                }
            ]
        }
    ],

    async execute(client, interaction) {
        let subCommand = interaction.options.data[0].name

        switch (subCommand) {
            case "kur": {
                    let channel = interaction.guild.channels.cache.get(interaction.options.get("kanal", true).channel.id)
                    let city = `${interaction.options.get("şehir").value}`.toLocaleLowerCase("tr-TR");

                    ((await fetch(`https://api.collectapi.com/pray/all?data.city=${city}`, {
                        headers: {
                            "authorization": `apikey ${client.config.ramazan["api_key"]}`,
                            "content-type": "application/json"
                        }
                    })).json()).then(() => {
                        if(channel && channel.isTextBased() && interaction.memberPermissions.has("ManageChannels")) {
                            interaction.reply({
                                embeds: [
                                    new EmbedBuilder()
                                    .setColor("Green")
                                    .setAuthor({ name: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}` })
                                    .setTitle("İşlem başarıyla kayıt edildi ✅")
                                    .setDescription(`> İftar bildirim kanalını başarıyla ${channelMention(channel.id)} kanalı olarak ayarladım.`)
                                    .setFooter({ text: `discord.gg/altyapilar`, iconURL: `${interaction.user.displayAvatarURL()}` })
                                    .setTimestamp()
                                ], 
                                fetchReply: true
                            });
    
                            db.set(`iftarKanal_${interaction.guild?.id}`, { channelId: channel.id, cityName: city });
                        }
                    }).catch(() => {
                        interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                .setColor("Red")
                                .setAuthor({ name: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}` })
                                .setTitle("Bir şeyler ters gitti ❌")
                                .setDescription(`> **${city}** adında bir şehir bulamadım..`)
                                .setFooter({ text: `discord.gg/altyapilar`, iconURL: `${interaction.user.displayAvatarURL()}` })
                                .setTimestamp()
                            ],
                            fetchReply: true
                        });
                        
                        return;
                    })
                break;
            }

            case "sorgu": {
                let city = `${interaction.options.get("şehir").value}`.toLocaleLowerCase("tr-TR");

                interface Ramazan {
                    success: boolean
                    result: {
                        saat: string
                        vakit: "İmsak" | "Güneş" | "Öğle" | "İkindi" | "Akşam" | "Yatsı"
                    }[]
                }

                ((await fetch(`https://api.collectapi.com/pray/all?data.city=${city}`, {
                    headers: {
                        "authorization": `apikey ${client.config.ramazan["api_key"]}`,
                        "content-type": "application/json"
                    }
                })).json()).then((iftarBilgi: Ramazan) => {
            
                    let iftarSehir = iftarBilgi["result"].filter((city) => city.vakit === "Akşam")[0];
                    let imsakSehir = iftarBilgi["result"].filter((city) => city.vakit === "İmsak")[0];
                    
                    function calculatePercentageElapsed(start: Date, end: Date): number {
                        const now = new Date();
                      
                        if (now < start) {
                          return 0;
                        } else if (now > end) {
                          return 100;
                        } else {
                          const totalTime = end.getTime() - start.getTime();
                          const elapsedTime = now.getTime() - start.getTime();
                          const percentageElapsed = (elapsedTime / totalTime) * 100;
                          return Number(percentageElapsed.toFixed(1))
                        }
                      }

                      function getRemainingTime(startTimeStr: Date, endTimeStr: Date): { result: string } {
                        const now = new Date();
                      
                        if (now < startTime) {

                            return {
                                result: "İftar açılmış 🎉"
                              }
                        } else if (now > endTime) {
                          
                            return {
                                result: "Sahur bekleniyor 👀"
                              }
                        } else {
                          const remainingTime = endTime.getTime() - now.getTime();
                          const hoursLeft = Math.floor(remainingTime / (1000 * 60 * 60));
                          const minutesLeft = Math.floor((remainingTime / (1000 * 60)) % 60);
                          
                          if(hoursLeft === 0) {
                            return {
                                result: `Orucunuzu açmanıza tam olarak ${minutesLeft} dakika kaldı.`
                            }
                          } if(minutesLeft === 0) {
                            return {
                                result: `Orucunuzu açmanıza tam olarak ${hoursLeft} saat kaldı.`
                            }
                          } else {
                            return {
                                result: `Orucunuzu açmanıza tam olarak ${hoursLeft} saat ${minutesLeft} dakika kaldı.`
                            }
                          } 
                        }
                      }

                    var startTime = new Date(`${new Date().toISOString().split("T")[0]}T${imsakSehir.saat}:00`)
                    var endTime = new Date(`${new Date().toISOString().split("T")[0]}T${iftarSehir.saat}:00`)

                    var percentage = calculatePercentageElapsed(startTime, endTime);
                    var duration = getRemainingTime(startTime, endTime);
                    
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

                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor("Blue")
                            .setAuthor({ name: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}` })
                            .setTitle(percentage === 100 ? "İftar açıldı 🎉" : percentage >= 90 ? "İftar açılıyor.." : percentage >= 50 ? "İftar yarılandı.." : percentage >= 20 ? "Daha yeni başladık.." : "İftar başladı..")
                            .setDescription(`> **${capitalizeFirstLetter(city)}** şehri için bilgiler;`)
                            .setFields([
                                {
                                    name: "Sahur;",
                                    value: `${codeBlock("yaml", imsakSehir.saat)}`,
                                    inline: true
                                },
                                {
                                    name: "İftar;",
                                    value: `${codeBlock("yaml", iftarSehir.saat)}`,
                                    inline: true
                                },
                                {
                                    name: "Kaç saat kaldı;",
                                    value: `${codeBlock("yaml", duration.result)}`,
                                    inline: false
                                }
                            ])
                            .setFooter({ text: `discord.gg/altyapilar - %${percentage} tamamlandı.`, iconURL: `${interaction.user.displayAvatarURL()}` })
                            .setTimestamp()
                        ],
                        fetchReply: true
                    });
                }).catch(() => {
                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor("Red")
                            .setAuthor({ name: `${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}` })
                            .setTitle("Bir şeyler ters gitti ❌")
                            .setDescription(`> **${city}** adında bir şehir bulamadım..`)
                            .setFooter({ text: `discord.gg/altyapilar`, iconURL: `${interaction.user.displayAvatarURL()}` })
                            .setTimestamp()
                        ],
                        fetchReply: true
                    });
                    
                    return;
                });
            }
        }
    },
}