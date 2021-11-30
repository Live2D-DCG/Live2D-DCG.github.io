var files = {'png':300};
for (var ext in files){
for (var i = 0; i < files[ext]; i++){
	var src = "img/bg (" + (i+1) + ")." + ext;
	var cls = "col-2" 
	var img = new Image(); 
    img.src = src;
	img.className = cls;
    document.getElementById("Photo").appendChild(img);
}
}