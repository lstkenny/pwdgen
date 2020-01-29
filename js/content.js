var _pwg_fields = document.querySelectorAll('[type="password"]')
if (_pwg_fields) {
	_pwg_fields.forEach(input => {
		input.setAttribute("value", _pwg_data.password)
		input.value = _pwg_data.password
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
}