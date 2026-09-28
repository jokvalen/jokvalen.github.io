// Full-size note graph for the homepage (content/index.md).
// Nodes and links come from Quartz's content index. Clicking a node shows that
// note in an info box instead of navigating away.
;(async function () {
  const el = document.getElementById("home-graph")
  const box = document.getElementById("home-graph-info")
  if (!el || !box) return

  const index = await fetch("/static/contentIndex.json").then((r) => r.json())

  // Only real notes: skip generated pages like tags/ and folders.
  const slugs = Object.keys(index).filter((s) => !s.startsWith("tags/"))
  const known = new Set(slugs)
  const nodes = slugs.map((slug) => ({ id: slug, label: index[slug].title || slug }))
  const links = []
  const neighbours = new Map(slugs.map((s) => [s, new Set([s])]))
  for (const source of slugs) {
    for (const target of index[source].links || []) {
      if (!known.has(target) || target === source) continue
      links.push({ source, target })
      neighbours.get(source).add(target)
      neighbours.get(target).add(source)
    }
  }
  // More connections = bigger node, like Obsidian.
  nodes.forEach((n) => (n.radius = 3 + Math.sqrt(neighbours.get(n.id).size) * 2.2))

  // Colours follow the site theme, and update when light/dark mode is toggled.
  let colors
  const readColors = () => {
    const css = getComputedStyle(document.documentElement)
    const v = (name) => css.getPropertyValue(name).trim()
    colors = {
      node: v("--gray"),
      accent: v("--secondary"),
      link: v("--lightgray"),
      text: v("--darkgray"),
      font: v("--bodyFont") || "sans-serif",
    }
  }
  readColors()
  document.addEventListener("themechange", readColors)

  let hovered = null
  let selected = null
  const focus = () => hovered || selected // hover wins; otherwise keep the clicked node lit
  const idOf = (x) => (typeof x === "object" ? x.id : x)
  const isLit = (id) => !focus() || neighbours.get(focus()).has(id)
  const touchesFocus = (l) =>
    focus() && (idOf(l.source) === focus() || idOf(l.target) === focus())

  let fitted = false
  const graph = ForceGraph()(el)
    .graphData({ nodes, links })
    .backgroundColor("rgba(0,0,0,0)")
    .linkColor((l) => (touchesFocus(l) ? colors.accent : colors.link))
    .linkWidth((l) => (touchesFocus(l) ? 2 : 1))
    .nodeCanvasObject((n, ctx, scale) => {
      ctx.globalAlpha = isLit(n.id) ? 1 : 0.15
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI)
      ctx.fillStyle = n.id === focus() || n.id === "index" ? colors.accent : colors.node
      ctx.fill()

      ctx.font = `${(n.id === focus() ? 13 : 11) / scale}px ${colors.font}`
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillStyle = colors.text
      ctx.fillText(n.label, n.x, n.y + n.radius + 3 / scale)
      ctx.globalAlpha = 1
    })
    .nodePointerAreaPaint((n, color, ctx) => {
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radius + 4, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    })
    .onNodeHover((n) => {
      hovered = n ? n.id : null
      el.style.cursor = n ? "pointer" : ""
    })
    .onNodeClick((n) => select(n.id))
    .onBackgroundClick(close)
    .autoPauseRedraw(false) // keep repainting so hover highlights show after the layout settles
    .warmupTicks(100) // lay out most of the graph before the first frame
    .cooldownTicks(100)
    .onEngineTick(() => {
      if (!fitted) {
        fitted = true
        graph.zoomToFit(0, 60)
      }
    })
    .onEngineStop(() => graph.zoomToFit(400, 60))

  graph.d3Force("charge").strength(-150)
  graph.d3Force("link").distance(45)

  // Show a note in the info box. The text comes from the note's own page, so
  // lists and links look the same as there.
  async function select(slug) {
    selected = slug
    const node = nodes.find((n) => n.id === slug)
    if (node) graph.centerAt(node.x, node.y, 600)

    box.querySelector("h3").textContent = index[slug].title || slug
    box.querySelector(".home-graph-open").href = "/" + (slug === "index" ? "" : slug)
    const body = box.querySelector(".home-graph-body")
    body.textContent = ""
    box.classList.remove("is-long")
    box.hidden = false

    const html = await fetch("/" + slug).then((r) => r.text())
    if (selected !== slug) return // user clicked another node meanwhile
    const doc = new DOMParser().parseFromString(html, "text/html")
    const article = doc.querySelector("article .markdown-preview-view") || doc.querySelector("article")
    // The homepage note holds this graph; only show its text.
    article?.querySelectorAll("#home-graph, #home-graph-info, script").forEach((e) => e.remove())
    body.innerHTML = article ? article.innerHTML : ""
    // Text taller than the box's max height gets cut off; only then offer the full page.
    box.classList.toggle("is-long", body.scrollHeight > body.clientHeight + 1)
  }

  function close() {
    selected = null
    box.hidden = true
  }
  box.querySelector("button").addEventListener("click", close)

  // Links in the intro card and inside the info box jump to that node in the
  // graph instead of leaving the page.
  document.querySelector("article").addEventListener("click", (e) => {
    const a = e.target.closest("a.internal:not(.home-graph-open)")
    if (!a) return
    const slug = decodeURIComponent(new URL(a.href).pathname.replace(/^\//, "")) || "index"
    if (!known.has(slug)) return
    e.preventDefault()
    select(slug)
  })

  // force-graph needs explicit pixel sizes; keep it matched to its box.
  new ResizeObserver(() => graph.width(el.clientWidth).height(el.clientHeight)).observe(el)
})()
