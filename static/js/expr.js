var exprParams = []
var exprParamsVal = []
var exprParamsDef = []


function enableExpr(key) {
  var exprId, exprVal, exprDef;
  var idx;
  exprParamsVal.fill(null)

  if ("params" in exprs[key]) {
    var params = exprs[key].params

    for (var i = 0; i < params.length; i++) {
      exprId = params[i].id
      exprVal = params[i].val
      if ("def" in params[i])
        exprDef = params[i].def
      else
        exprDef = 0

      idx = exprParams.indexOf(exprId)
      if (idx === -1) {
        exprParams.push(exprId)
        exprParamsVal.push(exprVal)
        exprParamsDef.push(exprDef)
      }
      else {
        exprParamsVal[idx] = exprVal
      }
    }
  }

  for (var i = 0; i < exprParams.length; i++) {
    if (exprParamsVal[i] === null)
      exprParamsVal[i] = exprParamsDef[i]
  }

  for (var i = 0; i < motions.length; i++) {
    motionParams = motions[i].motions.map(x => x._$4P)

    for (var j = 0; j < exprParams.length; j++) {
      idx = motionParams.indexOf(exprParams[j])
      if (idx === -1) {
        var m = {}
        m._$4P = exprParams[j]
        m._$I0 = new Float32Array(1)
        m._$I0[0] = exprParamsVal[j]
        m._$RP = 0
        motions[i].motions.push(m)
      }
      else {
        motions[i].motions[idx]._$I0 = new Float32Array(1)
        motions[i].motions[idx]._$I0[0] = exprParamsVal[j]
      }
    }
  }
}

function appendExprButton (key) {
  var exprButton = document.createElement("button")
  exprButton.innerText = key
  exprButton.setAttribute("type", "button")
  exprButton.setAttribute("name", key + "ExprButton")
  exprButton.setAttribute("onclick", "javascript:enableExpr('" + key + "')")
  document.getElementById("exprs").appendChild(exprButton)
}

function exprsOnload () {
  for (var key in exprs) {
    appendExprButton(key)
  }
}
