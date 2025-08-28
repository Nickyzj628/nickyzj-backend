import { DatabaseSync } from "node:sqlite";
import { ROOT_PATH } from "./constants.js";

class Sqlite {
	constructor(dbPath) {
		this.db = new DatabaseSync(dbPath)
	}

	get(sql, ...values) {
		try {
			const query = this.db.prepare(sql)
			return query.get(...values)
		} catch (err) {
			console.log(`${err.message} (${sql})`)
		}
	}

	all(sql, ...values) {
		try {
			const query = this.db.prepare(sql)
			return query.all(...values)
		} catch (err) {
			console.log(`${err.message} (${sql})`)
		}
	}

	run(sql, ...values) {
		try {
			const execute = this.db.prepare(sql)
			return execute.run(...values)
		} catch (err) {
			console.log(`${err.message} (${sql})`)
		}
	}

	close() {
		this.db.close()
	}
}

const db = new Sqlite(`${ROOT_PATH}/v1.db`);

export default db;
