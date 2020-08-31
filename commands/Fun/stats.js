module.exports = {
	help: ()=> "View users' stats in the bot.",
	usage: ()=> [
		' - Views top server stats.',
		' <board> <user> - Filters server stats based on a board or user. One or both can be supplied.',
		' global - Views top global stats.',
		' global <user> - Views top global stats for one user.'
	],
	desc: ()=> "Stars added: How many stars a user has added to posts.\n" +
			   "Posts created: How many posts made by the user have made it to the starboard.",
	execute: async (bot, msg, args) => {
		switch(args[0]?.toLowerCase()) {
			case undefined:
				var stats = await bot.stores.stats.get(msg.guild.id, {count: 10});
				if(!stats?.[0]) return 'No records found.';

				var embeds = [];
				var users = [];
				var channels = [];
				for(var stat of stats) {
					var user = users.find(u => u.id == stat.user_id);
					if(!user) {
						user = await bot.users.fetch(stat.user_id);
						users.push(user);
					}

					var channel = channels.find(c => c.id == stat.starboard);
					if(!channel) {
						channel = await bot.channels.fetch(stat.starboard);
						channels.push(channel);
					}
					embeds.push({embed: {
						title: 'Stats',
						fields: [
							{name: 'User', value: `${user} (${user.id})` || "(user not found)"},
							{name: 'Channel', value: `${channel || "(channel not found)"}`},
							{name: 'Stars added', value: stat.stars_added || 0},
							{name: 'Posts created', value: stat.posts_made || 0}
						],
						footer: {text: `See \`${bot.prefix}h stats\` for more info.`}
					}})
				}

				if(embeds.length > 1) {
					embeds = embeds.map((e,i) => {
						e.embed.title += ` (page ${i+1}/${embeds.length})`;
						return e
					});
				}

				return embeds;
				break;
			case 'global':
				var user;
				if(args[1]) {
					user = await bot.users.fetch(args[1]?.replace(/[<@!>]/g, ''));
					if(!user) return 'User not found.';
				}
				var stats = await bot.stores.stats.getGlobal({user});
				if(!stats?.[0]) return 'No records found.';
				
				var embeds = [];
				var users = [];
				for(var stat of stats) {
					var user = users.find(u => u.id == stat.user_id);
					if(!user) {
						user = await bot.users.fetch(stat.user_id);
						users.push(user);
					}

					embeds.push({embed: {
						title: 'Stats',
						fields: [
							{name: 'User', value: `${user} (${user.id})`},
							{name: 'Stars added', value: stat.stars_added || 0},
							{name: 'Posts created', value: stat.posts_made || 0}
						],
						footer: {text: `See \`${bot.prefix}h stats\` for more info.`}
					}})
				}

				if(embeds.length > 1) {
					embeds = embeds.map((e,i) => {
						e.embed.title += ` (page ${i+1}/${embeds.length})`;
						return e
					});
				}
				
				return embeds;
				break;
			default:
				var board;
				var user;
				for(var i = 0; i < 2; i++) {
					var chan = msg.guild.channels.cache.find(ch => [ch.name, ch.id].includes(args[i]?.replace(/[<#>]/g,"")));
					if(chan) board = await bot.stores.starboards.get(msg.guild.id, chan.id);
					else {
						var u = msg.guild.members.cache.find(m => m.id == args[i]?.replace(/[<@!>]/g, ''));
						if(u) user = u;
					}
				}

				if(!board && !user) return 'Filters invalid. Please provide a valid channel or user to filter stats from.';
				var stats = await bot.stores.stats.get(msg.guild.id, {user: user?.id, board: board?.channel_id});
				if(!stats?.[0]) return 'No records found.';

				var embeds = [];
				var users = [];
				var channels = [];
				for(var stat of stats) {
					var user = users.find(u => u.id == stat.user_id);
					if(!user) {
						user = await bot.users.fetch(stat.user_id);
						users.push(user);
					}

					var channel = channels.find(c => c.id == stat.starboard);
					if(!channel) {
						channel = await bot.channels.fetch(stat.starboard);
						channels.push(channel);
					}
					embeds.push({embed: {
						title: 'Stats',
						fields: [
							{name: 'User', value: `${user} (${user.id})`},
							{name: 'Channel', value: `${channel}`},
							{name: 'Stars added', value: stat.stars_added || 0},
							{name: 'Posts created', value: stat.posts_made || 0}
						],
						footer: {text: `See \`${bot.prefix}h stats\` for more info.`}
					}})
				}

				if(embeds.length > 1) {
					embeds = embeds.map((e,i) => {
						e.embed.title += ` (page ${i+1}/${embeds.length})`;
						return e
					});
				}
				
				return embeds;
				break;
		}
	}
}