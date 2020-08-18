module.exports = {
	help: ()=> "Add a user or role as a bot operator.",
	usage: ()=> [
		' - Views currently opped users/roles.',
		' [role/user] - Sets the given role/user as an operator.'
	],
	desc: ()=>
		"Bot operators can use all commands regardless of server permissions. "+
		"**This includes the op and deop commands.**\nUse this command wisely.\n" +
		"Also, roles can be the role name, role ID, or @role mention; users should be IDs or mentions.",
	execute: async (bot, msg, args) => {
		var config = await bot.stores.configs.get(msg.guild.id);
		if(!args[0]) {
			if(!config?.opped) return "No operators registered in this server.";
			console.log(config.opped);

			var roles = [];
			var users = [];
			for(var item of config.opped) {
				var role = msg.guild.roles.cache.find(r => r.id == item);
				var user = bot.users.cache.find(u => u.id == item);
				if(role) roles.push(role.toString());
				else if(user) users.push(user.toString());
			}

			return {embed: {
				title: "Operators",
				description: "People allowed to use the bot, regardless of permissions.",
				fields: [
					{name: "Roles", value: roles[0] ? roles.join("\n") : "(none)"},
					{name: "Users", value: users[0] ? users.join("\n") : "(none)"}
				]
			}}
		}

		var opped = [];
		if(config?.opped) opped = config.opped;
		var added = [];
		var invalid = [];

		for(var arg of args) {
			arg = arg.replace(/[<@!&>]/g, "");
			var role = msg.guild.roles.cache.find(r => [r.id, r.name.toLowerCase()].includes(arg.toLowerCase()));
			var user = bot.users.cache.find(u => u.id == arg);
			if((role || user) && !opped.includes(arg)) added.push(role || user);
			else invalid.push(arg);
		}

		opped = opped.concat(added.map(x => x.id));

		try {
			if(config) bot.stores.configs.update(msg.guild.id, {opped});
			else bot.stores.configs.create(msg.guild.id, {opped});
		} catch(e) {
			return "Error:\n"+e;
		}

		return {embed: {
			title: "Results",
			fields: [
				{name: "Added", value: added[0] ? added.map(x => x.toString()).join("\n") : "(none)"},
				{name: "Not added", value: invalid[0] ? invalid.join("\n") : "(none)"}
			]
		}}
	},
	alias: ['opped', 'ops'],
	permissions: ['MANAGE_GUILD'],
	guildOnly: true
}