const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");
const releaseLabels = document.querySelectorAll(".js-current-release");
const markdownSource = document.querySelector("[data-markdown-source]");

navToggle?.addEventListener("click", () => {
	const isOpen = navToggle.getAttribute("aria-expanded") === "true";
	navToggle.setAttribute("aria-expanded", String(!isOpen));
	siteNav?.setAttribute("data-open", String(!isOpen));
});

siteNav?.addEventListener("click", (event) => {
	if (event.target instanceof HTMLAnchorElement) {
		navToggle?.setAttribute("aria-expanded", "false");
		siteNav.removeAttribute("data-open");
	}
});

const installTargets = {
	chrome: {
		label: "Install for Chrome",
		url: "https://chromewebstore.google.com/detail/again-why-salesforce/bceeoimjhgjbihanbiifgpndmkklajbi",
	},
	edge: {
		label: "Install for Edge",
		url: "https://microsoftedge.microsoft.com/addons/detail/dfdjpokbfeaamjcomllncennmfhpldmm",
	},
	firefox: {
		label: "Install for Firefox",
		url: "https://addons.mozilla.org/en-US/firefox/addon/again-why-salesforce/",
	},
	safari: {
		label: "Install for Safari",
		url: "https://github.com/Astisme/again-why-salesforce/releases/latest",
	},
	unknown: {
		label: "Open latest release",
		url: "https://github.com/Astisme/again-why-salesforce/releases/latest",
	},
};

const wikiDocuments = {
	"Home": "Home.md",
	"Manage-Tabs": "Manage-Tabs/Manage-Tabs.md",
	"Manage-Tabs-modal": "Manage-Tabs/Manage-Tabs-modal.md",
	"Save-a-Tab": "Manage-Tabs/Save-a-Tab.md",
	"Remove-a-Tab": "Manage-Tabs/Remove-a-Tab.md",
	"Remove-Multiple-Tabs": "Manage-Tabs/Remove-Multiple-Tabs.md",
	"Import-Tabs": "Manage-Tabs/Import-Tabs.md",
	"Export-Tabs": "Manage-Tabs/Export-Tabs.md",
	"Sort-Tabs": "Manage-Tabs/Sort-Tabs.md",
	"Context-Menu": "Manage-Tabs/Context-Menu.md",
	"Commands": "Manage-Tabs/Commands.md",
	"Settings": "Settings/Settings.md",
	"Style-your-Tabs": "Settings/Style-your-Tabs.md",
	"Pick-Language": "Settings/Pick-Language.md",
	"Optional-Permissions": "Settings/Optional-Permissions.md",
	"No-Simple-Analytics": "Settings/No-Simple-Analytics.md",
	"Keep-Tabs-Sorted": "Settings/Keep-Tabs-Sorted.md",
	"Open-Other-Org": "Open-Other-Org.md",
	"Tutorial": "Tutorial.md",
	"Safari-Installation": "Safari-Installation.md",
};

/**
 * Detects current browser family for extension store routing.
 *
 * @param {string} userAgent Browser user agent string.
 * @returns {keyof typeof installTargets} Install target key.
 */
function detectInstallTarget(userAgent) {
	if (userAgent.includes("Edg/")) {
		return "edge";
	}
	if (userAgent.includes("Firefox/")) {
		return "firefox";
	}
	if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && !userAgent.includes("Chromium/")) {
		return "safari";
	}
	if (userAgent.includes("Chrome/") || userAgent.includes("Chromium/")) {
		return "chrome";
	}
	return "unknown";
}

/**
 * Updates install links so Chrome text is not shown to non-Chrome browsers.
 *
 * @returns {void}
 */
function updateInstallLinks() {
	const detectedTarget = detectInstallTarget(navigator.userAgent);
	const target = installTargets[detectedTarget];
	document.querySelectorAll(".js-install-link").forEach((link) => {
		link.textContent = target.label;
		link.setAttribute("href", target.url);
	});
	document.querySelectorAll(".js-safari-guide").forEach((link) => {
		link.toggleAttribute("hidden", detectedTarget !== "safari");
	});
}

/**
 * Fetches latest release name from GitHub.
 *
 * @returns {Promise<string | null>} Latest release label, or null when unavailable.
 */
async function getLatestReleaseLabel() {
	const response = await fetch("https://api.github.com/repos/Astisme/again-why-salesforce/releases/latest");
	if (response.ok) {
		const release = await response.json();
		return release.name || release.tag_name || null;
	}

	const manifestResponse = await fetch("https://raw.githubusercontent.com/Astisme/again-why-salesforce/main/src/manifest/template-manifest.json");
	if (!manifestResponse.ok) {
		return null;
	}
	const manifest = await manifestResponse.json();
	return `v${manifest.version}`;
}

/**
 * Replaces static release placeholders with live GitHub release value.
 *
 * @returns {Promise<void>} Promise resolved after release labels update or fallback.
 */
async function hydrateReleaseLabels() {
	const latestRelease = await getLatestReleaseLabel();
	if (!latestRelease) {
		releaseLabels.forEach((label) => {
			label.textContent = "Latest";
		});
		return;
	}
	releaseLabels.forEach((label) => {
		label.textContent = latestRelease;
	});
}

/**
 * Escapes text before writing generated HTML.
 *
 * @param {string} value Raw text.
 * @returns {string} Escaped text.
 */
function escapeHtml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

/**
 * Converts Markdown inline links and code to safe HTML.
 *
 * @param {string} value Markdown text.
 * @returns {string} HTML text.
 */
function renderInlineMarkdown(value) {
	return escapeHtml(value)
		.replaceAll(/`([^`]+)`/g, "<code>$1</code>")
		.replaceAll(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replaceAll(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
			const url = String(href);
			if (url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("#")) {
				return `<a href="${escapeHtml(url)}">${label}</a>`;
			}
			const localDoc = url
				.replaceAll("../", "")
				.replaceAll("./", "")
				.replaceAll(".md", "")
				.split("/")
				.pop() || "Home";
			const target = wikiDocuments[localDoc] ? `wiki.html?doc=${encodeURIComponent(localDoc)}` : "wiki.html";
			return `<a href="${escapeHtml(target)}">${label}</a>`;
		});
}

/**
 * Converts small Markdown subset used by project docs into HTML.
 *
 * @param {string} markdown Raw Markdown.
 * @returns {string} Rendered HTML.
 */
function renderMarkdown(markdown) {
	const visibleMarkdown = markdown.replaceAll(/<!--[\s\S]*?-->/g, "");
	const blocks = [];
	let listItems = [];

	/**
	 * Flushes pending list items into block list.
	 *
	 * @returns {void}
	 */
	function flushList() {
		if (listItems.length === 0) {
			return;
		}
		blocks.push(`<ul>${listItems.join("")}</ul>`);
		listItems = [];
	}

	for (const rawLine of visibleMarkdown.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line === "---") {
			flushList();
			continue;
		}
		if (line.startsWith("<!--")) {
			flushList();
			continue;
		}
		if (line.startsWith("# ")) {
			flushList();
			blocks.push(`<h1>${renderInlineMarkdown(line.slice(2))}</h1>`);
			continue;
		}
		if (line.startsWith("## ")) {
			flushList();
			blocks.push(`<h2>${renderInlineMarkdown(line.slice(3))}</h2>`);
			continue;
		}
		if (line.startsWith("### ")) {
			flushList();
			blocks.push(`<h3>${renderInlineMarkdown(line.slice(4))}</h3>`);
			continue;
		}
		if (line.startsWith("> ")) {
			flushList();
			blocks.push(`<blockquote>${renderInlineMarkdown(line.slice(2))}</blockquote>`);
			continue;
		}
		if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s/.test(line)) {
			listItems.push(`<li>${renderInlineMarkdown(line.replace(/^(-|\*|\d+\.)\s/, ""))}</li>`);
			continue;
		}
		flushList();
		blocks.push(`<p>${renderInlineMarkdown(line.replaceAll("\\", ""))}</p>`);
	}
	flushList();
	return blocks.join("");
}

/**
 * Converts changelog Markdown releases into collapsed detail panels.
 *
 * @param {string} markdown Raw changelog Markdown.
 * @returns {string} Rendered changelog HTML.
 */
function renderChangelog(markdown) {
	const visibleMarkdown = markdown.replaceAll(/<!--[\s\S]*?-->/g, "");
	const releaseParts = visibleMarkdown.split(/\n# (?=v\d+\.\d+\.\d+)/);
	const intro = renderMarkdown(releaseParts.shift() || "");
	const releases = releaseParts
		.filter((part) => part.trim())
		.map((part, index) => {
			const releaseMarkdown = `# ${part.trim()}`;
			const title = releaseMarkdown.match(/^#\s+(.+)$/m)?.[1] || "Release";
			return `<details class="release-panel" ${index === 0 ? "open" : ""}><summary>${escapeHtml(title)}</summary>${renderMarkdown(releaseMarkdown.replace(/^#\s+.+\n?/, ""))}</details>`;
		})
		.join("");
	return `${intro}${releases}`;
}

/**
 * Builds raw GitHub URL for selected local content wrapper.
 *
 * @param {Element} target Markdown target element.
 * @returns {string | null} Raw content URL.
 */
function getMarkdownUrl(target) {
	if (target.getAttribute("data-markdown-source") === "changelog") {
		return "https://raw.githubusercontent.com/Astisme/again-why-salesforce/main/docs/CHANGELOG.md";
	}
	if (target.getAttribute("data-markdown-source") === "security") {
		return "https://raw.githubusercontent.com/Astisme/again-why-salesforce/main/docs/SECURITY.md";
	}

	const doc = new URLSearchParams(location.search).get("doc") || "Home";
	const path = wikiDocuments[doc] || wikiDocuments.Home;
	return `https://raw.githubusercontent.com/wiki/Astisme/again-why-salesforce/${path}`;
}

/**
 * Loads raw GitHub Markdown into local wrapper page.
 *
 * @returns {Promise<void>} Promise resolved after Markdown render or fallback.
 */
async function hydrateMarkdown() {
	if (!markdownSource) {
		return;
	}
	const url = getMarkdownUrl(markdownSource);
	if (!url) {
		return;
	}
	const response = await fetch(url);
	if (!response.ok) {
		markdownSource.innerHTML = "<p>Could not load GitHub raw Markdown.</p>";
		return;
	}
	const markdown = await response.text();
	markdownSource.innerHTML = markdownSource.getAttribute("data-markdown-source") === "changelog"
		? renderChangelog(markdown)
		: renderMarkdown(markdown);
}

updateInstallLinks();
hydrateReleaseLabels().catch(() => {});
hydrateMarkdown().catch(() => {
	if (markdownSource) {
		markdownSource.innerHTML = "<p>Could not load GitHub raw Markdown.</p>";
	}
});
