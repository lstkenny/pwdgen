import { Storage } from "./storage.js"

function updateControls(config) {
	document.querySelectorAll("input").forEach(control => {
		if (!control.name) {
			return
		}
		switch (control.type) {
			case "radio" :
			case "checkbox":
				control.checked = config[control.name] == control.value
				control.dispatchEvent(new Event("change", { bubbles: true }))
				break
			default:
				control.value = config[control.name] || ""
		}
	})
}
function validateConfig(config, controls) {
	let error = false
	if (isNaN(parseFloat(config.sessionHours)) || !isFinite(config.sessionHours)) {
		controls.sessionHours.classList.add("pwg_error")
		error = "Session length must be a number"
	} else if (config.sessionHours < 1 || config.sessionHours > 24) {
		controls.sessionHours.classList.add("pwg_error")
		error = "Password length must be a number between 1 and 24"
	}
	if (error) {
		document.getElementById("pwg_msg").textContent = error
		document.getElementById("pwg_msg").style.display = "block"
		return false
	}
	document.getElementById("pwg_msg").style.display = "none"
	if (!config.theme) {
		config.theme = "light"
	}
	config.autocomplete = Boolean(config.autocomplete)
	return config;
}
function getControlsData() {
	const config = {}
	const controls = {}
	document.querySelectorAll("input").forEach(control => {
		switch (control.type) {
			case "radio" :
			case "checkbox":
				if (control.checked) {
					config[control.name] = control.value
				}
				break
			default:
				config[control.name] = control.value
		}
		control.classList.remove("pwg_error")
		controls[control.name] = control
	})
	return validateConfig(config, controls)
}
function toggleSessionInput(control) {
	if (control.value == "session" && control.checked) {
		document.getElementById("sessionInput").classList.remove("hidden")
	} else {
		document.getElementById("sessionInput").classList.add("hidden")
	}
}

let storage, defaultConfig

document.addEventListener("DOMContentLoaded", e => {
	storage = new Storage("sync")
	fetch("./config.json")
		.then(response => response.json())
		.then(data => {
			defaultConfig = data
			return storage.get("pwg", defaultConfig)
		})
		.then(state => {
			updateControls(state.config)
			toggleSessionInput(document.querySelector("input[name='rememberSecret'][value='session']"))
		})
})
document.querySelectorAll("input[name='rememberSecret']").forEach(radio => 
	radio.addEventListener("change", e => toggleSessionInput(e.target)))
document.querySelector("input[name='theme']").addEventListener("change", e => {
	document.getElementById("theme").href = "css/" + (e.target.checked ? "night" : "light") + ".css";
})
document.querySelectorAll("input").forEach(control => {
	control.addEventListener("input", e => {
		storage.get("pwg", defaultConfig)
			.then(state => {
				const config = getControlsData()
				if (config) {
					state.config = Object.assign(state.config, config)
					storage.set("pwg", state)
				}
			})
	})
})
/*
document.getElementById("reset").addEventListener("click", e => {
	e.preventDefault()
	storage.clear()
		.then(() => {
			updateControls(defaultConfig.config)
		})
})
document.getElementById("close").addEventListener("click", e => {
	window.close()
})
*/