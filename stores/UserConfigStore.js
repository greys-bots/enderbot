const {Collection} = require('discord.js');

class UserConfigStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO user_configs (
					user_id,
					status
				) VALUES ($1, $2)`,
				[user, data.status]);
			} catch(e) {
				console.log(e)
				return rej(e.message);
			}

			res(await this.get(user));
		})
	}

	async index(user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO user_configs (
					user_id,
					status
				) VALUES ($1, $2)`,
				[user, data.status]);
			} catch(e) {
				console.log(e)
				return rej(e.message);
			}

			res();
		})
	}

	async get(user, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var config = super.get(user);
				if(config) return res(config);
			}

			try {
				var data = await this.db.query(`SELECT * FROM user_configs WHERE user_id = $1`, [user]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			if(data?.rows[0]) {
				super.set(user, data.rows[0])
				res(data.rows[0])
			} else return res(undefined);
		})
	}

	async update(user, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`UPDATE user_configs SET ${Object.keys(data).map((k, i) => k+"=$"+(i+2)).join(",")} WHERE user_id = $1`,[user, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res(await this.get(user, true));
		})
	}

	async delete(user) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM user_configs WHERE user_id = $1`, [user]);
				super.delete(user);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			res();
		})
	}
}

module.exports = (bot, db) => new UserConfigStore(bot, db);