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
function getControlsData() {
	const config = {}
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
	})
	if (!config.theme) {
		config.theme = "light"
	}
	config.autocomplete = Boolean(config.autocomplete)
	return config;
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
	storage = new Storage()
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
				state.config = Object.assign(state.config, getControlsData())
				storage.set("pwg", state)
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