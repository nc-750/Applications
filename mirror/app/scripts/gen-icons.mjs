import { writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcVal]);
}

function encodePNG(width, height, pixels) {
  // pixels: Uint8Array [R,G,B,A, R,G,B,A, ...]
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  // bytes 10-12: 0 (compression, filter, interlace)

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Proportional "P" rects (x1, y1, x2, y2) in 0-1 space
const P_RECTS = [
  [0.30, 0.27, 0.42, 0.73], // vertical stem
  [0.30, 0.27, 0.66, 0.38], // top horizontal
  [0.30, 0.49, 0.66, 0.60], // middle horizontal
  [0.54, 0.38, 0.66, 0.49], // right cap
];

function lerp(a, b, t) { return a + (b - a) * t; }

function hexToRGB(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

const BG = hexToRGB("#0f172a");
const INDIGO = hexToRGB("#4f46e5");
const VIOLET = hexToRGB("#7c3aed");
const WHITE = [255, 255, 255];

function generateIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = Math.round(size * 0.18); // rounded corner radius
  const pad = Math.round(size * 0.08);    // inset from edges

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const off = (y * size + x) * 4;

      // ── Is this pixel inside the rounded rect? ──────────────────────────
      const rx = x - pad, ry = y - pad;
      const rw = size - pad * 2, rh = size - pad * 2;
      let inRect = false;
      if (rx >= 0 && ry >= 0 && rx < rw && ry < rh) {
        // Check four rounded corners
        const corners = [
          [radius, radius],
          [rw - radius, radius],
          [radius, rh - radius],
          [rw - radius, rh - radius],
        ];
        inRect = true;
        for (const [cx, cy] of corners) {
          const dx = rx - cx, dy = ry - cy;
          if (dx * dx + dy * dy > radius * radius && rx < radius && ry < radius && rx < rw - (rw - radius) || true) {
            // simpler: just re-test corners directly
          }
        }
        // Proper corner test
        const inCornerZone = (rx < radius && ry < radius) ||
                             (rx >= rw - radius && ry < radius) ||
                             (rx < radius && ry >= rh - radius) ||
                             (rx >= rw - radius && ry >= rh - radius);
        if (inCornerZone) {
          const nearX = rx < radius ? radius : rw - radius;
          const nearY = ry < radius ? radius : rh - radius;
          const dx = rx - nearX, dy = ry - nearY;
          inRect = dx * dx + dy * dy <= radius * radius;
        }
      }

      let r, g, b, a;
      if (!inRect) {
        [r, g, b] = BG;
        a = 255;
      } else {
        // Gradient: indigo (top-left) → violet (bottom-right)
        const t = (x / size + y / size) / 2;
        r = Math.round(lerp(INDIGO[0], VIOLET[0], t));
        g = Math.round(lerp(INDIGO[1], VIOLET[1], t));
        b = Math.round(lerp(INDIGO[2], VIOLET[2], t));
        a = 255;

        // ── Draw "P" lettermark (white) ────────────────────────────────────
        const nx = x / size, ny = y / size;
        for (const [x1, y1, x2, y2] of P_RECTS) {
          if (nx >= x1 && nx < x2 && ny >= y1 && ny < y2) {
            [r, g, b] = WHITE;
            break;
          }
        }
      }

      pixels[off] = r;
      pixels[off + 1] = g;
      pixels[off + 2] = b;
      pixels[off + 3] = a;
    }
  }
  return encodePNG(size, size, pixels);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/192.png", generateIcon(192));
writeFileSync("public/icons/512.png", generateIcon(512));
console.log("Generated public/icons/192.png and public/icons/512.png");
