# Gizmo Attack

Download this repository, then upload the playable files to [gizmokitten.io](https://gizmokitten.io). GitHub will not run the game in the browser — it is only storage.

## 1. Download

On this page click **Code → Download ZIP**. Unzip it. You will get a folder named `gizmo-attack-main`.

## 2. Upload to Hostinger

Upload the **contents** of `gizmo-attack-main` (not the zip) to:

```
games/gizmo-attack/
```

These files must sit together:

```
games/gizmo-attack/index.html
games/gizmo-attack/gizmo-attack.html
games/gizmo-attack/screenshot-gizmo-attack.png
games/gizmo-attack/assets/
games/gizmo-attack/gizmo-attack/   (sprites: enemies, towers, tiles, fx)
```

## 3. Arcade tile

In `games.html` use `games-tile.html` (or this href):

```
href="gizmo-attack/index.html"
```

Never link `games.gizmoattack.tsx`. That is source, not a webpage.

Play URL after upload:

```
https://gizmokitten.io/games/gizmo-attack/index.html
```

## Folder guide

| Path | What it is |
| --- | --- |
| `index.html` / `gizmo-attack.html` | Game page (site nav + game) |
| `assets/` | Game script and CSS |
| `gizmo-attack/` | Sprites the game loads |
| `art/` | Banners and character cards (not required to play) |
| `source/` | React/canvas source if you want to rebuild later |
