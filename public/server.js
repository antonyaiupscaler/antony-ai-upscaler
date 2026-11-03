const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const OUT = path.join(os.tmpdir(), "antony-upscaler");
fs.mkdirSync(OUT, { recursive: true });

app.use(express.static(path.join(ROOT, "public")));
app.use("/output", express.static(OUT, { fallthrough: false }));

// Batas demo per alamat IP: 10 foto dan 3 video per hari.
// Untuk produksi skala besar, ganti penyimpanan memori ini dengan Redis/database.
const usage = new Map();
function dailyUsage(ip) {
  const day = new Date().toISOString().slice(0, 10);
  let item = usage.get(ip);
  if (!item || item.day !== day) item = { day, photo: 0, video: 0 };
  usage.set(ip, item);
  return item;
}
function ipOf(req) {
  return (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
}
const upload = multer({
  dest: path.join(os.tmpdir(), "antony-upload"),
  limits: { fileSize: 250 * 1024 * 1024 }
});

app.get("/api/usage", (req, res) => {
  const u = dailyUsage(ipOf(req));
  res.json({ photo: u.photo, video: u.video, photoLimit: 10, videoLimit: 3 });
});

app.post("/api/photo", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Pilih foto terlebih dahulu." });
  const u = dailyUsage(ipOf(req));
  if (u.photo >= 10) {
    fs.unlink(req.file.path, () => {});
    return res.status(429).json({ error: "Batas gratis 10 foto per hari sudah habis." });
  }
  try {
    const id = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
    const dest = path.join(OUT, id);
    await sharp(req.file.path)
      .rotate()
      .resize({ width: 3840, height: 3840, fit: "inside", withoutEnlargement: false, kernel: "lanczos3" })
      .sharpen({ sigma: 1.1 })
      .modulate({ brightness: 1.03, saturation: 1.04 })
      .jpeg({ quality: 94, mozjpeg: true })
      .toFile(dest);
    fs.unlink(req.file.path, () => {});
    u.photo++;
    res.json({ url: "/output/" + id, usage: u.photo, limit: 10, note: "Foto diperbesar dengan Lanczos dan penajaman. Ini bukan rekonstruksi AI generatif." });
  } catch (e) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: "Gagal memproses foto. Coba file lain." });
  }
});

app.post("/api/video", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Pilih video terlebih dahulu." });
  const u = dailyUsage(ipOf(req));
  if (u.video >= 3) {
    fs.unlink(req.file.path, () => {});
    return res.status(429).json({ error: "Batas gratis 3 video per hari sudah habis." });
  }
  const id = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".mp4";
  const dest = path.join(OUT, id);
  // FFmpeg harus tersedia di server hosting.
  const args = ["-y", "-i", req.file.path, "-vf",
    "scale='min(1920,iw*max(1,1080/ih))':'min(1080,ih*max(1,1920/iw))':force_original_aspect_ratio=decrease:flags=lanczos,unsharp=5:5:0.7:3:3:0.2,eq=brightness=0.015:saturation=1.04",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", dest];
  const ff = spawn("ffmpeg", args);
  let err = "";
  ff.stderr.on("data", d => { err += d.toString(); });
  ff.on("close", code => {
    fs.unlink(req.file.path, () => {});
    if (code !== 0) return res.status(500).json({ error: "Pemrosesan video gagal. Pastikan FFmpeg tersedia di server." });
    u.video++;
    res.json({ url: "/output/" + id, usage: u.video, limit: 3, note: "Video diproses dengan Lanczos, penajaman ringan, dan encoding H.264. Maksimum sisi panjang 1920 piksel." });
  });
});

app.listen(PORT, () => console.log(`ANTONY AI UPSCALER berjalan di port ${PORT}`));
