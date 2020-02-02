export { Storage }

class Storage {

	constructor() {
		this.isChromeStorage = (typeof chrome != "undefined" && chrome.storage)
	}
	get(key, deflt) {
		deflt = deflt || null
		return new Promise((resolve, reject) => {
			if (this.isChromeStorage) {
				chrome.storage.sync.get([key], result => {
					resolve(result[key] || deflt)
				})
			} else {
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
			if (this.isChromeStorage) {
				const data = {}
				data[key] = value
				chrome.storage.sync.set(data, () => {
					resolve(value)
				})
			} else {
				window.localStorage.setItem(key, JSON.stringify(value))
				resolve(value)
			}
		})
	}
	clear() {
		return new Promise((resolve, reject) => {
			if (this.isChromeStorage) {
				chrome.storage.sync.clear(() => {
					resolve()
				})
			} else {
				window.localStorage.clear()
			}
		})
	}
}