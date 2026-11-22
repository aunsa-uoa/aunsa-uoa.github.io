/* AUNSA exec dashboard
   - Google sign-in through Firebase (or DEMO MODE until firebase-config.js is filled in)
   - The president manages who has access and what each exec can edit
   - Permissions are also enforced on Google's servers by firestore.rules */

const CONFIG = window.AUNSA_FIREBASE || {};
const LIVE = Boolean(CONFIG.apiKey && CONFIG.projectId);
const BASE = new URL('../../', import.meta.url);
const FIREBASE_CDN = 'https://www.gstatic.com/firebasejs/10.12.2/';

const DEMO_KEY = 'aunsa-demo-db';
const DEMO_USER_KEY = 'aunsa-demo-user';
const DEMO_OWNER = 'club@aunsa.demo';
const OWNER_EMAIL = (LIVE ? CONFIG.ownerEmail || '' : DEMO_OWNER).trim().toLowerCase();

const SECTIONS = [
  { key: 'events', label: 'Events', help: 'Add, edit and delete events' },
  { key: 'team', label: 'Team page', help: "Edit everyone's profiles" },
  { key: 'guides', label: 'Guides', help: 'Resource guides' },
  { key: 'links', label: 'Useful links', help: 'Links on the Resources page' },
  { key: 'instagram', label: 'Instagram photos', help: 'Photos on the home page' },
  { key: 'site', label: 'Club settings', help: 'Linktree, email, intro, banner' }
];
const ALL_PERMS = Object.fromEntries(SECTIONS.map((s) => [s.key, true]));
const NO_PERMS = Object.fromEntries(SECTIONS.map((s) => [s.key, false]));

const ROLES = [
  'President', 'Secretary', 'Treasurer', 'Events & Community Officer',
  'Social Media & Outreach Officer', 'Wellbeing & Equity Officer'
];
const ROLE_DEFAULTS = {
  'President': ALL_PERMS,
  'Secretary': { site: true, guides: true },
  'Treasurer': {},
  'Events & Community Officer': { events: true },
  'Social Media & Outreach Officer': { instagram: true, events: true, links: true },
  'Wellbeing & Equity Officer': { guides: true, links: true }
};

const DEMO_PEOPLE = {
  'club@aunsa.demo': { label: 'Club Google account', note: 'The emergency key: always has full control' },
  'president@aunsa.demo': { label: 'Alex, President', note: 'Can do everything and manages exec access' },
  'secretary@aunsa.demo': { label: 'Priya, Secretary', note: 'Can edit club settings, guides and their own profile' },
  'events@aunsa.demo': { label: 'Riley, Events & Community Officer', note: 'Can edit events and their own profile' },
  'wellbeing@aunsa.demo': { label: 'Sam, Wellbeing & Equity Officer', note: 'Can edit guides, links and their own profile' },
  'social@aunsa.demo': { label: 'Kai, Social Media & Outreach Officer', note: 'Can edit events, Instagram photos, links and their own profile' },
  'treasurer@aunsa.demo': { label: 'Jordan, Treasurer', note: 'Can only edit their own profile' },
  'someone@gmail.com': { label: 'Someone who isn\'t an exec', note: 'Sees the "no access" screen' }
};

/* ---------- Small helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const slugify = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const nowISO = () => new Date().toISOString();
const safeUrl = (u) => { u = String(u || '').trim(); return !u || /^(https?:|mailto:|tel:)/i.test(u) ? u : 'https://' + u; };
const nextOrder = (items) => items.reduce((m, i) => Math.max(m, Number(i.order) || 0), 0) + 1;
const byOrder = (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0);

function stripPrivate(data) {
  const out = {};
  Object.keys(data || {}).forEach((k) => {
    if (k.charAt(0) !== '_' && data[k] !== undefined) out[k] = data[k];
  });
  return out;
}

let toastTimer;
function toast(message, isError) {
  const el = $('#toast');
  el.textContent = message;
  el.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, isError ? 6000 : 2800);
}

function friendlyError(err) {
  const code = (err && (err.code || err.message)) || '';
  if (/permission/i.test(code)) return "You don't have permission to do that. Ask your president.";
  if (/popup-closed|cancelled-popup/i.test(code)) return 'Sign-in was cancelled.';
  if (/unauthorized-domain/i.test(code)) return 'This web address isn\'t allowed to sign in yet. See SETUP.md, step 5.';
  if (/quota|QuotaExceeded/i.test(code)) return 'Storage is full. In demo mode, use "Reset demo".';
  return 'Something went wrong: ' + (err && err.message ? err.message : code);
}

/* ---------- Stores: Firebase (live) or this browser (demo) ---------- */
async function firebaseStore() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(FIREBASE_CDN + 'firebase-app.js'),
    import(FIREBASE_CDN + 'firebase-auth.js'),
    import(FIREBASE_CDN + 'firebase-firestore.js')
  ]);
  const app = initializeApp({ apiKey: CONFIG.apiKey, authDomain: CONFIG.authDomain, projectId: CONFIG.projectId, appId: CONFIG.appId });
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  return {
    mode: 'live',
    onAuth(cb) {
      A.onAuthStateChanged(auth, (u) => cb(u ? { email: (u.email || '').toLowerCase(), name: u.displayName || u.email, verified: u.emailVerified } : null));
    },
    async signIn() {
      const provider = new A.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await A.signInWithPopup(auth, provider);
    },
    signOut: () => A.signOut(auth),
    async get(path) { const s = await F.getDoc(F.doc(db, path)); return s.exists() ? s.data() : null; },
    set: (path, data) => F.setDoc(F.doc(db, path), stripPrivate(data)),
    update: (path, data) => F.updateDoc(F.doc(db, path), stripPrivate(data)),
    remove: (path) => F.deleteDoc(F.doc(db, path)),
    async list(coll) { const s = await F.getDocs(F.collection(db, coll)); return s.docs.map((d) => ({ ...d.data(), _id: d.id })); },
    async add(coll, data) { const r = await F.addDoc(F.collection(db, coll), stripPrivate(data)); return r.id; },
    async recentLog() {
      const s = await F.getDocs(F.query(F.collection(db, 'log'), F.orderBy('at', 'desc'), F.limit(100)));
      return s.docs.map((d) => d.data());
    }
  };
}

function demoStore() {
  const read = () => { try { return JSON.parse(localStorage.getItem(DEMO_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const write = (db) => localStorage.setItem(DEMO_KEY, JSON.stringify(db));
  const listeners = [];
  const current = () => {
    const email = localStorage.getItem(DEMO_USER_KEY);
    return email ? { email, name: (DEMO_PEOPLE[email] || {}).label || email, verified: true } : null;
  };
  const api = {
    mode: 'demo',
    onAuth(cb) { listeners.push(cb); cb(current()); },
    async signIn(email) { localStorage.setItem(DEMO_USER_KEY, email); listeners.forEach((l) => l(current())); },
    async signOut() { localStorage.removeItem(DEMO_USER_KEY); listeners.forEach((l) => l(null)); },
    async get(path) { const v = read()[path]; return v ? JSON.parse(JSON.stringify(v)) : null; },
    async set(path, data) { const db = read(); db[path] = stripPrivate(data); write(db); },
    async update(path, data) { const db = read(); db[path] = Object.assign({}, db[path], stripPrivate(data)); write(db); },
    async remove(path) { const db = read(); delete db[path]; write(db); },
    async list(coll) {
      const db = read();
      return Object.keys(db).filter((p) => { const parts = p.split('/'); return parts.length === 2 && parts[0] === coll; })
        .map((p) => ({ ...db[p], _id: p.split('/')[1] }));
    },
    async add(coll, data) { const id = Math.random().toString(36).slice(2, 12); await api.set(coll + '/' + id, data); return id; },
    async recentLog() { return (await api.list('log')).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 100); }
  };
  return api;
}

async function fileJSON(name) {
  const res = await fetch(new URL('data/' + name + '.json', BASE), { cache: 'no-cache' });
  if (!res.ok) throw new Error(name + '.json ' + res.status);
  return res.json();
}

/* Copies the starter files in /data into the store. */
async function importStarterContent(store, teamOwners) {
  const [site, events, team, guides, links, instagram] = await Promise.all(
    ['site', 'events', 'team', 'guides', 'links', 'instagram'].map(fileJSON)
  );
  await store.set('content/site', site);
  await store.set('content/links', { sections: links });
  await store.set('content/instagram', { items: instagram });
  for (const e of events) await store.add('events', e);
  for (let i = 0; i < team.length; i++) {
    await store.add('team', { ...team[i], order: i + 1, ownerEmail: (teamOwners && teamOwners[team[i].name]) || '' });
  }
  for (let i = 0; i < guides.length; i++) await store.add('guides', { ...guides[i], order: i + 1 });
}

async function seedDemo(store) {
  if (localStorage.getItem(DEMO_KEY)) return;
  write({});
  function write(v) { localStorage.setItem(DEMO_KEY, JSON.stringify(v)); }
  await importStarterContent(store, {
    Alex: 'president@aunsa.demo', Priya: 'secretary@aunsa.demo', Riley: 'events@aunsa.demo', Sam: 'wellbeing@aunsa.demo', Kai: 'social@aunsa.demo', Jordan: 'treasurer@aunsa.demo'
  });
  const members = [
    ['president@aunsa.demo', 'Alex', 'President', true, ALL_PERMS],
    ['secretary@aunsa.demo', 'Priya', 'Secretary', false, ROLE_DEFAULTS['Secretary']],
    ['events@aunsa.demo', 'Riley', 'Events & Community Officer', false, ROLE_DEFAULTS['Events & Community Officer']],
    ['wellbeing@aunsa.demo', 'Sam', 'Wellbeing & Equity Officer', false, ROLE_DEFAULTS['Wellbeing & Equity Officer']],
    ['social@aunsa.demo', 'Kai', 'Social Media & Outreach Officer', false, ROLE_DEFAULTS['Social Media & Outreach Officer']],
    ['treasurer@aunsa.demo', 'Jordan', 'Treasurer', false, ROLE_DEFAULTS['Treasurer']]
  ];
  for (const [email, name, role, isPresident, perms] of members) {
    await store.set('members/' + email, { email, name, role, isPresident, perms: { ...NO_PERMS, ...perms }, addedBy: DEMO_OWNER, addedAt: nowISO() });
  }
}

/* ---------- Photos: shrunk in the browser, then stored ---------- */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file doesn't look like a photo.")); };
    im.src = url;
  });
}
async function compressImage(file, maxSide) {
  const im = await loadImage(file);
  let side = maxSide;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, side / Math.max(im.naturalWidth, im.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(im.naturalWidth * scale);
    canvas.height = Math.round(im.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
    let data = canvas.toDataURL('image/webp', 0.82);
    if (data.indexOf('data:image/webp') !== 0) data = canvas.toDataURL('image/jpeg', 0.82);
    if (data.length < 700000) return data;
    side = Math.round(side * 0.75);
  }
  throw new Error('That photo is too big, even after shrinking. Try a smaller one.');
}

/* ---------- Rich text: keeps headings, lists, bold, italics, links, quotes ---------- */
function cleanHTML(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out = document.createElement('div');
  const walk = (node, parent) => {
    node.childNodes.forEach((ch) => {
      if (ch.nodeType === 3) { parent.appendChild(document.createTextNode(ch.nodeValue)); return; }
      if (ch.nodeType !== 1) return;
      const tag = ch.tagName.toLowerCase();
      const style = ch.getAttribute('style') || '';
      if (['script', 'style', 'meta', 'title', 'head', 'img', 'iframe', 'object'].includes(tag)) return;
      if (tag === 'br') { parent.appendChild(document.createElement('br')); return; }
      let el = null;
      if (/^h[12]$/.test(tag)) el = document.createElement('h2');
      else if (/^h[3-6]$/.test(tag)) el = document.createElement('h3');
      else if (['p', 'ul', 'ol', 'li', 'blockquote'].includes(tag)) el = document.createElement(tag);
      else if (tag === 'div' && ch.parentNode === doc.body) el = document.createElement('p');
      else if (tag === 'a') {
        const href = ch.getAttribute('href') || '';
        if (/^(https?:|mailto:)/i.test(href)) { el = document.createElement('a'); el.setAttribute('href', href); }
      } else if (tag === 'strong' || (tag === 'b' && !/font-weight:\s*(normal|400)/i.test(style))) el = document.createElement('strong');
      else if (tag === 'em' || tag === 'i') el = document.createElement('em');
      else if (tag === 'span' || tag === 'b') {
        const bold = /font-weight:\s*(bold|[6-9]00)/i.test(style);
        const italic = /font-style:\s*italic/i.test(style);
        let target = parent;
        if (bold) { const s = document.createElement('strong'); target.appendChild(s); target = s; }
        if (italic) { const e = document.createElement('em'); target.appendChild(e); target = e; }
        walk(ch, target);
        return;
      }
      if (el) { parent.appendChild(el); walk(ch, el); } else walk(ch, parent);
    });
  };
  walk(doc.body, out);
  $$('p, li, h2, h3, strong, em', out).forEach((el) => { if (!el.textContent.trim() && !el.querySelector('br')) el.remove(); });
  return out.innerHTML.trim();
}

function bodyToHTML(body) {
  const text = String(body || '').trim();
  if (!text) return '';
  if (text.charAt(0) === '<') return text;
  if (window.marked) return window.marked.parse(text, { breaks: true });
  return '<p>' + esc(text).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
}

/* ---------- App state ---------- */
let store;
const state = { user: null, me: null, view: 'overview', editing: null };
const appEl = () => $('#app');

function can(section) { return Boolean(state.me && (state.me.isPresident || (state.me.perms || {})[section])); }

async function log(action, section, title) {
  try {
    await store.add('log', { email: state.me.email, name: state.me.name || state.me.email, action, section, title: title || '', at: nowISO() });
  } catch (e) { /* the log never blocks an edit */ }
}

async function resolveMe(user) {
  if (!user) return null;
  if (LIVE && !user.verified) return null;
  if (OWNER_EMAIL && user.email === OWNER_EMAIL) {
    return { email: user.email, name: 'Club account', role: 'Club Google account', isPresident: true, isOwner: true, perms: ALL_PERMS };
  }
  let m = null;
  try { m = await store.get('members/' + user.email); } catch (e) { m = null; }
  if (!m) return null;
  return { ...m, email: user.email, perms: m.isPresident ? ALL_PERMS : { ...NO_PERMS, ...(m.perms || {}) } };
}

/* ---------- Image helpers for the dashboard ---------- */
async function imageURL(ref) {
  if (!ref) return '';
  if (String(ref).indexOf('fs:') === 0) {
    try { const d = await store.get('images/' + String(ref).slice(3)); return d ? d.data : ''; } catch (e) { return ''; }
  }
  return /^(https?:|data:)/i.test(ref) ? ref : new URL(String(ref).replace(/^\/+/, ''), BASE).href;
}
function hydrateImages(root) {
  $$('img[data-ref]', root).forEach(async (img) => {
    const url = await imageURL(img.getAttribute('data-ref'));
    if (url) img.src = url; else img.removeAttribute('src');
  });
}
async function uploadPhoto(file, maxSide) {
  const data = await compressImage(file, maxSide || 1200);
  const id = await store.add('images', { data, uploadedBy: state.me.email, uploadedAt: nowISO(), name: file.name.slice(0, 120) });
  return 'fs:' + id;
}

/* ---------- Form builder ---------- */
/* field types: text, email, url, date, textarea, select, checkbox, image, roles, richtext */
function fieldHTML(f, value) {
  const id = 'f-' + f.name;
  const help = f.help ? '<p class="help" id="' + id + '-help">' + esc(f.help) + '</p>' : '';
  const describe = f.help ? ' aria-describedby="' + id + '-help"' : '';
  const req = f.required ? ' required' : '';
  const v = value == null ? '' : value;
  switch (f.type) {
    case 'textarea':
      return '<div class="field"><label for="' + id + '">' + esc(f.label) + '</label>' + help + '<textarea id="' + id + '" name="' + f.name + '"' + describe + req + '>' + esc(v) + '</textarea></div>';
    case 'select':
      return '<div class="field"><label for="' + id + '">' + esc(f.label) + '</label>' + help + '<select id="' + id + '" name="' + f.name + '"' + describe + '>' +
        f.options.map((o) => '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select></div>';
    case 'checkbox':
      return '<label class="check"><input type="checkbox" name="' + f.name + '"' + (v ? ' checked' : '') + '><span>' + esc(f.label) + (f.help ? '<small>' + esc(f.help) + '</small>' : '') + '</span></label>';
    case 'roles':
      return '<div class="field"><label for="' + id + '">' + esc(f.label) + '</label>' + help + '<input type="text" id="' + id + '" name="' + f.name + '" list="role-list" value="' + esc(v) + '"' + describe + req + '>' +
        '<datalist id="role-list">' + ROLES.map((r) => '<option value="' + esc(r) + '">').join('') + '</datalist></div>';
    case 'image':
      return '<div class="field"><span class="label" id="' + id + '-label">' + esc(f.label) + '</span>' + help +
        '<div class="image-field" data-image-field="' + f.name + '" data-max="' + (f.max || 1200) + '">' +
          '<img alt="" ' + (v ? 'data-ref="' + esc(v) + '"' : '') + (v ? '' : ' hidden') + '>' +
          '<input type="hidden" name="' + f.name + '" value="' + esc(v) + '">' +
          '<span class="small-btn file-btn">Upload photo<input type="file" accept="image/*" aria-labelledby="' + id + '-label"></span>' +
          '<button type="button" class="small-btn" data-remove-image' + (v ? '' : ' hidden') + '>Remove photo</button>' +
        '</div></div>';
    case 'richtext':
      return '<div class="field"><span class="label" id="' + id + '-label">' + esc(f.label) + '</span>' + help +
        '<div class="rte-toolbar" role="toolbar" aria-label="Text formatting">' +
          '<button type="button" data-cmd="formatBlock" data-arg="h2">Heading</button>' +
          '<button type="button" data-cmd="formatBlock" data-arg="h3">Subheading</button>' +
          '<button type="button" data-cmd="formatBlock" data-arg="p">Normal</button>' +
          '<button type="button" data-cmd="bold" aria-label="Bold"><strong>B</strong></button>' +
          '<button type="button" data-cmd="italic" aria-label="Italic"><em>I</em></button>' +
          '<button type="button" data-cmd="insertUnorderedList">• List</button>' +
          '<button type="button" data-cmd="insertOrderedList">1. List</button>' +
          '<button type="button" data-cmd="formatBlock" data-arg="blockquote">Quote box</button>' +
          '<button type="button" data-cmd="createLink">Link</button>' +
        '</div>' +
        '<div class="rte prose" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="' + id + '-label" data-rte="' + f.name + '">' + bodyToHTML(v) + '</div></div>';
    default:
      return '<div class="field"><label for="' + id + '">' + esc(f.label) + '</label>' + help +
        '<input type="' + (f.type || 'text') + '" id="' + id + '" name="' + f.name + '" value="' + esc(v) + '"' + describe + req + (f.pattern ? ' pattern="' + f.pattern + '"' : '') + '></div>';
  }
}

function formHTML(fields, data, opts) {
  return '<form class="form" novalidate>' +
    fields.map((f) => fieldHTML(f, (data || {})[f.name])).join('') +
    '<div class="form-actions"><button class="btn btn-purple" type="submit">' + esc((opts && opts.submit) || 'Save') + '</button>' +
    '<button class="btn btn-outline" type="button" data-cancel>Cancel</button></div></form>';
}

function wireForm(root, fields, onSubmit, onCancel) {
  const form = $('form', root);
  hydrateImages(form);

  $$('[data-image-field]', form).forEach((wrap) => {
    const input = $('input[type="file"]', wrap);
    const hidden = $('input[type="hidden"]', wrap);
    const preview = $('img', wrap);
    const removeBtn = $('[data-remove-image]', wrap);
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      toast('Uploading photo…');
      try {
        const ref = await uploadPhoto(file, Number(wrap.getAttribute('data-max')));
        hidden.value = ref;
        preview.hidden = false;
        preview.src = await imageURL(ref);
        removeBtn.hidden = false;
        toast('Photo uploaded. Remember to save.');
      } catch (e) { toast(e.message || friendlyError(e), true); }
      input.value = '';
    });
    removeBtn.addEventListener('click', () => {
      hidden.value = ''; preview.hidden = true; preview.removeAttribute('src'); removeBtn.hidden = true;
    });
  });

  $$('[data-rte]', form).forEach((editor) => {
    const toolbar = editor.previousElementSibling;
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-cmd]');
      if (!btn) return;
      editor.focus();
      const cmd = btn.getAttribute('data-cmd');
      if (cmd === 'createLink') {
        const url = window.prompt('Paste the web address for the link:');
        if (url) document.execCommand('createLink', false, safeUrl(url));
      } else {
        document.execCommand(cmd, false, btn.getAttribute('data-arg') ? '<' + btn.getAttribute('data-arg') + '>' : null);
      }
    });
    editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');
      const clean = html ? cleanHTML(html) : esc(text).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
      document.execCommand('insertHTML', false, html ? clean : '<p>' + clean + '</p>');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const missing = fields.find((f) => f.required && f.type !== 'checkbox' && !String(form.elements[f.name] ? form.elements[f.name].value : '').trim());
    if (missing) { toast('Please fill in "' + missing.label + '".', true); form.elements[missing.name] && form.elements[missing.name].focus(); return; }
    const values = {};
    fields.forEach((f) => {
      if (f.type === 'richtext') values[f.name] = cleanHTML($('[data-rte="' + f.name + '"]', form).innerHTML);
      else if (f.type === 'checkbox') values[f.name] = form.elements[f.name].checked;
      else if (f.type === 'url') values[f.name] = safeUrl(form.elements[f.name].value);
      else values[f.name] = String(form.elements[f.name].value || '').trim();
    });
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    try { await onSubmit(values); } catch (err) { toast(friendlyError(err), true); }
    btn.disabled = false;
  });
  $('[data-cancel]', form).addEventListener('click', onCancel);
}

/* ---------- Generic list + editor for collections ---------- */
function listEditor(opts) {
  /* opts: { title, intro, section, collection, fields, itemTitle, itemMeta, itemThumb, ordered, newItem, sort, addLabel } */
  return async function render(panel) {
    const items = (await store.list(opts.collection)).sort(opts.sort || byOrder);

    if (state.editing) {
      const editing = state.editing === 'new' ? (opts.newItem ? opts.newItem() : {}) : items.find((i) => i._id === state.editing);
      if (!editing) { state.editing = null; return render(panel); }
      panel.innerHTML = '<h1>' + esc(state.editing === 'new' ? opts.addLabel : 'Edit ' + (opts.itemTitle(editing) || 'item')) + '</h1>' + formHTML(opts.fields, editing);
      wireForm(panel, opts.fields, async (values) => {
        const data = { ...editing, ...values, updatedAt: nowISO(), updatedBy: state.me.email };
        if (opts.beforeSave) opts.beforeSave(data, items);
        if (state.editing === 'new') {
          if (opts.ordered) data.order = nextOrder(items);
          await store.add(opts.collection, data);
          await log('Added', opts.section, opts.itemTitle(data));
        } else {
          await store.set(opts.collection + '/' + editing._id, data);
          await log('Edited', opts.section, opts.itemTitle(data));
        }
        toast('Saved! It\'s live on the website.');
        state.editing = null;
        render(panel);
      }, () => { state.editing = null; render(panel); });
      $('h1', panel).focus && panel.querySelector('input, textarea')?.focus();
      return;
    }

    panel.innerHTML = '<h1>' + esc(opts.title) + '</h1><p class="intro">' + esc(opts.intro) + '</p>' +
      '<div class="toolbar-row"><button class="btn btn-purple" type="button" data-add>+ ' + esc(opts.addLabel) + '</button></div>' +
      (items.length ? '<ul class="item-list">' + items.map((item, i) =>
        '<li class="item">' +
          (opts.itemThumb ? '<img class="item-thumb' + (opts.roundThumb ? ' round' : '') + '" alt="" ' + (opts.itemThumb(item) ? 'data-ref="' + esc(opts.itemThumb(item)) + '"' : '') + '>' : '') +
          '<div class="item-main"><strong>' + esc(opts.itemTitle(item)) + '</strong><span>' + (opts.itemMeta ? opts.itemMeta(item) : '') + '</span></div>' +
          '<div class="item-actions">' +
            (opts.ordered ? '<button class="small-btn" type="button" data-up="' + item._id + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move ' + esc(opts.itemTitle(item)) + ' up">↑</button>' +
                            '<button class="small-btn" type="button" data-down="' + item._id + '"' + (i === items.length - 1 ? ' disabled' : '') + ' aria-label="Move ' + esc(opts.itemTitle(item)) + ' down">↓</button>' : '') +
            '<button class="small-btn" type="button" data-edit="' + item._id + '">Edit<span class="visually-hidden"> ' + esc(opts.itemTitle(item)) + '</span></button>' +
            '<button class="small-btn danger" type="button" data-delete="' + item._id + '">Delete<span class="visually-hidden"> ' + esc(opts.itemTitle(item)) + '</span></button>' +
          '</div></li>').join('') + '</ul>'
        : '<p class="empty">Nothing here yet.</p>');
    hydrateImages(panel);

    $('[data-add]', panel).addEventListener('click', () => { state.editing = 'new'; render(panel); });
    panel.onclick = async (e) => {
      const b = e.target.closest('button');
      if (!b || !panel.contains(b)) return;
      const id = b.getAttribute('data-edit') || b.getAttribute('data-delete') || b.getAttribute('data-up') || b.getAttribute('data-down');
      if (!id) return;
      panel.onclick = null;
      const item = items.find((x) => x._id === id);
      try {
        if (b.hasAttribute('data-edit')) { state.editing = id; return render(panel); }
        if (b.hasAttribute('data-delete')) {
          if (!window.confirm('Delete "' + opts.itemTitle(item) + '"? This removes it from the website.')) { return render(panel); }
          await store.remove(opts.collection + '/' + id);
          await log('Deleted', opts.section, opts.itemTitle(item));
          toast('Deleted.');
          return render(panel);
        }
        const idx = items.indexOf(item);
        const swap = items[b.hasAttribute('data-up') ? idx - 1 : idx + 1];
        if (swap) {
          items.forEach((x, i) => { x.order = i + 1; });
          const a = item.order; item.order = swap.order; swap.order = a;
          await store.set(opts.collection + '/' + item._id, item);
          await store.set(opts.collection + '/' + swap._id, swap);
          await log('Reordered', opts.section, opts.itemTitle(item));
        }
        render(panel);
      } catch (err) { toast(friendlyError(err), true); render(panel); }
    };
  };
}

/* ---------- Views ---------- */
const EVENT_FIELDS = [
  { name: 'title', label: 'Event name', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true, help: 'Once this date has passed, the event moves to "Past events" and the home page carousel.' },
  { name: 'time', label: 'Time', help: 'For example: 5:00 to 7:00 pm' },
  { name: 'location', label: 'Location' },
  { name: 'image', label: 'Photo', type: 'image', help: 'Landscape photos work best. They are shrunk automatically.' },
  { name: 'summary', label: 'Short description', type: 'textarea' },
  { name: 'signupUrl', label: 'Sign-up link', type: 'url', help: 'Optional. A Google Form, Engage or Linktree link.' },
  { name: 'photosUrl', label: 'Photo album link', type: 'url', help: 'Optional, for past events.' },
  { name: 'noise', label: 'Sensory guide: noise level', help: 'For example: Quiet, Low, Medium, Loud' },
  { name: 'groupSize', label: 'Sensory guide: group size', help: 'For example: 10 to 15 people' },
  { name: 'quietSpace', label: 'Sensory guide: a quiet space is available', type: 'checkbox' },
  { name: 'accessNotes', label: 'Sensory guide: good to know', type: 'textarea', help: 'Lighting, food, step-free access, online option and so on.' }
];

const PROFILE_FIELDS = [
  { name: 'name', label: 'Name', required: true },
  { name: 'pronouns', label: 'Pronouns', help: 'Optional' },
  { name: 'study', label: 'What you study', help: 'Optional. For example: Psychology, third year' },
  { name: 'bio', label: 'Short bio', type: 'textarea' },
  { name: 'photo', label: 'Profile photo', type: 'image', max: 700, help: 'Optional. Square photos work best. Leave empty to show your initial.' },
  { name: 'color', label: 'Card colour', type: 'select', options: ['Automatic (from role)', 'Purple', 'Blue', 'Green', 'Orange', 'Pink', 'Yellow'], help: 'Automatic uses the role colour: President purple, Secretary blue, Treasurer green, Events & Community orange, Social Media & Outreach pink, Wellbeing & Equity yellow.' }
];

function formatDay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return 'No date';
  return new Intl.DateTimeFormat('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(+m[1], +m[2] - 1, +m[3]));
}

const views = {};

views.overview = async (panel) => {
  const me = state.me;
  const allowed = SECTIONS.filter((s) => can(s.key));
  const [events, team, guides, site] = await Promise.all([store.list('events'), store.list('team'), store.list('guides'), store.get('content/site')]);
  const upcoming = events.filter((e) => (e.date || '') >= todayISO()).length;
  const empty = !events.length && !team.length && !guides.length && !site;

  panel.innerHTML =
    '<h1>Kia ora' + (me.isOwner ? '' : ', ' + esc(me.name)) + '!</h1>' +
    '<p class="intro">You\'re signed in as <strong>' + esc(me.role || 'Exec') + '</strong>' + (me.isPresident ? ' <span class="badge">Full control</span>' : '') + '.</p>' +
    (empty && me.isPresident ? '<div class="notice warn"><p><strong>The website has no content yet.</strong> Import the starter content to begin, then edit it.</p><p><button class="btn btn-purple btn-sm" type="button" data-import>Import starter content</button></p></div>' : '') +
    '<div class="stat-grid">' +
      '<div class="stat"><strong>' + upcoming + '</strong>upcoming events</div>' +
      '<div class="stat" style="background:var(--blue-light)"><strong>' + team.length + '</strong>team profiles</div>' +
      '<div class="stat" style="background:var(--green-light)"><strong>' + guides.length + '</strong>guides</div>' +
    '</div>' +
    '<h2>You can edit</h2>' +
    (allowed.length ? '<div class="chips-row">' + allowed.map((s) => '<span class="pill">' + esc(s.label) + '</span>').join('') + '</div>' : '<p>Your own Meet the team profile. Ask your president if you need to edit more.</p>') +
    (me.isPresident ? '<h2>President tools</h2><p>Use <strong>Exec access</strong> to add execs and choose what they can edit, <strong>Activity log</strong> to see recent changes, and <strong>Handover &amp; backup</strong> at the end of your term.</p>' : '') +
    '<p><a href="index.html">View the website →</a></p>';

  const importBtn = $('[data-import]', panel);
  if (importBtn) importBtn.addEventListener('click', async () => {
    importBtn.disabled = true;
    try { await importStarterContent(store); await log('Imported starter content', 'site', ''); toast('Starter content imported.'); views.overview(panel); }
    catch (e) { toast(friendlyError(e), true); importBtn.disabled = false; }
  });
};

views.events = listEditor({
  title: 'Events', section: 'events', collection: 'events', addLabel: 'Add event',
  intro: 'Upcoming events appear on the Events page. Past events move to "Past events" and the home page carousel automatically.',
  fields: EVENT_FIELDS,
  sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
  itemTitle: (e) => e.title || 'Untitled event',
  itemMeta: (e) => esc(formatDay(e.date)) + ((e.date || '') >= todayISO() ? ' <span class="badge green">Upcoming</span>' : ' <span class="badge grey">Past</span>'),
  itemThumb: (e) => e.image,
  newItem: () => ({ date: todayISO(), quietSpace: false })
});

views.guides = listEditor({
  title: 'Guides', section: 'guides', collection: 'guides', addLabel: 'Add guide', ordered: true,
  intro: 'Write your guide in Google Docs, then copy and paste it into "Guide text". Headings, lists, bold, italics and links are kept.',
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'category', label: 'Category', type: 'select', options: ['Study', 'Support', 'Wellbeing', 'Uni life', 'Community'] },
    { name: 'summary', label: 'Short summary', type: 'textarea', help: 'Shown on the Resources page card.' },
    { name: 'googleDocUrl', label: 'Google Doc link', type: 'url', help: 'Optional. Adds an "Open in Google Docs" link.' },
    { name: 'body', label: 'Guide text', type: 'richtext', help: 'Paste from Google Docs, or type here. Use the buttons for headings and lists.' }
  ],
  itemTitle: (g) => g.title || 'Untitled guide',
  itemMeta: (g) => esc(g.category || '') + (g.updated ? ' · updated ' + esc(formatDay(g.updated)) : ''),
  newItem: () => ({ category: 'Study' }),
  beforeSave: (data, items) => {
    data.updated = todayISO();
    if (!data.slug) {
      let slug = slugify(data.title) || 'guide';
      const taken = new Set(items.filter((i) => i._id !== data._id).map((i) => i.slug));
      let n = 2; const base = slug;
      while (taken.has(slug)) slug = base + '-' + n++;
      data.slug = slug;
    }
  }
});

views.team = async (panel) => {
  const members = state.me.isPresident || can('team') ? await store.list('members').catch(() => []) : [];
  const accountOptions = ['', ...members.map((m) => m.email)];
  return listEditor({
    title: 'Team page', section: 'team', collection: 'team', addLabel: 'Add person', ordered: true, roundThumb: true,
    intro: 'Profiles appear on Meet the team in this order. Link a profile to an exec\'s account so they can edit it themselves.',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'role', label: 'Role', type: 'roles', help: 'Pick a role or type a new one.' },
      ...PROFILE_FIELDS.slice(1),
      { name: 'ownerEmail', label: 'Linked exec account', type: 'select', options: accountOptions, help: 'Optional. The exec with this Google account can edit this profile.' }
    ],
    itemTitle: (m) => m.name || 'Unnamed',
    itemMeta: (m) => esc(m.role || '') + (m.ownerEmail ? ' · <span class="badge blue">Linked to ' + esc(m.ownerEmail) + '</span>' : ''),
    itemThumb: (m) => m.photo
  })(panel);
};

views.profile = async (panel) => {
  const mine = (await store.list('team')).find((t) => t.ownerEmail === state.me.email);
  if (!mine) {
    panel.innerHTML = '<h1>My profile</h1><p class="intro">You don\'t have a Meet the team profile linked to your account yet. Ask your president to link one.</p>';
    return;
  }
  panel.innerHTML = '<h1>My profile</h1><p class="intro">This is how you appear on Meet the team as <strong>' + esc(mine.role || 'exec') + '</strong>. Only share what you\'re comfortable with.</p>' + formHTML(PROFILE_FIELDS, mine);
  wireForm(panel, PROFILE_FIELDS, async (values) => {
    await store.update('team/' + mine._id, { ...values, updatedAt: nowISO(), updatedBy: state.me.email });
    await log('Edited own profile', 'team', values.name);
    toast('Saved! Your profile is updated.');
    views.profile(panel);
  }, () => views.profile(panel));
};

views.links = async (panel) => {
  const doc = (await store.get('content/links')) || { sections: [] };
  let sections = JSON.parse(JSON.stringify(doc.sections || []));

  function draw() {
    panel.innerHTML = '<h1>Useful links</h1><p class="intro">Links grouped into sections on the Resources page. Visitors can filter by section.</p>' +
      '<form class="form" novalidate style="max-width:none">' +
      sections.map((s, si) =>
        '<fieldset class="fieldset"><legend>Section ' + (si + 1) + '</legend>' +
          '<div class="field"><label for="s' + si + '">Section name</label><input type="text" id="s' + si + '" data-s="' + si + '" value="' + esc(s.section) + '"></div>' +
          '<div style="display:grid;gap:.6rem;margin-top:.8rem">' +
          (s.links || []).map((l, li) =>
            '<div class="link-row">' +
              '<div class="field"><label for="n' + si + '-' + li + '">Name</label><input type="text" id="n' + si + '-' + li + '" data-l="' + si + '-' + li + '-name" value="' + esc(l.name) + '"></div>' +
              '<div class="field"><label for="u' + si + '-' + li + '">Web address</label><input type="url" id="u' + si + '-' + li + '" data-l="' + si + '-' + li + '-url" value="' + esc(l.url) + '"></div>' +
              '<div class="field"><label for="d' + si + '-' + li + '">Description</label><input type="text" id="d' + si + '-' + li + '" data-l="' + si + '-' + li + '-description" value="' + esc(l.description) + '"></div>' +
              '<button class="small-btn danger" type="button" data-remove-link="' + si + '-' + li + '">Remove<span class="visually-hidden"> ' + esc(l.name) + '</span></button>' +
            '</div>').join('') +
          '</div>' +
          '<div class="toolbar-row"><button class="small-btn" type="button" data-add-link="' + si + '">+ Add link</button>' +
            '<button class="small-btn" type="button" data-move-section="' + si + '-up"' + (si === 0 ? ' disabled' : '') + '>Move section up</button>' +
            '<button class="small-btn" type="button" data-move-section="' + si + '-down"' + (si === sections.length - 1 ? ' disabled' : '') + '>Move section down</button>' +
            '<button class="small-btn danger" type="button" data-remove-section="' + si + '">Remove section</button></div>' +
        '</fieldset>').join('') +
      '<div class="form-actions"><button class="small-btn" type="button" data-add-section>+ Add section</button></div>' +
      '<div class="form-actions"><button class="btn btn-purple" type="submit">Save links</button></div></form>';
  }
  function collect() {
    $$('[data-s]', panel).forEach((el) => { sections[+el.getAttribute('data-s')].section = el.value.trim(); });
    $$('[data-l]', panel).forEach((el) => {
      const [si, li, key] = el.getAttribute('data-l').split('-');
      sections[+si].links[+li][key] = key === 'url' ? safeUrl(el.value) : el.value.trim();
    });
  }
  draw();
  panel.onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.type === 'submit') return;
    collect();
    if (b.hasAttribute('data-add-link')) sections[+b.getAttribute('data-add-link')].links.push({ name: '', url: '', description: '' });
    else if (b.hasAttribute('data-remove-link')) { const [si, li] = b.getAttribute('data-remove-link').split('-'); sections[+si].links.splice(+li, 1); }
    else if (b.hasAttribute('data-add-section')) sections.push({ section: 'New section', links: [] });
    else if (b.hasAttribute('data-remove-section')) { if (!window.confirm('Remove this whole section?')) return; sections.splice(+b.getAttribute('data-remove-section'), 1); }
    else if (b.hasAttribute('data-move-section')) {
      const [si, dir] = b.getAttribute('data-move-section').split('-'); const i = +si; const j = dir === 'up' ? i - 1 : i + 1;
      [sections[i], sections[j]] = [sections[j], sections[i]];
    } else return;
    draw();
  };
  panel.onsubmit = async (e) => {
    e.preventDefault(); collect();
    sections = sections.filter((s) => s.section).map((s) => ({ section: s.section, links: (s.links || []).filter((l) => l.name && l.url) }));
    try { await store.set('content/links', { sections }); await log('Edited', 'links', 'Useful links'); toast('Links saved!'); draw(); }
    catch (err) { toast(friendlyError(err), true); }
  };
};

views.instagram = async (panel) => {
  const doc = (await store.get('content/instagram')) || { items: [] };
  const items = doc.items || [];
  const fields = [];
  for (let i = 0; i < 5; i++) {
    fields.push({ name: 'image' + i, label: 'Photo ' + (i + 1), type: 'image', max: 1000 });
    fields.push({ name: 'caption' + i, label: 'Photo ' + (i + 1) + ': describe it', help: 'For people using screen readers.' });
    fields.push({ name: 'url' + i, label: 'Photo ' + (i + 1) + ': link to the Instagram post', type: 'url' });
  }
  const data = {};
  items.forEach((it, i) => { data['image' + i] = it.image; data['caption' + i] = it.caption; data['url' + i] = it.url; });
  panel.innerHTML = '<h1>Instagram photos</h1><p class="intro">Up to 5 photos for the "Our Instagram" section on the home page. The first one is shown biggest. To show your latest posts automatically instead, add a feed widget link in Club settings.</p>' + formHTML(fields, data);
  wireForm(panel, fields, async (v) => {
    const out = [];
    for (let i = 0; i < 5; i++) if (v['image' + i]) out.push({ image: v['image' + i], caption: v['caption' + i], url: v['url' + i] });
    await store.set('content/instagram', { items: out });
    await log('Edited', 'instagram', 'Instagram photos');
    toast('Instagram photos saved!');
    views.instagram(panel);
  }, () => views.instagram(panel));
};

const SITE_FIELDS = [
  { name: 'fullName', label: 'Full club name' },
  { name: 'tagline', label: 'Tagline' },
  { name: 'intro', label: 'Home page introduction', type: 'textarea' },
  { name: 'draftBanner', label: 'Yellow banner at the top of every page', help: 'Clear this to hide the banner.' },
  { name: 'linktreeUrl', label: 'Linktree link', type: 'url', help: 'Used by the Linktree button in the navigation bar.' },
  { name: 'email', label: 'Club email', type: 'email' },
  { name: 'instagramHandle', label: 'Instagram handle', help: 'Without the @' },
  { name: 'instagramUrl', label: 'Instagram profile link', type: 'url' },
  { name: 'instagramWidgetUrl', label: 'Instagram feed widget link', type: 'url', help: 'Optional. An embed link from a free widget service (e.g. LightWidget or SnapWidget) shows your latest posts automatically.' },
  { name: 'discordUrl', label: 'Discord invite link', type: 'url', help: 'Shown on the home page and Contact page. Use an invite link that never expires.' },
  { name: 'discordServerId', label: 'Discord server ID', help: 'Optional. Shows a live preview of your server (who\'s online) on the home page. In Discord: Server Settings > Widget > turn on "Enable Server Widget", then copy the Server ID.' },
  { name: 'joinUrl', label: 'Membership form link (Google Form)', type: 'url', help: 'Shown on the Join AUNSA! page. In Google Forms, click Send, choose the link tab, untick "Shorten URL" and paste the full docs.google.com link here so the form appears right on the website.' },
  { name: 'contactFormUrl', label: 'Contact form link', type: 'url', help: 'Optional, e.g. a Google Form' },
  { name: 'feedbackFormUrl', label: 'Anonymous feedback form link', type: 'url', help: 'Optional' },
  { name: 'contactNote', label: 'Note on the Contact page', type: 'textarea' }
];
views.site = async (panel) => {
  const site = (await store.get('content/site')) || {};
  panel.innerHTML = '<h1>Club settings</h1><p class="intro">Links and wording used across the whole website.</p>' + formHTML(SITE_FIELDS, site);
  wireForm(panel, SITE_FIELDS, async (v) => {
    await store.set('content/site', { ...site, ...v });
    await log('Edited', 'site', 'Club settings');
    toast('Settings saved!');
    views.site(panel);
  }, () => views.site(panel));
};

/* ----- President: exec access ----- */
function permChecks(prefix, perms, disabled) {
  return '<div class="perm-grid">' + SECTIONS.map((s) =>
    '<label class="check"><input type="checkbox" data-perm="' + prefix + ':' + s.key + '"' + (perms[s.key] ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
    '<span>' + esc(s.label) + '<small>' + esc(s.help) + '</small></span></label>').join('') + '</div>';
}

views.access = async (panel) => {
  const members = (await store.list('members')).sort((a, b) => (b.isPresident - a.isPresident) || String(a.name).localeCompare(String(b.name)));
  const presidents = members.filter((m) => m.isPresident).length;

  panel.innerHTML = '<h1>Exec access</h1>' +
    '<p class="intro">Only Google accounts listed here can sign in. Choose what each exec can edit. Everyone can always edit their own Meet the team profile.</p>' +
    '<h2>Add an exec</h2>' +
    '<form class="form" data-add-form novalidate>' +
      '<div class="form-grid two">' +
        '<div class="field"><label for="new-email">Their Google email</label><p class="help" id="new-email-help">The exact account they\'ll sign in with.</p><input type="email" id="new-email" name="email" aria-describedby="new-email-help" required></div>' +
        '<div class="field"><label for="new-name">Their name</label><p class="help">&nbsp;</p><input type="text" id="new-name" name="name" required></div>' +
      '</div>' +
      '<div class="field"><label for="new-role">Role</label><p class="help" id="new-role-help">Choosing a role ticks suggested permissions. You can change them.</p>' +
        '<input type="text" id="new-role" name="role" list="role-list-add" aria-describedby="new-role-help"><datalist id="role-list-add">' + ROLES.map((r) => '<option value="' + esc(r) + '">').join('') + '</datalist></div>' +
      '<fieldset class="fieldset"><legend>They can edit</legend>' + permChecks('new', NO_PERMS) + '</fieldset>' +
      '<label class="check"><input type="checkbox" name="isPresident"><span>Make them a president<small>Presidents can do everything, including managing exec access.</small></span></label>' +
      '<label class="check"><input type="checkbox" name="makeProfile" checked><span>Create a Meet the team profile for them<small>Linked to their account, so they can fill it in themselves.</small></span></label>' +
      '<div class="form-actions"><button class="btn btn-purple" type="submit">Add exec</button></div>' +
    '</form>' +
    '<h2>Current execs (' + members.length + ')</h2>' +
    (members.length ? '<div style="display:grid;gap:.9rem">' + members.map((m) =>
      '<section class="member-card" aria-label="' + esc(m.name) + '">' +
        '<div class="member-head"><div><strong>' + esc(m.name) + '</strong>' + (m.isPresident ? '<span class="badge">President</span>' : '') + (m.email === state.me.email ? '<span class="badge blue">You</span>' : '') +
        '<br><span>' + esc(m.role || 'No role') + ' · ' + esc(m.email) + '</span></div></div>' +
        (m.isPresident ? '<p class="help" style="margin:0">Presidents can edit everything.</p>' : permChecks(m.email, { ...NO_PERMS, ...(m.perms || {}) })) +
        '<div class="item-actions">' +
          (m.isPresident ? '' : '<button class="small-btn" type="button" data-save-perms="' + esc(m.email) + '">Save permissions</button>') +
          '<button class="small-btn" type="button" data-role="' + esc(m.email) + '">Change role</button>' +
          '<button class="small-btn" type="button" data-change-email="' + esc(m.email) + '">Change email</button>' +
          (m.isPresident
            ? '<button class="small-btn" type="button" data-unpres="' + esc(m.email) + '">Remove president status</button>'
            : '<button class="small-btn" type="button" data-pres="' + esc(m.email) + '">Make president</button>') +
          '<button class="small-btn danger" type="button" data-remove="' + esc(m.email) + '">Remove access</button>' +
        '</div></section>').join('') + '</div>' : '<p class="empty">No execs yet. Add the president first.</p>');

  const addForm = $('[data-add-form]', panel);
  const roleInput = $('#new-role', panel);
  roleInput.addEventListener('change', () => {
    const d = ROLE_DEFAULTS[roleInput.value];
    if (!d) return;
    SECTIONS.forEach((s) => { $('[data-perm="new:' + s.key + '"]', panel).checked = Boolean(d[s.key]); });
    addForm.elements.isPresident.checked = roleInput.value === 'President';
  });
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = addForm.elements.email.value.trim().toLowerCase();
    const name = addForm.elements.name.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Please enter a valid email address.', true); addForm.elements.email.focus(); return; }
    if (!name) { toast('Please enter their name.', true); addForm.elements.name.focus(); return; }
    if (members.some((m) => m.email === email)) { toast('That account already has access.', true); return; }
    const perms = Object.fromEntries(SECTIONS.map((s) => [s.key, $('[data-perm="new:' + s.key + '"]', panel).checked]));
    const role = roleInput.value.trim();
    try {
      await store.set('members/' + email, { email, name, role, isPresident: addForm.elements.isPresident.checked, perms, addedBy: state.me.email, addedAt: nowISO() });
      if (addForm.elements.makeProfile.checked) {
        const team = await store.list('team');
        const existing = team.find((t) => t.ownerEmail === email);
        if (!existing) await store.add('team', { name, role, pronouns: '', study: '', bio: '', photo: '', ownerEmail: email, order: nextOrder(team) });
      }
      await log('Gave access to', 'access', name + ' (' + email + ')');
      toast(name + ' can now sign in.');
      views.access(panel);
    } catch (err) { toast(friendlyError(err), true); }
  });

  panel.onclick = async (e) => {
    const b = e.target.closest('button'); if (!b || b.type === 'submit') return;
    const email = b.getAttribute('data-save-perms') || b.getAttribute('data-role') || b.getAttribute('data-pres') || b.getAttribute('data-unpres') || b.getAttribute('data-remove') || b.getAttribute('data-change-email');
    if (!email) return;
    const m = members.find((x) => x.email === email);
    /* Removing the last president is allowed: the club Google account always keeps full control. */
    const lastPresidentWarning = m && m.isPresident && presidents <= 1
      ? '\n\n' + m.name + ' is the only president. Afterwards, only the club Google account' + (OWNER_EMAIL ? ' (' + OWNER_EMAIL + ')' : '') + ' will have full control until you make someone else president.'
      : '';
    try {
      if (b.hasAttribute('data-change-email')) {
        const input = window.prompt('New Google email for ' + m.name + '.\nIt must be the exact account they sign in with:', m.email);
        if (input == null) return;
        const newEmail = input.trim().toLowerCase();
        if (newEmail === m.email) return;
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) { toast('That doesn\'t look like an email address.', true); return; }
        if (members.some((x) => x.email === newEmail)) { toast('That account already has access.', true); return; }
        /* Accounts are stored by email, so copy to the new email, move the profile link, then remove the old one. */
        await store.set('members/' + newEmail, { ...m, email: newEmail });
        const profile = (await store.list('team')).find((t) => t.ownerEmail === m.email);
        if (profile) await store.set('team/' + profile._id, { ...profile, ownerEmail: newEmail });
        await store.remove('members/' + m.email);
        await log('Changed sign-in email for', 'access', m.name + ' → ' + newEmail);
        toast(m.name + ' now signs in with ' + newEmail + '.');
        if (m.email === state.me.email) {
          window.alert('You changed your own sign-in email. Sign in again with ' + newEmail + '.');
          return store.signOut();
        }
        return views.access(panel);
      }
      if (b.hasAttribute('data-save-perms')) {
        const perms = Object.fromEntries(SECTIONS.map((s) => [s.key, $('[data-perm="' + email + ':' + s.key + '"]', panel).checked]));
        await store.set('members/' + email, { ...m, perms });
        await log('Changed permissions for', 'access', m.name);
        toast('Permissions saved for ' + m.name + '.');
      } else if (b.hasAttribute('data-role')) {
        const role = window.prompt('New role for ' + m.name + ':', m.role || '');
        if (role == null) return;
        await store.set('members/' + email, { ...m, role: role.trim() });
        const profile = (await store.list('team')).find((t) => t.ownerEmail === email);
        if (profile) await store.set('team/' + profile._id, { ...profile, role: role.trim() });
        await log('Changed role for', 'access', m.name + ' → ' + role.trim());
        toast('Role updated, including on Meet the team.');
      } else if (b.hasAttribute('data-pres')) {
        if (!window.confirm('Make ' + m.name + ' a president? They\'ll have full control, including exec access.')) return;
        await store.set('members/' + email, { ...m, isPresident: true });
        await log('Made president', 'access', m.name);
        toast(m.name + ' is now a president.');
      } else if (b.hasAttribute('data-unpres')) {
        if (!window.confirm('Remove president status from ' + m.name + '?' + lastPresidentWarning)) return;
        await store.set('members/' + email, { ...m, isPresident: false, perms: { ...NO_PERMS, ...(m.perms || {}) } });
        await log('Removed president status from', 'access', m.name);
        toast('Done.');
        if (email === state.me.email) return start();
      } else if (b.hasAttribute('data-remove')) {
        if (!window.confirm('Remove ' + m.name + '\'s access? They won\'t be able to sign in any more. Their Meet the team profile stays until you delete it.' + lastPresidentWarning)) return;
        await store.remove('members/' + email);
        await log('Removed access for', 'access', m.name);
        toast(m.name + ' can no longer sign in.');
        if (email === state.me.email) return start();
      }
      views.access(panel);
    } catch (err) { toast(friendlyError(err), true); }
  };
};

views.log = async (panel) => {
  const entries = await store.recentLog();
  panel.innerHTML = '<h1>Activity log</h1><p class="intro">The last 100 changes made in the dashboard. Entries can\'t be edited or deleted.</p>' +
    (entries.length ? '<div class="table-wrap"><table class="log-table"><thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">What</th></tr></thead><tbody>' +
      entries.map((e) => '<tr><td>' + esc(new Date(e.at).toLocaleString('en-NZ', { dateStyle: 'medium', timeStyle: 'short' })) + '</td><td>' + esc(e.name || e.email) + '</td><td>' + esc(e.action) + ' ' + esc(e.title) + '</td></tr>').join('') +
      '</tbody></table></div>' : '<p class="empty">No changes yet.</p>');
};

views.handover = async (panel) => {
  const members = await store.list('members');
  const others = members.filter((m) => m.email !== state.me.email);
  panel.innerHTML = '<h1>Handover &amp; backup</h1><p class="intro">Everything the president needs at the end of their term.</p>' +
    '<h2>Hand over the presidency</h2>' +
    (state.me.isOwner ? '<p>You\'re signed in with the club account, which always keeps full control. To set a new president, use <strong>Make president</strong> in Exec access.</p>' :
      others.length ? '<form class="form" data-transfer novalidate><div class="field"><label for="transfer-to">New president</label><p class="help">Add them in Exec access first if they\'re not listed.</p><select id="transfer-to" name="to">' +
        others.map((m) => '<option value="' + esc(m.email) + '">' + esc(m.name) + ' (' + esc(m.email) + ')</option>').join('') + '</select></div>' +
        '<label class="check"><input type="checkbox" name="stay"><span>Keep my access as a regular exec<small>Otherwise your access is removed straight away.</small></span></label>' +
        '<div class="form-actions"><button class="btn btn-purple" type="submit">Hand over presidency</button></div></form>'
        : '<p>Add the next president in <strong>Exec access</strong> first.</p>') +
    '<h2>Download a backup</h2><p>Saves all website content, including photos and the exec list, as one file. Keep it somewhere safe, like the club\'s Google Drive.</p>' +
    '<p><button class="btn btn-outline" type="button" data-backup>Download backup</button></p>' +
    '<h2>Handover checklist</h2><ol class="checklist">' +
      '<li>Add the new execs in <strong>Exec access</strong> and set their permissions.</li>' +
      '<li>Hand over the presidency (above).</li>' +
      '<li>Remove access for execs who have left.</li>' +
      '<li>Update Meet the team for the new exec.</li>' +
      '<li>Pass on the club Google account, email, Instagram and Linktree logins securely, not in a group chat.</li>' +
      '<li>Download a backup and save it to the club\'s Drive.</li>' +
      '<li>Check the Useful links still work.</li>' +
    '</ol>';

  const transfer = $('[data-transfer]', panel);
  if (transfer) transfer.addEventListener('submit', async (e) => {
    e.preventDefault();
    const to = members.find((m) => m.email === transfer.elements.to.value);
    if (!to || !window.confirm('Make ' + to.name + ' the president? ' + (transfer.elements.stay.checked ? 'You\'ll become a regular exec.' : 'Your access will be removed.'))) return;
    try {
      await store.set('members/' + to.email, { ...to, isPresident: true, role: 'President' });
      const profile = (await store.list('team')).find((t) => t.ownerEmail === to.email);
      if (profile) await store.set('team/' + profile._id, { ...profile, role: 'President' });
      await log('Handed the presidency to', 'access', to.name);
      const mine = members.find((m) => m.email === state.me.email);
      if (transfer.elements.stay.checked) await store.set('members/' + state.me.email, { ...mine, isPresident: false, role: 'Former president', perms: { ...NO_PERMS } });
      else await store.remove('members/' + state.me.email);
      window.alert(to.name + ' is now the president. Thank you for your mahi!');
      start();
    } catch (err) { toast(friendlyError(err), true); }
  });

  $('[data-backup]', panel).addEventListener('click', async () => {
    try {
      toast('Preparing backup…');
      const out = { exportedAt: nowISO(), exportedBy: state.me.email, docs: {} };
      for (const p of ['content/site', 'content/links', 'content/instagram']) out.docs[p] = await store.get(p);
      for (const c of ['events', 'team', 'guides', 'members', 'images']) {
        (await store.list(c)).forEach((d) => { out.docs[c + '/' + d._id] = stripPrivate(d); });
      }
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'aunsa-website-backup-' + todayISO() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      await log('Downloaded a backup', 'access', '');
      toast('Backup downloaded.');
    } catch (err) { toast(friendlyError(err), true); }
  });
};

/* ---------- Screens ---------- */
const GOOGLE_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

function demoBar() {
  return store.mode === 'demo'
    ? '<p class="demo-bar">Demo mode: changes are saved in this browser only, not online. <button type="button" data-reset-demo>Reset demo</button></p>'
    : '';
}

function wireDemoBar() {
  const b = $('[data-reset-demo]');
  if (b) b.addEventListener('click', async () => {
    if (!window.confirm('Reset the demo? This clears every change you made in demo mode.')) return;
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(DEMO_USER_KEY);
    window.location.reload();
  });
}

/* Demo mode only runs on this computer. "?real" shows the login screen execs will actually see. */
const ON_THIS_COMPUTER = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const PREVIEW_REAL = new URLSearchParams(location.search).has('real');

function signInScreen(error) {
  const demoPicker = store.mode === 'demo' && !PREVIEW_REAL;
  const body = demoPicker
    ? '<p><strong>Testing only:</strong> pick who to try the dashboard as. Execs never see this list. <a href="admin.html?real">See the real login screen →</a></p>' +
      '<div class="demo-people">' + Object.keys(DEMO_PEOPLE).map((email) =>
        '<button type="button" data-demo-user="' + esc(email) + '"><strong>' + esc(DEMO_PEOPLE[email].label) + '</strong><span>' + esc(DEMO_PEOPLE[email].note) + '</span></button>').join('') + '</div>'
    : '<button class="google-btn" type="button" data-google>' + GOOGLE_ICON + 'Sign in with Google</button>';
  appEl().innerHTML = (demoPicker ? demoBar() : '') +
    (store.mode === 'demo' && PREVIEW_REAL ? '<p class="demo-bar">Preview of the real exec login. <a href="admin.html" style="color:inherit">Back to testing mode</a></p>' : '') +
    '<main class="signin" id="admin-main"><div class="signin-card">' +
      '<img src="assets/img/logo/aunsa-mark.webp" alt="" width="112" height="112">' +
      '<h1>Exec login</h1>' +
      '<p>For AUNSA execs. Sign in with your Google account and you\'ll see the parts of the website you can edit.</p>' +
      body +
      (error ? '<p class="signin-error" role="alert">' + esc(error) + '</p>' : '') +
      '<p style="margin-top:1.5rem"><a href="index.html">← Back to the website</a></p>' +
    '</div></main>';
  wireDemoBar();
  const g = $('[data-google]');
  if (g) g.addEventListener('click', async () => {
    if (store.mode === 'demo') {
      signInScreen('This is just a preview. Google sign-in starts working once Firebase is set up.');
      return;
    }
    try { await store.signIn(); } catch (e) { signInScreen(friendlyError(e)); }
  });
  $$('[data-demo-user]').forEach((b) => b.addEventListener('click', () => store.signIn(b.getAttribute('data-demo-user'))));
}

function noAccessScreen(user) {
  appEl().innerHTML = demoBar() +
    '<main class="signin" id="admin-main"><div class="signin-card">' +
      '<img src="assets/img/logo/aunsa-mark.webp" alt="" width="112" height="112">' +
      '<h1>No access yet</h1>' +
      '<p>You\'re signed in as <strong>' + esc(user.email) + '</strong>, but this account hasn\'t been added as an AUNSA exec.</p>' +
      '<p>Ask your president to add this exact Google account in <strong>Exec access</strong>, or sign in with a different account.</p>' +
      '<button class="btn btn-outline" type="button" data-signout>Use a different account</button>' +
    '</div></main>';
  wireDemoBar();
  $('[data-signout]').addEventListener('click', () => store.signOut());
}

function navItems() {
  const me = state.me;
  const items = [{ view: 'overview', label: 'Overview' }];
  if (can('events')) items.push({ view: 'events', label: 'Events' });
  if (can('team')) items.push({ view: 'team', label: 'Team page' });
  else items.push({ view: 'profile', label: 'My profile' });
  if (can('team') && !me.isOwner) items.push({ view: 'profile', label: 'My profile' });
  if (can('guides')) items.push({ view: 'guides', label: 'Guides' });
  if (can('links')) items.push({ view: 'links', label: 'Useful links' });
  if (can('instagram')) items.push({ view: 'instagram', label: 'Instagram photos' });
  if (can('site')) items.push({ view: 'site', label: 'Club settings' });
  if (me.isPresident) {
    items.push({ group: 'President' });
    items.push({ view: 'access', label: 'Exec access' });
    items.push({ view: 'log', label: 'Activity log' });
    items.push({ view: 'handover', label: 'Handover & backup' });
  }
  return items;
}

function shell() {
  const me = state.me;
  const items = navItems();
  if (!items.some((i) => i.view === state.view)) state.view = 'overview';
  appEl().innerHTML = demoBar() +
    '<header class="admin-top"><div class="container admin-top-inner">' +
      '<a class="brand" href="index.html"><img src="assets/img/logo/aunsa-mark.webp" alt="" width="48" height="48"><span class="brand-text"><span class="brand-name">AUN<span>SA</span></span><span class="brand-sub">Exec dashboard</span></span></a>' +
      '<div class="who"><strong>' + esc(me.name || me.email) + '</strong><span>' + esc(me.role || '') + (me.isPresident ? ' · full control' : '') + '</span></div>' +
      '<a class="small-btn" href="index.html" style="display:inline-flex;align-items:center;text-decoration:none">View site</a>' +
      '<button class="small-btn" type="button" data-signout>Sign out</button>' +
    '</div></header>' +
    '<div class="container admin-shell">' +
      '<nav class="admin-nav" aria-label="Dashboard">' + items.map((i) => i.group
        ? '<p class="nav-group">' + esc(i.group) + '</p>'
        : '<button type="button" data-view="' + i.view + '"' + (i.view === state.view ? ' aria-current="page"' : '') + '>' + esc(i.label) + '</button>').join('') + '</nav>' +
      '<main class="panel" id="admin-main" tabindex="-1"></main>' +
    '</div>';
  wireDemoBar();
  $('[data-signout]').addEventListener('click', () => store.signOut());
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => {
    state.view = b.getAttribute('data-view');
    state.editing = null;
    shell();
    $('#admin-main').focus();
  }));
  const panel = $('#admin-main');
  panel.onclick = null; panel.onsubmit = null;
  Promise.resolve().then(() => views[state.view](panel)).catch((e) => {
    panel.innerHTML = '<p class="signin-error">' + esc(friendlyError(e)) + '</p>';
  });
}

async function start() {
  const user = state.user;
  if (!user) { state.me = null; return signInScreen(); }
  appEl().innerHTML = '<p class="admin-loading">Checking your access…</p>';
  state.me = await resolveMe(user);
  if (!state.me) return noAccessScreen(user);
  shell();
}

/* ---------- Boot ---------- */
(async function boot() {
  try {
    /* On the published website, never show demo mode: until Firebase is set up, explain that instead. */
    if (!LIVE && !ON_THIS_COMPUTER) {
      appEl().innerHTML = '<main class="signin" id="admin-main"><div class="signin-card">' +
        '<img src="assets/img/logo/aunsa-mark.webp" alt="" width="112" height="112">' +
        '<h1>Exec login</h1><p>Exec login isn\'t switched on yet. It will be ready soon!</p>' +
        '<p><a href="index.html">← Back to the website</a></p></div></main>';
      return;
    }
    store = LIVE ? await firebaseStore() : demoStore();
    if (!LIVE) await seedDemo(store);
    store.onAuth((user) => {
      state.user = store.mode === 'demo' && PREVIEW_REAL ? null : user;
      state.view = 'overview';
      state.editing = null;
      start();
    });
  } catch (e) {
    appEl().innerHTML = '<main class="signin"><div class="signin-card"><h1>Couldn\'t load</h1><p>' + esc(friendlyError(e)) + '</p></div></main>';
  }
})();
