// Full-size note graph for the homepage (content/index.md).
// Nodes and links come from Quartz's content index. Clicking a node shows that
// note in an info box instead of navigating away.
;(async function () {
  const el = document.getElementById("home-graph")
  const box = document.getElementById("home-graph-info")
  if (!el || !box) return

  // Phones: the title card can collapse to just the title, and does so the
  // first time the visitor touches the graph or opens a note, so the graph gets the space.
  const intro = document.querySelector(".home-intro")
  const introToggle = intro?.querySelector(".home-intro-toggle")
  const isPhone = () => matchMedia("(max-width: 800px)").matches
  // Margin around the whole graph when it is fitted to the screen; small on phones,
  // where 90px on each side left the graph tiny.
  const fitPadding = () => (isPhone() ? 20 : 90)
  const setCollapsed = (collapsed) => {
    if (!intro || !introToggle) return
    intro.classList.toggle("is-collapsed", collapsed)
    introToggle.setAttribute("aria-expanded", String(!collapsed))
  }
  if (intro && introToggle) {
    introToggle.addEventListener("click", () =>
      setCollapsed(!intro.classList.contains("is-collapsed")),
    )
    el.addEventListener(
      "pointerdown",
      () => {
        if (isPhone()) setCollapsed(true)
      },
      { once: true },
    )
  }

  const index = await fetch("/static/contentIndex.json").then((r) => r.json())

  // Only real notes: skip generated pages like tags/ and folders.
  const slugs = Object.keys(index).filter((s) => !s.startsWith("tags/"))
  const known = new Set(slugs)
  const nodes = slugs.map((slug) => ({ id: slug, label: index[slug].title || slug }))
  // Pages whose own links are left out of the graph. "Om meg" links to almost
  // every note, which would pull all the clusters into the middle.
  const summaryPages = new Set(["om-meg"])
  const pairKey = (a, b) => [a, b].sort().join("\n")

  // Links as written in the notes, and one graph link per pair of notes
  // (two notes linking to each other would otherwise get a double line).
  const outgoing = new Map(slugs.map((s) => [s, []]))
  const pairs = new Map()
  for (const source of slugs) {
    if (summaryPages.has(source)) continue
    for (const target of index[source].links || []) {
      if (!known.has(target) || target === source) continue
      outgoing.get(source).push(target)
      const key = pairKey(source, target)
      if (!pairs.has(key)) pairs.set(key, { source, target })
    }
  }
  const links = [...pairs.values()]

  // The backbone: walk out from the homepage, breadth first, in the order links
  // appear in each note (homepage → hubs → periods and tools → jobs and projects).
  // The link that first reaches a note is a tree link and shapes the layout.
  // All other links are cross-links: drawn faint and pulling only lightly, so
  // clusters stay apart. They still light up on hover.
  const treeLinks = new Set()
  const reached = new Set(["index"])
  let queue = ["index"]
  while (queue.length) {
    const next = []
    for (const source of queue) {
      for (const target of outgoing.get(source) || []) {
        if (reached.has(target)) continue
        reached.add(target)
        treeLinks.add(pairKey(source, target))
        next.push(target)
      }
    }
    queue = next
  }
  links.forEach((l) => (l.tree = treeLinks.has(pairKey(l.source, l.target))))

  const neighbours = new Map(slugs.map((s) => [s, new Set([s])]))
  for (const { source, target } of links) {
    neighbours.get(source).add(target)
    neighbours.get(target).add(source)
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
  let settled = false
  const graph = ForceGraph()(el)
    .graphData({ nodes, links })
    .backgroundColor("rgba(0,0,0,0)")
    .linkColor((l) => (touchesFocus(l) ? colors.accent : colors.link))
    .linkWidth((l) => (touchesFocus(l) ? 2 : l.tree ? 1 : 0.4))
    .nodeCanvasObject((n, ctx, scale) => {
      ctx.globalAlpha = isLit(n.id) ? 1 : 0.15
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI)
      ctx.fillStyle = n.id === focus() || n.id === "index" ? colors.accent : colors.node
      ctx.fill()

      // Like Obsidian: the more zoomed in, the more labels. Zoomed far out (e.g.
      // on phones) only the biggest hubs; then all hubs; then every note.
      // The focused node and its neighbours are always labelled.
      const links = neighbours.get(n.id).size - 1
      const showLabel = focus()
        ? isLit(n.id)
        : scale > 1.6 || (links >= 4 && scale > 0.9) || links >= 6
      if (showLabel) {
        ctx.font = `${(n.id === focus() ? 13 : 11) / scale}px ${colors.font}`
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillStyle = colors.text
        ctx.fillText(n.label, n.x, n.y + n.radius + 3 / scale)
      }
      ctx.globalAlpha = 1
    })
    // Tap area: at least ~14px radius on screen, so small nodes are easy to hit with a finger.
    .nodePointerAreaPaint((n, color, ctx, scale) => {
      ctx.beginPath()
      ctx.arc(n.x, n.y, Math.max(n.radius + 4, 14 / scale), 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    })
    .onNodeHover((n) => {
      hovered = n ? n.id : null
      el.style.cursor = n ? "pointer" : ""
    })
    .onNodeClick((n) => select(n.id, "node"))
    .onBackgroundClick(close)
    // Touch screens: a tap always moves the finger a little, which counted as dragging
    // the node and restarted the layout (and the zoom-to-fit below). Let a finger pan.
    .enableNodeDrag(!matchMedia("(pointer: coarse)").matches)
    .autoPauseRedraw(false) // keep repainting so hover highlights show after the layout settles
    .warmupTicks(100) // lay out most of the graph before the first frame
    .cooldownTicks(100)
    .onEngineTick(() => {
      if (!fitted) {
        fitted = true
        graph.zoomToFit(0, fitPadding())
      }
    })
    // Fit once the first layout has settled. Not on later stops (e.g. after a node is
    // dragged), or it zooms out from the node the visitor just selected.
    .onEngineStop(() => {
      if (settled) return
      settled = true
      graph.zoomToFit(400, fitPadding())
    })

  graph.d3Force("charge").strength(-200)
  graph
    .d3Force("link")
    .distance((l) => (l.tree ? 40 : 90))
    .strength((l) => (l.tree ? 0.9 : 0.02))

  // Show a note in the info box. The text comes from the note's own page, so
  // lists and links look the same as there.
  // Zoom level on phones when a note is opened: tree links (40 units) become ~100px.
  const phoneZoom = 2.5

  // Note text for the info box, fetched once per note.
  const noteHtml = new Map()
  async function loadNote(slug) {
    if (!noteHtml.has(slug)) {
      const html = await fetch("/" + slug).then((r) => r.text())
      const doc = new DOMParser().parseFromString(html, "text/html")
      const article = doc.querySelector("article .markdown-preview-view") || doc.querySelector("article")
      // The homepage note holds this graph; only show its text.
      article?.querySelectorAll("#home-graph, #home-graph-info, script").forEach((e) => e.remove())
      noteHtml.set(slug, article ? article.innerHTML : "")
    }
    return noteHtml.get(slug)
  }

  async function select(slug, source) {
    selected = slug
    // Analytics: window.amplitude only exists after consent (see componentResources.ts).
    window.amplitude?.track("Graph Note Opened", { note: slug, title: index[slug].title, source })
    const node = nodes.find((n) => n.id === slug)
    if (node && !isPhone()) graph.centerAt(node.x, node.y, 600)
    if (isPhone()) setCollapsed(true)

    // Fill the box before showing it, so it doesn't open empty and then grow
    // (visible as a flicker on slower phone connections).
    const html = await loadNote(slug)
    if (selected !== slug) return // user clicked another node meanwhile
    box.querySelector("h3").textContent = index[slug].title || slug
    box.querySelector(".home-graph-open").href = "/" + (slug === "index" ? "" : slug)
    const body = box.querySelector(".home-graph-body")
    body.innerHTML = html
    box.hidden = false
    // Text taller than the box's max height gets cut off; only then offer the full page.
    box.classList.toggle("is-long", body.scrollHeight > body.clientHeight + 1)

    // Phones: zoom in so the note and its neighbours have readable labels, and put the
    // node in the middle of the space above the info box (which sits at the bottom).
    if (node && isPhone()) {
      const zoom = Math.max(graph.zoom(), phoneZoom)
      graph.zoom(zoom, 600)
      graph.centerAt(node.x, node.y + box.offsetHeight / 2 / zoom, 600)
    }
  }

  function close() {
    if (selected && isPhone()) graph.zoomToFit(400, fitPadding()) // back to the overview
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
    // "Om meg" is a full page meant to be read there, so let that link navigate.
    if (!known.has(slug) || slug === "om-meg") return
    e.preventDefault()
    select(slug, "link")
  })

  box.querySelector(".home-graph-open").addEventListener("click", () =>
    window.amplitude?.track("Graph Page Opened", { note: selected }),
  )

  // force-graph needs explicit pixel sizes; keep it matched to its box.
  new ResizeObserver(() => graph.width(el.clientWidth).height(el.clientHeight)).observe(el)
})()
