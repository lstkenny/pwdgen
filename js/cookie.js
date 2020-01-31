export { Cookie }

class Cookie {
	constructor() {
		this.url = "http://pwdgenextension"
		this.isChromeCookie = (typeof chrome.cookies != "undefined")
	}
	buildCookieHeader(cookie) {
		let header = cookie.name + "=" + (cookie.value || "");
		if (cookie.expirationDate) {
			const date = new Date()
			date.setTime(cookie.expirationDate)
			header += "; expires=" + date.toUTCString()
		}
		header += "; path=/"
		return header
	}
	parseCookieHeader(name) {
		const nameEQ = name + "="
		const ca = document.cookie.split(";")
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i]
			while (c.charAt(0) == " ") {
				c = c.substring(1, c.length)
			}
			if (c.indexOf(nameEQ) == 0) {
				return c.substring(nameEQ.length, c.length)
			}
		}
		return null
	}
	set(name, value, hours) {
		const cookie = {
			"url": this.url, 
			"name": name,
			"value": value,
			"path": "/"
		}
		if (hours) {
			cookie.expirationDate = Date.now() + hours * 60 * 60 * 1000
		}
		return new Promise((resolve, reject) => {
			if (this.isChromeCookie) {
				chrome.cookies.set(cookie, cookie => resolve(cookie))
			} else {
				document.cookie = this.buildCookieHeader(cookie)
				resolve(cookie)
			}
		})
	}
	get(name) {
		const cookie = {
			"url": this.url, 
			"name": name
		}
		return new Promise((resolve, reject) => {
			if (this.isChromeCookie) {
				chrome.cookies.get(cookie, cookie => {
					if (!cookie) {
						resolve(null)
					} else {
						resolve(cookie.value)
					}
				})
			} else {
				resolve(this.parseCookieHeader(name))
			}
		})
	}
	delete(name) {
		const cookie = {
			"url": this.url, 
			"name": name
		}
		return new Promise((resolve, reject) => {
			if (this.isChromeCookie) {
				chrome.cookies.remove(cookie, cookie => resolve(cookie))
			} else {
				document.cookie = name + "=; Max-Age=-99999999;"
				resolve(cookie)
			}
		})
	}
}