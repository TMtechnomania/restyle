const STYLE_ID = "restyle-theme-css";
const FONT_ID = "restyle-theme-font";
const CSS_PATH = chrome.runtime.getURL("css/content.css");
const ICON_PATH = chrome.runtime.getURL("icons/listen.svg");

function injectStyleSheet() {
	show = true;
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
	show = false;
	document.getElementById(STYLE_ID)?.remove();
}

function injectFontStyle(fontUrl) {
	if (!fontUrl || document.getElementById(FONT_ID)) return;
	const style = document.createElement("style");
	style.id = FONT_ID;
	style.textContent = `@import url('${fontUrl}');`;
	document.head.appendChild(style);
}

function removeFontStyle() {
	document.getElementById(FONT_ID)?.remove();
}

function applyStyles(vars) {
	const root = document.documentElement;

	if (!vars.enabled) {
		removeStyleSheet();
		removeFontStyle();
		Object.keys(vars).forEach((key) => {
			if (key.startsWith("--")) root.style.removeProperty(key);
		});
		return;
	}
	vars["--light"] = vars["--primary"] + "55";
	vars["--br"] = vars["--br"].toString().endsWith("px")
		? vars["--br"]
		: `${vars["--br"]}px`;

	injectStyleSheet();
	removeFontStyle();
	injectFontStyle(vars.fontUrl);

	for (const key in vars) {
		if (key.startsWith("--")) {
			root.style.setProperty(key, vars[key], "important");
		}
	}
	if (vars.font) {
		root.style.setProperty("--font", vars.font);
	}
}

chrome.storage.local.get("restyleVars", ({ restyleVars = {} }) =>
	applyStyles(restyleVars),
);
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "local" && changes.restyleVars) {
		applyStyles(changes.restyleVars.newValue);
	}
});

let show = false;
let selectedElement = null;
let target = null;
const allowedTags = [
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"p",
	"div",
	"code",
	"li",
	"ul",
	"ol",
	"a",
	"pre",
	"article",
	"section",
];
let iconEl = null;
let activeIconEl = null;
const synthesis = window.speechSynthesis;
let currentUtterance = null;
let textToSpeak = "";

function createIconElement() {
	const icon = document.createElement("img");
	icon.src = ICON_PATH;
	icon.alt = "Restyle Icon";
	icon.className = "restyle-listen-icon";
	icon.draggable = false;

	icon.addEventListener("click", (event) => {
		event.stopPropagation();
		event.preventDefault();
		if (activeIconEl) {
			activeIconEl.remove();
		}
		if (currentUtterance) {
			synthesis.cancel();
			currentUtterance = null;
		}

		console.log(target);

		if (target.tagName.toLowerCase() === "code") {
			textToSpeak = target.textContent.trim();
		} else {
			textToSpeak = filteredText(target);
		}
		if (!textToSpeak) {
			console.warn("No text to speak");
			return;
		}
		currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
		currentUtterance.lang = "en-US";
		currentUtterance.voice =
			synthesis.getVoices().find((voice) => voice.default) ||
			synthesis.getVoices()[0];
		synthesis.speak(currentUtterance);
		activeIconEl = icon;
		selectedElement = target;
	});
	return icon;
}

function filteredText(node) {
	let result = "";
	for (const child of node.childNodes) {
		if (child.nodeType === Node.TEXT_NODE) {
			result += child.textContent;
		} else if (
			child.nodeType === Node.ELEMENT_NODE &&
			child.tagName.toLowerCase() !== "code"
		) {
			result += filteredText(child);
		}
	}
	return result.trim();
}

iconEl = createIconElement();

document.addEventListener("mouseover", (event) => {
	if (!show) return;
	if (event.target === iconEl) return;
	if (event.target === selectedElement) return;

	target = event.target;
	if (!target || !allowedTags.includes(target.tagName.toLowerCase())) {
		return;
	}
	if (selectedElement === target) return;
	const rect = target.getBoundingClientRect();

	Object.assign(iconEl.style, {
		top: `${rect.top + window.scrollY + 4}px`,
		left: `${rect.left + window.scrollX + 4}px`,
	});

	if (!iconEl.isConnected) {
		document.body.appendChild(iconEl);
	}
});

document.addEventListener("mousemove", (event) => {
	if (!show || !selectedElement) return;

	const target = event.target;
	// check if the target element is not the icon
	if (
		(target !== iconEl || target !== activeIconEl) &&
		target !== selectedElement &&
		!selectedElement.contains(target)
	) {
		activeIconEl.remove();
		selectedElement = null;
		if (speechSynthesis.speaking) {
			speechSynthesis.cancel();
			currentUtterance = null;
		}
	} else if (activeIconEl !== iconEl) {
		iconEl.remove();
		iconEl = null;
	}
});
