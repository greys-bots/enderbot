module.exports = {
	help: ()=> "See the top posts globally or on a specific starboard.",
	usage: ()=> [
		' <count> - Views global top posts.',
		' [board] <count> - Views top posts in a starboard.'
	],
	execute: async (bot, msg, args) => {
		var starboard;
		var count = 10;
		if(args[0]) {
			console.log(args[0]);
			console.log(typeof args[0]);
			var chan = msg.guild.channels.cache.find(ch => [ch.id, ch.name].includes(args[0].replace(/[<#>]/g, "").toLowerCase()));
			if(chan) {
				var starboard = await bot.stores.starboards.get(msg.guild.id, chan.id);
				if(!starboard) return 'Starboard not found.';
			} else {
				count = parseInt(args[0]);
				if(isNaN(count)) return 'Channel not found.';
			}
		}

		if(args[1]) count = parseInt(args[1]);
		if(isNaN(count)) return 'Please provide a valid number.';
		if(count <= 0) return 'Amount to get must be greater than zero.';

		var top = await bot.stores.starPosts.getTop(msg.guild.id, {board: starboard?.channel_id, count});
		if(!top?.[0]) return 'No posts found.';

		var posts = [];
		var i = 0;
		for(var p of top) {
			var emote = p.emoji.includes(":") ? `<${p.emoji}>` : `${p.emoji}`;
			var channel = await bot.channels.fetch(p.channel_id);
			var message = await channel?.messages.fetch(p.message_id);
			var snippet;
			if(message && message.embeds?.[0]?.description) snippet = message.embeds[0].description.slice(0, 512);
			if(snippet && message.embeds[0].description.length > 512) snippet += "...";
			posts.push({
				name: `Number ${i+1}: ${emote} ${p.star_count}`,
				value: `**Message Snippet:** ${snippet || "(couldn't get message)"}\n` +
					   `**Message Link:** [click](https://discordapp.com/channels/${msg.channel.guild.id}/${p.channel_id}/${p.original_id})`
			})
			i++;
		}

		if(posts.length > 10) {
			var embeds = [];
			for(var i = 0; i < Math.ceil(posts.length / 10); i ++) {
				embeds.push({embed: {
					title: `Top Posts (page ${i+1}/${Math.ceil(posts.length / 10)})`,
					fields: posts.slice(i*10, i * 10 + 10)
				}})
			}

			return embeds;
		}

		return {embed: {
			title: 'Top Posts',
			fields: posts
		}}
	}
}