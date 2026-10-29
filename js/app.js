/* =====================================================================
   Destiny Child Live2D Viewer
   Rendering: PixiJS + pixi-live2d-display (Cubism 2) + live2d.min.js
   ===================================================================== */
(function () {
  'use strict'

  // ------------------------------------------------------------ config
  var CONFIG = {
    modelRoot: 'static/',                 // where the Korean/ and Global/ folders live
    regions: {
      kr: { dir: 'Korean/', name: 'Uncensored (KR)', pck: 'https://patch.real.dckr.shiftupcorp.com/real.185.k4bn7a4p4xhm/hd_android/asset/character/' },
      gl: { dir: 'Global/', name: 'Censored (Global)', pck: 'https://patch.real.dcgl.shiftupcorp.com/real.215.xmfrfnjz6e8d/hd_mobile/asset/character/' }
    },
    categories: [
      ['all', 'All'], ['child', 'Child'], ['spa', 'Spa'], ['monster', 'Monster'],
      ['puppet', 'Puppet'], ['cutscene', 'Cutscene'], ['carta', 'Soul Carta']
    ],
    defaultModel: 'c001_02',
    fitHeight: 0.95                          // model fills 95% of canvas height at scale 1
  }

  var EMBED = document.documentElement.classList.contains('embed')
  var Live2DModel = PIXI.live2d.Live2DModel
  var FORCE = PIXI.live2d.MotionPriority.FORCE

  // ------------------------------------------------------------ state
  var state = {
    id: null,
    region: 'kr',
    scale: 1,
    x: 0,                 // offset from center, as a fraction of canvas width
    y: 0,                 // offset from center, as a fraction of canvas height
    expr: '',
    bg: 'transparent',
    size: 'fit',          // 'fit' or 'WxH'
    category: 'all',
    query: ''
  }

  var models = []         // [{ id, name, outfit, cat, regions: {kr, gl}, el }]
  var byId = {}
  var visible = []        // filtered list, in order
  var current = null      // loaded Live2DModel
  var baseSize = { w: 1, h: 1 }
  var loadToken = 0
  var maxMode = false

  // ------------------------------------------------------------ dom
  var $ = function (id) { return document.getElementById(id) }
  var stageEl = $('stage'), canvas = $('canvas')

  // ------------------------------------------------------------ pixi
  var app = new PIXI.Application({
    view: canvas,
    width: 800,
    height: 800,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2)
  })
  var bgLayer = new PIXI.Graphics()
  app.stage.addChild(bgLayer)

  // =====================================================================
  // URL state
  // =====================================================================
  function readUrl() {
    var p = new URLSearchParams(location.search)
    var num = function (keys, fallback) {
      for (var i = 0; i < keys.length; i++) {
        var v = parseFloat(p.get(keys[i]))
        if (!isNaN(v)) return v
      }
      return fallback
    }
    // new params, plus old site params (model, mN, region) so old links still open the right model
    state.id = p.get('m') || p.get('model') || p.get('mN') || null
    var r = (p.get('r') || p.get('region') || '').toLowerCase()
    if (r === 'gl' || r === 'g') state.region = 'gl'
    state.scale = clamp(num(['s'], 1), 0.1, 4)
    state.x = clamp(num(['x'], 0), -1, 1)
    state.y = clamp(num(['y'], 0), -1, 1)
    state.expr = p.get('e') || ''
    state.bg = p.get('bg') || 'transparent'
    if (state.bg !== 'transparent' && !/^#[0-9a-f]{6}$/i.test(state.bg)) state.bg = '#' + state.bg.replace('#', '')
    state.size = /^\d+x\d+$/.test(p.get('size') || '') ? p.get('size') : 'fit'
  }

  function buildUrl(extra) {
    var p = new URLSearchParams()
    if (extra && extra.embed) p.set('embed', '1')
    p.set('m', state.id)
    p.set('r', state.region)
    if (Math.abs(state.scale - 1) > 0.001) p.set('s', state.scale.toFixed(2))
    if (Math.abs(state.x) > 0.0005) p.set('x', state.x.toFixed(3))
    if (Math.abs(state.y) > 0.0005) p.set('y', state.y.toFixed(3))
    if (state.expr) p.set('e', state.expr)
    if (state.bg !== 'transparent') p.set('bg', state.bg.replace('#', ''))
    if (state.size !== 'fit') p.set('size', state.size)
    return location.origin + location.pathname + '?' + p.toString()
  }

  var urlTimer = null
  function syncUrl() {
    if (EMBED || !state.id) return
    clearTimeout(urlTimer)
    urlTimer = setTimeout(function () { history.replaceState(null, '', buildUrl()) }, 250)
  }

  // =====================================================================
  // model list
  // =====================================================================
  function loadModelList() {
    return fetch('data/models.json').then(function (r) { return r.json() }).then(function (rows) {
      models = rows.map(function (r) {
        var m = { id: r[0], name: r[1], outfit: r[2], cat: r[3], regions: { kr: r[4].indexOf('k') > -1, gl: r[4].indexOf('g') > -1 } }
        m.search = (m.id + ' ' + m.name + ' ' + m.outfit).toLowerCase()
        byId[m.id] = m
        return m
      })
      if (!EMBED) renderList()
    })
  }

  function label(m) {
    return m.name || (m.outfit ? m.outfit : m.id)
  }

  function renderList() {
    var list = $('model-list')
    var frag = document.createDocumentFragment()
    models.forEach(function (m) {
      var li = document.createElement('li')
      li.setAttribute('role', 'option')
      li.dataset.id = m.id
      li.innerHTML =
        '<span class="name"></span><span class="id"></span>' +
        '<span class="outfit"></span>' +
        '<span class="regions"><span class="' + (m.regions.kr ? '' : 'off') + '">KR</span><span class="' + (m.regions.gl ? '' : 'off') + '">GL</span></span>'
      li.querySelector('.name').textContent = m.name || m.outfit || 'Unknown'
      li.querySelector('.outfit').textContent = m.name ? (m.outfit || 'Default') : ''
      li.querySelector('.id').textContent = m.id
      m.el = li
      frag.appendChild(li)
    })
    list.appendChild(frag)
    list.addEventListener('click', function (e) {
      var li = e.target.closest('li')
      if (li) { selectModel(li.dataset.id); closeDrawers() }
    })

    var cats = $('categories')
    CONFIG.categories.forEach(function (c) {
      var b = document.createElement('button')
      b.className = 'chip'
      b.setAttribute('role', 'tab')
      b.dataset.cat = c[0]
      b.textContent = c[1]
      b.setAttribute('aria-selected', String(c[0] === state.category))
      cats.appendChild(b)
    })
    cats.addEventListener('click', function (e) {
      var b = e.target.closest('.chip')
      if (!b) return
      state.category = b.dataset.cat
      cats.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)) })
      applyFilter()
    })

    var t
    $('search').addEventListener('input', function (e) {
      clearTimeout(t)
      t = setTimeout(function () { state.query = e.target.value.trim().toLowerCase(); applyFilter() }, 80)
    })
    applyFilter()
  }

  function applyFilter() {
    var words = state.query.split(/\s+/).filter(Boolean)
    visible = []
    models.forEach(function (m) {
      var show = (state.category === 'all' || m.cat === state.category) &&
        words.every(function (w) { return m.search.indexOf(w) > -1 })
      m.el.hidden = !show
      if (show) visible.push(m)
    })
    $('list-count').textContent = visible.length + (visible.length === 1 ? ' model' : ' models')
  }

  function step(dir) {
    var list = visible.length ? visible : models
    var i = list.indexOf(byId[state.id])
    var next = list[(i + dir + list.length) % list.length]
    if (next) selectModel(next.id)
  }

  // =====================================================================
  // loading models
  // =====================================================================
  function selectModel(id, opts) {
    var m = byId[id]
    if (!m) { toast('Model "' + id + '" not found'); return }
    opts = opts || {}
    // switch region automatically if this model only exists in the other one
    if (!m.regions[state.region]) {
      var other = state.region === 'kr' ? 'gl' : 'kr'
      if (!opts.silent) toast('Only the ' + CONFIG.regions[other].name + ' version exists for this model')
      state.region = other
    }
    state.id = id
    if (!opts.keepExpr) state.expr = ''
    updateSelection()
    loadModel()
  }

  function modelUrl(id, region, file) {
    return CONFIG.modelRoot + CONFIG.regions[region].dir + id + '/' + file
  }

  function loadModel() {
    var token = ++loadToken
    var id = state.id, region = state.region
    showStatus('Loading model')
    clearModelUi()

    Live2DModel.from(modelUrl(id, region, 'MOC.' + id + '.json'), { autoInteract: false })
      .then(function (model) {
        if (token !== loadToken) { model.destroy({ children: true, texture: true, baseTexture: true }); return }
        if (current) {
          app.stage.removeChild(current)
          current.destroy({ children: true, texture: true, baseTexture: true })
        }
        current = model
        model.anchor.set(0.5, 0.5)
        baseSize = { w: model.width, h: model.height }
        app.stage.addChild(model)
        maxMode = false
        layout()
        buildModelUi(model)
        hideStatus()
        if (state.expr) setExpression(state.expr, true)
        prefetchNext()
      })
      .catch(function (err) {
        if (token !== loadToken) return
        console.error(err)
        // don't leave the previous model on screen under the error
        if (current) {
          app.stage.removeChild(current)
          current.destroy({ children: true, texture: true, baseTexture: true })
          current = null
        }
        $('motions').innerHTML = $('expressions').innerHTML = '<p class="empty">Model failed to load</p>'
        showStatus('This model could not be loaded', true)
      })
    syncUrl()
  }

  // Warm the browser cache with the next model in the list
  function prefetchNext() {
    if (navigator.connection && navigator.connection.saveData) return
    var list = visible.length ? visible : models
    var next = list[list.indexOf(byId[state.id]) + 1]
    if (!next || !next.regions[state.region]) return
    var get = function (url, as) { return fetch(url, { priority: 'low' }).then(function (r) { return r.ok ? r[as]() : null }) }
    setTimeout(function () {
      get(modelUrl(next.id, state.region, 'MOC.' + next.id + '.json'), 'json').then(function (j) {
        if (!j) return
        get(modelUrl(next.id, state.region, j.model), 'blob')
        ;(j.textures || []).forEach(function (t) { get(modelUrl(next.id, state.region, t), 'blob') })
        if (j.motions && j.motions.idle) get(modelUrl(next.id, state.region, j.motions.idle[0].file), 'blob')
      }).catch(function () {})
    }, 600)
  }

  // =====================================================================
  // view: size, scale, position, background
  // =====================================================================
  function canvasSize() {
    if (state.size !== 'fit') {
      var p = state.size.split('x')
      return { w: +p[0], h: +p[1], fixed: true }
    }
    return { w: Math.max(stageEl.clientWidth, 50), h: Math.max(stageEl.clientHeight, 50), fixed: false }
  }

  function layout() {
    var s = canvasSize()
    if (app.renderer.width / app.renderer.resolution !== s.w || app.renderer.height / app.renderer.resolution !== s.h) {
      app.renderer.resolution = s.fixed ? 1 : Math.min(window.devicePixelRatio || 1, 2)
      app.renderer.resize(s.w, s.h)
    }
    stageEl.classList.toggle('fixed', s.fixed)
    if (s.fixed) {
      // show a fixed-size canvas scaled down to fit the stage
      var k = Math.min((stageEl.clientWidth - 32) / s.w, (stageEl.clientHeight - 32) / s.h, 1)
      canvas.style.width = Math.round(s.w * k) + 'px'
      canvas.style.height = Math.round(s.h * k) + 'px'
    } else {
      canvas.style.width = s.w + 'px'
      canvas.style.height = s.h + 'px'
    }
    drawBackground(s)
    applyTransform()
  }

  function applyTransform() {
    var s = canvasSize()
    if (current) {
      var fit = (s.h * CONFIG.fitHeight) / baseSize.h
      current.scale.set(fit * state.scale)
      current.position.set(s.w / 2 + state.x * s.w, s.h / 2 + state.y * s.h)
    }
    $('scale').value = state.scale
    $('scale-out').textContent = state.scale.toFixed(2) + '×'
    $('pos-x').value = state.x
    $('pos-x-out').textContent = state.x.toFixed(2)
    $('pos-y').value = state.y
    $('pos-y-out').textContent = state.y.toFixed(2)
    syncUrl()
  }

  function drawBackground(s) {
    s = s || canvasSize()
    bgLayer.clear()
    if (state.bg !== 'transparent') {
      bgLayer.beginFill(PIXI.utils.string2hex(state.bg))
      bgLayer.drawRect(0, 0, s.w, s.h)
      bgLayer.endFill()
    }
    stageEl.dataset.bg = state.bg === 'transparent' ? 'transparent' : 'color'
    document.querySelectorAll('#backgrounds .swatch').forEach(function (b) {
      b.classList.toggle('active', b.dataset.bg === state.bg || (b.classList.contains('picker') && !b.dataset.bg && isCustomBg()))
    })
  }

  function isCustomBg() {
    return state.bg !== 'transparent' && !document.querySelector('#backgrounds [data-bg="' + state.bg + '"]')
  }

  function resetView() {
    state.scale = 1
    state.x = 0
    state.y = 0
    applyTransform()
  }

  // =====================================================================
  // canvas interaction: drag, wheel/pinch zoom, double-click reset, tap
  // =====================================================================
  var pointers = new Map(), dragStart = null, pinchStart = null, moved = 0

  function toCanvas(e) {
    var r = canvas.getBoundingClientRect(), s = canvasSize()
    return { x: (e.clientX - r.left) * (s.w / r.width), y: (e.clientY - r.top) * (s.h / r.height) }
  }

  function zoomAt(point, newScale) {
    var s = canvasSize()
    newScale = clamp(newScale, 0.1, 4)
    var k = newScale / state.scale
    var cx = s.w / 2 + state.x * s.w, cy = s.h / 2 + state.y * s.h
    state.x = clamp((point.x - (point.x - cx) * k - s.w / 2) / s.w, -1, 1)
    state.y = clamp((point.y - (point.y - cy) * k - s.h / 2) / s.h, -1, 1)
    state.scale = newScale
    applyTransform()
  }

  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId)
    pointers.set(e.pointerId, toCanvas(e))
    moved = 0
    hideHint()
    if (pointers.size === 1) {
      dragStart = { p: toCanvas(e), x: state.x, y: state.y }
      canvas.classList.add('dragging')
    } else if (pointers.size === 2) {
      var pts = Array.from(pointers.values())
      pinchStart = { d: dist(pts[0], pts[1]), scale: state.scale }
      dragStart = null
    }
  })

  canvas.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) return
    var p = toCanvas(e), s = canvasSize()
    pointers.set(e.pointerId, p)
    if (pointers.size === 2 && pinchStart) {
      var pts = Array.from(pointers.values())
      var mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
      zoomAt(mid, pinchStart.scale * dist(pts[0], pts[1]) / pinchStart.d)
      moved = 99
    } else if (dragStart) {
      var dx = p.x - dragStart.p.x, dy = p.y - dragStart.p.y
      moved = Math.max(moved, Math.abs(dx) + Math.abs(dy))
      state.x = clamp(dragStart.x + dx / s.w, -1, 1)
      state.y = clamp(dragStart.y + dy / s.h, -1, 1)
      applyTransform()
    }
  })

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return
    var wasTap = pointers.size === 1 && moved < 6 && e.type === 'pointerup'
    pointers.delete(e.pointerId)
    if (pointers.size < 2) pinchStart = null
    if (pointers.size === 0) { dragStart = null; canvas.classList.remove('dragging') }
    if (wasTap && current) {
      var p = toCanvas(e)
      if (current.getBounds().contains(p.x, p.y)) playTap()
    }
  }
  canvas.addEventListener('pointerup', endPointer)
  canvas.addEventListener('pointercancel', endPointer)

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault()
    hideHint()
    zoomAt(toCanvas(e), state.scale * Math.exp(-e.deltaY * 0.0015))
  }, { passive: false })

  canvas.addEventListener('dblclick', resetView)

  // =====================================================================
  // motions and expressions
  // =====================================================================
  function motionGroups(model) {
    return Object.keys(model.internalModel.motionManager.definitions || {})
  }

  function expressionNames(model) {
    var em = model.internalModel.motionManager.expressionManager
    return em ? em.definitions.map(function (d) { return d.name }) : []
  }

  function isSpa(model) {
    var g = motionGroups(model)
    return g.indexOf('attack') === -1 && g.indexOf('touch') > -1
  }

  function tapGroup(model) {
    var g = motionGroups(model)
    if (isSpa(model)) return maxMode ? (g.indexOf('maxtouch') > -1 ? 'maxtouch' : 'touch') : 'touch'
    var pick = ['attack', 'hit', 'touch', 'maxtouch'].filter(function (x) { return g.indexOf(x) > -1 })[0]
    return pick || g.filter(function (x) { return x.indexOf('idle') !== 0 })[0] || null
  }

  // Spa models: max/maxtouch switch the idle loop to "max", idle/touch switch it back
  function setMaxMode(on) {
    if (!current || !isSpa(current)) return
    var g = motionGroups(current)
    maxMode = on && g.indexOf('max') > -1
    current.internalModel.motionManager.groups.idle = maxMode ? 'max' : 'idle'
    $('max-badge').hidden = !maxMode
  }

  function playMotion(group) {
    if (!current) return Promise.resolve(false)
    if (isSpa(current)) {
      if (group === 'max' || group === 'maxtouch') setMaxMode(true)
      else if (group === 'idle' || group === 'touch') setMaxMode(false)
    }
    markMotion(group)
    return current.motion(group, 0, FORCE)
  }

  function playTap() {
    var g = current && tapGroup(current)
    if (g) playMotion(g)
  }

  function setExpression(name, quiet) {
    if (!current) return
    var em = current.internalModel.motionManager.expressionManager
    if (!em) return
    if (!name) {
      em.currentExpression = em.defaultExpression
      em.resetExpression()
      state.expr = ''
      markExpression('')
      syncUrl()
      return
    }
    em.setExpression(name).then(function (ok) {
      var failed = em.expressions[em.getExpressionIndex(name)] === null
      if (failed) {
        var chip = document.querySelector('#expressions [data-expr="' + cssEscape(name) + '"]')
        if (chip) chip.disabled = true
        if (!quiet) toast('The "' + name + '" expression file is missing for this model')
        return
      }
      state.expr = name
      markExpression(name)
      syncUrl()
    })
  }

  function clearModelUi() {
    $('motions').innerHTML = '<p class="empty">Loading…</p>'
    $('expressions').innerHTML = '<p class="empty">Loading…</p>'
    $('record-motion').innerHTML = ''
    $('max-badge').hidden = true
  }

  function buildModelUi(model) {
    var groups = motionGroups(model)
    var motions = $('motions'), exprs = $('expressions'), rec = $('record-motion')
    motions.innerHTML = ''
    exprs.innerHTML = ''
    rec.innerHTML = ''

    groups.forEach(function (g) {
      var b = chip(g.replace(/_/g, ' '), function () { playMotion(g) })
      b.dataset.motion = g
      motions.appendChild(b)
      var o = document.createElement('option')
      o.value = g
      o.textContent = g.replace(/_/g, ' ')
      rec.appendChild(o)
    })
    if (!groups.length) motions.innerHTML = '<p class="empty">No motions</p>'
    var tap = tapGroup(model)
    if (tap) rec.value = tap

    var names = expressionNames(model)
    if (names.length) {
      var none = chip('None', function () { setExpression('') })
      none.dataset.expr = ''
      none.classList.add('active')
      exprs.appendChild(none)
      names.forEach(function (n) {
        var b = chip(n, function () { setExpression(n) })
        b.dataset.expr = n
        exprs.appendChild(b)
      })
    } else {
      exprs.innerHTML = '<p class="empty">This model has no expressions</p>'
    }

    var m = byId[state.id]
    $('download-pck').href = CONFIG.regions[state.region].pck + state.id + '.pck'
    $('download-pck').textContent = 'Download ' + state.id + '.pck (' + (state.region === 'kr' ? 'KR' : 'Global') + ')'
    $('stage-label').innerHTML = '<div class="t"></div><div class="s"></div>'
    $('stage-label').querySelector('.t').textContent = m.name || m.outfit || m.id
    $('stage-label').querySelector('.s').innerHTML = (m.name && m.outfit ? escapeHtml(m.outfit) + ' · ' : '') +
      '<code>' + m.id + '</code> · ' + (state.region === 'kr' ? 'Uncensored' : 'Censored')
    document.title = (m.name || m.id) + (m.outfit ? ' (' + m.outfit + ')' : '') + ' · Destiny Child Live2D'
  }

  function markMotion(group) {
    document.querySelectorAll('#motions .chip').forEach(function (b) {
      b.classList.toggle('active', b.dataset.motion === group)
    })
    clearTimeout(markMotion.t)
    markMotion.t = setTimeout(function () {
      document.querySelectorAll('#motions .chip').forEach(function (b) { b.classList.remove('active') })
    }, 1200)
  }

  function markExpression(name) {
    document.querySelectorAll('#expressions .chip').forEach(function (b) {
      b.classList.toggle('active', b.dataset.expr === name)
    })
  }

  // =====================================================================
  // export: PNG and WebM recording
  // =====================================================================
  function fileBase() {
    return state.id + '_' + state.region
  }

  function download(blob, name) {
    var a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 1000)
  }

  function savePng() {
    if (!current) return
    app.renderer.render(app.stage)
    var out = app.renderer.extract.canvas()
    out.toBlob(function (blob) { download(blob, fileBase() + '.png') }, 'image/png')
  }

  var recorder = null, recordTimer = null
  function pickMime() {
    var types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
    for (var i = 0; i < types.length; i++) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(types[i])) return types[i]
    }
    return null
  }

  function toggleRecord() {
    if (recorder) { recorder.stop(); return }
    if (!current) return
    var mime = pickMime()
    if (!mime || !canvas.captureStream) { toast('Recording is not supported in this browser'); return }
    var chunks = []
    var group = $('record-motion').value
    recorder = new MediaRecorder(canvas.captureStream(60), { mimeType: mime, videoBitsPerSecond: 12e6 })
    recorder.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data) }
    recorder.onstop = function () {
      clearTimeout(recordTimer)
      current && current.internalModel.motionManager.off('motionFinish', onFinish)
      recorder = null
      $('record').classList.remove('recording')
      $('record-label').textContent = 'Record'
      download(new Blob(chunks, { type: mime }), fileBase() + '_' + group + (mime.indexOf('mp4') > -1 ? '.mp4' : '.webm'))
    }
    var onFinish = function () { if (recorder) recorder.stop() }
    recorder.start()
    $('record').classList.add('recording')
    $('record-label').textContent = 'Stop'
    playMotion(group).then(function () {
      current.internalModel.motionManager.once('motionFinish', onFinish)
    })
    recordTimer = setTimeout(function () { if (recorder) recorder.stop() }, 30000)
  }

  // =====================================================================
  // small helpers
  // =====================================================================
  function chip(text, onClick) {
    var b = document.createElement('button')
    b.className = 'chip'
    b.type = 'button'
    b.textContent = text
    b.addEventListener('click', onClick)
    return b
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)) }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) || 1 }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';' }) }
  function cssEscape(s) { return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/"/g, '\\"') }

  function showStatus(text, isError) {
    var el = $('stage-status')
    el.hidden = false
    el.classList.toggle('error', !!isError)
    el.querySelector('span').textContent = text
  }
  function hideStatus() { $('stage-status').hidden = true }

  var toastTimer
  function toast(text) {
    var el = $('toast')
    el.textContent = text
    el.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(function () { el.classList.remove('show') }, 2600)
  }

  function hideHint() { $('stage-hint').classList.add('gone') }

  function copy(text, msg) {
    var done = function () { toast(msg) }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { prompt('Copy this link:', text) })
    else prompt('Copy this link:', text)
  }

  function updateSelection() {
    document.querySelectorAll('.segmented button').forEach(function (b) {
      var r = b.dataset.region
      b.setAttribute('aria-checked', String(r === state.region))
      var m = byId[state.id]
      b.disabled = !!(m && !m.regions[r])
      b.title = b.disabled ? 'This model has no ' + CONFIG.regions[r].name + ' version' : ''
    })
    if (EMBED) return
    var prev = document.querySelector('#model-list [aria-selected="true"]')
    if (prev) prev.removeAttribute('aria-selected')
    var m2 = byId[state.id]
    if (m2 && m2.el) {
      m2.el.setAttribute('aria-selected', 'true')
      m2.el.scrollIntoView({ block: 'nearest' })
    }
  }

  // mobile drawers
  function openDrawer(id) {
    closeDrawers()
    $(id).classList.add('open')
    $('scrim').hidden = false
  }
  function closeDrawers() {
    $('sidebar').classList.remove('open')
    $('panel').classList.remove('open')
    $('scrim').hidden = true
  }

  // =====================================================================
  // wire up controls
  // =====================================================================
  function bindControls() {
    document.querySelectorAll('.segmented button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.region === state.region || b.disabled) return
        state.region = b.dataset.region
        selectModel(state.id, { keepExpr: true })
      })
    })

    $('scale').addEventListener('input', function (e) { state.scale = +e.target.value; applyTransform() })
    $('pos-x').addEventListener('input', function (e) { state.x = +e.target.value; applyTransform() })
    $('pos-y').addEventListener('input', function (e) { state.y = +e.target.value; applyTransform() })
    $('reset-view').addEventListener('click', resetView)

    var sizeSel = $('canvas-size')
    var presets = Array.from(sizeSel.options).map(function (o) { return o.value })
    if (state.size !== 'fit') {
      if (presets.indexOf(state.size) > -1) sizeSel.value = state.size
      else {
        sizeSel.value = 'custom'
        $('custom-size').hidden = false
        $('custom-w').value = state.size.split('x')[0]
        $('custom-h').value = state.size.split('x')[1]
      }
    }
    sizeSel.addEventListener('change', function () {
      var v = sizeSel.value
      $('custom-size').hidden = v !== 'custom'
      state.size = v === 'custom' ? customSize() : v
      layout()
    })
    ;['custom-w', 'custom-h'].forEach(function (id) {
      $(id).addEventListener('change', function () { state.size = customSize(); layout() })
    })

    $('backgrounds').addEventListener('click', function (e) {
      var b = e.target.closest('[data-bg]')
      if (!b) return
      state.bg = b.dataset.bg
      drawBackground()
      syncUrl()
    })
    $('bg-custom').addEventListener('input', function (e) {
      state.bg = e.target.value
      drawBackground()
      syncUrl()
    })

    $('save-png').addEventListener('click', savePng)
    $('record').addEventListener('click', toggleRecord)
    $('copy-share').addEventListener('click', function () { copy(buildUrl(), 'Share link copied') })
    $('copy-embed').addEventListener('click', function () { copy(buildUrl({ embed: true }), 'Embed link copied') })
    $('prev-model').addEventListener('click', function () { step(-1) })
    $('next-model').addEventListener('click', function () { step(1) })

    $('toggle-sidebar').addEventListener('click', function () { openDrawer('sidebar') })
    $('toggle-panel').addEventListener('click', function () { openDrawer('panel') })
    $('scrim').addEventListener('click', closeDrawers)

    document.addEventListener('keydown', function (e) {
      if (e.target.matches('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === ']' || e.key === 'ArrowDown') { e.preventDefault(); step(1) }
      else if (e.key === '[' || e.key === 'ArrowUp') { e.preventDefault(); step(-1) }
      else if (e.key === '0') resetView()
      else if (e.key === ' ') { e.preventDefault(); playTap() }
    })
  }

  function customSize() {
    var w = clamp(parseInt($('custom-w').value, 10) || 1000, 64, 4096)
    var h = clamp(parseInt($('custom-h').value, 10) || 1000, 64, 4096)
    return w + 'x' + h
  }

  // =====================================================================
  // start
  // =====================================================================
  readUrl()
  if (!EMBED) bindControls()
  else canvas.addEventListener('click', function () {})   // taps handled by pointer events

  new ResizeObserver(function () { layout() }).observe(stageEl)

  loadModelList().then(function () {
    var start = byId[state.id] ? state.id : CONFIG.defaultModel
    if (state.id && !byId[state.id]) toast('Model "' + state.id + '" not found, showing ' + start)
    selectModel(start, { silent: !!state.id, keepExpr: true })
  }).catch(function (e) {
    console.error(e)
    showStatus('Could not load the model list (data/models.json)', true)
  })

  // handy for debugging in the console
  window.viewer = { app: app, state: state, get model() { return current }, select: selectModel, playMotion: playMotion }
})()
