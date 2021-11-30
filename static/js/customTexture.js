function checkPowerOfTwo(number) {
  return (Math.log(number)/Math.log(2)) % 1 === 0;
}

function handleTextures(textures, index) {
  if (index >= textures.length) {
    initModelCustom('kr', textures)
  }
  else if (textures[index]) {
    var img = new Image();
    img.src = textures[index];
    img.onload = function() {
      if (!checkPowerOfTwo(img.width) ||
          !checkPowerOfTwo(img.height))
      {
        alert("Load failed (texture_0" + index + ".png): check size of your texture file")
        textures[index] = null;
      }
      handleTextures(textures, index + 1);
    }
  }
  else
    handleTextures(textures, index + 1);
}

function handleFiles(files) {
  var reader = new FileReader();
  var img;
  var textures = [null, null];

  function readFile(index) {
    if (index >= files.length) return;
    var file = files[index];
    reader.onload = function(e) {
      if (file.name == "texture_00.png")
        textures[0] = e.target.result;
      else if (file.name == "texture_01.png")
        textures[1] = e.target.result;
      else {
        alert("Load failed (" + file.name + "): file name must be texture_00.png or texture_01.png")
      }
      readFile(index + 1)
      if (index == files.length - 1) {
        handleTextures(textures, 0);
      }
    }
    reader.readAsDataURL(file);
  }
  readFile(0);
}

function initModelCustom(pathDir, textures) {
	if (pathDir == 'kr'){
		dir = "static/Korean/"
	} else
		dir = "static/Global/"

  // get variables from GET
  var searchParams = (new URL(window.location.href)).searchParams,
      canvasWidth = searchParams.get('width') || canvasSize
  var searchParams = (new URL(window.location.href)).searchParams,
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

  loadBytes(getPath(dir, 'MOC.' + modelName + '.json'), 'text', function(buf) {
    var modelJson = JSON.parse(buf)
    initLive2dCustom(dir, modelJson, textures)
  })
}

function initLive2dCustom(dir, model, textures) {
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
  initCustom(dir, canvas, textures)
}



function initCustom(dir, canvas, textures) {
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
    if (textures[i] != null)
      loadedImages[i].src = textures[i]
    else
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
  })
  // child motions
  if(modelJson.motions.attack) {
    loadBytes(getPath(dir, modelJson.motions.attack[0].file), 'arraybuffer', function(buf) {
      motionClick = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionClick._$eo = 0
      motionClick._$dP = 0
	  })

    loadBytes(getPath(dir, modelJson.motions.hit[0].file), 'arraybuffer', function(buf) {
      motionHit = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionHit._$eo = 0
      motionHit._$dP = 0
    })

/*    loadBytes(getPath(dir, modelJson.motions.banner[0].file), 'arraybuffer', function(buf) {
      motionClick = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionClick._$eo = 0
      motionClick._$dP = 0
    })
*/
  }
  // spa motions
  else if ( modelJson.motions.touch) {
	 loadBytes(getPath(dir, modelJson.motions.touch[0].file), 'arraybuffer', function(buf) {
      motionClick = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionClick._$eo = 0
      motionClick._$dP = 0
	})
	 loadBytes(getPath(dir, modelJson.motions.max[0].file), 'arraybuffer', function(buf) {
      motionMax = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionMax._$eo = 0
      motionMax._$dP = 0
	})
	 loadBytes(getPath(dir, modelJson.motions.maxtouch[0].file), 'arraybuffer', function(buf) {
      motionMaxtouch = new Live2DMotion.loadMotion(buf)
      // remove fade in/out delay to make it smooth
      motionMaxtouch._$eo = 0
      motionMaxtouch._$dP = 0
	})}

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
