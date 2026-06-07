<!-- prettier-ignore -->
# 🎮 Playful Tetris

<p align="center">
	<img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
	<img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
	<img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
	<img alt="Live demo" src="https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge&logo=github" />
</p>

Playful browser Tetris with themed UI, hold/next previews, and simple settings. Dive in and enjoy a colorful retro-arcade feel.

[▶️ Play the live demo](https://ayinuer.github.io/TetrisGame/)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Quick glance](#quick-glance)
- [Color palette](#-color-palette)
- [Preview](#preview)
- [Controls](#controls)
- [Tips](#tips)
- [Code Validation](#code-validation)
- [Declaration of AI Assistance](#declaration-of-ai-assistance)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 Overview

🟡 Playful Tetris is a lightweight browser game implemented in vanilla JavaScript using the HTML5 Canvas API. It's intended as a small, self-contained demo with no build step — open `index.html` in any modern browser to play.

Quick details:

- Language: JavaScript (ES6)
- Renderer: Canvas API
- Main files: `index.html`, `style.css`, `app.js`
- Storage: localStorage (preferences and high score)

---

## Quick glance

- Responsive: desktop and mobile
- Light (colorful paper) & Dark theme
- Hold / Next preview, ghost piece, hard drop
- Keyboard + on-screen touch controls
- Saves preferences and high score in localStorage

### 🎨 Color palette

Center: primary, accent, paper, dark, and teal swatches used across the UI.

<p align="center">
	<img alt="Primary" src="https://img.shields.io/badge/Primary-%23FF6B6B?style=for-the-badge&logoColor=white" />
	<img alt="Accent" src="https://img.shields.io/badge/Accent-%23FFD93D?style=for-the-badge&logoColor=black" />
	<img alt="Paper" src="https://img.shields.io/badge/Paper-%23FFF8EF?style=for-the-badge&logoColor=black" />
	<img alt="Dark" src="https://img.shields.io/badge/Dark-%230F172A?style=for-the-badge&logoColor=white" />
	<img alt="Teal" src="https://img.shields.io/badge/Teal-%2300C2A8?style=for-the-badge&logoColor=white" />
</p>

You can paste these into your CSS variables:

```css
:root {
	--color-primary: #FF6B6B; /* warm coral */
	--color-accent:  #FFD93D; /* sunny yellow */
	--color-paper:   #FFF8EF; /* paper-like background */
	--color-dark:    #0F172A; /* deep blue/ink */
	--color-teal:    #00C2A8; /* fresh teal */
}
```

---

## Preview

### Gameplay
![Gameplay preview](/assets/Screenshot%201.png)

---

## Controls

- ← / → : move piece left / right
- ↑ : rotate piece
- ↓ : soft drop
- Space : hard drop
- Hold button : save/swap the current piece
- Start / Pause / Reset : control the game
- Theme : toggle light/dark themes

Mobile on-screen controls match the desktop controls.

---

## Tips

- Clear multiple rows at once for higher scoring bonuses.
- Use Hold to store a useful piece for later.
- Keep the stack as flat as possible to avoid losing space.

---

## ✅ Code Validation

This project is small and uses no build tools. Suggested quick validation steps:

- Open `index.html` in a modern browser (Chrome, Firefox, Safari) and check the console for runtime errors.
- Run a static linter on `app.js` (for example ESLint) for style and potential issues.
- Verify there are no obvious accessibility issues (keyboard controls work, ARIA where applicable).

If you want, I can add a simple `npm`-based dev setup with ESLint and a test harness.

---

## 📝 Declaration of AI Assistance

Some edits to this repository (documentation and UI polish) were assisted by an AI code assistant. All logic, assets, and final decisions remain under the author's control. If you'd like, I can add a short CONTRIBUTORS or CREDITS section listing the edits performed.

---

## Contributing

Contributions welcome — open issues or send a pull request with small, focused changes.

---

## 👥 Contributors & Credits

- Ayinuer — project author, game logic, and original assets.
- AI assistant — documentation polish, README redesign (badges, palette, TOC), UI styling suggestions, theme variables and light/dark polish, hold/preview UI visibility fixes, removal of unused i18n code, and small accessibility and layout tweaks.

All code and final decisions remain under the author's control.

---

## License

Use this project freely for learning and prototyping. Please include attribution on redistribution.