const {Collection} = require('discord.js');

class ConfigStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`INSERT INTO configs (
					server_id,
					tolerance,
					to_remove,
					override,
					opped,
					self_star
				) VALUES (?, ?, ?, ?, ?, ?)`,
				[server, data.tolerance, data.to_remove,
				 data.override, data.opped, data.self_star || true]);
			} catch(e) {
				console.log(e)
				return rej(e.message);
			}

			res(await this.get(server));
		})
	}

	async index(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`INSERT INTO configs (
					server_id,
					tolerance,
					to_remove,
					override,
					opped,
					self_star
				) VALUES (?, ?, ?, ?, ?, ?)`,
				[server, data.tolerance, data.to_remove,
				 data.override, data.opped, data.self_star || true]);
			} catch(e) {
				console.log(e)
				return rej(e.message);
			}

			res();
		})
	}

	async get(server, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var config = super.get(server);
				if(config) return res(config);
			}

			try {
				var data = await this.db.get(`SELECT * FROM configs WHERE server_id = ?`, [server], {
					id: Number,
					server_id: String,
					tolerance: Number,
					to_remove: Number,
					override: Boolean,
					opped: val => val ? JSON.parse(val) : [],
					self_star: Boolean
				});
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data?.[0]) {
				super.set(server, data[0])
				res(data[0])
			} else return res(undefined);
		})
	}

	async update(server, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`UPDATE configs SET ${Object.keys(data).map((k, i) => k+"=?").join(",")} WHERE server_id = ?`,[...Object.values(data), server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(server, true));
		})
	}

	async delete(server) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.get(`DELETE FROM configs WHERE server_id = ?`, [server]);
				super.delete(server);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res();
		})
	}
}

module.exports = (bot, db) => new ConfigStore(bot, db);