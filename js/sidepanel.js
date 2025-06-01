const defaultVars = {
	enabled: true,
	font: "Inter",
	"--primary": "#f48024",
	"--text": "#333333",
	"--text-dark": "#111111",
	"--text-light": "#dddddd",
	"--bg": "#ffffff",
	"--surface": "#f5f5f5",
	"--br": "4",
};
document.addEventListener("DOMContentLoaded", () => {
	const theme = document.getElementById("theme");
	const primary = document.getElementById("primary");
	const bg = document.getElementById("bg");
	const surface = document.getElementById("surface");
	const text = document.getElementById("text");
	const textDark = document.getElementById("text-dark");
	const textLight = document.getElementById("text-light");
	const border = document.getElementById("border");
	const font = document.getElementById("font");

	const observer = [
		theme,
		primary,
		bg,
		surface,
		text,
		textDark,
		textLight,
		border,
		font,
	];

	function renderInputs(vars) {
		theme.checked = vars.enabled;
		primary.value = vars["--primary"];
		bg.value = vars["--bg"];
		surface.value = vars["--surface"];
		text.value = vars["--text"];
		textDark.value = vars["--text-dark"];
		textLight.value = vars["--text-light"];
		border.value = vars["--br"];
		font.value = vars.font;
		applyVars(vars);
	}

	function applyVars(vars) {
		const root = document.documentElement.style;

		for (const key in vars) {
			if (key.startsWith("--")) {
				if (key === "--br") {
					root.setProperty(key, `${vars[key]}px`);
				} else {
					root.setProperty(key, vars[key]);
				}
			}
		}

		root.setProperty("--light", vars["--primary"] + "55");
		root.setProperty("--font", vars.font);

		if (!document.getElementById("google-font-import")) {
			const link = document.createElement("link");
			link.id = "google-font-import";
			link.rel = "stylesheet";
			link.href = `https://fonts.googleapis.com/css2?family=${vars.font.replace(
				/ /g,
				"+",
			)}:wght@400;700&display=swap`;
			document.head.appendChild(link);
		} else {
			document.getElementById(
				"google-font-import",
			).href = `https://fonts.googleapis.com/css2?family=${vars.font.replace(
				/ /g,
				"+",
			)}:wght@400;700&display=swap`;
		}
	}

	// Load saved or default values
	chrome.storage.local.get("restyleVars", (data) => {
		const vars = data.restyleVars || defaultVars;
		renderInputs(vars);
	});

	observer.forEach((el) => {
		if (el !== font) {
			el.addEventListener("input", () => {
				const vars = {
					enabled: theme.checked,
					font: font.value,
					"--primary": primary.value,
					"--bg": bg.value,
					"--surface": surface.value,
					"--text": text.value,
					"--text-dark": textDark.value,
					"--text-light": textLight.value,
					"--br": border.value,
				};
				applyVars(vars);
				chrome.storage.local.set({ restyleVars: vars });
			});
		}
	});

	// Handle font input separately
	font.addEventListener("keydown", (e) => {
		if (e.key === "Enter" && font.value.trim().length > 2) {
			const vars = {
				enabled: theme.checked,
				font: font.value,
				fontUrl: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
					font.value,
				)}&display=swap`,
				"--primary": primary.value,
				"--bg": bg.value,
				"--surface": surface.value,
				"--text": text.value,
				"--text-dark": textDark.value,
				"--text-light": textLight.value,
				"--br": border.value,
			};
			applyVars(vars);
			chrome.storage.local.set({ restyleVars: vars });
		}
	});

	// Reset button
	document.getElementById("reset").addEventListener("click", () => {
		chrome.storage.local.set({ restyleVars: defaultVars });
		renderInputs(defaultVars);
	});
});
