// default parameters
var canvasSize = 800,
    modelName = "c479_00",
    modelScale = 1.0,
    modelX = 0.0,
    modelY = 0.0,
    motionIdle = null, motionClick = null,
    canvasWidth = 800, canvasHeight = 800

var motions = []
var motionEtc = []
var exprs = {}


function totsugeki() {
  doDraw = true
  if(motionMgr !== null && motionClick !== null) {
    motionMgr.startMotion(motionClick)
  }
}

function switchSpa(isMax) {
  if (motionMgr !== null && motionMax !== null && motionMaxtouch !== null) {
    if (isMax) {
      motionIdle = motionMax
      motionClick = motionMaxtouch
    }
    else {
      motionIdle = motionIdle_
      motionClick = motionTouch
    }
  }
}

function parseFloat(arr) {
  var intval = 0, mask = 0x1000000, i
  var sign, exp, mantissa, float = 0
  for (i = 0; i < 4; i++) {
    intval = intval + arr[i] * mask
    mask = mask >>> 8
  }
  if (intval === 0)
    return 0.0
  sign = (intval >>> 31) ? -1 : 1;
  exp = (intval >>> 23 & 0xff) - 127;
  if (exp === 128)
    return null
  mantissa = ((intval & 0x7fffff) + 0x800000).toString(2);
  for (i = 0; i < mantissa.length; i++) {
    float += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0;
    exp--;
  }
  return float * sign;
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0, strlen=str.length; i<strlen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
 return buf;
}

function getAllIndexes(arr, strings) {
  var res = [], val, i, j;

  for (i = 0; i < strings.length; i++) {
    if (strings[i].indexOf("VISIBLE:") !== -1) {
      res.push(null)
      continue
    }
    var ab = new Uint8Array(str2ab(strings[i]))
    val = ab[0]
    for (j = arr.indexOf(val); j < arr.length; j++) {
      if (arr[j] === val) {
        if (ab.toString() === arr.slice(j, j + ab.length).toString()) {
          res.push(j)
          break
        }
      }
      if (j === arr.length - 1)
        res.push(0)
    }
  }
  return res;
}

function initModelTeen() {
  var dir = "static/Global/"

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      // Remove when you try to local test
      if (xhr.status !== 200) {
        console.error('Failed to load (' + xhr.status + ') : ' + path)
        initModel()
      } else {
          var modelJson = JSON.parse(xhr.response)
          initLive2d(dir, modelJson)
      }
    }
  }

  var path = dir + modelName + '/MOC.' + modelName + '.json'
  xhr.open('GET', path, true);
  xhr.send(null);
}

function initModelKR() {
  var searchParams = (new URL(window.location.href)).searchParams
  var canvasWidth = searchParams.get('width') || canvasSize,
      canvasHeight = searchParams.get('height') || canvasSize

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  var mS = searchParams.get('mS')
  if(mS) modelScale = mS
  var mX = searchParams.get('mX')
  if(mX) modelX = mX
  var mY = searchParams.get('mY')
  if(mY) modelY = mY
  var mN = searchParams.get('mN')
  if(mN) modelName = mN

  if (searchParams.get('isTeen') === "true") {
    initModelTeen()
  } else {
    initModel()
  }
}

function initModel() {
	var dir = "static/Korean/"

  loadBytes(getPath(dir, 'MOC.' + modelName + '.json'), 'text', function(buf, status) {
    // Remove when you try to local test
    if (status !== 200) {
      console.error('Failed to load (' + status + ') : ' + getPath(dir, 'MOC.' + modelName + '.json'))
      return;
    }
    var modelJson = JSON.parse(buf)
    initLive2d(dir, modelJson)
  })
}

function initLive2d(dir, model) {
  // declare global variables
  this.live2DModel = null
  this.requestID = null
  this.loadLive2DCompleted = false
  this.initLive2DCompleted = false
  this.loadedImages = []

  var motionMgr = null

  this.modelJson = model

  var canvas = document.getElementById('canvas')

  // the fun begins
  Live2D.init()
  init(dir, canvas)
}

function init(dir, canvas) {
  // try getting WebGl context
  var gl = getWebGLContext(canvas)
  if(!gl) {
    console.error('Failed to create WebGl context!')
    return
  }
  // pass WebGl context to Live2D lib
  Live2D.setGL(gl)

  // ------------------------
  // start of model rendering
  // ------------------------
  loadBytes(getPath(dir, modelJson.model), 'arraybuffer', function(buf) {
    live2DModel = Live2DModelWebGL.loadModel(buf)
    //document.getElementById('loading').remove()
  })

  // ------------------------
  // start loading textures
  // ------------------------
  var loadedCount = 0
  for(var i = 0; i < modelJson.textures.length; i++) {
  // create new image
    loadedImages[i] = new Image()
    loadedImages[i].src = getPath(dir, modelJson.textures[i])
    loadedImages[i].onload = function() {
      // check if all textures are loaded
      loadedCount++
      if(loadedCount == modelJson.textures.length) {loadLive2DCompleted = true}
    }
    loadedImages[i].onerror = function() {
      console.error('Failed to load texture: ' + modelJson.textures[i])
    }
  }

  // ------------------------
  // start loading motions
  // ------------------------
  motionMgr = new L2DMotionManager()
  loadBytes(getPath(dir, modelJson.motions.idle[0].file), 'arraybuffer', function(buf) {
    motionIdle = new Live2DMotion.loadMotion(buf)
    // remove fade in/out delay to make it smooth
    motionIdle._$eo = 0
    motionIdle._$dP = 0
    motions.push(motionIdle)
  })

  loadBytes(getPath(dir, modelJson.motions.idle[0].file), 'arraybuffer', function(buf) {
    motionDefault = new Live2DMotion.loadMotion(buf)
    // remove fade in/out delay to make it smooth
    motionDefault._$eo = 0
    motionDefault._$dP = 0
    motionDefault._$D0 = 1
    motionDefault._$yT = 10
    motionDefault._$rr = 10000
    var motionStrings = motionDefault.motions.map(({_$4P}) => _$4P)
    loadBytes(getPath(dir, 'character.dat'), 'arraybuffer', function(buf) {
      var motionValue = []
      var charData = new Uint8Array(buf)
      var indexes = getAllIndexes(charData, motionStrings)
      var val, i

      for (i = 0; i < indexes.length; i++) {
        if (indexes[i] !== null && indexes[i] !== 0) {
          val = parseFloat(charData.slice(indexes[i] - 6, indexes[i] - 2))
          motionValue.push(val)
        }
        else {
          motionValue.push(indexes[i])
        }
      }

      for (var i = 0; i < motionValue.length; i++) {
        if (motionValue[i] === null) {
          motionValue.splice(i, 1);
          motionDefault.motions.splice(i, 1);
          i--;
          continue
        }
        var arr = new Float32Array(10)
        motionDefault.motions[i]._$I0 = arr.fill(motionValue[i])
      }
    })
    motions.push(motionDefault)
  })

  // child motions
  if(modelJson.motions.attack) {
    loadBytes(getPath(dir, modelJson.motions.attack[0].file), 'arraybuffer', function(buf) {
      motionClick = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionClick._$eo = 0
      motionClick._$dP = 0
      motions.push(motionClick)
	  })

    if (modelJson.motions.hit) {
      loadBytes(getPath(dir, modelJson.motions.hit[0].file), 'arraybuffer', function(buf) {
        motionHit = new Live2DMotion.loadMotion(buf)
        // remove fade in/out delay to make it smooth
        motionHit._$eo = 0
        motionHit._$dP = 0
        motions.push(motionHit)
      })
    }
    else {
      motionHit = motionClick
    }

    // child expressions
    if ("expressions" in modelJson) {
      var exprsJson = modelJson.expressions
      var exprCount = 0

      for (var i = 0; i < exprsJson.length; i++) {
        var exprName = exprsJson[i].name
        loadBytes(getPath(dir, exprsJson[i].file), 'text', function (exprText, status, path) {
          exprText = exprText.replace(/(00)/gi, '"00"')
          expr = JSON.parse(exprText)
          exprName = path.split('/').pop().split('.')[0]
          exprs[exprName] = expr
          exprCount++;
          if (exprCount == exprsJson.length)
            exprsOnload(exprs)
        })
      }
    }

    var defaultMotions = ["idle", "attack", "hit"]
    var idx = 0
    var divPreviewButton = document.getElementById("previewButton")
    var divHQLSButton = document.getElementById("HQLSButton")
    var keys = []

    for (var key in modelJson.motions) {
      keys.push(key)
    }
    for (var i = 0; i < keys.length; i++) {
      key = keys[i]
      console.log(key)
      if (defaultMotions.indexOf(key) == -1) {
        var previewButton = document.createElement("button")
        previewButton.textContent = key + " motion"
        previewButton.name = key + "Preview"
        previewButton.setAttribute("onclick", "javascript:doDraw=true;motionMgr.startMotion(motionEtc[" + idx.toString() + "]);")
        divPreviewButton.appendChild(previewButton)

        var HQLSButton = document.createElement("button")
        HQLSButton.textContent = "get FULL " + key + " motion PNGs"
        HQLSButton.name = key + "HQLS"
        HQLSButton.setAttribute("onclick", "javascript:getPNGsFull('" + key + "');")
        divHQLSButton.appendChild(HQLSButton)

        file = modelJson.motions[key][0].file
        loadBytes(getPath(dir, file), 'arraybuffer', function(buf, idx) {
          motiontmp = new Live2DMotion.loadMotion(buf)
          motiontmp._$eo = 0
          motiontmp._$dP = 0
          motions.push(motiontmp)
          motionEtc.push(motiontmp)
        })

        idx = idx + 1
      }
    }
  }

  // spa motions
  else if ( modelJson.motions.touch) {
    loadBytes(getPath(dir, modelJson.motions.touch[0].file), 'arraybuffer', function(buf) {
      motionClick = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionClick._$eo = 0
      motionClick._$dP = 0
      motions.push(motionClick)
    })
    loadBytes(getPath(dir, modelJson.motions.max[0].file), 'arraybuffer', function(buf) {
      motionMax = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionMax._$eo = 0
      motionMax._$dP = 0
      motions.push(motionMax)
    })
    loadBytes(getPath(dir, modelJson.motions.maxtouch[0].file), 'arraybuffer', function(buf) {
      motionMaxtouch = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionMaxtouch._$eo = 0
      motionMaxtouch._$dP = 0
      motions.push(motionMaxtouch)
    })

    loadBytes(getPath(dir, modelJson.motions.idle[0].file), 'arraybuffer', function(buf) {
      motionIdle_ = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionIdle_._$eo = 0
      motionIdle_._$dP = 0
      motions.push(motionIdle_)
    })
    loadBytes(getPath(dir, modelJson.motions.touch[0].file), 'arraybuffer', function(buf) {
      motionTouch = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionTouch._$eo = 0
      motionTouch._$dP = 0
      motions.push(motionTouch)
    })
  }

  // ------------------------
  // ?loop every frame
  // ------------------------
  (function tick() {
    draw(gl)

    var requestAnimationFrame =
            window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame
    requestID = requestAnimationFrame(tick, canvas)
  })()
}

var doDraw = true

function draw(gl) {
  if(doDraw === false){ return; }

  // clear canvas
  gl.clearColor(0.0, 0.0, 0.0, 0.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // check if model and textures are loaded
  if(!live2DModel || !loadLive2DCompleted) return
  // check if first time drawign
  if(!initLive2DCompleted) {
    initLive2DCompleted = true

    // apply textures to the model
    for(var i = 0; i < loadedImages.length; i++) {
      var texture = getWebGLTexture(gl, loadedImages[i])
      live2DModel.setTexture(i, texture)
    }

    // reduce resources usage
    loadedImages = null

    // pass WebGl to model
    live2DModel.setGL(gl)
  }

  // something about model matrix
  var width = live2DModel.getCanvasWidth()
  var height = live2DModel.getCanvasHeight()

  var modelMatrix = new L2DModelMatrix(width, height)

  modelMatrix.setWidth(modelScale)
  modelMatrix.setCenterPosition(modelX, modelY)

  var modelMatrixArray = modelMatrix.getArray()
  var scaleX = 1, scaleY = 1
  var w = canvas.width, h = canvas.height

  if (w < h) {
    scaleX = h / w
  }
  modelMatrixArray[0] *= scaleX

  if (w > h) {
    scaleY = w / h
  }
  modelMatrixArray[5] *= scaleY

  live2DModel.setMatrix(modelMatrixArray)

  // start idle animation
  if(motionMgr.isFinished()) {
    motionMgr.startMotion(motionIdle)
  }
  motionMgr.updateParam(live2DModel)

  // update and draw model
  live2DModel.update()
  live2DModel.draw()
}

// common helpers
function loadBytes(path, mime, callback) {
  var request = new XMLHttpRequest()
  request.open('GET', path, true)
  request.responseType = mime
  request.onloadend = function() {
    if(request.status === 200) {
      callback(request.response, request.status, path)
    }
    else {
      console.error('Failed to load (' + request.status + ') : ' + path)
    }
  }
  request.send(null)
}

function getPath(pathDir, file) {
  return pathDir + modelName + '/' + file
}

// WebGL helpers
function getWebGLContext(canvas) {
  // try different WebGl kits
  var kits = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl']
  var param = { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true }

  for(var i = 0; i < kits.length; i++) {
    try {
      var ctx = canvas.getContext(kits[i], param)
      if(ctx) return ctx
    }
    catch(e) {}
  }
  return null
}

function getWebGLTexture(gl, img) {
  // create empty texture
  var texture = gl.createTexture()

  // a lot of WebGL things i dont understand
  if(live2DModel.isPremultipliedAlpha() == false) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.activeTexture(gl.TEXTURE0 )
  gl.bindTexture(gl.TEXTURE_2D, texture )
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture
}
