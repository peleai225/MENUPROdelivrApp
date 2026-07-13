---
name: Image processing in sandbox
description: How to crop/resize/composite images (app icons, splash screens) when script access is needed
---

The CodeExecution sandbox does not have the `sharp` npm package installed, and dynamic-importing
it inside a "use impure" function fails with ERR_MODULE_NOT_FOUND. Don't try to install it ad hoc.

**Why:** ImageMagick (`magick` / legacy `convert`) is already present in the Nix environment and
handles the same crop/resize/pad/composite operations (e.g. squaring a wide logo onto a white
canvas for an app icon, or centering it on a portrait canvas for a splash screen) via plain
ShellExec commands — no package install, no Node needed.

**How to apply:** For one-off asset processing (app icons, splash screens, image padding/cropping),
default to `magick <src> -resize <W>x -background white -gravity center -extent <W>x<H> <out>`
via ShellExec instead of reaching for sharp/Jimp in CodeExecution.
