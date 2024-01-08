# Project for Mobile Computing WS23/24 @ KIT

## Web Puzzle Game
### Features
- Supports both Image and Video input by uploading a file and displays it dynamically via canvas puzzle-tiles
- Supports Video input from Camera via WebRTC
- Supports using a representative image color for image borders with [color-thief](https://github.com/lokesh/color-thief)
- Supports using a custom color for borders
- Supports custom refresh rate for video tiles to ensure performance on slower hardware#
- Supports dynamic puzzle & tile resizing with the browser window
- Supports Dark mode (with a switch & auto-detect preferred user theme)

### Planned Features
- Maybe a different view mode (unlikely, tried it but the normal view, which is being used, felt best)
- Currently none! :)

### Impossible to implement
- Safari mobile support for video tiles (can't see the safari logs due to lack of macbook, webcam seems to work however)
- Didn't test mobile support on Android devices

### Notable
- As the header and footer are designed to be imported on multiple sites by just including the import script you need to open the website via a local hosted server so that the header and footer can be imported by the scripts
- Always include the `footer.js` before the `navbar.js`, as the navbar script modifies elements of the footer so it has to be loaded after (include order can be copied from the `index.html`) 

---
- GitHub Link: https://github.com/BasicallyPolaris/MC-HTML
- By Soheel Dario Aghadavoodi Jolfaei
