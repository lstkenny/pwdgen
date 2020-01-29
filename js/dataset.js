export { DataSet }

class DataSet {
	constructor(data = {}) {
		this.assign(data)
	}
	assign(data) {
		Object.assign(this, data)
	}
	isObject(data) {
		return typeof data === "object" && data !== null
	}
	find(obj, key) {
		let parts = key.replace(/\[(\w+)\]/g, ".$1").replace(/^\./, "").split(".")
		for (let i = 0; i < parts.length; i++) {
			if (!obj || !(parts[i] in obj)) {
				return null
			}
			obj = obj[parts[i]]
		}
		return obj
	}
	clone(key, deflt = false) {
		return JSON.parse(JSON.stringify(this.get(key, deflt)))
	}
	get(key, deflt = false) {
		if (arguments.length === 0 || !key) {
			return this
		} else {
			let result = this.find(this, key)
			if (result !== null) {
				return result
			}
			return deflt
		}
	}
	set(key, value = null, merge = false) {
		if (this.isObject(key)) {
			this.assign(key)
		} else if (typeof key === "string") {
			let keyParts = key.split(".")
			let keyLength = keyParts.length
			let schema = this
			for (let i = 0; i < keyLength - 1; i++) {
				let item = keyParts[i]
				if (!schema.hasOwnProperty(item)) {
					schema[item] = {}
				}
				schema = schema[item]
			}
			let lastKey = keyParts[keyLength - 1]
			if (!schema[lastKey] || !merge) {
				schema[lastKey] = value
			} else if (Array.isArray(schema[lastKey])) {
				schema[lastKey].push(value)
			} else {
				schema[lastKey] = [schema[lastKey], value]
			}
		}
	}
}