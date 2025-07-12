// Library (provided from node.js environment, not a dependency)
import { open, readFile, writeFile } from 'node:fs/promises';

// Fetch API
console.log("Fetching API...");
const apiResponse = await fetch("https://api.impossiblelevels.com/api/levels/details");
console.log("Sorting...");
const listJson = (await apiResponse.json())
	.sort((a, b) => a?.level?.rank < b?.level?.rank);

// Build document
function sanitize(input) {
	return input.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot")
		.replaceAll("'", "&apos;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}
function node(name, params, inner) {
	const keys = Object.keys(params);
	if (keys.length == 0) {
		return `<${name}>${inner}</${name}>`;
	} else {
		return `<${name} ${keys.map(k => `${k}="${sanitize(params[k])}"`).join(" ")}>${inner}</${name}>`;
	}
}
const tags = {
	'1': '[2P]',
	'2': '[2.2]',
	'3': '[Unreleased]',
	'4': '[Unnerfed]',
	'5': '[Old Version]',
	'6': node("span", { style: "color: #ae35ff" }, "[FIT1]"),
	'7': node("span", { style: "color: #980000" }, "[Top 1]"),
	'8': node("span", { style: "color: #ff9900" }, "[R]"),
	'9': node("span", { style: "color: #0000ff" }, "[FHL]"),
	'10': node("span", { style: "color: #ff0000" }, "[R]"),
	'11': node("span", { style: "color: #ff00ff" }, "[FT1]")
}
console.log("Constructing document...");

const ILL = [];

for (const entry of listJson) {
	let annotate;

	let style = "";
	let text = "";
	let subtext = "";
	text += `${node("a", { href: entry.level.showcaseLink }, entry.level.name)}`;
	text += ` by ${entry.level.authors}`;
	if (entry.level.uploader != null && entry.level.uploader != "")
		text += `, uploaded by ${entry.level.uploader}`;
	subtext += `${node("b", {}, "FPS: ")} ${entry.level.fps}`;
	if (parseInt(entry.level.levelId)) {
		subtext += `; ${node("b", {}, "ID: ")} ${entry.level.levelId}`;
	} else {
		subtext += `; ${node("b", {}, "ID: ")} N/A ${node("a", { href: entry.level.levelId }, "(GMD)")}`;
	}
	if (entry.level.wrMinimum == "") {
		subtext += `; ${node("b", {}, `WR: `)}`;
	} else {
		subtext += `; ${node("b", {}, `WR (≥${entry.level.wrMinimum}%): `)}`;
	}
	const records = [];
	for (const record of entry.records) {
		let recordText;
		if (record.startDistance == 0) {
			recordText = `${record.endDistance}%`;
		} else {
			recordText = `${record.startDistance}-${record.endDistance}%`;
		}
		recordText += ` (${record.player})`;
		records.push(node("a", { href: record.videoUrl }, recordText));
	}
	subtext += records.length == 0 ? "N/A" : records.join(", ");

	for (const tag of entry.tags) {
		if (tag.id === 25) {
			style += "; background: #d9d9d9";
		} else if (tag.id === 26) {
			style += "; background: #ffe599";
		} else if (tag.id === 27) {
			style += "; background: #f4cccc";
		} else {
			text += " " + tags[tag.id];
		}
	}

	text = node(entry.level.uncleared ? "b" : "span", { style }, text);
	text += node("ul", {}, node("span", {}, subtext));

	ILL.push(node("li", {}, text));
}

// Assembling HTML
const documentHandle = await open("template.html", "r+");
const document = (await documentHandle.readFile()).toString();

// Writing
const listHandle = await open("index.html", "w+");
await listHandle.writeFile(document.replace("{{list}}", ILL.join("\n")));
listHandle.close();