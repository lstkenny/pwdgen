export { SRand }

class SRand {
	constructor() {
		this.seed(arguments[0] || Date.now())
		const mod1 = arguments[1] || 7247
		const mod2 = arguments[2] || 7823
		this.base = mod1 * mod2
	}
	seed(seed) {
		this.bias = this.crc32(seed)
	}
	makeCRCTable() {
		let c
		const crcTable = []
		for (let n = 0; n < 256; n++) {
			c = n
			for (let k = 0; k < 8; k++) {
				c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
			}
			crcTable[n] = c
		}
		return crcTable
	}
	crc32(str) {
		str = str.toString()
		const crcTable = window.crcTable || (window.crcTable = this.makeCRCTable())
		let crc = 0 ^ (-1)
		for (let i = 0; i < str.length; i++) {
			crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF]
		}
		return (crc ^ (-1)) >>> 0
	}
	rndFloat() {
		let min = 0
		let max = 1
		if (arguments[1]) {
			min = arguments[0]
			max = arguments[1]
		} else if (arguments[0]) {
			max = arguments[0]
		}
		this.bias = Math.pow(this.bias, 2) % this.base
		return this.bias / this.base * (max - min) + min
	}
	rndInteger(...args) {
		return Math.floor(this.rndFloat(...args))
	}
	rndArrayKey(arr) {
		return this.rndInteger(arr.length)
	}
	rndArrayValue(arr) {
		return arr[this.rndArrayKey(arr)]
	}
	rndArrayShuffle(arr) {
		let j, x
		for (let i = arr.length - 1; i > 0; i--) {
			j = this.rndArrayKey(arr)
			x = arr[i]
			arr[i] = arr[j]
			arr[j] = x
		}
		return arr
	}
}