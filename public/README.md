# ANTONY AI UPSCALER

Website publik untuk pemrosesan foto dan video. Paket ini adalah versi awal yang bisa dipasang di hosting Node.js.

## Fitur
- Foto: resize sampai batas 4K, Lanczos, sharpening, JPEG kualitas tinggi (Sharp).
- Video: resize maksimal 1080p, Lanczos, unsharp ringan, H.264/AAC (FFmpeg).
- Kuota harian per IP: 10 foto dan 3 video.
- Tampilan responsif untuk HP dan komputer.

## Menjalankan
1. Pasang Node.js 18 atau lebih baru.
2. Pasang FFmpeg di server dan pastikan perintah `ffmpeg` tersedia di PATH.
3. Di folder proyek jalankan: `npm install`
4. Jalankan: `npm start`
5. Buka `http://localhost:3000`.

## Deploy publik
Gunakan hosting yang mendukung aplikasi Node.js dan menyediakan FFmpeg. Upload isi folder ini, jalankan `npm install`, lalu set perintah start ke `npm start`. Domain/URL publik diberikan oleh penyedia hosting.

## Catatan penting
- Website ini tidak memakai model AI generatif. Pembesaran Lanczos dan sharpening dapat memperbaiki tampilan, tetapi tidak dapat menciptakan detail asli yang hilang seperti model AI super-resolution.
- Kuota saat ini disimpan di memori server dan akan reset saat server restart; untuk penggunaan publik sungguhan, ganti dengan Redis/database dan tambahkan autentikasi/rate limiting.
- Output sementara disimpan di folder temporary server; siapkan pembersihan otomatis dan batas penyimpanan untuk produksi.
- Batas upload 250 MB. Hosting dapat menerapkan batas lebih kecil.
- Video 4K dan model AI seperti Real-ESRGAN memerlukan server GPU/layanan AI terpisah dan biaya operasional.
