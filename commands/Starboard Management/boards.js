module.exports = {
	help: ()=> "List registered starboards, or view a specific board.",
	usage: ()=> [
		" - Lists starboards.",
		" [channel] - Views a specific starboard."
	],
	execute: async (bot, msg, args)=> {
		var config = await bot.stores.configs.get(msg.guild.id);
		if(args[0]) {
			var channel = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
			var board;
			if(channel) board = await bot.stores.starboards.get(msg.guild.id, channel.id);
			else board = await bot.stores.starboards.getByEmoji(msg.guild.id, args[0].replace(/[<>]/g,""));
			if(!board) return "Board not found.";

			if(!channel) channel = msg.guild.channels.cache.find(ch => ch.id == board.channel_id);
			if(!channel) {
				try {
					await bot.stores.starboards.delete(msg.guild.id, board.channel_id);
				} catch(e) {
					console.log(e);
					return "Error while trying to delete invalid starboard:\n"+e;
				}

				return "That starboard is not valid and has been deleted.";
			}

			return {embed: {
				title: channel.name,
				fields: [
					{name: "Emoji", value: board.emoji.includes(":") ? `<${board.emoji}>` : board.emoji},
					{name: "Tolerance", value: board.tolerance ? board.tolerance : (config?.tolerance || 2)},
					{name: "Moderator Override", value: board.override ? "Enabled." : "Disabled."},
					{name: "Message Count", value: board.message_count}
				],
				color: parseInt("aa55aa", 16)
			}};
		}

		var boards = await bot.stores.starboards.getAll(msg.guild.id);
		if(!boards || !boards[0]) return "No starboards registered for this server.";
		
		var embeds = []
		var remove = [];

		for(var i = 0; i < boards.length; i++) {
			var channel = msg.guild.channels.cache.find(ch => ch.id == boards[i].channel_id);
			if(channel) {
				embeds.push({embed: {
					title: `${channel.name} (${i+1}/${boards.length})`,
					fields: [
						{name: "Emoji", value: boards[i].emoji.includes(":") ? `<${boards[i].emoji}>` : boards[i].emoji},
						{name: "Tolerance", value: boards[i].tolerance ? boards[i].tolerance : (config?.tolerance || 2)},
						{name: "Moderator Override", value: boards[i].override ? "Yes" : "No"},
						{name: "Message Count", value: boards[i].message_count}
					],
					color: parseInt("aa55aa", 16)
				}})
			} else remove.push({id: boards[i].channel_id});
		}

		if(remove[0]) {
			var err;
			for(var i = 0; i < remove.length; i++) {
				try {
					await bot.stores.starboards.delete(msg.guild.id, remove[i].id);
				} catch(e) {
					err = true;
				}
			}

			if(err) msg.channel.createMessage("Some invalid boards couldn't be removed from the database.");
			else msg.channel.createMessage("Invalid starboards have been deleted.");
		}

		if(embeds[0]) return embeds;
		else return "No valid starboards exist.";
	},
	permissions: ["MANAGE_CHANNELS"],
	guildOnly: true,
	alias: ["b", "board", "sb", "starboard", "starboards"]
}
