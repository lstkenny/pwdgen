export { Storage }

class Storage {

	constructor(type) {
		if (["sync", "local", "default"].indexOf(type) < 0) {
			type = "default"
		}
		if (typeof chrome == "undefined" || !chrome.storage) {
			type = "default"
		}
		this.type = type
	}
	get(key, deflt) {
		deflt = deflt || null
		return new Promise((resolve, reject) => {
			switch (this.type) {
				case "sync":
				case "local":
					chrome.storage[this.type].get([key], result => {
						resolve(result[key] || deflt)
					})
					break
				default: 
					let data = window.localStorage.getItem(key)
					if (data === null) {
						data = deflt
					} else {
						try {
							data = JSON.parse(data)
						} catch (e) {
							data = deflt
						}
					}
					resolve(data)
			}
		}) 
	}
	set(key, value) {
		return new Promise((resolve, reject) => {
			switch (this.type) {
				case "sync":
				case "local":
					const data = {}
					data[key] = value
					chrome.storage[this.type].set(data, () => {
						resolve(value)
					})
					break
				default: 
					window.localStorage.setItem(key, JSON.stringify(value))
					resolve(value)
			}
		})
	}
	remove(key) {
		return new Promise((resolve, reject) => {
			switch (this.type) {
				case "sync":
				case "local":
					chrome.storage[this.type].remove(key, () => {
						resolve(key)
					})
					break
				default: 
					window.localStorage.removeItem(key)
					resolve(key)
			}
		})
	}
	clear() {
		return new Promise((resolve, reject) => {
			switch (this.type) {
				case "sync":
				case "local":
					chrome.storage[this.type].clear(() => {
						resolve()
					})
					break
				default: 
					window.localStorage.clear()
			}
		})
	}
}