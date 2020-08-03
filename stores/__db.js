var fs = require('fs');
var {Pool} = require('pg');

module.exports = async (bot) => {
	const db = new Pool();

	await db.query(`
		CREATE TABLE IF NOT EXISTS configs (
	    	id 				SERIAL PRIMARY KEY,
	        server_id   	TEXT UNIQUE,
	        tolerance 		TEXT,
	        override 		BOOLEAN
	    );

		CREATE TABLE IF NOT EXISTS starboards (
			id 				SERIAL PRIMARY KEY,
			server_id 		TEXT,
			channel_id		TEXT UNIQUE,
			emoji			TEXT,
			override		BOOLEAN,
			tolerance		INTEGER,
			blacklist		JSONB
		);

		CREATE TABLE IF NOT EXISTS star_posts (
			id 				SERIAL PRIMARY KEY,
			server_id		TEXT,
			channel_id		TEXT REFERENCES starboards(channel_id) ON DELETE CASCADE,
			message_id 		TEXT,
			original_id 	TEXT,
			emoji 			TEXT
		);
	`);
	
	bot.stores = {};
	var files = fs.readdirSync(__dirname);
	for(var file of files) {
		if(["__db.js", "__migrations.js", "tmp.js"].includes(file)) continue;
		var tmpname = file.replace(/store\.js/i, "");
		var name =  tmpname[0].toLowerCase() + 
				   (tmpname.endsWith("y") ?
				   	tmpname.slice(1, tmpname.length-1) + "ies" : //ReactCategoryStore.js becomes reactCategories
				    tmpname.slice(1) + "s"); //ProfileStore.js becomes "profiles"

		bot.stores[name] = require(__dirname+'/'+file)(bot, db);
		if(bot.stores[name].init) bot.stores[name].init();
	}

	return db;
}