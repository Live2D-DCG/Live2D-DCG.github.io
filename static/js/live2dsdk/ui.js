/* global $ */


function loadAssets(callback) {
  $.getJSON('static/json/assets.json', function(data) {
    $.each(data, function(i, asset) {
      var id = asset.id
      selectedModel = selectedModel || id
      modelIds.push(id)
      assets[id] = asset
      $('select').append(
        '<option value="' + id + '">' + getLabel(id) + '</option>'
      )
    })
    callback()
  })
}

    loadAssets(function() {
      createComboBox()
      createSlider()
	  createScaleSlider()
	  createOffsetXSlider()
	  createOffsetYSlider()
      $('#previous').button()
      $('#previous').click(function() { setSelectedIndex(getSelectedIndex() - 1) })
      $('#next').button()
      $('#next').click(function() { setSelectedIndex(getSelectedIndex() + 1) })
      var model = searchParams.get('model')
      var modelIndex = modelIds.indexOf(model)
      if(modelIndex > -1) setSelectedIndex(modelIndex)
      else updateViewer()
      $('#loading').hide()
      $('#ui').show()
    })

