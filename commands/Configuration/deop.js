module.exports = {
	help: ()=> "Remove operator status from roles/users.",
	usage: ()=> [
		' - Views and optionally clears current op list.',
		' [role/user] - Removes the given role/user from the op list.'
	],
	execute: async (bot, msg, args) => {
		var config = await bot.stores.configs.get(msg.guild.id);
		if(!config?.opped) return 'Nothing to de-op.';

		if(!args[0]) {
			var roles = [];
			var users = [];
			for(var item of config.opped) {
				var role = msg.guild.roles.cache.find(r => r.id == item);
				var user = bot.users.cache.find(u => u.id == item);
				if(role) roles.push(role.toString());
				else if(user) users.push(user.toString());
			}

			var message = await msg.channel.send({embed: {
				title: "Operators",
				description: "People allowed to use the bot, regardless of permissions.",
				fields: [
					{name: "Roles", value: roles[0] ? roles.join("\n") : "(none)"},
					{name: "Users", value: users[0] ? users.join("\n") : "(none)"}
				],
				footer: {
					text: 'React with ✅ below to clear all operators;' +
						  'react with ❌ to cancel.'
				}
			}});
			["✅","❌"].forEach(r => message.react(r));

			var confirm = await bot.utils.handleChoices(bot, message, msg.author, [
				{accepted: ['y', 'yes', '✅'], name: 'yes'},
				{accepted: ['n', 'no', '❌'], name: 'no', msg: 'Action cancelled.'}
			]);
			if(confirm.msg) return confirm.msg;

			try {
				await bot.stores.configs.update(msg.guild.id, {opped: null});
			} catch(e) {
				return 'Error:\n'+e
			}

			return 'All ops removed.';
		}

		var opped = config.opped;
		var removed = [];
		var invalid = [];

		for(var arg of args) {
			arg = arg.replace(/[<@!&>]/g, "");
			var role = msg.guild.roles.cache.find(r => [r.id, r.name.toLowerCase()].includes(arg.toLowerCase()));
			var user = bot.users.cache.find(u => u.id == arg);
			if((role || user) && opped.includes((role || user).id)) {
				opped = opped.filter(x => x != (role?.id || user?.id));
				removed.push(role || user);
			} else invalid.push(arg);
		}

		try {
			bot.stores.configs.update(msg.guild.id, {opped});
		} catch(e) {
			return "Error:\n"+e;
		}

		return {embed: {
			title: "Results",
			fields: [
				{name: "De-opped", value: removed[0] ? removed.map(x => x.toString()).join("\n") : "(none)"},
				{name: "Not de-opped", value: invalid[0] ? invalid.join("\n") : "(none)"}
			]
		}}
	},
	permissions: ['MANAGE_GUILD'],
	guildOnly: true
}