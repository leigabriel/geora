export function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function drawCover(ctx, img, x, y, w, h) {
  const ratio = Math.max(w / img.width, h / img.height)
  const dw = img.width * ratio
  const dh = img.height * ratio
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

// A solid black chip with one line of text, sized to fit. The chip is
// deliberately theme-independent: it reads the same on paper and on a dark
// globe, and it never collides with the accent colour the rest of the HUD is
// tuned to. Long values shrink rather than spill past the chip.
export function drawChip(ctx, { width, height, text, color, padding = 24, maxWidth, initialSize = 40, minSize = 12 }) {
  ctx.clearRect(0, 0, width, height)
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  let size = initialSize
  const limit = maxWidth ?? width - (padding + 12)
  ctx.font = `bold ${size}px "JetBrains Mono", ui-monospace, monospace`
  while (ctx.measureText(text).width > limit && size > minSize) {
    size -= 2
    ctx.font = `bold ${size}px "JetBrains Mono", ui-monospace, monospace`
  }

  const boxW = Math.min(width, Math.ceil(ctx.measureText(text).width) + padding)
  const boxH = Math.ceil(size * 1.7)
  const x = (width - boxW) / 2
  const y = (height - boxH) / 2

  ctx.fillStyle = "#000000"
  ctx.fillRect(x, y, boxW, boxH)

  ctx.fillStyle = color
  ctx.fillText(text, width / 2, height / 2 + 1)
}

export function drawFlagTexture(ctx, img) {
  ctx.clearRect(0, 0, 128, 96)
  ctx.save()
  roundedRect(ctx, 4, 4, 120, 88, 10)
  ctx.clip()
  ctx.drawImage(img, 4, 4, 120, 88)
  ctx.restore()
  // Light frame: thin white edge for lift, hairline dark edge for definition.
  // No heavy shadow so clustered beacons stay separable from the point cloud.
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 3
  roundedRect(ctx, 4, 4, 120, 88, 10)
  ctx.stroke()
  ctx.strokeStyle = "rgba(0, 0, 0, 0.18)"
  ctx.lineWidth = 1
  roundedRect(ctx, 4, 4, 120, 88, 10)
  ctx.stroke()
}
