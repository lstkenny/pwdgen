import { DataSet } from "./dataset.js"
import { Storage } from "./storage.js"
import { Session } from "./session.js"
import { SRand } from "./srand.js"
export { PwdGen }

class PwdGen extends DataSet {

	constructor(state) {
		super()
		this.storage = new Storage("sync")
		this.session = new Session()
		this.srand = new SRand()
	}
	init() {
		return fetch("./config.json")
			.then(response => response.json())
			.then(defaultConfig => {
				this.set(defaultConfig)
				return this.storage.get("pwg")
			})
			.then(pwg => {
				if (pwg) {
					["config", "default", "domains"].forEach(key => {
						if (pwg[key]) {
							this.set(key, pwg[key])
						}
					})
				}
				return this.session.get("_pwg_secret")
			})
			.then(secret => {
				this.set("session_secret", secret)
				return Promise.resolve()
			})
	}
	getData(key) {
		return this.get("data." + key)
	}
	getConfig(key) {
		return this.get("config." + key)
	}
	getHostName(href) {
		const url = new URL(href)
		return url.hostname.toLowerCase()
	}
	getRootDomain(domain) {
		let domainParts = domain.split(".")
		const partsLength = domainParts.length
		let partsCount = 2
		if (partsLength > 1) {
			const sld = [
				"ac","co","com","org","net",
				"biz","info","pro","int","coop",
				"jobs","mobi","travel","museum",
				"aero","tel","name","charity",
				"mil","edu","gov"]
			if (sld.indexOf(domainParts[partsLength - 2]) > -1) {
				partsCount = 3
			}
		}
		return domainParts.slice(Math.max(partsLength - partsCount, 0)).join(".")
	}
	excludeChars(arr, exclude) {
		let symbols = arr.join("")
		exclude.forEach(symbol => {
			symbols = symbols.replace(symbol, "")
		})
		return symbols.split("")
	}
	getRandomSeed(min, max) {
		return Math.floor(Math.random() * (max - min)) + min
	}
	getSeed() {
		const parts = []
		if (this.get("data.secret")) {
			parts.push(this.get("data.secret"))
		}
		if (this.get("data.subdomains")) {
			parts.push(this.get("data.host").toLowerCase())
		} else {
			parts.push(this.get("data.domain").toLowerCase())
		}
		return parts.join(".")
	}
	getChars() {
		const chars = {
			"digits": "0123456789".split(""),
			"lower": "abcdefghijklmnopqrstuvwxyz".split(""),
			"upper": "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
			"symbols": "!@#$%^&*/-+=()<>[]{}_\\|.,:;'\"`~".split("")
		}
		let exclude = this.get("data.exclude")
		if (this.get("data.similar")) {
			exclude += "1iIlL0oO"
		}
		exclude = exclude.split("")
		for (let key in chars) {
			if (this.get("data." + key)) {
				chars[key] = this.excludeChars(chars[key], exclude)
				if (chars[key].length) {
					chars[key] = this.srand.rndArrayShuffle(chars[key])
				} else {
					delete chars[key]
				}
			} else {
				delete chars[key]
			}
		}
		return chars	
	}
	saveSecret() {
		switch (this.get("config.rememberSecret")) {
			case "session" :
				this.session.set("_pwg_secret", this.get("data.secret"), this.get("config.sessionHours", 1))
				break
			case "remember" :
				this.set("config.secret", this.get("data.secret"))
				break
			default :
				this.set("config.secret", null)
		}
	}
	escapeDomain(domain) {
		return domain.replace(/\./g, "_")
	}
	getDomainOptions(domain) {
		domain = this.escapeDomain(domain)
		return this.clone("domains." + domain, this.get("default"))
	}
	saveDomainOptions(domain, data) {
		if (domain && this.get("config.rememberSettings") == "domains") {
			domain = this.escapeDomain(domain)
			this.set("domains." + domain, data)
		}
	}
	saveOptions() {
		if (this.get("config.rememberSettings")) {
			const data = {}
			const options = ["len", "digits", "lower", "upper", "symbols", "subdomains", "exclude", "similar"]
			options.forEach((value, key) => {
				let optionValue = this.get("data." + value)
				if (!optionValue) {
					data[value] = false
				} else {
					data[value] = optionValue
				}
			})
			this.set("default", data)
			this.saveDomainOptions(this.get("data.domain"), data)
		}
	}
	saveState() {
		this.saveSecret()
		this.saveOptions()
		let pwg = {
			"config": this.clone("config"),
			"default": this.clone("default"),
			"domains": this.clone("domains")
		}
		this.storage.set("pwg", pwg)
	}
	setOptions(options) {
		for (let key in options) {
			this.set("data." + key, options[key])
		}
		if (!this.get("data.secret")) {
			let secret
			switch (this.get("config.rememberSecret")) {
				case "session" :
					secret = this.get("session_secret")
					break
				case "remember" :
					secret = this.get("config.secret")
					break
			}
			if (!secret) {
				secret = this.getRandomSeed(100000, 999999)
			}
			this.set("data.secret", secret)
		}
	}
	setUrl(url) {
		const host = this.getHostName(url)
		const domain = this.getRootDomain(host)
		const options = this.getDomainOptions(domain)
		options.url = url
		options.domain = domain
		options.host = host
		this.setOptions(options)
	}
	updatePassword() {
		this.srand.seed(this.getSeed())
		const chars = this.getChars()
		const scope = Object.keys(chars)
		let pwd = []
		for (let i = 0; i < this.get("data.len"); i++) {
			pwd.push(this.srand.rndArrayValue(chars[scope[(i + scope.length) % scope.length]]))
		}
		pwd = this.srand.rndArrayShuffle(pwd).join("")
		this.set("data.password", pwd)
		return pwd
	}
	generate(options) {
		this.setOptions(options)
		this.saveState(options)
		return this.updatePassword()
	}
}