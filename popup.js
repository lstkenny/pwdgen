const makeCRCTable = function()
{
	let c;
	let crcTable = [];
	for (let n = 0; n < 256; n++)
	{
		c = n;
		for (let k = 0; k < 8; k++)
		{
			c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
		}
		crcTable[n] = c;
	}
	return crcTable;
};

const isNumeric = function (n) 
{
	return !isNaN(parseFloat(n)) && isFinite(n);
};

const crc32 = function(str) 
{
	str = str.toString();
	let crcTable = window.crcTable || (window.crcTable = makeCRCTable());
	let crc = 0 ^ (-1);

	for (let i = 0; i < str.length; i++) 
	{
		crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
	}

	return (crc ^ (-1)) >>> 0;
};

const seededRand = function()
{
	let seed = arguments[0] || Date.now();
	seed = crc32(seed.toString());
	let mod1 = arguments[1] || 7247;
	let mod2 = arguments[2] || 7823;
	let base = mod1 * mod2;

	return function()
	{
		let min = 0;
		let max = 1;
		if (arguments[1])
		{
			min = arguments[0];
			max = arguments[1];
		}
		else if (arguments[0])
		{
			max = arguments[0];
		}
		seed = Math.pow(seed, 2) % base;
		return seed / base * (max - min) + min;
	};
};

function getConfig()
{
	let config = window.localStorage.getItem("config");
	try 
	{
		config = JSON.parse(config);
	} 
	catch(e) 
	{
		config = false;
	}
	if (!config)
	{
		//	default config
		config = {
			"url": "",
			"secret": "",
			"len": 12,
			"digits": 1,
			"lower": 1,
			"upper": 1,
			"symbols": 1,
			"savesecret": false,
			"exclude": "",
			"similar": false,
			"password": ""
		};
		saveConfig(config);
	}
	if (!config.secret)
	{
		config.secret = Math.floor(Math.random() * 1000000);
	}
	return config;
}

function updateConfig(config)
{
	let controls = {};
	let error = false;

	//	read form
	document.querySelectorAll("input").forEach(function(control) {

		switch (control.type)
		{
			case "checkbox":
				config[control.name] = control.checked ? 1 : false;
				break;
			default:
				config[control.name] = control.value;
		}
		control.classList.remove("pwg_error");
		controls[control.name] = control;
	});

	//	validate data
	if (!config.secret)
	{
		controls.secret.classList.add("pwg_error");
		error = "Secret word cannot be empty";
	}
	if (!isNumeric(config.len))
	{
		controls.len.classList.add("pwg_error");
		error = "Password length must be a number";
	}
	if (!config.digits && !config.lower && !config.upper && !config.symbols)
	{
		error = "Select at least one of symbols group (digits, letters, uppercase or symbols)";
	}
	if (error)
	{
		document.getElementById("pwg_msg").innerHTML = error;
		document.getElementById("pwg_msg").style.display = "block";
		return false;
	}
	document.getElementById("pwg_msg").style.display = "none";
	return config;
}

function saveConfig(config)
{
	let saved = {};
	options.forEach(function(value, key) {
		if (!config[value])
		{
			saved[value] = false;
		}
		else
		{
			saved[value] = config[value];
		}
	});
	if (!config.savesecret)
	{
		saved.secret = "";
	}
	window.localStorage.setItem("config", JSON.stringify(saved));
}

function updatePopup(config)
{
	document.querySelectorAll("input").forEach(function(control) {

		switch (control.type)
		{
			case "checkbox":
				control.checked = config[control.name] ? true : false;
				break;
			default:
				control.value = config[control.name] ? config[control.name] : "";
		}
	});
}

function extractHostname(url) 
{
	let hostname;
	//find & remove protocol (http, ftp, etc.) and get hostname

	if (url.indexOf("//") > -1) {
		hostname = url.split("/")[2];
	}
	else {
		hostname = url.split("/")[0];
	}

	//find & remove port number
	hostname = hostname.split(":")[0];
	//find & remove "?"
	hostname = hostname.split("?")[0];

	return hostname.toLowerCase();
}

function extractRootDomain(url) 
{
	let domain = extractHostname(url),
		splitArr = domain.split("."),
		arrLen = splitArr.length;

	//extracting the root domain here
	//if there is a subdomain 
	if (arrLen > 2) {
		domain = splitArr[arrLen - 2] + "." + splitArr[arrLen - 1];
		//check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
		if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
			//this is using a ccTLD
			domain = splitArr[arrLen - 3] + "." + domain;
		}
	}
	return domain;
}

function getDomain(config)
{
		//	cut subdomains
		config.url = config.url.replace("www.", "");
		if (!config.subdomains)
		{
			return extractRootDomain(config.url);
		}
		return extractHostname(config.url);
}

function getSeed(config)
{
	let parts = [];
	if (config.secret)
	{
		parts.push(config.secret);
	}
	parts.push(config.domain.toLowerCase());
	return parts.join(".");
}

function arrayRandomKey(arr)
{
	return Math.floor(srand(arr.length));
}

function arrayRandomValue(arr)
{
	return arr[arrayRandomKey(arr)];
}

function arrayShuffle(arr) 
{
	let j, x, i;
	for (i = arr.length - 1; i > 0; i--) 
	{
		j = arrayRandomKey(arr);
		x = arr[i];
		arr[i] = arr[j];
		arr[j] = x;
	}
	return arr;
}

function arrayExclude(arr, exclude)
{
	let symbols = arr.join("");
	exclude.forEach(function(symbol) {
		symbols = symbols.replace(symbol, "");
	});
	return symbols.split("");
}

function getPwdData(config)
{
	let chars = {
		"digits": "0123456789".split(""),
		"lower": "abcdefghijklmnopqrstuvwxyz".split(""),
		"upper": "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
		"symbols": "!@#$%^&*/-+=()<>[]{}_\\|.,:;'\"`~".split("")
	};

	let exclude = config.exclude;
	if (config.similar)
	{
		exclude += "1iIlL0oO";
	}
	exclude = exclude.split("");

	let scope = [];
	for (var key in chars) 
	{
		if (config[key])
		{
			chars[key] = arrayExclude(chars[key], exclude);
			chars[key] = arrayShuffle(chars[key]);
			if (chars[key].length)
			{
				scope.push(key);
			}
		}
	}

	let pwd = [];
	for (let i = 0; i < config.len; i++)
	{
		pwd.push(arrayRandomValue(chars[scope[(i + scope.length) % scope.length]]));
	}
	pwd = arrayShuffle(pwd);

	config.password = pwd.join("");

	return config;
}

let srand = new seededRand(Math.random());
let options = ["digits", "lower", "upper", "symbols", "len", "secret", "subdomains", "exclude", "similar", "savesecret"];
let config = {};

let generatePwd = function()
{
	if (updateConfig(config))
	{
		config.domain = getDomain(config);

		saveConfig(config);

		//	update seed
		srand = new seededRand(getSeed(config));

		config = getPwdData(config);

		document.getElementById("pwg_res_domain").value = config.domain;
	}
	document.getElementById("pwg_res_pwd").value = config.password;

	//	send data to content script
	if (typeof chrome.tabs != 'undefined')
	{
		chrome.tabs.executeScript(null, {
			code: "var _pwd_data = " + JSON.stringify(config)
		}, function() {
			chrome.tabs.executeScript(
				null, {
					file: "content.js"
			});
		});
	}
}

document.addEventListener("DOMContentLoaded", function () {

	if (typeof chrome.tabs != 'undefined')
	{
		//	runned as extension
		chrome.tabs.query({
			currentWindow: true,
			active: true
		}, function(tab) {
			config = getConfig();
			config.url = tab[0].url;
			config.domain = getDomain(config);
			updatePopup(config);
			generatePwd();
		});
	}
	else
	{
		config = getConfig();
		config.url = document.URL;
		config.domain = getDomain(config);
		updatePopup(config);
		generatePwd();
	}

	document.getElementById("pwg_more_options").addEventListener("click", function() {
		document.querySelectorAll('li[class="hidden"]').forEach(function(control) {		
			control.style.display = "block";
			document.getElementById("pwg_more_options").style.display = "none";
		});
	});

	document.querySelectorAll("input").forEach(function(control) {
		control.addEventListener("change", generatePwd);
		control.addEventListener("input", generatePwd);
	});
});