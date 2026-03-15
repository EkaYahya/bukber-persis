// ============================================
// BUKA BERSAMA ANGKATAN 27 — UNIFIED FORM
// Google Sheets + Google Drive
// ============================================

const CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwpAWR57Mc4Hyn1-BHhXourRdEtPGBw419M6t3W4jvXpZbNp8UJF48An29Omb8WdQkK/exec',
    DRIVE_FOLDER_ID: '1-nMHqGY1e7DgE7tLBrRySPjQL51nHThW',
    EVENT_DATE: '2026-03-18T17:00:00+07:00',
    MAX_FILE_SIZE: 5 * 1024 * 1024
};

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    createStars();
    createLanterns();
    initCountdown();
    initReveal();
    initForm();
    initFileUpload();
});

// ============ STAR FIELD ============
function createStars() {
    const container = document.getElementById('bgStars');
    const count = window.innerWidth < 600 ? 40 : 80;
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.setProperty('--dur', (3 + Math.random() * 5) + 's');
        star.style.setProperty('--opacity', (0.3 + Math.random() * 0.7).toString());
        star.style.animationDelay = (Math.random() * 5) + 's';
        star.style.width = star.style.height = (1 + Math.random() * 2) + 'px';
        container.appendChild(star);
    }
}

// ============ FLOATING LANTERNS ============
function createLanterns() {
    const container = document.getElementById('lanterns');
    const emojis = ['🏮', '✨', '⭐', '🌟'];
    const count = window.innerWidth < 600 ? 5 : 8;
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'lantern';
        el.textContent = emojis[i % emojis.length];
        el.style.left = (5 + Math.random() * 90) + '%';
        el.style.animationDuration = (10 + Math.random() * 8) + 's';
        el.style.animationDelay = (Math.random() * 12) + 's';
        el.style.fontSize = (18 + Math.random() * 16) + 'px';
        container.appendChild(el);
    }
}

// ============ COUNTDOWN ============
function initCountdown() {
    const target = new Date(CONFIG.EVENT_DATE).getTime();
    function tick() {
        const diff = target - Date.now();
        if (diff <= 0) {
            document.getElementById('days').textContent = '🎉';
            document.getElementById('hours').textContent = '—';
            document.getElementById('minutes').textContent = '—';
            document.getElementById('seconds').textContent = '—';
            return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        document.getElementById('days').textContent = String(d).padStart(2, '0');
        document.getElementById('hours').textContent = String(h).padStart(2, '0');
        document.getElementById('minutes').textContent = String(m).padStart(2, '0');
        document.getElementById('seconds').textContent = String(s).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
}

// ============ SCROLL REVEAL ============
function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ============ UNIFIED FORM ============
let selectedFile = null;

function initForm() {
    const form = document.getElementById('mainForm');
    const btn = document.getElementById('btnSubmit');
    const foodGroup = document.getElementById('foodGroup');
    const uploadSection = document.getElementById('uploadSection');
    const radios = document.querySelectorAll('input[name="kehadiran"]');
    const steps = document.querySelectorAll('.form-step');

    // Toggle food & upload based on attendance
    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'Tidak Hadir') {
                foodGroup.style.opacity = '0.3';
                foodGroup.style.pointerEvents = 'none';
                uploadSection.classList.add('hidden');
                document.querySelectorAll('input[name="makanan"]').forEach(r => r.checked = false);
                // Still allow submit without upload for "Tidak Hadir"
                steps[1].classList.remove('active');
            } else {
                foodGroup.style.opacity = '1';
                foodGroup.style.pointerEvents = 'auto';
                uploadSection.classList.remove('hidden');
                steps[1].classList.add('active');
            }
        });
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fd = new FormData(form);
        const nama = fd.get('nama')?.trim();
        const kehadiran = fd.get('kehadiran');
        const makanan = fd.get('makanan');
        const pesan = fd.get('pesan')?.trim() || '-';

        // Validate
        if (!nama) return toast('Mohon isi nama lengkap', 'error');
        if (!kehadiran) return toast('Mohon pilih konfirmasi kehadiran', 'error');

        if (kehadiran === 'Hadir') {
            if (!makanan) return toast('Mohon pilih makanan', 'error');
            if (!selectedFile) return toast('Upload bukti pembayaran wajib untuk konfirmasi kehadiran', 'error');
        }

        btn.classList.add('loading');
        btn.disabled = true;

        try {
            // Siapkan data file jika ada
            let base64 = '';
            let mimeType = '';
            let fileName = '';

            if (kehadiran === 'Hadir' && selectedFile) {
                base64 = await toBase64(selectedFile);
                mimeType = selectedFile.type;
                fileName = `bukti_${nama.replace(/\s+/g, '_')}_${Date.now()}.${selectedFile.name.split('.').pop()}`;
            }

            // Gabungkan semua data menjadi SATU payload
            const payload = {
                action: 'submit_all',
                timestamp: new Date().toLocaleString('id-ID'),
                nama,
                kehadiran,
                makanan: kehadiran === 'Hadir' ? makanan : '-',
                pesan,
                fileData: base64,
                mimeType,
                fileName,
                folderId: CONFIG.DRIVE_FOLDER_ID
            };

            await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            });

            // Success!
            showOverlay(
                '🎉',
                'Terima Kasih!',
                kehadiran === 'Hadir'
                    ? `Hai ${nama}, konfirmasi & bukti bayar kamu sudah tercatat! Kamu memilih ${makanan}. Sampai jumpa di acara! 🤲`
                    : `Hai ${nama}, sayang sekali kamu tidak bisa hadir. Semoga bisa di lain waktu! 🤲`
            );

            // Reset form
            form.reset();
            resetUpload();
            foodGroup.style.opacity = '1';
            foodGroup.style.pointerEvents = 'auto';
            uploadSection.classList.remove('hidden');
            steps[1].classList.remove('active');

        } catch (err) {
            console.error(err);
            toast('Terjadi kesalahan, silakan coba lagi!', 'error');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    });
}

// ============ FILE UPLOAD ============
function initFileUpload() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('fileInput');

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', e => pickFile(e.target.files[0]));

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragging'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('dragging');
        pickFile(e.dataTransfer.files[0]);
    });
}

function pickFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Hanya file gambar (JPG, PNG)', 'error');
    if (file.size > CONFIG.MAX_FILE_SIZE) return toast('Ukuran maks. 5MB', 'error');

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('uploadPreview').classList.add('active');
        document.getElementById('fileName').textContent = `📎 ${file.name}`;
        document.getElementById('fileName').classList.add('active');
        document.getElementById('uploadZone').classList.add('has-file');

        // Activate step 2 indicator
        document.querySelector('.form-step[data-step="2"]').classList.add('active');
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    selectedFile = null;
    document.getElementById('uploadPreview').classList.remove('active');
    document.getElementById('fileName').classList.remove('active');
    document.getElementById('uploadZone').classList.remove('has-file');
    document.getElementById('fileInput').value = '';
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}

// ============ OVERLAY ============
function showOverlay(icon, title, msg) {
    document.getElementById('overlayIcon').textContent = icon;
    document.getElementById('overlayTitle').textContent = title;
    document.getElementById('overlayMsg').textContent = msg;
    document.getElementById('overlay').classList.add('active');
}

function closeOverlay() {
    document.getElementById('overlay').classList.remove('active');
}

// ============ TOAST ============
function toast(message, type = 'error') {
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span><span>${message}</span>`;
    wrap.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => el.remove(), 300);
    }, 3500);
}

// ============ COPY REKENING ============
function copyRekening() {
    const num = document.getElementById('rekeningNum').textContent;
    const btn = document.getElementById('btnCopy');
    navigator.clipboard.writeText(num).then(() => {
        btn.classList.add('copied');
        btn.querySelector('.btn-copy__text').textContent = '✅ Copied!';
        toast('Nomor rekening berhasil dicopy!', 'success');
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.querySelector('.btn-copy__text').textContent = '📋 Copy';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = num;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.classList.add('copied');
        btn.querySelector('.btn-copy__text').textContent = '✅ Copied!';
        toast('Nomor rekening berhasil dicopy!', 'success');
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.querySelector('.btn-copy__text').textContent = '📋 Copy';
        }, 2000);
    });
}


// ============ GOOGLE APPS SCRIPT ============
/*
 * Paste kode di bawah ini ke Apps Script Editor (Extensions > Apps Script):
 *
 * Buat SATU sheet saja, misal bernama "Sheet1" atau "RSVP", dengan susunan header:
 * Timestamp | Nama | Kehadiran | Makanan | Pesan | File URL | Status
 *
 * (Pastikan urutan header di excel sama persis dengan yang di atas)
 *

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet(); // Menggunakan sheet yang sedang aktif
  
  if (data.action === 'submit_all') {
    var fileUrl = '-';
    var status = '-';
    
    // Kalau ada file yang diupload (Hadir)
    if (data.fileData && data.fileData !== "") {
      try {
        var folder = DriveApp.getFolderById(data.folderId);
        var blob = Utilities.newBlob(Utilities.base64Decode(data.fileData), data.mimeType, data.fileName);
        var file = folder.createFile(blob);
        fileUrl = file.getUrl();
        status = 'Uploaded';
      } catch(err) {
        status = 'Error upload';
      }
    }
    
    // Susun data ke array (Harus sesuai urutan kolom sheet)
    // 1: Timestamp, 2: Nama, 3: Kehadiran, 4: Makanan, 5: Pesan, 6: File URL, 7: Status
    sheet.appendRow([
      data.timestamp, 
      data.nama, 
      data.kehadiran, 
      data.makanan, 
      data.pesan, 
      fileUrl, 
      status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({result:'success'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status:'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}

*/
