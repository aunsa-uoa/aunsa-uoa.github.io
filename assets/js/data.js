/* AUNSA data loader for the public website.
   Content comes from one of three places, in this order:
   1. Firebase (once SETUP.md is done), read with Firestore's public web API
   2. Demo mode: edits made in the exec dashboard on this browser
   3. The starter files in /data
   Every page gets the same shapes back, wherever the content lives. */
(function () {
  'use strict';

  var BASE = new URL('../../', document.currentScript.src);
  var CONFIG = window.AUNSA_FIREBASE || {};
  var LIVE = Boolean(CONFIG.apiKey && CONFIG.projectId);
  var DEMO_KEY = 'aunsa-demo-db';

  /* ---------- Firestore REST helpers ---------- */
  function restBase() {
    return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(CONFIG.projectId) + '/databases/(default)/documents/';
  }

  function decodeValue(v) {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('nullValue' in v) return null;
    if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
    return null;
  }
  function decodeFields(fields) {
    var out = {};
    Object.keys(fields || {}).forEach(function (k) { out[k] = decodeValue(fields[k]); });
    return out;
  }
  function restGet(path) {
    return fetch(restBase() + path + '?key=' + encodeURIComponent(CONFIG.apiKey)).then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(path + ': ' + res.status);
      return res.json().then(function (doc) { return decodeFields(doc.fields); });
    });
  }
  function restList(collection) {
    return fetch(restBase() + collection + '?pageSize=300&key=' + encodeURIComponent(CONFIG.apiKey)).then(function (res) {
      if (!res.ok) throw new Error(collection + ': ' + res.status);
      return res.json().then(function (body) {
        return (body.documents || []).map(function (doc) {
          var data = decodeFields(doc.fields);
          data._id = doc.name.split('/').pop();
          return data;
        });
      });
    });
  }

  /* ---------- Demo mode (browser only) ---------- */
  function demoDb() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY) || 'null'); } catch (e) { return null; }
  }
  function demoList(db, collection) {
    return Object.keys(db).filter(function (p) {
      var parts = p.split('/');
      return parts.length === 2 && parts[0] === collection;
    }).map(function (p) {
      var data = Object.assign({}, db[p]);
      data._id = p.split('/')[1];
      return data;
    });
  }

  /* ---------- Starter files ---------- */
  function fileJSON(name) {
    return fetch(new URL('data/' + name + '.json', BASE), { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error(name + '.json: ' + res.status);
      return res.json();
    });
  }

  function byOrder(a, b) { return (a.order || 0) - (b.order || 0); }

  /* Shapes: events/team/guides/links/instagram -> arrays, site -> object */
  var SHAPES = {
    events: { collection: 'events' },
    team: { collection: 'team', sort: byOrder },
    guides: { collection: 'guides', sort: byOrder },
    links: { doc: 'content/links', key: 'sections' },
    instagram: { doc: 'content/instagram', key: 'items' },
    site: { doc: 'content/site' }
  };

  function fromSource(name, getDoc, list) {
    var shape = SHAPES[name];
    if (shape.collection) {
      return Promise.resolve(list(shape.collection)).then(function (items) {
        return shape.sort ? items.sort(shape.sort) : items;
      });
    }
    return Promise.resolve(getDoc(shape.doc)).then(function (doc) {
      if (!doc) return null;
      return shape.key ? (doc[shape.key] || []) : doc;
    });
  }

  function load(name) {
    if (LIVE) {
      return fromSource(name, restGet, restList).then(function (result) {
        /* Before the starter content is imported, fall back to the files. */
        return result == null ? fileJSON(name) : result;
      }).catch(function () { return fileJSON(name); });
    }
    var db = demoDb();
    if (db) {
      return fromSource(name, function (p) { return db[p] || null; }, function (c) { return demoList(db, c); })
        .then(function (result) { return result == null ? fileJSON(name) : result; });
    }
    return fileJSON(name);
  }

  /* ---------- Images ---------- */
  /* Photos uploaded in the dashboard are stored as "fs:<id>". */
  var imageCache = {};
  function image(ref) {
    if (!ref) return Promise.resolve('');
    if (String(ref).indexOf('fs:') !== 0) {
      return Promise.resolve(/^(https?:|data:)/i.test(ref) ? ref : new URL(String(ref).replace(/^\/+/, ''), BASE).href);
    }
    var id = String(ref).slice(3);
    if (!imageCache[id]) {
      if (LIVE) {
        imageCache[id] = restGet('images/' + encodeURIComponent(id)).then(function (d) { return d ? d.data : ''; }).catch(function () { return ''; });
      } else {
        var db = demoDb() || {};
        imageCache[id] = Promise.resolve((db['images/' + id] || {}).data || '');
      }
    }
    return imageCache[id];
  }

  /* Fills in <img data-img="..."> once the photo is ready. */
  function hydrate(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('img[data-img]'), function (img) {
      var ref = img.getAttribute('data-img');
      img.removeAttribute('data-img');
      image(ref).then(function (url) {
        if (url) img.src = url;
        else img.hidden = true;
      });
    });
  }

  window.AUNSA_DATA = { load: load, image: image, hydrate: hydrate, live: LIVE, demo: !LIVE && Boolean(demoDb()) };
})();
