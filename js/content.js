if (typeof chrome !== 'undefined' && chrome.runtime) {
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.sender == "pwg") {
			let pwdfields = document.querySelectorAll('[type="password"]')
			if (pwdfields) {
				pwdfields.forEach(input => {
					input.setAttribute("value", request.data.password)
					input.value = request.data.password
					const events = ["change", "input"]
					events.forEach(eventName => {
						if (typeof Event === "function") {
							const event = new Event(eventName, { bubbles: true })
							event.simulated = true
							input.dispatchEvent(event)
						} else if ("createEvent" in document) {
							const event = document.createEvent("HTMLEvents")
							event.initEvent(eventName, false, true)
							event.simulated = true
							input.dispatchEvent(event)
						} else {
							input.fireEvent("on" + eventName)
						}
					})
				})
				sendResponse({"autocompleted": pwdfields.length})
			}
		}
	})
}