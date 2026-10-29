const PAGE_URLS = { home: '/', menu: '/menu/', gallery: '/gallery/', about: '/about/', book: '/book/', privacy: '/privacy/' };
function switchPage(name) { location.href = PAGE_URLS[name] || '/'; }

/* MOBILE MENU */
function openMenu() {
    document.getElementById('sideMenu').classList.add('active');
    document.getElementById('sideMenuOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    document.getElementById('sideMenu').classList.remove('active');
    document.getElementById('sideMenuOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.getElementById('sideMenu').classList.contains('active')) {
        closeMenu();
    }
});

/* GALLERY: SCROLL-DRIVEN SHOWCASE */
const GALLERY_TINTS = {
    'img-matchas':          '#1a3328',
    'img-pistachio-matcha': '#2a3a22',
    'img-lattes':           '#33241b',
    'img-pistachio-latte':  '#2e3220',
    'img-mint':             '#16362f',
    'img-strawberry':       '#3a1f29'
};

const galleryReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let galleryState = null;
let galleryQueued = false;
let galleryActiveItem = null;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function buildGallery() {
    const page = document.getElementById('page-gallery');
    const rail = document.getElementById('galleryRail');
    const images = {};

    page.querySelectorAll('.gallery-visuals img').forEach(img => { images[img.id] = img; });

    const items = Array.from(page.querySelectorAll('.gallery-step')).map(step => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Go to ' + step.querySelector('h2').textContent);
        dot.addEventListener('click', () => scrollToGalleryStep(step));
        rail.appendChild(dot);

        return {
            step,
            dot,
            card: step.querySelector('.step-card'),
            image: images[step.dataset.image],
            d: null   // eased position; null until the first frame so nothing sweeps on load
        };
    });

    return { page, items };
}

function scrollToGalleryStep(step) {
    const rect = step.getBoundingClientRect();
    const top = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
    window.scrollTo({ top, behavior: galleryReduceMotion.matches ? 'auto' : 'smooth' });
}

function setActiveGalleryItem(item) {
    galleryActiveItem = item;

    galleryState.items.forEach(other => {
        const isActive = other === item;
        other.step.classList.toggle('is-active', isActive);
        other.dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    const tint = GALLERY_TINTS[item.step.dataset.image];
    if (tint) document.documentElement.style.setProperty('--tint', tint);
}

function galleryFrame() {
    galleryQueued = false;

    const page = document.getElementById('page-gallery');
    if (!page || !page.classList.contains('active')) return;

    if (!galleryState) galleryState = buildGallery();

    const still = galleryReduceMotion.matches;
    const viewportCenter = window.innerHeight / 2;
    let settled = true;
    let nearest = null;
    let nearestDistance = Infinity;

    for (const item of galleryState.items) {
        const rect = item.step.getBoundingClientRect();

        // -1.5 to 1.5: 0 = step centred, ±1 = one full step away
        const target = clamp((rect.top + rect.height / 2 - viewportCenter) / rect.height, -1.5, 1.5);

        if (item.d === null || still) {
            item.d = target;
        } else {
            item.d += (target - item.d) * 0.16;   // easing toward the scroll position
            if (Math.abs(target - item.d) > 0.001) settled = false;
            else item.d = target;
        }

        if (Math.abs(target) < nearestDistance) {
            nearestDistance = Math.abs(target);
            nearest = item;
        }

        const d = still ? 0 : item.d;
        const abs = Math.abs(item.d);

        if (item.image) {
            item.image.style.opacity = clamp((0.8 - abs) / 0.5, 0, 1).toFixed(3);
            item.image.style.zIndex = abs < 0.5 ? 2 : 1;
            item.image.style.setProperty('--d', d.toFixed(4));
            item.image.style.setProperty('--a', (still ? 0 : abs).toFixed(4));
        }

        item.card.style.opacity = clamp(1 - (abs - 0.12) / 0.38, 0, 1).toFixed(3);
        item.card.style.setProperty('--d', d.toFixed(4));
    }

    if (nearest && nearest !== galleryActiveItem) setActiveGalleryItem(nearest);

    if (!settled) {
        galleryQueued = true;
        requestAnimationFrame(galleryFrame);
    }
}

function handleGalleryScroll() {
    if (galleryQueued) return;
    galleryQueued = true;
    requestAnimationFrame(galleryFrame);
}

window.addEventListener('scroll', handleGalleryScroll, { passive: true });
window.addEventListener('resize', handleGalleryScroll, { passive: true });
window.addEventListener('load', handleGalleryScroll);

/* COOKIE CONSENT + GOOGLE ANALYTICS */
const GA_ID = 'G-WTRDJ5W9KK';
const CONSENT_KEY = 'dm-cookie-consent';

function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
}

function loadAnalytics() {
    if (window.gaLoaded) return;
    window.gaLoaded = true;
    window['ga-disable-' + GA_ID] = false;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID);
}

function setCookieConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
    document.getElementById('cookieBanner').hidden = true;

    if (value === 'granted') {
        loadAnalytics();
    } else {
        window['ga-disable-' + GA_ID] = true;
    }
}

function openCookieBanner() {
    document.getElementById('cookieBanner').hidden = false;
}

(function initConsent() {
    const consent = getConsent();
    if (consent === 'granted') loadAnalytics();
    else if (consent === 'denied') window['ga-disable-' + GA_ID] = true;
    else openCookieBanner();
})();

/* MOTION + INTERACTIVE */
const reduceMo = window.matchMedia('(prefers-reduced-motion: reduce)');
const REVEAL_SEL = '.section-heading,.hero-text>*,.featured-text>*,.featured-image,.trio .menu-card,.menu-grid .menu-card,.about-text>*,.about-box,.faq details,.quote-card,.booking .container>*,.legal-content,.builder-grid>*';
let revealObserver = null;
let revealReady = false;

function setupReveal(root) {
    if (!root || !revealReady || reduceMo.matches || !('IntersectionObserver' in window)) return;
    revealObserver = revealObserver || new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('in'); revealObserver.unobserve(entry.target); }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    root.querySelectorAll(REVEAL_SEL).forEach((el, i) => {
        if (el.dataset.rv) return;
        el.dataset.rv = '1';
        el.classList.add('rv');
        el.style.setProperty('--i', i % 6);
        revealObserver.observe(el);
    });
}

(function introSequence() {
    const intro = document.getElementById('intro');
    const start = () => { revealReady = true; setupReveal(document.querySelector('.page-section.active')); };
    let seen = false;
    try { seen = sessionStorage.getItem('dm-intro') === '1'; } catch (e) {}
    if (!intro || reduceMo.matches || seen) { if (intro) intro.remove(); start(); return; }
    try { sessionStorage.setItem('dm-intro', '1'); } catch (e) {}
    setTimeout(() => intro && intro.classList.add('done'), 1500);
    setTimeout(start, 1800);
    setTimeout(() => intro && intro.remove(), 2600);
})();

(function decoration() {
    const hero = document.querySelector('.hero');
    if (hero && !reduceMo.matches) {
        for (let i = 0; i < 12; i++) {
            const b = document.createElement('span');
            const size = 8 + Math.random() * 22;
            b.className = 'bubble';
            b.style.cssText = 'left:' + (Math.random() * 100) + '%;width:' + size + 'px;height:' + size + 'px;--t:' + (7 + Math.random() * 7) + 's;--d:-' + (Math.random() * 10) + 's;--x:' + ((Math.random() - 0.5) * 60) + 'px;--h:900px';
            hero.appendChild(b);
        }
    }
    if (!reduceMo.matches && window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('.hero-image,.featured-image').forEach(box => {
            const img = box.querySelector('img');
            box.addEventListener('pointermove', e => {
                const r = box.getBoundingClientRect();
                img.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 10) + 'deg');
                img.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - 0.5) * 8) + 'deg');
            });
            box.addEventListener('pointerleave', () => { img.style.setProperty('--rx', '0deg'); img.style.setProperty('--ry', '0deg'); });
        });
    }
})();

document.addEventListener('click', e => {
    const btn = e.target.closest('.button,.booking-button');
    if (!btn || reduceMo.matches) return;
    const r = btn.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.left = (e.clientX - r.left) + 'px';
    dot.style.top = (e.clientY - r.top) + 'px';
    btn.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
});

/* MENU FILTER */
(function menuFilter() {
    const CATS = { 'Matcha': 'matcha', 'Matcha Spanish': 'matcha', 'Iced Latte': 'latte', 'Spanish Latte': 'latte', 'Mojitos': 'mojito' };
    const cards = Array.from(document.querySelectorAll('#page-menu .menu-card'));
    cards.forEach(c => { c.dataset.cat = CATS[c.querySelector('h3').textContent.trim()] || 'all'; });
    const tabs = Array.from(document.querySelectorAll('.tab'));
    tabs.forEach(tab => tab.addEventListener('click', () => {
        tabs.forEach(t => t.setAttribute('aria-pressed', String(t === tab)));
        const f = tab.dataset.filter;
        cards.forEach(c => {
            const show = f === 'all' || c.dataset.cat === f;
            c.hidden = !show;
            if (show && c.classList.contains('rv')) {
                c.classList.remove('in');
                void c.offsetWidth;
                requestAnimationFrame(() => c.classList.add('in'));
            }
        });
    }));
})();

/* BUILD YOUR DRINK (names, prices and descriptions are read from the menu above) */
(function drinkBuilder() {
    const root = document.getElementById('builderControls');
    if (!root) return;
    const DRINKS = {
        'matcha-regular-original': 'Original Matcha', 'matcha-regular-vanilla': 'Vanilla Matcha', 'matcha-regular-caramel': 'Caramel Matcha',
        'matcha-spanish-original': 'Matcha Spanish Latte', 'matcha-spanish-vanilla': 'Vanilla Matcha Spanish', 'matcha-spanish-caramel': 'Caramel Matcha Spanish', 'matcha-spanish-pistachio': 'Pistachio Matcha Spanish',
        'latte-regular-original': 'Iced Latte', 'latte-regular-vanilla': 'Iced Vanilla Latte', 'latte-regular-caramel': 'Iced Caramel Latte',
        'latte-spanish-original': 'Original Spanish Latte', 'latte-spanish-vanilla': 'Vanilla Spanish Latte', 'latte-spanish-caramel': 'Caramel Spanish Latte', 'latte-spanish-pistachio': 'Pistachio Spanish Latte'
    };
    const GROUPS = [
        ['base', 'Base', [['matcha', 'Matcha'], ['latte', 'Iced latte']]],
        ['flavour', 'Flavour', [['original', 'Original'], ['vanilla', 'Vanilla'], ['caramel', 'Caramel'], ['pistachio', 'Pistachio']]],
        ['style', 'Style', [['regular', 'Regular'], ['spanish', 'Spanish']]]
    ];
    const BASE = { matcha: ['#7fa05a', '#e9e2c8'], latte: ['#6b4a36', '#d9c1a0'] };
    const SYRUP = { original: 'transparent', vanilla: '#f2e3b3', caramel: '#c98a3a', pistachio: '#a9c27a' };
    root.innerHTML = GROUPS.map(([key, label, opts]) =>
        '<fieldset><legend>' + label + '</legend><div class="chips">' +
        opts.map(([v, t], i) => '<label class="chip"><input type="radio" name="b-' + key + '" value="' + v + '"' + (i ? '' : ' checked') + '><span>' + t + '</span></label>').join('') +
        '</div></fieldset>').join('');
    const menu = {};
    document.querySelectorAll('#page-menu .menu-item').forEach(item => {
        menu[item.querySelector('.menu-item-name').textContent.trim()] = {
            price: item.querySelector('.menu-price').textContent.trim(),
            desc: item.querySelector('.menu-item-desc').textContent.trim()
        };
    });
    const val = k => root.querySelector('input[name="b-' + k + '"]:checked').value;
    const $ = id => document.getElementById(id);
    function render() {
        const regular = val('style') === 'regular';
        const pist = root.querySelector('input[value="pistachio"]');
        pist.disabled = regular;
        if (regular && pist.checked) root.querySelector('input[value="original"]').checked = true;
        const name = DRINKS[val('base') + '-' + val('style') + '-' + val('flavour')];
        const info = menu[name] || {};
        $('rName').textContent = name;
        $('rPrice').textContent = info.price || '';
        $('rDesc').textContent = info.desc || '';
        $('rNote').hidden = !regular;
        const g = $('glass');
        g.style.setProperty('--liq', BASE[val('base')][0]);
        g.style.setProperty('--top', BASE[val('base')][1]);
        g.style.setProperty('--syr', SYRUP[val('flavour')]);
        g.classList.toggle('spanish', val('style') === 'spanish');
        const res = $('builderResult');
        res.classList.remove('swap');
        void res.offsetWidth;
        res.classList.add('swap');
    }
    root.addEventListener('change', render);
    render();
})();

/* QUOTE HELPER */
(function quoteHelper() {
    const g = id => document.getElementById(id);
    if (!g('qMail')) return;
    function update() {
        const lines = [
            "Hi Drinks Madness, I'd like a quote for an event.",
            'Event type: ' + g('qType').value,
            'Payment: ' + g('qPay').value,
            'Date: ' + (g('qDate').value || 'to be confirmed'),
            'Location: ' + (g('qLoc').value.trim() || 'to be confirmed'),
            'Guests: ' + (g('qGuests').value || 'to be confirmed')
        ];
        const text = lines.join('\n');
        g('qMail').href = 'mailto:info@drinksmadness.com?subject=' + encodeURIComponent('Event enquiry - Drinks Madness') + '&body=' + encodeURIComponent(text);
        g('qWa').href = 'https://wa.me/447442453031?text=' + encodeURIComponent(text);
    }
    ['qDate', 'qLoc', 'qGuests', 'qType', 'qPay'].forEach(id => g(id).addEventListener('input', update));
    const qs = new URLSearchParams(location.search);
    const wantType = qs.get('type');
    if (wantType && Array.from(g('qType').options).some(o => o.value === wantType)) g('qType').value = wantType;
    update();

    /* Date check: free, already booked, or less than a month away */
    function checkDate() {
        const v = g('qDate').value, el = g('qDateErr');
        el.className = 'field-error';
        if (!v) { el.textContent = ''; return ''; }
        const days = (new Date(v + 'T00:00:00') - new Date()) / 864e5;
        if ((window.BOOKED_DATES || []).indexOf(v) > -1) { el.textContent = "Sorry, we are already booked on that date. Please try another day."; return 'booked'; }
        if (days < 30) { el.textContent = 'That date is less than a month away. We ask for bookings at least one month in advance.'; return 'soon'; }
        el.textContent = "Looks free. Send us your details and we'll confirm."; el.classList.add('ok'); return 'free';
    }

    /* Inline checks: each problem is shown next to its field and focus moves to the first one */
    const FIELDS = [['qDate', 'qDateErr', 'Choose your event date.'], ['qLoc', 'qLocErr', 'Add the area or venue.'], ['qGuests', 'qGuestsErr', 'Add roughly how many guests.']];
    function validate() {
        let first = null;
        FIELDS.forEach(([id, errId, msg]) => {
            const el = g(id);
            const bad = !el.value.trim() || (id === 'qGuests' && Number(el.value) < 1);
            el.setAttribute('aria-invalid', bad ? 'true' : 'false');
            g(errId).textContent = bad ? msg : '';
            if (bad && !first) first = el;
        });
        if (g('qDate').value) {
            if (checkDate() === 'booked') { g('qDate').setAttribute('aria-invalid', 'true'); if (!first) first = g('qDate'); }
        }
        return first;
    }
    FIELDS.forEach(([id, errId]) => g(id).addEventListener('input', () => { g(id).setAttribute('aria-invalid', 'false'); g(errId).textContent = ''; }));
    g('qDate').addEventListener('input', checkDate);
    ['qMail', 'qWa'].forEach(id => g(id).addEventListener('click', e => {
        const first = validate();
        if (first) { e.preventDefault(); e.stopImmediatePropagation(); first.focus(); }
    }));
})();

/* OLD #menu STYLE LINKS GO TO THE NEW PAGES */
(function legacyHash() {
    const h = location.hash.slice(1);
    if (location.pathname === '/' && h && h !== 'home' && PAGE_URLS[h]) location.replace(PAGE_URLS[h]);
})();

document.addEventListener('click', e => {
    const el = e.target.closest('[data-track]');
    if (el && window.gtag) gtag('event', 'click_' + el.dataset.track);
});

/* PAY OPTIONS CHOOSER */
(function payChooser() {
    const res = document.getElementById('pqResult');
    if (!res) return;
    const val = n => document.querySelector('input[name="' + n + '"]:checked').value;
    const OUT = {
        u: ['Unlimited drinks looks like a good fit. Guests can relax and enjoy as many drinks as they like until our stock runs out.', 'Unlimited drinks until stock runs out'],
        p: ['Paying per drink looks like a good fit. Each drink is paid for as it is served.', 'Pay per drink'],
        n: ['Not sure yet? Tell us about your event and we will talk it through.', 'Not sure yet']
    };
    let pick = 'n';
    function show() {
        const a = val('pq1'), b = val('pq2'), score = (a === 'u') + (b === 'u') - (a === 'p') - (b === 'p');
        pick = score > 0 ? 'u' : score < 0 ? 'p' : 'n';
        res.textContent = OUT[pick][0];
    }
    document.querySelectorAll('input[name="pq1"],input[name="pq2"]').forEach(i => i.addEventListener('change', show));
    show();
    document.getElementById('pqUse').addEventListener('click', () => {
        const sel = document.getElementById('qPay');
        if (sel) sel.value = OUT[pick][1];
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        const plan = document.getElementById('plan');
        plan.scrollIntoView({ behavior: reduceMo.matches ? 'auto' : 'smooth' });
        document.getElementById('qDate').focus({ preventScroll: true });
    });
})();

/* REVIEWS (hidden until reviews.js has real reviews) + REVIEW LINK */
(function reviews() {
    const list = window.DM_REVIEWS || [];
    const sec = document.getElementById('reviews');
    if (sec && list.length) {
        const box = document.getElementById('reviewList');
        list.forEach(r => {
            const card = document.createElement('div'); card.className = 'menu-card';
            const p = document.createElement('p'); p.textContent = '\u201C' + r.text + '\u201D';
            const h = document.createElement('h3'); h.textContent = r.name;
            card.appendChild(p); card.appendChild(h); box.appendChild(card);
        });
        sec.hidden = false;
    }
    const link = document.getElementById('reviewLink');
    if (link && window.DM_REVIEW_LINK) { link.href = window.DM_REVIEW_LINK; link.hidden = false; }
})();

/* SIGNATURE SCROLL STORY: an iced matcha latte comes together as you scroll */
(function pourStory() {
    const sec = document.getElementById('pour');
    if (!sec) return;
    const $ = id => document.getElementById(id);
    const milk = $('psMilk'), matcha = $('psMatcha'), stream = $('psStream'), cap = $('psCap');
    const ices = Array.from(document.querySelectorAll('.ps-ice'));
    const CAPS = ['Start with ice.', 'Add the milk.', 'Pour the matcha.', 'A little madness in every drink.'];
    let last = -1, queued = false;
    function render() {
        queued = false;
        const still = reduceMo.matches;
        let p = 1;
        if (!still) { const r = sec.getBoundingClientRect(); p = clamp(-r.top / (r.height - window.innerHeight), 0, 1); }
        const e = (a, b) => clamp((p - a) / (b - a), 0, 1);
        ices.forEach((ic, i) => { ic.style.transform = 'translateY(' + ((1 - e(0.02 + i * 0.05, 0.22 + i * 0.05)) * -170) + 'px)'; });
        milk.style.transform = 'scaleY(' + e(0.25, 0.55) + ')';
        matcha.style.transform = 'scaleY(' + e(0.55, 0.85) + ')';
        stream.style.opacity = (!still && p > 0.24 && p < 0.88) ? 1 : 0;
        const idx = p < 0.25 ? 0 : p < 0.55 ? 1 : p < 0.85 ? 2 : 3;
        if (idx !== last) { cap.textContent = CAPS[idx]; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); last = idx; }
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(render); } }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    render();
})();
