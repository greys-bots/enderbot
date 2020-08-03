module.exports = {
	help: ()=> "Remove a channel from the server's starboard config.",
	usage: ()=> [" [chanName | chanID | #channel]- Removes the channel's pin config."],
	execute: async (bot, msg, args)=> {
		if(!args[0]) return "Please provide a channel to remove the configs from";

		var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[0].replace(/[<#>]/g,"")));
		if(!chan) return "Channel not found.";
		var board = await bot.stores.starboards.get(msg.guild.id, chan.id);
		if(!board) return "Board not found.";

		try {
			await bot.stores.starboards.delete(msg.guild.id, chan.id);
		} catch(e) {
			return "ERR: "+e;
		}

		return "Starboard deleted.";
	},
	permissions: ["manageGuild"],
	guildOnly: true,
	alias: ["r","rmv","del","delete","-"]
}