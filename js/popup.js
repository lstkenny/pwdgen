import { PwdGen } from './pwdgen.js'

function validateOptions(options, controls) {
	let error = false
	if (!options.secret) {
		controls.secret.classList.add("pwg_error")
		error = "Secret word cannot be empty"
	}
	if (isNaN(parseFloat(options.len)) || !isFinite(options.len)) {
		controls.len.classList.add("pwg_error")
		error = "Password length must be a number"
	} else if (options.len < 1 || options.len > 50) {
		controls.len.classList.add("pwg_error")
		error = "Password length must be a number between 1 and 50"
	}
	if (!options.digits && !options.lower && !options.upper && !options.symbols) {
		error = "Select at least one of symbols group (digits, letters, uppercase or symbols)"
	}
	if (error) {
		document.getElementById("pwg_msg").textContent = error
		document.getElementById("pwg_msg").style.display = "block"
		document.getElementById("pwg_res_pwd").value = ""
		return false
	}
	document.getElementById("pwg_msg").style.display = "none"
	return options
}
function getOptions() {
	const controls = {}
	const options = {}
	document.querySelectorAll("input").forEach(control => {
		if (!control.name) {
			return
		}
		switch (control.type) {
			case "checkbox":
				options[control.name] = control.checked
				break
			default:
				options[control.name] = control.value
		}
		control.classList.remove("pwg_error")
		controls[control.name] = control
	})
	return validateOptions(options, controls)
}
function updateOptions() {
	document.querySelectorAll("input").forEach(control => {
		if (!control.name) {
			return
		}
		switch (control.type) {
			case "checkbox":
				control.checked = Boolean(pwg.getData(control.name))
				break
			default:
				control.value = pwg.getData(control.name) || ""
		}
	})
}
function updateResult() {
	if (pwg.getData("subdomains")) {
		document.getElementById("pwg_res_domain").value = pwg.getData("host")
	} else {
		document.getElementById("pwg_res_domain").value = pwg.getData("domain")
	}
	document.getElementById("pwg_res_pwd").value = pwg.getData("password")
}
function autocomplete() {
	if (typeof chrome.tabs != "undefined" && pwg.getConfig("autocomplete")) {
		if (pwg.getData("url").match(/^http/i)) {
			chrome.tabs.query({active: true, currentWindow: true}, 
				tabs => chrome.tabs.sendMessage(tabs[0].id, {"sender": "pwg", "data": pwg.get("data")}))
		}
	}
}
function injectAutocomplete() {
	return new Promise((resolve, reject) => {
		if (typeof chrome.tabs == "undefined" || !pwg.getConfig("autocomplete")) {
			resolve()
		}
		chrome.tabs.executeScript(
			null, {
				file: "./js/content.js"
			}, () => resolve(chrome.runtime.lastError))
		})
}
function getUrl() {
	return new Promise((resolve, reject) => {
		if (typeof chrome.tabs != "undefined") {
			//	run as an extension
			chrome.tabs.query({
				"currentWindow": true,
				"active": true
			}, tab => {
				resolve(tab[0].url)
			})
		} else {
			resolve(document.URL)
		}
	})
}
function generatePassword(url) {
	if (url) {
		pwg.setUrl(url)
		updateOptions()
	}
	const options = getOptions()
	if (options) {
		pwg.generate(options)
		updateResult()
		autocomplete()
	}
}
let pwg
document.addEventListener("DOMContentLoaded", e => {
	pwg = new PwdGen()
	pwg.init()
		.then(() => injectAutocomplete())
		.then(() => getUrl())
		.then(url => {
			document.getElementById("theme").href = "css/" + pwg.getConfig("theme") + ".css"
			generatePassword(url)
		})
})
document.getElementById("pwg_more_options").addEventListener("click", e => {
	document.querySelectorAll('li[class="hidden"]').forEach(control => {
		control.style.display = "block"
		document.getElementById("pwg_more_options").style.display = "none"
	})
})
document.querySelectorAll("input").forEach(control => {
	if (control.name == "url") {
		control.addEventListener("change", () => generatePassword(control.value))
	} else {
		control.addEventListener("input", () => generatePassword())
	}
})
document.getElementById("pwg_res_pwd").addEventListener("click", e => {
	e.target.select()
	document.execCommand("copy")
})
document.getElementById("settings").addEventListener("click", e => {
	if (typeof chrome.tabs != "undefined") {
		chrome.tabs.create({"url": "./options.html" } )
	}
})