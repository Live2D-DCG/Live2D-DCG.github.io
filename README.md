## Model folders

Models live in two places:

- `static/Korean/<id>/` : uncensored
- `static/Global/<id>/` : censored

Each folder (for example `static/Korean/c001_02/`) has:

- `MOC.<id>.json` : the model's settings file
- `character.dat` : the model
- `texture_00.png` : textures (some have more than one)
- `*.mtn` : motions (idle, attack, touch, max, ...)
- `*.exp.json` : expressions (not every model has these)

**Adding new models**

1. Drop the folders into `static/Korean/` and/or `static/Global/`
2. Add the English name to `data/names.json` if it's a new character
3. Run `node tools/build-models.js` from the repo root (rebuilds `data/models.json`)
4. Commit and push

## How a page load works

1. `index.html` loads the Live2D libraries, then `js/app.js`
2. `app.js` reads the URL (model, version, scale, position, background)
3. It loads `data/models.json` and builds the sidebar list
4. It loads the model's `MOC.<id>.json`, which pulls in the model, textures and motions
5. Motion and expression buttons are built from what that model has
6. The URL updates as you change things, so the address bar is always a working share link

Switching models never reloads the page. The old model is swapped out in place.

## Running and deploying

**Run locally**

1. `index.html` loads the Live2D libraries, then `js/app.js`
2. `app.js` reads the URL (model, version, scale, position, background)
3. It loads `data/models.json` and builds the sidebar list
4. It loads the model's `MOC.<id>.json`, which pulls in the model, textures and motions
5. Motion and expression buttons are built from what that model has
6. The URL updates as you change things, so the address bar is always a working share link

A local server is needed. Opening `index.html` directly won't load the models.