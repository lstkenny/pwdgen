export { Session }
import { Storage } from "./storage.js"

class Session {

	constructor() {
		this.storage = new Storage("local")
	}
	getExpirationTime(hours) {
		return Date.now() + hours * 60 * 60 * 1000
	}
	set(name, value, hours) {
		return this.storage.set(name, {
			"expires": this.getExpirationTime(hours),
			"value": value
		})
	}
	get(name) {
		return new Promise((resolve, reject) => {
			this.storage.get(name)
				.then(data => {
					if (!data || !data.expires) {
						resolve(null)
					} else if (data.expires < Date.now()) {
						this.remove(name)
							.then(() => {
								resolve(null)
							})
					} else {
						resolve(data.value)
					}
				})
		})
	}
	remove(name) {
		return this.storage.remove(name)
	}
}