module.exports = {
	help: ()=> "Set the tolerance for boards (or globally).",
	usage: ()=> [" - Reset global tolerance.",
				 " [number] - Set global tolerance.",
				 " [channel] - Reset specific tolerance.",
				 " [channel] [number] - Set specific tolerance."],
	execute: async (bot, msg, args) => {
		var config = await bot.stores.configs.get(msg.guild.id);
		switch(args.length) {
			case 0:
				if(!config || !config.tolerance) return "No global tolerance registered for this server";
				else {
					var messsage = await msg.channel.createMessage(`Current global tolerance: ${config.tolerance}\nWould you like to reset it?`);
					if(!bot.menus) bot.menus = {};
					bot.menus[message.id] = {
						user: msg.author.id,
						timeout: setTimeout(()=> {
							if(!bot.menus[message.id]) return;
							try {
								message.removeReactions();
							} catch(e) {
								console.log(e);
							}
							delete bot.menus[message.id];
						}, 900000),
						execute: async (bot, m, emoji) => {
							switch(emoji.name) {
								case "✅":
									await bot.stores.configs.update(msg.guild.id, {tolerance: null});
									msg.channel.createMessage("Global tolerance reset!");
									break;
								case "❌":
									msg.channel.createMessage("Action cancelled");
									break;
							}
						}
					}

					return;
				}
				break;
			case 1:
				var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
				if(!chan) { //assume this is setting the global tolerance
					if(isNaN(parseInt(args[0])) || args[0].match(/\d{17,}/)) //Might've mistyped the channel
						return "Channel not found or is invalid";
					else {
						try {
							await bot.stores.configs.update(msg.guild.id, {tolerance: parseInt(args[0])});
						} catch(e) {
							return "ERR: "+e;
						}

						return "Global tolerance set!";
					}
				} else {
					var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
					if(!board) return "No board found for that channel.";

					try {
						await bot.stores.starboards.update(msg.guild.id, chan.id, {tolerance: null});
					} catch(e) {
						return "ERR: "+e;
					}

					return "Board tolerance reset.";
				}
				break;
			default:
				var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
				if(!chan) return "Channel not found.";

				var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
				if(!board) "No board found for that channel.";
				else {
					try {
						await bot.stores.starboards.update(msg.guild.id, chan.id, {tolerance: parseInt(args[1])});
					} catch(e) {
						return "ERR: "+e;
					}

					return "Board tolerance set.";
				}
				break;
		}
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["t","tol"]
}