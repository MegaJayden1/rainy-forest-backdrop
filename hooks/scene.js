// Rainy forest backdrop. Idle: soft steady rain in misty pines.
// Working: heavier rain and slow, occasional lightning.
// Pure vector. scene(working) returns the whole SVG string.

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const n = v => (Math.round(v * 10) / 10).toString()

// One pine: stacked drooping tiers, base at (x, y), height h.
function pine(r, x, y, h) {
  const w = h * (0.26 + r() * 0.08)
  const tiers = 5 + Math.floor(r() * 3)
  let d = `M${n(x - w * 0.04)} ${n(y)}h${n(w * 0.08)}v${n(-h * 0.2)}h${n(-w * 0.08)}Z`
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers
    const top = y - h + h * 0.85 * t0 - h * 0.04
    const bot = y - h + h * 0.85 * ((i + 1) / tiers) + h * 0.06
    const tw = w * (0.3 + 0.7 * ((i + 1) / tiers)) * (0.9 + r() * 0.2)
    const sag = h * 0.035
    d += `M${n(x)} ${n(top)}Q${n(x + tw * 0.5)} ${n(bot - sag * 2)} ${n(x + tw)} ${n(bot)}Q${n(x)} ${n(bot - sag)} ${n(x - tw)} ${n(bot + (r() - 0.5) * 4)}Q${n(x - tw * 0.5)} ${n(bot - sag * 2)} ${n(x)} ${n(top)}Z`
  }
  return d
}

// A row of trees on a gently rolling ground line.
function layer(r, ground, minH, maxH, gap, fill) {
  let d = ''
  let x = -60 + r() * gap
  while (x < 1680) {
    const gy = ground + Math.sin(x / 210) * 14
    d += pine(r, x, gy, minH + r() * (maxH - minH)) + ' '
    x += gap * (0.6 + r() * 0.8)
  }
  const hill = `M-20 ${ground + 4} ` + Array.from({ length: 18 }, (_, i) => {
    const hx = i * 100
    return `L${hx} ${n(ground + Math.sin(hx / 210) * 14 + 6)}`
  }).join(' ') + ` L1700 ${ground} L1700 960 L-20 960Z`
  return `<path d="${d}" fill="${fill}"/><path d="${hill}" fill="${fill}"/>`
}

function rain(r, count, speedLo, speedHi, opLo, opHi, width, slant) {
  let out = ''
  for (let i = 0; i < count; i++) {
    const x = r() * 1800 - 100
    const len = 50 + r() * 60
    const d = (speedLo + r() * (speedHi - speedLo)).toFixed(2)
    const del = r().toFixed(2)
    const op = (opLo + r() * (opHi - opLo)).toFixed(2)
    out += `<line class="rn" x1="${n(x)}" y1="-130" x2="${n(x - slant * len)}" y2="${n(-130 + len)}" stroke-width="${width}" stroke-opacity="${op}" style="--dx:${n(-slant * 1100)}px;animation-duration:${d}s;animation-delay:-${del}s"/>`
  }
  return out
}

function splashes(r, count) {
  let out = ''
  for (let i = 0; i < count; i++) {
    const x = r() * 1600
    const y = 820 + r() * 70
    out += `<ellipse class="sp" cx="${n(x)}" cy="${n(y)}" rx="9" ry="2" style="transform-origin:${n(x)}px ${n(y)}px;animation-delay:-${(r() * 1.6).toFixed(2)}s"/>`
  }
  return out
}

// A jagged bolt with one or two branches, from the top of the sky down to
// the far tree line, with its own glow on the clouds.
function bolt(r, x0, period, delay) {
  const pts = [[x0, -10]]
  let x = x0
  let y = -10
  while (y < 470) {
    y += 30 + r() * 40
    x += (r() - 0.5) * 70
    pts.push([x, y])
  }
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${n(px)} ${n(py)}`).join('')
  let branches = ''
  for (let b = 0; b < 2; b++) {
    const [bx0, by0] = pts[2 + Math.floor(r() * (pts.length - 4))]
    let bx = bx0
    let by = by0
    let d = `M${n(bx)} ${n(by)}`
    const dir = r() < 0.5 ? -1 : 1
    for (let k = 0; k < 3; k++) {
      by += 25 + r() * 25
      bx += dir * (15 + r() * 30)
      d += `L${n(bx)} ${n(by)}`
    }
    branches += `<path d="${d}" stroke-width="1.6"/>`
  }
  const t = `animation-duration:${period}s;animation-delay:-${delay}s`
  return `<ellipse class="flash" cx="${n(x0)}" cy="60" rx="520" ry="380" fill="url(#flashG)" style="${t}"/>
<g class="bolt" fill="none" stroke="#eef4ff" stroke-linecap="round" stroke-linejoin="round" filter="url(#boltGlow)" style="${t}"><path d="${line}" stroke-width="3.5"/>${branches}</g>`
}

export function scene(working) {
  const r = rng(11)
  const far1 = layer(r, 560, 70, 120, 34, '#465b69')
  const far2 = layer(r, 620, 110, 170, 48, '#34485a')
  const mid = layer(r, 700, 170, 260, 70, '#1f2e3a')
  const near = layer(r, 800, 260, 380, 120, '#111b23')
  const front = layer(r, 900, 420, 560, 300, '#060a0e')

  const heavy = working
  const rainBack = rain(r, heavy ? 110 : 60, heavy ? 0.5 : 0.8, heavy ? 0.75 : 1.2, 0.12, 0.3, 1, heavy ? 0.22 : 0.12)
  const rainFront = rain(r, heavy ? 55 : 25, heavy ? 0.35 : 0.55, heavy ? 0.55 : 0.85, 0.25, 0.55, heavy ? 2 : 1.5, heavy ? 0.25 : 0.14)

  // Bolts: x, period in seconds, delay. The first three sit in the middle
  // band (x 640 to 960) that a phone screen keeps; the rest fill wide screens.
  const BOLTS = [
    [800, 5, 0],
    [690, 7, 2.6],
    [930, 8, 4.9],
    [300, 6, 1.4],
    [1320, 9, 3.7],
    [1500, 11, 6.2],
  ]
  const storm = working ? BOLTS.map(([x, p, del]) => bolt(r, x, p, del)).join('') : ''
  const flashFront = working
    ? BOLTS.map(([, p, del]) => `<rect class="flash2" width="1600" height="900" fill="#cfe0f2" style="animation-duration:${p}s;animation-delay:-${del}s"/>`).join('')
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
<style>
.rn{stroke:#c3d4e2;animation-name:fall;animation-timing-function:linear;animation-iteration-count:infinite}
@keyframes fall{from{transform:translate(0px,0px)}to{transform:translate(var(--dx),1150px)}}
.sp{fill:none;stroke:#9fb3c4;stroke-width:1;opacity:0;animation:splash 1.6s ease-out infinite}
@keyframes splash{0%{transform:scale(0.2);opacity:0.6}60%{opacity:0.2}100%{transform:scale(1.8);opacity:0}}
.mist{animation:drift 40s ease-in-out infinite alternate}
.mist2{animation:drift 55s ease-in-out infinite alternate-reverse}
@keyframes drift{from{transform:translateX(-60px)}to{transform:translateX(60px)}}
.flash{opacity:0;animation-name:flash;animation-timing-function:ease-out;animation-iteration-count:infinite}
@keyframes flash{0%{opacity:0}2%{opacity:0.9}14%{opacity:0}100%{opacity:0}}
.flash2{opacity:0;animation-name:flash2;animation-timing-function:ease-out;animation-iteration-count:infinite}
@keyframes flash2{0%{opacity:0}2%{opacity:0.08}12%{opacity:0}100%{opacity:0}}
.bolt{opacity:0;animation-name:bolt;animation-timing-function:ease-out;animation-iteration-count:infinite}
@keyframes bolt{0%{opacity:0}1%{opacity:1}6%{opacity:0}100%{opacity:0}}
</style>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${working ? '#1a242e' : '#24323e'}"/><stop offset="0.6" stop-color="${working ? '#34444f' : '#4a5d6a'}"/><stop offset="1" stop-color="#5d707c"/></linearGradient>
<radialGradient id="flashG" cx="0.7" cy="0.1" r="0.9"><stop offset="0" stop-color="#e8f0fa" stop-opacity="0.95"/><stop offset="0.5" stop-color="#a9bfd4" stop-opacity="0.5"/><stop offset="1" stop-color="#7f97ad" stop-opacity="0"/></radialGradient>
<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d909c" stop-opacity="0"/><stop offset="0.5" stop-color="#7d909c" stop-opacity="0.55"/><stop offset="1" stop-color="#7d909c" stop-opacity="0"/></linearGradient>
<radialGradient id="vig" cx="0.5" cy="0.45" r="0.8"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>
<filter id="boltGlow" x="-100%" y="-20%" width="300%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="soft2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
</defs>
<rect width="1600" height="900" fill="url(#sky)"/>
${storm}
<!-- far ridges, soft with distance -->
<g filter="url(#soft2)">${far1}</g>
<rect class="mist" x="-100" y="440" width="1800" height="160" fill="url(#fog)" filter="url(#soft)"/>
<g filter="url(#soft2)">${far2}</g>
<rect class="mist2" x="-100" y="520" width="1800" height="170" fill="url(#fog)" opacity="0.8" filter="url(#soft)"/>
<g>${rainBack}</g>
${mid}
<rect class="mist" x="-100" y="620" width="1800" height="150" fill="url(#fog)" opacity="0.6" filter="url(#soft)"/>
${near}
<rect class="mist2" x="-100" y="760" width="1800" height="120" fill="url(#fog)" opacity="0.35" filter="url(#soft)"/>
${front}
${splashes(r, working ? 40 : 20)}
<g>${rainFront}</g>
${flashFront}
<rect width="1600" height="900" fill="url(#vig)"/>
</svg>`
}
