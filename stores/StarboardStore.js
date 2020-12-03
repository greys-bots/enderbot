const {Collection} = require("discord.js");

class StarboardStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async init() {
		this.bot.on('channelDelete', async (channel) => {
			await this.delete(channel.guild.id, channel.id);
		})

		this.bot.on('guildDelete', async (guild) => {
			await this.deleteAll(guild.id);
		})
	}

	async create(server, channel, emoji, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`INSERT INTO starboards (
					server_id,
					channel_id,
					emoji,
					override,
					tolerance,
					to_remove,
					blacklist,
					self_star
				) VALUES (?,?,?,?,?,?,?,?)`,
				[server, channel, emoji, data.override || false,
				 data.tolerance, data.to_remove, data.blacklist,data.self_star]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, channel));
		})
	}

	async index(server, channel, emoji, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`INSERT INTO starboards (
					server_id,
					channel_id,
					emoji,
					override,
					tolerance,
					to_remove,
					blacklist,
					self_star
				) VALUES (?,?,?,?,?,?,?,?)`,
				[server, channel, emoji, data.override || false,
				 data.tolerance, data.to_remove, data.blacklist,data.self_star]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, channel, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var starboard = super.get(`${server}-${channel}`);
				if(starboard) return res(starboard);
			}

			try {
				var data = await this.db.get(`
					SELECT starboards.*, (
						SELECT COUNT(*) FROM star_posts
						WHERE channel_id = starboards.channel_id
					) AS message_count FROM starboards WHERE server_id = ? AND channel_id = ?`,
					[server, channel], {
						id: String,
						server_id: String,
						channel_id: String,
						emoji: String,
						override: Boolean,
						tolerance: Number,
						to_remove: Number,
						blacklist: val => val ? JSON.parse(val) : [],
						self_star: Boolean,
						message_count: Number
					});
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data && data[0]) {
				this.set(`${server}-${channel}`, data[0])
				res(data[0])
			} else res(undefined);
		})
	}

	async getByEmoji(server, emoji) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.get(`
					SELECT starboards.*, (
						SELECT COUNT(*) FROM star_posts
						WHERE channel_id = starboards.channel_id
					) AS message_count FROM starboards WHERE server_id = ? AND emoji = ?`,
					[server, emoji], {
						id: String,
						server_id: String,
						channel_id: String,
						emoji: String,
						override: Boolean,
						tolerance: Number,
						to_remove: Number,
						blacklist: val => val ? JSON.parse(val) : [],
						self_star: Boolean,
						message_count: Number
					});
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data && data[0]) {
				res(data[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.get(`
					SELECT starboards.*, (
						SELECT COUNT(*) FROM star_posts
						WHERE channel_id = starboards.channel_id
					) AS message_count FROM starboards WHERE server_id = ?`,
					[server], {
						id: String,
						server_id: String,
						channel_id: String,
						emoji: String,
						override: Boolean,
						tolerance: Number,
						to_remove: Number,
						blacklist: val => val ? JSON.parse(val) : [],
						self_star: Boolean,
						message_count: Number
					});
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data && data[0]) {
				res(data)
			} else res(undefined);
		})
	}

	async update(server, channel, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`UPDATE starboards SET ${Object.keys(data).map((k, i) => k+"=?").join(",")} WHERE server_id = ? AND channel_id = ?`,[...Object.values(data), server, channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res(await this.get(server, channel, true));
		})
	}

	async delete(server, channel) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`DELETE FROM starboards WHERE server_id = ? AND channel_id = ?`, [server, channel]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${channel}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var starboards = await this.getAll(server);
				await this.db.get(`DELETE FROM starboards WHERE server_id = ?`, [server]);
			} catch(e) {
				console.log(e);
				return rej(e.message || e);
			}

			for(starboard of starboards) super.delete(`${server}-${starboard.channel_id}`);
			res();
		})
	}
}

module.exports = (bot, db) => new StarboardStore(bot, db);