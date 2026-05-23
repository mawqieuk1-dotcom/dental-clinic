// ========== AOS Animation ==========
AOS.init({ duration: 800, once: true });

// ========== Dark Mode ==========
const darkToggle = document.getElementById('darkModeToggle');
const darkCSS = document.getElementById('dark-mode-css');
const body = document.body;
function setDark(e) {
    if (e) { body.classList.add('dark'); darkCSS.disabled = false; darkToggle.innerHTML = '<i class="fas fa-sun"></i>'; }
    else { body.classList.remove('dark'); darkCSS.disabled = true; darkToggle.innerHTML = '<i class="fas fa-moon"></i>'; }
    localStorage.setItem('darkMode', e ? 'enabled' : 'disabled');
}
darkToggle.addEventListener('click', () => setDark(!body.classList.contains('dark')));
if (localStorage.getItem('darkMode') === 'enabled') setDark(true);

// ========== Scroll Hide/Show Header & Bottom Nav ==========
const header = document.getElementById('header');
const bottomNav = document.getElementById('bottomNav');
let lastScroll = 0;
window.addEventListener('scroll', () => {
    let s = window.pageYOffset || document.documentElement.scrollTop;
    if (s > lastScroll && s > 80) { header.classList.add('header-hidden'); if (bottomNav) bottomNav.classList.add('bottom-nav-hidden'); }
    else { header.classList.remove('header-hidden'); if (bottomNav) bottomNav.classList.remove('bottom-nav-hidden'); }
    lastScroll = s;
    updateActiveNav();
});

// ========== تحديث نشاط المنيو العلوي ==========
function updateActiveNav() {
    const sections = ['home', 'why', 'services', 'doctor', 'gallery', 'contact'];
    let current = 'home';
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150) current = id;
        }
    });
    document.querySelectorAll('.nav-list a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#' + current) item.classList.add('active');
    });
}

// ========== Bottom Nav Click ==========
document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

// ========== Counter Animation ==========
const counters = document.querySelectorAll('.counter');
let animated = false;
function animateCounters() {
    counters.forEach(c => {
        const t = +c.getAttribute('data-target'), inc = t / 100;
        const u = () => { const cur = +c.innerText; if (cur < t) { c.innerText = Math.ceil(cur + inc); setTimeout(u, 20); } else c.innerText = t; };
        u();
    });
}
window.addEventListener('scroll', () => {
    const stats = document.querySelector('.hero-stats');
    if (stats && !animated) { const r = stats.getBoundingClientRect(); if (r.top < window.innerHeight - 100) { animateCounters(); animated = true; } }
});

// ========== نظام الحجز مع مودال الدفع ==========
let selectedPayment = null;

// فتح مودال الدفع
function openPaymentModal() {
    const name = document.getElementById('name')?.value?.trim() || '';
    const phone = document.getElementById('phone')?.value?.trim() || '';
    const service = document.getElementById('service')?.value || '';
    const fb = document.getElementById('formFeedback');

    if (!name) { fb.textContent = 'الاسم مطلوب'; fb.style.color = 'red'; return; }
    if (!phone || !/^\d{8,}$/.test(phone)) { fb.textContent = 'رقم الجوال غير صحيح'; fb.style.color = 'red'; return; }
    if (!service) { fb.textContent = 'الرجاء اختيار الخدمة'; fb.style.color = 'red'; return; }
    fb.textContent = ''; fb.style.color = '';

    document.getElementById('paymentModal').classList.add('active');
    document.getElementById('bankSection').style.display = 'none';
    document.getElementById('modalActions').style.display = 'none';
    document.getElementById('paymentOptionsModal').style.display = 'flex';
    selectedPayment = null;
    document.getElementById('btnCod').classList.remove('selected');
    document.getElementById('btnBank').classList.remove('selected');
    document.getElementById('receiptFile').value = '';
    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('modalFeedback').textContent = '';
}

// اختيار طريقة الدفع
function selectPayment(method) {
    selectedPayment = method;
    document.getElementById('btnCod').classList.remove('selected');
    document.getElementById('btnBank').classList.remove('selected');
    if (method === 'cod') {
        document.getElementById('btnCod').classList.add('selected');
        document.getElementById('bankSection').style.display = 'none';
    } else {
        document.getElementById('btnBank').classList.add('selected');
        document.getElementById('bankSection').style.display = 'block';
    }
    document.getElementById('modalActions').style.display = 'block';
}

// رفع الصورة إلى imgbb
async function uploadToImgbb(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('https://api.imgbb.com/1/upload?key=9dc838c75907d91865c9164d1a78c91a', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            return data.data.url;
        }
        return null;
    } catch (error) {
        console.error('فشل رفع الصورة:', error);
        return null;
    }
}

// الإرسال النهائي عبر واتساب
async function submitBooking() {
    const mf = document.getElementById('modalFeedback');
    
    if (!selectedPayment) {
        mf.textContent = 'الرجاء اختيار طريقة الدفع';
        return;
    }
    
    const rf = document.getElementById('receiptFile');
    if (selectedPayment === 'bank' && (!rf || !rf.files || !rf.files.length)) {
        mf.textContent = 'الرجاء رفع صورة إيصال التحويل';
        return;
    }

    mf.textContent = 'جاري تجهيز الرسالة...';
    
    const name = document.getElementById('name')?.value || '';
    const phone = document.getElementById('phone')?.value || '';
    const service = document.getElementById('service')?.selectedOptions[0]?.text || '';
    const date = document.getElementById('date')?.value || 'غير محدد';
    const notes = document.getElementById('notes')?.value || 'لا يوجد';
    const paymentMethod = selectedPayment === 'bank' ? 'تحويل بنكي' : 'دفع عند الاستلام';
    const line = '━━━━━━━━━━━━━━━━━━';

    // رفع صورة الحوالة إن وجدت
    let receiptLink = '';
    if (selectedPayment === 'bank' && rf && rf.files && rf.files.length) {
        mf.textContent = 'جاري رفع صورة الحوالة...';
        receiptLink = await uploadToImgbb(rf.files[0]);
    }

    // بناء رسالة الواتساب
    let msg = `*حجز موعد جديد - عيادة الابتسامة*\n\n`;
    msg += `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `تم استلام طلب حجز موعد جديد بالمعلومات التالية:\n\n`;
    msg += `${line}\n\n`;
    msg += `*اسم المريض:* ${name}\n`;
    msg += `*رقم الجوال:* ${phone}\n\n`;
    msg += `${line}\n\n`;
    msg += `*الخدمة:* ${service}\n`;
    msg += `*التاريخ:* ${date}\n\n`;
    msg += `${line}\n\n`;
    msg += `*طريقة الدفع:* ${paymentMethod}\n`;
    
    if (selectedPayment === 'bank') {
        msg += `\n*معلومات التحويل البنكي:*\n`;
        msg += `• البنك: بنك الكويت الوطني\n`;
        msg += `• رقم الحساب: 1234567890\n`;
        msg += `• IBAN: KW12345678901234567890\n`;
        if (receiptLink) {
            msg += `\n📎 *رابط صورة الحوالة:*\n${receiptLink}\n`;
        }
    }
    
    msg += `\n${line}\n\n`;
    msg += `*ملاحظات المريض:*\n${notes}\n\n`;
    msg += `${line}\n\n`;
    msg += `*للتواصل مع المريض:* ${phone}\n\n`;
    msg += `مع تحيات،\n`;
    msg += `*عيادة الابتسامة - الكويت*`;

    // فتح واتساب
    window.open(`https://wa.me/966507652943?text=${encodeURIComponent(msg)}`, '_blank');
    
    mf.textContent = '✅ تم فتح واتساب!';
    
    // إعادة تعيين النموذج بعد 3 ثواني
    setTimeout(() => {
        document.getElementById('paymentModal').classList.remove('active');
        document.getElementById('bookingForm').reset();
        mf.textContent = '';
        document.getElementById('bankSection').style.display = 'none';
        document.getElementById('modalActions').style.display = 'none';
        document.getElementById('paymentOptionsModal').style.display = 'flex';
        document.getElementById('previewImage').style.display = 'none';
    }, 3000);
}

// ========== معاينة صورة الحوالة ==========
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const receiptFile = document.getElementById('receiptFile');
    const previewImage = document.getElementById('previewImage');
    
    if (uploadArea && receiptFile) {
        uploadArea.addEventListener('click', () => receiptFile.click());
        receiptFile.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // إغلاق المودال عند النقر خارجه
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
        paymentModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
});