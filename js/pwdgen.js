import { Storage } from "./storage.js"
import { Cookie } from "./cookie.js"
import { SRand } from "./srand.js"
import { DataSet } from "./dataset.js"
export { PwdGen }

class PwdGen extends DataSet {

	constructor(state) {
		super()
		this.storage = new Storage()
		this.cookie = new Cookie()
		this.srand = new SRand()
	}
	init() {
		return fetch('./config.json')
			.then(response => response.json())
			.then(defaultConfig => {
				this.set(defaultConfig)
				return this.storage.get("pwg")
			})
			.then(pwgState => {
				if (pwgState) {
					["config", "default", "domains"].forEach(key => {
						if (pwgState[key]) {
							this.set(key, pwgState[key])
						}
					})
				}
				return this.cookie.get("_pwg_secret")
			})
			.then(secret => {
				this.set("cookies.secret", secret)
				return Promise.resolve()
			})
	}
	saveState(options) {
		const pwg = {}
		pwg.config = this.clone("config", {})
		//	set current options
		for (let key in options) {
			this.set("data." + key, options[key])	
		}
		this.set("data.domain", this.extractRootDomain(this.get("data.url")))
		this.set("data.host", this.extractHostName(this.get("data.url")))
		//	save secret
		switch (this.get("config.rememberSecret")) {
			case "session" :
				this.cookie.set("_pwg_secret", this.get("data.secret"), this.get("config.sessionHours", 1))
				break
			case "remember" :
				pwg.config.secret = this.get("data.secret")
				break
			default :
				pwg.config.secret = false
		}
		//	save options
		if (this.get("config.rememberSettings")) {
			const data = {}
			const options = ["len", "digits", "lower", "upper", "symbols", "subdomains", "exclude", "similar"]
			options.forEach((value, key) => {
				if (!this.get("data." + value)) {
					data[value] = false
				} else {
					data[value] = this.data[value]
				}
			})
			pwg.default = data
			this.set('default', data)
			if (this.get("data.domain") && this.get("config.rememberSettings") == "domains") {
				pwg.domains = this.clone("domains", {})
				pwg.domains[this.get("data.domain").replace(/\./g, "_")] = data
				this.set('domains', pwg.domains)
			}
		}
		this.storage.set("pwg", pwg)
	}
	extractHostName(url) {
		//	remove www
		url = url.replace("www.", "")
		let hostname
		//	find & remove protocol (http, ftp, etc.) and get hostname
		if (url.indexOf("//") > -1) {
			hostname = url.split("/")[2]
		} else {
			hostname = url.split("/")[0]
		}
		//	find & remove port number
		hostname = hostname.split(":")[0]
		//	find & remove "?"
		hostname = hostname.split("?")[0]
		return hostname.toLowerCase()
	}
	extractRootDomain(url) {
		let domain = this.extractHostName(url)
		const domainParts = domain.split(".")
		const partsLength = domainParts.length
		//	extracting the root domain here if there is a subdomain 
		if (partsLength > 2) {
			domain = domainParts[partsLength - 2] + "." + domainParts[partsLength - 1]
			//	check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
			if (domainParts[partsLength - 2].length == 2 && domainParts[partsLength - 1].length == 2) {
				//	this is using a ccTLD
				domain = domainParts[partsLength - 3] + "." + domain
			}
		}
		return domain
	}
	setUrl(url) {
		const domain = this.extractRootDomain(url)
		const data = this.clone("domains." + domain.replace(/\./g, "_"), this.get("default"))
		this.set("data", data)
		this.set("data.url", url)
		this.set("data.domain", domain)
		let secret
		switch (this.get("config.rememberSecret")) {
			case "session" :
				secret = this.get("cookies.secret")
				break
			case "remember" :
				secret = this.get("config.secret")
				break
		}
		if (!secret) {
			secret = this.randomSeed(100000, 999999)
		}
		this.set("data.secret", secret)
	}
	randomSeed(min, max) {
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
	getData(key) {
		return this.get("data." + key)
	}
	getConfig(key) {
		return this.get("config." + key)
	}
	arrayExclude(arr, exclude) {
		let symbols = arr.join("")
		exclude.forEach(symbol => {
			symbols = symbols.replace(symbol, "")
		})
		return symbols.split("")
	}
	updatePassword() {
		this.srand.seed(this.getSeed())
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
		let scope = []
		for (let key in chars) {
			if (this.get("data." + key)) {
				chars[key] = this.arrayExclude(chars[key], exclude)
				chars[key] = this.srand.rndArrayShuffle(chars[key])
				if (chars[key].length) {
					scope.push(key)
				}
			}
		}
		let pwd = []
		for (let i = 0; i < this.get("data.len"); i++) {
			pwd.push(this.srand.rndArrayValue(chars[scope[(i + scope.length) % scope.length]]))
		}
		pwd = this.srand.rndArrayShuffle(pwd).join("")
		this.set("data.password", pwd)
		return pwd
	}
	generate(options) {
		this.saveState(options)
		return this.updatePassword()
	}
}