const STYLE_ID = "restyle-theme-css";
const FONT_STYLE_ID = "restyle-font-css";
const CSS_PATH = chrome.runtime.getURL("/css/content.css");

function injectStyleSheet() {
	if (!document.getElementById(STYLE_ID)) {
		const link = document.createElement("link");
		link.id = STYLE_ID;
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = CSS_PATH;
		document.head.appendChild(link);
	}
}

function removeStyleSheet() {
	const existing = document.getElementById(STYLE_ID);
	if (existing) existing.remove();
}

function injectFontStyle(fontUrl) {
	if (!fontUrl || document.getElementById(FONT_STYLE_ID)) return;

	const style = document.createElement("style");
	style.id = FONT_STYLE_ID;
	style.textContent = `
		@import url('${fontUrl}');
	`;
	document.head.appendChild(style);
}

function removeFontStyle() {
	const font = document.getElementById(FONT_STYLE_ID);
	if (font) font.remove();
}

function applyVars(vars) {
	const root = document.documentElement;

	if (!vars.enabled) {
		removeStyleSheet();
		removeFontStyle();
		Object.keys(vars).forEach((key) => {
			if (key.startsWith("--")) root.style.removeProperty(key);
		});
		return;
	}

	// Optional derived vars
	vars["--light"] = vars["--primary"] + "55";
	vars["--br"] = vars["--br"].toString().endsWith("px")
		? vars["--br"]
		: `${vars["--br"]}px`;

	// Inject styles
	injectStyleSheet();

	// Inject or update font style
	removeFontStyle(); // ensure only one at a time
	injectFontStyle(vars.fontUrl);

	// Set CSS variables
	for (const key in vars) {
		if (key.startsWith("--")) {
			root.style.setProperty(key, vars[key], "important");
		}
	}

	// Set --font variable if font family is defined
	if (vars.font) {
		root.style.setProperty("--font", vars.font);
	}
}

// Load on start
chrome.storage.local.get("restyleVars", (data) => {
	const vars = data.restyleVars || {};
	applyVars(vars);
});

// Live update on change
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "local" && changes.restyleVars) {
		applyVars(changes.restyleVars.newValue);
	}
});

// Optional: listen for service worker messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.command === "updateVars") {
		applyVars(message.vars);
		sendResponse({ status: "done" });
	}
});
