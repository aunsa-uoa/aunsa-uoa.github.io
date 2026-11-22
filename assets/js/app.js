/* AUNSA website
   Builds the header, footer and page content from the files in /data.
   Execs don't need to touch this file: edit content in the editing panel
   (Pages CMS) or in the /data/*.json files instead. */
(function () {
  'use strict';

  var BASE = new URL('../../', document.currentScript.src);
  var PAGE = document.body.getAttribute('data-page') || '';
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NAV = [
    { href: 'index.html', label: 'Home', page: 'home' },
    { href: 'events.html', label: 'Events', page: 'events' },
    { href: 'team.html', label: 'About us', page: 'team' },
    { href: 'resources.html', label: 'Resources', page: 'resources' },
    { href: 'contact.html', label: 'Contact us', page: 'contact' }
  ];

  /* Linktree's logo, used for the Linktree button */
  var LINKTREE_LOGO = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="m13.736 5.853 4.005-4.117 2.325 2.381-4.201 4.005h5.909v3.305h-5.937l4.229 4.108-2.325 2.334L12 12.099l-5.74 5.769-2.325-2.325 4.229-4.108H2.226V8.121h5.909L3.934 4.117l2.325-2.381 4.005 4.117V0h3.472zm-3.472 10.306h3.472V24h-3.472z"/></svg>';

  var DISCORD_LOGO = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>';
  var LOGOS = { linktree: LINKTREE_LOGO, discord: DISCORD_LOGO, instagram: icon('instagram'), email: icon('mail') };

  /* ---------- Icons ---------- */
  function icon(name) {
    var paths = {
      menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
      close: '<path d="M18 6 6 18M6 6l12 12"/>',
      sliders: '<path d="M21 5h-7M10 5H3M21 12h-9M8 12H3M21 19h-5M12 19H3M14 3v4M8 10v4M16 17v4"/>',
      link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
      left: '<path d="m15 18-6-6 6-6"/>',
      right: '<path d="m9 18 6-6-6-6"/>',
      clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
      pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
      calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
      mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
      instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
      chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      form: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
      book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
      heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
      building: '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
      doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (paths[name] || '') + '</svg>';
  }

  /* ---------- Helpers ---------- */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Turns "/assets/uploads/photo.jpg" into a full address that works on any host. */
  function asset(path) {
    if (!path) return '';
    if (/^(https?:|data:|mailto:|tel:)/i.test(path)) return path;
    return new URL(String(path).replace(/^\/+/, ''), BASE).href;
  }

  /* Only allow web, email and phone links from content files. */
  function safeUrl(url) {
    if (!url) return '';
    url = String(url).trim();
    return /^(https?:|mailto:|tel:|sms:)/i.test(url) ? url : '';
  }

  function slugify(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function parseDate(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }

  function formatDate(date, opts) {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-NZ', opts || { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  function today() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getJSON(name) {
    return window.AUNSA_DATA.load(name);
  }

  /* Photo attribute: the real address is filled in by AUNSA_DATA.hydrate(). */
  var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  function img(ref) {
    return 'src="' + BLANK + '" data-img="' + esc(ref || '') + '"';
  }

  function $(selector) { return document.querySelector(selector); }

  function fill(selector, html) {
    var el = $(selector);
    if (el) {
      el.innerHTML = html;
      window.AUNSA_DATA.hydrate(el);
    }
    return el;
  }

  function showError(selector) {
    fill(selector, '<p class="load-error">Sorry, this part of the page didn\'t load. Try refreshing. ' +
      '(Execs: if you opened the file straight from your computer, see "Previewing" in the README.)</p>');
  }

  /* ---------- Header & footer ---------- */
  function renderHeader(site) {
    var current = PAGE === 'guide' ? 'resources' : PAGE;
    var links = NAV.map(function (item) {
      return '<li><a href="' + item.href + '"' + (item.page === current ? ' aria-current="page"' : '') + '>' + item.label + '</a></li>';
    }).join('');
    var linktree = safeUrl(site.linktreeUrl);

    fill('#site-header',
      '<header class="site-header"><div class="container header-inner">' +
        '<a class="brand" href="index.html" aria-label="' + esc(site.shortName || 'AUNSA') + ' home">' +
          '<img src="' + asset('assets/img/logo/aunsa-mark.webp') + '" alt="" width="48" height="48">' +
          '<span class="brand-text"><span class="brand-name">AUN<span>SA</span></span>' +
          '<span class="brand-sub">' + esc(site.fullName) + '</span></span>' +
        '</a>' +
        '<nav id="site-nav" class="site-nav" aria-label="Main"><ul>' + links + '</ul></nav>' +
        '<a class="btn btn-purple btn-sm join-btn" href="join.html"' + (PAGE === 'join' ? ' aria-current="page"' : '') + '>Join AUNSA!</a>' +
        (linktree ? '<a class="linktree-btn" href="' + esc(linktree) + '" aria-label="AUNSA on Linktree" title="Linktree">' + LINKTREE_LOGO + '</a>' : '') +
        '<button class="icon-btn nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">' + icon('menu') + '<span class="btn-label">Menu</span></button>' +
        '<button class="icon-btn comfort-btn" type="button" data-open-comfort aria-haspopup="dialog">' + icon('sliders') + '<span class="visually-hidden">Comfort settings</span></button>' +
      '</div></header>');

    initMenu();
    initComfort();
  }

  function renderFooter(site) {
    var connect = [
      safeUrl(site.instagramUrl) && '<li><a class="footer-social" href="' + esc(site.instagramUrl) + '">' + '<span class="brand-logo brand-instagram">' + LOGOS.instagram + '</span>' + 'Instagram</a></li>',
      safeUrl(site.linktreeUrl) && '<li><a class="footer-social" href="' + esc(site.linktreeUrl) + '">' + '<span class="brand-logo brand-linktree">' + LOGOS.linktree + '</span>' + 'Linktree</a></li>',
      safeUrl(site.discordUrl) && '<li><a class="footer-social" href="' + esc(site.discordUrl) + '">' + '<span class="brand-logo brand-discord">' + LOGOS.discord + '</span>' + 'Discord</a></li>',
      site.email && '<li><a class="footer-social" href="mailto:' + esc(site.email) + '">' + '<span class="brand-logo brand-email">' + LOGOS.email + '</span>' + esc(site.email) + '</a></li>'
    ].filter(Boolean).join('');

    fill('#site-footer',
      '<footer class="site-footer"><div class="container">' +
        '<div class="footer-grid">' +
          '<div class="footer-about">' +
            '<img class="footer-logo" src="' + asset('assets/img/logo/aunsa-mark.webp') + '" alt="" width="72" height="72">' +
            '<p><strong>' + esc(site.fullName) + '</strong><br>' + esc(site.tagline) + '</p>' +
            '<p class="footer-help">We\'re students, not health professionals. If you need to talk to someone right now, free call or text <a href="tel:1737">1737</a>.</p>' +
          '</div>' +
          '<nav aria-label="Footer"><h2 class="footer-heading">Explore</h2><ul>' +
            NAV.map(function (item) { return '<li><a href="' + item.href + '">' + item.label + '</a></li>'; }).join('') +
            '<li><a href="join.html">Join AUNSA!</a></li>' +
          '</ul></nav>' +
          '<div><h2 class="footer-heading">Connect</h2><ul>' + connect + '</ul></div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<p>© ' + new Date().getFullYear() + ' ' + esc(site.shortName || 'AUNSA') + ' · Waipapa Taumata Rau, University of Auckland</p>' +
          '<p><a href="admin.html">Exec login</a></p>' +
        '</div>' +
      '</div></footer>');
  }

  /* Fills any element marked data-site="key" with that club setting. */
  function bindSite(site) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-logo]'), function (el) {
      var logo = LOGOS[el.getAttribute('data-logo')];
      if (logo && !el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', '<span class="brand-logo brand-' + el.getAttribute('data-logo') + '">' + logo + '</span>');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-site]'), function (el) {
      var value = site[el.getAttribute('data-site')];
      if (value) el.textContent = value;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-site-href]'), function (el) {
      var url = safeUrl(site[el.getAttribute('data-site-href')]);
      if (url) el.href = url;
      else el.hidden = true;
    });
  }

  /* ---------- Events ---------- */
  function splitEvents(events) {
    var now = today();
    var list = (events || []).filter(function (e) { return e && e.title; }).map(function (e) {
      var copy = Object.assign({}, e);
      copy._date = parseDate(e.date);
      copy._id = 'e-' + slugify(e.title + '-' + (e.date || ''));
      return copy;
    });
    var upcoming = list.filter(function (e) { return !e._date || e._date >= now; })
      .sort(function (a, b) { return (a._date || 0) - (b._date || 0); });
    var past = list.filter(function (e) { return e._date && e._date < now; })
      .sort(function (a, b) { return b._date - a._date; });
    return { upcoming: upcoming, past: past };
  }

  function eventCard(e) {
    var rows = [
      e.noise && ['Noise', e.noise],
      e.groupSize && ['Group size', e.groupSize],
      ['Quiet space', e.quietSpace ? 'Yes' : 'No'],
      e.accessNotes && ['Good to know', e.accessNotes]
    ].filter(Boolean);
    var signup = safeUrl(e.signupUrl);

    return '<article class="card event-card" id="' + e._id + '">' +
      (e.image ? '<img class="event-img" ' + img(e.image) + ' alt="" loading="lazy">' : '') +
      '<div class="event-body">' +
        '<span class="pill event-date-pill">' + esc(e._date ? formatDate(e._date) : 'Date to be confirmed') + '</span>' +
        '<h3>' + esc(e.title) + '</h3>' +
        '<ul class="event-meta">' +
          (e.time ? '<li>' + icon('clock') + esc(e.time) + '</li>' : '') +
          (e.location ? '<li>' + icon('pin') + esc(e.location) + '</li>' : '') +
        '</ul>' +
        (e.summary ? '<p>' + esc(e.summary) + '</p>' : '') +
        '<details class="sensory"><summary>Sensory guide</summary><dl>' +
          rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') +
        '</dl></details>' +
        '<div class="event-actions">' +
          (signup ? '<a class="btn btn-purple btn-sm" href="' + esc(signup) + '">Sign up<span class="visually-hidden"> for ' + esc(e.title) + '</span></a>'
                  : '') +
        '</div>' +
      '</div></article>';
  }

  function pastCard(e) {
    var photos = safeUrl(e.photosUrl);
    return '<li><article class="past-card" id="' + e._id + '">' +
      (e.image ? '<img ' + img(e.image) + ' alt="" loading="lazy">' : '') +
      '<div class="past-body">' +
        '<h3>' + esc(e.title) + '</h3>' +
        '<p>' + esc(formatDate(e._date, { day: 'numeric', month: 'long', year: 'numeric' })) + '</p>' +
        (e.summary ? '<p>' + esc(e.summary) + '</p>' : '') +
        (photos ? '<a href="' + esc(photos) + '">See photos<span class="visually-hidden"> from ' + esc(e.title) + '</span></a>' : '') +
      '</div></article></li>';
  }

  function renderEventsPage(events) {
    var split = splitEvents(events);
    fill('#upcoming-list', split.upcoming.length
      ? '<div class="event-list">' + split.upcoming.map(eventCard).join('') + '</div>'
      : '<p class="empty">Nothing planned just yet. Keep an eye on our Instagram!</p>');
    fill('#past-list', split.past.length
      ? '<ul class="past-grid">' + split.past.map(pastCard).join('') + '</ul>'
      : '<p class="empty">Photos from our past events will show up here.</p>');
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  /* ---------- Home ---------- */
  function renderCarousel(events) {
    var split = splitEvents(events);
    var slides = split.past.filter(function (e) { return e.image; }).slice(0, 8);
    if (!slides.length) slides = split.upcoming.filter(function (e) { return e.image; }).slice(0, 8);

    var root = $('#recent-events');
    if (!root) return;
    if (!slides.length) {
      fill('#recent-events', '<p class="empty">Photos from our events will appear here.</p>');
      return;
    }

    root.innerHTML =
      '<div class="carousel" role="region" aria-roledescription="carousel" aria-labelledby="recent-title">' +
        '<ul class="carousel-track" tabindex="0" aria-label="Recent events, scroll sideways for more">' +
          slides.map(function (e, i) {
            return '<li class="slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + slides.length + '">' +
              '<a class="slide-card" href="events.html#' + e._id + '">' +
                '<img class="slide-img" ' + img(e.image) + ' alt="" ' + (i > 1 ? 'loading="lazy"' : '') + '>' +
                '<p class="slide-title">' + esc(e.title) + '</p>' +
                '<p class="slide-date">' + esc(formatDate(e._date, { day: 'numeric', month: 'long', year: 'numeric' })) + '</p>' +
              '</a></li>';
          }).join('') +
        '</ul>' +
      '</div>';
    window.AUNSA_DATA.hydrate(root);

    var track = root.querySelector('.carousel-track');
    var prev = $('[data-carousel-prev]');
    var next = $('[data-carousel-next]');
    if (!prev || !next) return;
    prev.hidden = false;
    next.hidden = false;

    function step() {
      var slide = track.querySelector('.slide');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return slide ? slide.getBoundingClientRect().width + gap : track.clientWidth;
    }
    function update() {
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: REDUCED_MOTION ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: REDUCED_MOTION ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function renderInstagram(site, posts) {
    var handle = (site.instagramHandle || '').replace(/^@/, '');
    var profile = safeUrl(site.instagramUrl);
    var widget = safeUrl(site.instagramWidgetUrl);

    var head =
      '<div class="ig-profile">' +
        '<div class="ig-who"><img class="ig-avatar" src="' + asset('assets/img/logo/aunsa-mark.webp') + '" alt="" width="56" height="56">' +
          '<p class="ig-handle">@' + esc(handle) + '</p></div>' +
        (profile ? '<a class="btn btn-light btn-sm" href="' + esc(profile) + '">' + '<span class="brand-logo brand-instagram">' + LOGOS.instagram + '</span>' + 'Follow us</a>' : '') +
      '</div>';

    var body;
    if (widget) {
      body = '<iframe class="ig-embed" src="' + esc(widget) + '" title="Latest posts from @' + esc(handle) + ' on Instagram" loading="lazy"></iframe>';
    } else if (posts && posts.length) {
      body = '<ul class="ig-grid">' + posts.filter(function (p) { return p && p.image; }).slice(0, 5).map(function (p) {
        var url = safeUrl(p.url) || profile || '#';
        return '<li><a class="ig-tile" href="' + esc(url) + '">' +
          '<img ' + img(p.image) + ' alt="' + esc(p.caption || 'Instagram post') + '" loading="lazy">' +
          '<span class="ig-icon">' + icon('instagram') + '</span></a></li>';
      }).join('') + '</ul>';
    } else {
      body = '<p class="empty">Follow us on Instagram for event pics and updates!</p>';
    }
    fill('#instagram', head + body);
  }

  function renderDiscord(site) {
    var invite = safeUrl(site.discordUrl);
    var serverId = /^\d{5,25}$/.test(String(site.discordServerId || '').trim()) ? String(site.discordServerId).trim() : '';
    if (!invite && !serverId) {
      var band = $('#discord');
      if (band) band.closest('section').hidden = true;
      return;
    }
    var points = [
      ['chat', 'Chat whenever, at your own pace (lurkers welcome!)'],
      ['book', 'Find study buddies and join online body-doubling sessions'],
      ['calendar', 'Hear about events first, and ask us anything before you come']
    ];
    fill('#discord',
      '<div class="discord-grid">' +
        '<div>' +
          '<h2 id="discord-title">Hang out with us on Discord</h2>' +
          '<p class="discord-lead">Not feeling up to in-person stuff, or just prefer typing? Our Discord is a chill space to chat, share your special interests and meet other ND students.</p>' +
          '<ul class="discord-points">' + points.map(function (p) { return '<li>' + icon(p[0]) + '<span>' + p[1] + '</span></li>'; }).join('') + '</ul>' +
          (invite ? '<a class="btn btn-light" href="' + esc(invite) + '">' + '<span class="brand-logo brand-discord">' + DISCORD_LOGO + '</span>Join our Discord</a>' : '') +
        '</div>' +
        (serverId
          ? '<iframe class="discord-embed" src="https://discord.com/widget?id=' + serverId + '&amp;theme=dark" title="AUNSA Discord server: who\'s online" loading="lazy" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>'
          : '<img class="discord-mark" src="' + asset('assets/img/logo/aunsa-mark.webp') + '" alt="" width="260" height="260">') +
      '</div>');
  }

  /* ---------- Team ---------- */
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  /* Card colour: the one chosen in the dashboard, otherwise picked from the role. */
  var TONES = ['purple', 'blue', 'green', 'orange', 'pink', 'yellow'];
  function toneFor(member, index) {
    var chosen = String(member.color || '').toLowerCase();
    if (TONES.indexOf(chosen) !== -1) return chosen;
    var role = String(member.role || '').toLowerCase();
    if (role.indexOf('president') !== -1) return 'purple';
    if (role.indexOf('secretary') !== -1) return 'blue';
    if (role.indexOf('treasurer') !== -1) return 'green';
    if (role.indexOf('event') !== -1) return 'orange';
    if (role.indexOf('social') !== -1 || role.indexOf('outreach') !== -1) return 'pink';
    if (role.indexOf('wellbeing') !== -1 || role.indexOf('equity') !== -1) return 'yellow';
    return TONES[index % TONES.length];
  }

  function renderTeam(team) {
    var members = (team || []).filter(function (m) { return m && m.name; });
    if (!members.length) {
      fill('#team-list', '<p class="empty">Our exec team is coming soon!</p>');
      return;
    }
    fill('#team-list', '<ul class="team-grid">' + members.map(function (m, i) {
      var meta = [m.pronouns, m.study].filter(Boolean).map(esc).join(' · ');
      var photo = m.photo
        ? '<img class="member-photo" ' + img(m.photo) + ' alt="Photo of ' + esc(m.name) + '" loading="lazy">'
        : '<span class="member-photo" aria-hidden="true">' + esc(initials(m.name)) + '</span>';
      return '<li class="card member tone-' + toneFor(m, i) + '">' +
        '<div class="member-top"></div>' + photo +
        '<div class="member-body">' +
          '<h2>' + esc(m.name) + '</h2>' +
          (m.role ? '<span class="pill role">' + esc(m.role) + '</span>' : '') +
          (meta ? '<p class="meta">' + meta + '</p>' : '') +
          (m.bio ? '<p class="bio">' + esc(m.bio) + '</p>' : '') +
        '</div></li>';
    }).join('') + '</ul>');
  }

  /* ---------- Resources ---------- */
  var GUIDE_ICONS = { study: 'book', support: 'shield', wellbeing: 'heart', 'uni life': 'building', community: 'users' };

  function renderGuides(guides) {
    var list = (guides || []).filter(function (g) { return g && g.title; });
    if (!list.length) {
      fill('#guides', '<p class="empty">Guides coming soon!</p>');
      return;
    }
    fill('#guides', '<div class="grid-2">' + list.map(function (g) {
      var slug = g.slug || slugify(g.title);
      return '<a class="card guide-card" href="guide.html?g=' + encodeURIComponent(slug) + '">' +
        '<span class="guide-icon">' + icon(GUIDE_ICONS[String(g.category || '').toLowerCase()] || 'doc') + '</span>' +
        (g.category ? '<span class="pill">' + esc(g.category) + '</span>' : '') +
        '<h3>' + esc(g.title) + '</h3>' +
        (g.summary ? '<p>' + esc(g.summary) + '</p>' : '') +
        '<span class="read">Read the guide →</span>' +
      '</a>';
    }).join('') + '</div>');
  }

  function renderLinks(sections) {
    var list = (sections || []).filter(function (s) { return s && s.section; });
    if (!list.length) { fill('#links', ''); return; }

    var buttons = '<div class="filter-bar" role="group" aria-label="Filter links by topic">' +
      '<button class="filter-btn" type="button" data-filter="all" aria-pressed="true">All</button>' +
      list.map(function (s) {
        return '<button class="filter-btn" type="button" data-filter="' + esc(slugify(s.section)) + '" aria-pressed="false">' + esc(s.section) + '</button>';
      }).join('') + '</div><p class="filter-status" role="status"></p>';

    var body = list.map(function (s) {
      return '<section class="link-section" data-category="' + esc(slugify(s.section)) + '" aria-label="' + esc(s.section) + '">' +
        '<h3>' + esc(s.section) + '</h3><div class="grid">' +
        (s.links || []).filter(function (l) { return l && l.name && safeUrl(l.url); }).map(function (l) {
          var domain = '';
          try { domain = new URL(l.url).hostname.replace(/^www\./, ''); } catch (e) { domain = ''; }
          return '<article class="card link-card"><h4>' + esc(l.name) + '</h4>' +
            (l.description ? '<p>' + esc(l.description) + '</p>' : '') +
            '<a href="' + esc(l.url) + '">Visit website<span class="visually-hidden">: ' + esc(l.name) + '</span>' + icon('arrow') + '</a>' +
            (domain ? '<span class="domain">' + esc(domain) + '</span>' : '') +
          '</article>';
        }).join('') + '</div></section>';
    }).join('');

    var root = fill('#links', buttons + body);
    var status = root.querySelector('.filter-status');
    var btns = root.querySelectorAll('[data-filter]');
    var secs = root.querySelectorAll('[data-category]');

    function show(filter, label) {
      var count = 0;
      Array.prototype.forEach.call(btns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === filter)); });
      Array.prototype.forEach.call(secs, function (s) {
        s.hidden = !(filter === 'all' || s.getAttribute('data-category') === filter);
        if (!s.hidden) count += s.querySelectorAll('.link-card').length;
      });
      status.textContent = filter === 'all' ? 'Showing all ' + count + ' links.' : 'Showing ' + count + (count === 1 ? ' link' : ' links') + ' for ' + label + '.';
    }
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-filter'), b.textContent.trim()); });
    });
    show('all', 'All');
  }

  /* ---------- Guide page ---------- */
  function renderGuide(guides) {
    var slug = new URLSearchParams(location.search).get('g') || '';
    var guide = (guides || []).filter(function (g) { return g && (g.slug || slugify(g.title)) === slug; })[0];
    if (!guide) {
      fill('#guide', '<h1>Guide not found</h1><p>This guide may have moved. <a href="resources.html">See all resources</a>.</p>');
      return;
    }
    document.title = guide.title + ' · AUNSA';

    var body = String(guide.body || '').replace(/^\s*\*Sample guide\. Replace this with the text from your Google Doc\.\*\s*/, '');
    var html;
    if (window.marked && window.DOMPurify) {
      html = window.DOMPurify.sanitize(window.marked.parse(body, { breaks: true }));
    } else {
      html = '<p style="white-space:pre-wrap">' + esc(body) + '</p>';
    }
    var doc = safeUrl(guide.googleDocUrl);
    var updated = parseDate(guide.updated);

    fill('#guide',
      '<p class="crumbs"><a href="resources.html">← All resources</a></p>' +
      '<h1>' + esc(guide.title) + '</h1>' +
      '<div class="guide-meta">' +
        (guide.category ? '<span class="pill">' + esc(guide.category) + '</span>' : '') +
        (updated ? '<span>Updated ' + esc(formatDate(updated, { day: 'numeric', month: 'long', year: 'numeric' })) + '</span>' : '') +
        (doc ? '<a href="' + esc(doc) + '">Open in Google Docs</a>' : '') +
      '</div>' +
      '<div class="prose">' + html + '</div>');
  }

  /* ---------- Contact ---------- */
  function renderContact(site) {
    var items = [
      site.email && { href: 'mailto:' + site.email, logo: 'email', tint: 'var(--blue)', title: 'Email us', text: site.email },
      safeUrl(site.instagramUrl) && { href: site.instagramUrl, logo: 'instagram', tint: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)', title: 'Instagram', text: 'Send us a DM at @' + String(site.instagramHandle || '').replace(/^@/, '') },
      safeUrl(site.linktreeUrl) && { href: site.linktreeUrl, logo: 'linktree', tint: '#43e660', title: 'Linktree', text: 'All our sign-up forms and links in one place' },
      safeUrl(site.discordUrl) && { href: site.discordUrl, logo: 'discord', tint: '#5865f2', title: 'Discord', text: 'Chat with the community, any time' },
      safeUrl(site.contactFormUrl) && { href: site.contactFormUrl, icon: 'form', tint: 'var(--blue-light)', title: 'Send us a message', text: 'Fill in a quick form and we\'ll get back to you' },
      safeUrl(site.feedbackFormUrl) && { href: site.feedbackFormUrl, icon: 'shield', tint: 'var(--green-light)', title: 'Anonymous feedback', text: 'Tell us anything, without sharing your name' },
      { href: 'join.html', icon: 'users', tint: 'var(--purple-light)', title: 'Join AUNSA!', text: 'Fill in our quick membership form' }
    ].filter(Boolean);

    fill('#contact-list', '<div class="grid-2">' + items.map(function (c) {
      return '<a class="card contact-card" href="' + esc(c.href) + '">' +
        '<span class="contact-icon' + (c.logo ? ' logo-' + c.logo : '') + '" style="--tint:' + c.tint + '">' + (c.logo ? LOGOS[c.logo] : icon(c.icon)) + '</span>' +
        '<div><h3>' + esc(c.title) + '</h3><p>' + esc(c.text) + '</p></div></a>';
    }).join('') + '</div>' +
    (site.contactNote ? '<div class="card note-card"><p>' + esc(site.contactNote) + '</p></div>' : ''));
  }

  /* ---------- Join page ---------- */
  /* Google Form links like .../forms/d/e/<id>/viewform can be shown right on the page. */
  function formEmbedUrl(url) {
    var m = /^https:\/\/docs\.google\.com\/forms\/d\/e\/([\w-]+)/.exec(url || '');
    return m ? 'https://docs.google.com/forms/d/e/' + m[1] + '/viewform?embedded=true' : '';
  }

  function renderJoin(site) {
    var url = safeUrl(site.joinUrl);
    var embed = formEmbedUrl(url);
    var html;
    if (embed) {
      html = '<div class="card form-card"><iframe class="form-embed" src="' + esc(embed) + '" title="AUNSA membership form" loading="lazy">Loading the form…</iframe></div>' +
        '<p class="form-help">Form not showing properly? <a href="' + esc(url) + '">Open it in Google Forms</a> instead.</p>';
    } else if (url) {
      html = '<div class="card form-card form-card--link"><p>Our membership form opens in Google Forms.</p>' +
        '<a class="btn btn-purple" href="' + esc(url) + '">Open the membership form</a></div>';
    } else {
      html = '<div class="card form-card form-card--link"><p>Our membership form is opening soon! Follow us on Instagram to hear when it\'s live.</p>' +
        (safeUrl(site.instagramUrl) ? '<a class="btn btn-purple" href="' + esc(site.instagramUrl) + '">Follow us on Instagram</a>' : '') + '</div>';
    }
    fill('#join-form', html);
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var toggle = $('.nav-toggle');
    var nav = $('#site-nav');
    if (!toggle || !nav) return;
    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    }
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
  }

  /* ---------- Comfort settings ---------- */
  var COMFORT_KEY = 'aunsa-comfort';
  var COMFORT_DEFAULTS = { text: 'default', spacing: 'default', calm: false };

  function loadPrefs() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(COMFORT_KEY) || '{}') || {}; } catch (e) { p = {}; }
    return {
      text: p.text === 'large' || p.text === 'larger' ? p.text : 'default',
      spacing: p.spacing === 'wide' ? 'wide' : 'default',
      calm: p.calm === true
    };
  }
  function savePrefs(p) { try { localStorage.setItem(COMFORT_KEY, JSON.stringify(p)); } catch (e) { /* storage blocked */ } }
  function applyPrefs(p) {
    var root = document.documentElement;
    if (p.text === 'default') root.removeAttribute('data-text'); else root.setAttribute('data-text', p.text);
    if (p.spacing === 'wide') root.setAttribute('data-spacing', 'wide'); else root.removeAttribute('data-spacing');
    if (p.calm) root.setAttribute('data-calm', 'true'); else root.removeAttribute('data-calm');
  }

  function initComfort() {
    var opener = $('[data-open-comfort]');
    if (!opener) return;
    if (typeof HTMLDialogElement !== 'function') { opener.hidden = true; return; }

    function opt(name, value, label) {
      return '<label><input type="radio" name="' + name + '" value="' + value + '"><span>' + label + '</span></label>';
    }
    document.body.insertAdjacentHTML('beforeend',
      '<dialog class="comfort" id="comfort" aria-labelledby="comfort-title"><form method="dialog" class="comfort-form">' +
        '<div class="comfort-head"><h2 id="comfort-title">Comfort settings</h2>' +
          '<button class="icon-btn" value="close" aria-label="Close comfort settings">' + icon('close') + '</button></div>' +
        '<p class="comfort-intro">Change how this site looks and feels. Your choices are saved on this device only.</p>' +
        '<fieldset><legend>Text size</legend><div class="segmented">' + opt('text', 'default', 'Default') + opt('text', 'large', 'Large') + opt('text', 'larger', 'Larger') + '</div></fieldset>' +
        '<fieldset><legend>Reading spacing</legend><div class="segmented">' + opt('spacing', 'default', 'Default') + opt('spacing', 'wide', 'Extra space between letters and lines') + '</div></fieldset>' +
        '<fieldset><legend class="visually-hidden">Calm mode</legend><label class="switch"><input type="checkbox" role="switch" name="calm">' +
          '<span class="switch-text"><strong>Calm mode</strong>Softens the bright colour blocks, hides decorations and turns off animation.</span></label></fieldset>' +
        '<div class="comfort-actions"><button type="button" class="link-btn" data-comfort-reset>Reset to default</button>' +
          '<button class="btn btn-purple btn-sm" value="close">Done</button></div>' +
      '</form></dialog>');

    var dialog = $('#comfort');
    var form = dialog.querySelector('form');
    var prefs = loadPrefs();
    function sync() {
      form.querySelector('input[name="text"][value="' + prefs.text + '"]').checked = true;
      form.querySelector('input[name="spacing"][value="' + prefs.spacing + '"]').checked = true;
      form.querySelector('input[name="calm"]').checked = prefs.calm;
    }
    form.addEventListener('change', function () {
      prefs = {
        text: form.querySelector('input[name="text"]:checked').value,
        spacing: form.querySelector('input[name="spacing"]:checked').value,
        calm: form.querySelector('input[name="calm"]').checked
      };
      applyPrefs(prefs); savePrefs(prefs);
    });
    dialog.querySelector('[data-comfort-reset]').addEventListener('click', function () {
      prefs = Object.assign({}, COMFORT_DEFAULTS); sync(); applyPrefs(prefs); savePrefs(prefs);
    });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    opener.addEventListener('click', function () { sync(); dialog.showModal(); });
  }

  /* ---------- Start ---------- */
  applyPrefs(loadPrefs());

  var FALLBACK_SITE = { shortName: 'AUNSA', fullName: 'Auckland Neurodivergent Students Association', tagline: "A space where you don't have to mask" };

  getJSON('site').catch(function () { return FALLBACK_SITE; }).then(function (site) {
    site = Object.assign({}, FALLBACK_SITE, site);
    renderHeader(site);
    renderFooter(site);
    bindSite(site);

    if (PAGE === 'home') {
      getJSON('events').then(renderCarousel).catch(function () { showError('#recent-events'); });
      renderDiscord(site);
      getJSON('instagram').catch(function () { return []; }).then(function (posts) { renderInstagram(site, posts); });
    } else if (PAGE === 'events') {
      getJSON('events').then(renderEventsPage).catch(function () { showError('#upcoming-list'); showError('#past-list'); });
    } else if (PAGE === 'team') {
      getJSON('team').then(renderTeam).catch(function () { showError('#team-list'); });
    } else if (PAGE === 'resources') {
      getJSON('guides').then(renderGuides).catch(function () { showError('#guides'); });
      getJSON('links').then(renderLinks).catch(function () { showError('#links'); });
    } else if (PAGE === 'guide') {
      getJSON('guides').then(renderGuide).catch(function () { showError('#guide'); });
    } else if (PAGE === 'contact') {
      renderContact(site);
    } else if (PAGE === 'join') {
      renderJoin(site);
    }
  });
})();
