// Generates the favicon (quartz/static/icon.png) and the site-wide social card
// (quartz/static/og-image.png). Run from the repo root: npm run images
// Needs internet: the card's fonts are fetched from Google Fonts.
// Satori lays out the card as SVG; sharp (already a Quartz dependency) makes the PNGs.
import satori from "satori"
import sharp from "sharp"

// Dark theme colours from quartz.config.yaml.
const t = { bg: "#171915", text: "#eff2e7", muted: "#9a9f8f", accent: "#9cc47a", node: "#c1dea5" }

const svgUri = (svg) => "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64")

// Favicon: few, large nodes so it still reads at 16px.
function iconSvg() {
  const n = [[50, 58], [140, 46], [96, 104], [150, 142], [52, 146]]
  const e = [[0, 2], [1, 2], [2, 3], [2, 4], [1, 3]]
  const lines = e.map(([a, b]) => `<line x1="${n[a][0]}" y1="${n[a][1]}" x2="${n[b][0]}" y2="${n[b][1]}" stroke="${t.muted}" stroke-width="9" stroke-linecap="round"/>`).join("")
  const dots = n.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 2 ? 26 : 17}" fill="${i === 2 ? t.accent : t.node}"/>`).join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" rx="40" fill="${t.bg}"/>${lines}${dots}</svg>`
}

// Card: a small node graph on the right, echoing the homepage.
function graphSvg() {
  const n = [[140, 80], [260, 150], [180, 250], [320, 290], [90, 330], [250, 400], [380, 180], [130, 470], [330, 500]]
  const e = [[0, 1], [1, 2], [1, 6], [2, 3], [2, 4], [3, 5], [4, 7], [5, 8], [3, 6], [5, 7]]
  const lines = e.map(([a, b]) => `<line x1="${n[a][0]}" y1="${n[a][1]}" x2="${n[b][0]}" y2="${n[b][1]}" stroke="${t.muted}" stroke-opacity="0.45" stroke-width="2"/>`).join("")
  const dots = n.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 2 ? 14 : 9}" fill="${i === 2 ? t.accent : t.node}" fill-opacity="${i === 2 ? 1 : 0.8}"/>`).join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="560">${lines}${dots}</svg>`
}

// Google Fonts serves TTF to clients without a browser user agent, which satori needs.
async function ttf(family, weight) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`,
  ).then((r) => r.text())
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)[1]
  return fetch(url).then((r) => r.arrayBuffer())
}

const h = (type, style, children) => ({ type, props: { style, children } })

await sharp(Buffer.from(iconSvg())).png({ compressionLevel: 9 }).toFile("quartz/static/icon.png")

const fonts = [
  { name: "Schibsted Grotesk", data: await ttf("Schibsted Grotesk", 700), weight: 700 },
  { name: "Source Sans 3", data: await ttf("Source Sans 3", 400), weight: 400 },
  { name: "Source Sans 3", data: await ttf("Source Sans 3", 600), weight: 600 },
]
const card = h("div", { display: "flex", width: "100%", height: "100%", backgroundColor: t.bg, padding: "64px 72px", fontFamily: "Source Sans 3" }, [
  h("div", { display: "flex", flexDirection: "column", justifyContent: "space-between", width: 720 }, [
    h("div", { display: "flex", alignItems: "center", gap: 16 }, [
      { type: "img", props: { src: svgUri(iconSvg()), width: 56, height: 56 } },
      h("div", { fontSize: 30, color: t.muted }, "jokvalen.no"),
    ]),
    h("div", { display: "flex", flexDirection: "column", gap: 20 }, [
      h("div", { fontFamily: "Schibsted Grotesk", fontWeight: 700, fontSize: 80, lineHeight: 1.05, color: t.text }, "Jo Aleksander Bakke Kvalen"),
      h("div", { fontSize: 40, fontWeight: 600, color: t.accent }, "Digital analyse og eksperimentering"),
    ]),
    h("div", { fontSize: 30, color: t.muted }, "Strukturert nysgjerrighet."),
  ]),
  { type: "img", props: { src: svgUri(graphSvg()), width: 330, height: 420, style: { marginLeft: "auto", alignSelf: "center" } } },
])
const svg = await satori(card, { width: 1200, height: 630, fonts })
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile("quartz/static/og-image.png")
console.log("Wrote quartz/static/icon.png and quartz/static/og-image.png")
