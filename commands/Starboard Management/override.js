module.exports = {
	help: ()=> "Set moderator override for adding items to the starboard.",
	usage: ()=> [" [channel] [(true|1)|(false|0] - Sets the override."],
	execute: async (bot, msg, args) => {
		if(!args[1]) return "Please provide a board and a value.";
		
		var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"").toLowerCase()));
		if(!chan) return "Channel not found.";
		var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
		if(!board) return "No board found for that channel.";

		var val;
		switch(args[1]) {
			case "true":
			case "1":
			case "enable":
				val = true;
				break;
			case "false":
			case "0":
			case "disable":
				val = false;
				break;
		}

		try {
			await bot.stores.starboards.update(msg.guild.id, chan.id, {override: val});
		} catch(e) {
			return "ERR: "+e;
		}

		return "Override set.";
	},
	permissions: ["manageGuild"],
	alias: ['m', 'mod', 'o', 'or'],
	guildOnly: true
}