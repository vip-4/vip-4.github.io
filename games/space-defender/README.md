# 🚀 Space Defender

A classic arcade-style space shooter game built with vanilla JavaScript and HTML5 Canvas. Defend Earth from waves of alien invaders, dodge asteroids, and collect treasure in bonus rounds!

![Game Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34C26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

## 🎮 Play Now

Simply download the `index.html` file and open it in your web browser - no installation required!

## 📖 Table of Contents

- [Features](#-features)
- [How to Play](#-how-to-play)
- [Controls](#-controls)
- [Game Mechanics](#-game-mechanics)
- [Installation](#-installation)
- [Technologies Used](#-technologies-used)
- [Browser Compatibility](#-browser-compatibility)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Gameplay
- 🎯 **Classic Arcade Action** - Smooth 60 FPS gameplay with responsive controls
- 👾 **Multiple Enemy Types** - Face off against different invader types with varying strengths
- ☄️ **Dynamic Asteroids** - Dodge falling space rocks that increase in frequency
- 🎨 **Particle Effects** - Explosive visual feedback for all interactions
- 🔊 **Retro Sound Effects** - Web Audio API-generated sounds for authentic arcade feel

### Progressive Difficulty System
- 📈 **Level Progression** - Difficulty increases with each level
- ⚡ **Speed Scaling** - Enemies move and shoot faster as you advance
- 🌟 **Adaptive Spawning** - Asteroid spawn rates increase over time

### Bonus Features
- 💰 **Bonus Levels** - Special coin-collecting rounds every 3 levels
- 🏪 **Shop System** - Purchase power-ups between bonus rounds
- 🛡️ **Shield Protection** - 10-second invincibility shield available for purchase
- ❤️ **Extra Lives** - Buy additional lives with collected coins
- ⏱️ **Timed Challenges** - 10-second treasure chest collection rounds

### Quality of Life
- ⏸️ **Pause Function** - Pause anytime with 'P' key or pause button
- 🔇 **Mute Option** - Toggle sound effects on/off
- 📱 **Mobile Support** - Touch controls for mobile devices
- 🖥️ **Responsive Design** - Adapts to any screen size

## 🎯 How to Play

1. **Objective**: Survive waves of alien invaders while achieving the highest score possible
2. **Destroy Enemies**: Shoot invaders and asteroids to earn points
3. **Avoid Damage**: Dodge enemy bullets and falling asteroids
4. **Complete Levels**: Clear all invaders to advance (earn +1 life per level!)
5. **Collect Coins**: Every 3rd level is a bonus round - shoot treasure chests for coins
6. **Shop Wisely**: Use coins to buy extra lives or shield protection
7. **Survive**: Game ends when you run out of lives or invaders reach your position

## 🎮 Controls

### Keyboard Controls
| Key | Action |
|-----|--------|
| `←` / `A` | Move Left |
| `→` / `D` | Move Right |
| `SPACE` | Shoot |
| `P` | Pause/Resume |
| `Click` | Shoot (Mouse) |

### Mobile Controls
- **Touch buttons** appear automatically on mobile devices
- Left/Right arrows for movement
- Fire button for shooting

## 🔧 Game Mechanics

### Scoring System
- **Weak Invader**: 10 points
- **Strong Invader**: 20 points
- **Asteroid**: 10 points
- **Level Completion**: 100 points bonus
- **Bonus Life**: +1 life for each completed level

### Enemy Behavior
- **Invaders**: Move horizontally and descend when reaching screen edges
- **Asteroids**: Fall vertically with random rotation
- **Enemy Fire**: Invaders shoot randomly with increasing frequency

### Bonus Level Mechanics
- Appears every 3 levels (3, 6, 9, etc.)
- 10-second timer to collect treasure chests
- Chests contain 10-40 coins randomly
- Coins can only be spent immediately after bonus round

### Shop Items
| Item | Cost | Effect |
|------|------|--------|
| Extra Life | 50 💰 | +1 life |
| Shield | 100 💰 | 10 seconds protection at level start |

### Difficulty Progression
- **Invader Speed**: +0.2 per level
- **Shooting Rate**: +0.0003 per level
- **Asteroid Spawn**: +0.003 per level
- **Enemy Bullet Speed**: +0.2 per level

## 💾 Installation

### Option 1: Direct Download
1. Download the `index.html` file
2. Open it in any modern web browser
3. Start playing!

### Option 2: Clone Repository
```bash
# Clone this repository
git clone [Space-Defender-Game](https://github.com/navaranjithsai/Space-Defender-Game.git)

# Navigate to the game directory
cd space-defender

# Open index.html in your browser
# On Mac:
open index.html
# On Windows:
start index.html
# On Linux:
xdg-open index.html
```

### Option 3: Host on GitHub Pages
1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from branch" → main → root
4. Your game will be available at `https://yourusername.github.io/Space-Defender-Game/`

## 🛠️ Technologies Used

- **HTML5 Canvas** - Game rendering and animation
- **Vanilla JavaScript** - Game logic and mechanics (no frameworks!)
- **Tailwind CSS** - UI styling via CDN
- **Web Audio API** - Dynamic sound generation
- **CSS3 Animations** - UI effects and transitions

## 🌐 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full Support |
| Firefox | 88+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 90+ | ✅ Full Support |
| Opera | 76+ | ✅ Full Support |
| Mobile Chrome | Latest | ✅ Full Support |
| Mobile Safari | Latest | ✅ Full Support |

## 🎨 Screenshots

<details>
<summary>View Game Screenshots</summary>
<img width="1366" height="605" alt="image" src="https://github.com/user-attachments/assets/d10d8994-e600-495f-992c-7257d2cb86d7" />

### Main Menu
*Start screen with game controls*
<img width="1366" height="603" alt="image" src="https://github.com/user-attachments/assets/83370456-147e-4c52-a14d-ef0ae41d3f45" />

### Gameplay
*Active gameplay showing invaders, asteroids, and player ship*
<img width="1366" height="599" alt="image" src="https://github.com/user-attachments/assets/3b9533b4-4dac-4aad-9be0-a7cbfa69f2b6" />
<img width="1366" height="601" alt="image" src="https://github.com/user-attachments/assets/063b73dc-3a9a-4b9d-a27a-3d14503849db" />

### Bonus Level
*Treasure chest collection round*
<img width="1366" height="600" alt="image" src="https://github.com/user-attachments/assets/b4e9af59-cf59-4f8e-ba8f-9e6c0e33abd2" />

### Shop Screen
*Power-up purchase interface*
<img width="1366" height="602" alt="image" src="https://github.com/user-attachments/assets/42259526-e277-4b85-aea5-c12b6f86ade4" />

### Shield Active
*Player with protective bubble shield*
<img width="1366" height="598" alt="image" src="https://github.com/user-attachments/assets/1a0b2b4c-8a23-4587-8804-2db1f3d5f1d2" />


</details>

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Ideas for Contributions
- 🎮 New power-ups (rapid fire, multi-shot, etc.)
- 👾 Additional enemy types
- 🎨 Visual themes/skins
- 🎵 Background music system
- 🏆 High score leaderboard
- 🌍 Different levels/backgrounds
- 💥 Boss battles
- 🚀 Player ship upgrades

## 🐛 Known Issues

- Audio may not work on first interaction in some browsers or too beep sounds (requires user gesture)
- Performance may vary on older mobile devices
- Touch controls may overlap game area on very small screens

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Navaranjith Sai**
- GitHub: [@navaranjithsai](https://github.com/navaranjith)
- LinkedIn: [Navaranjith Sai Varayogula](https://linkedin.com/in/navaranjithsai)

## 🙏 Acknowledgments

- Inspired by classic arcade games like Space Invaders and Galaga
- Built as a learning project for HTML5 Canvas game development
- Thanks to the open-source community for inspiration and resources

## 📈 Future Roadmap

- [ ] Local high score storage
- [ ] Online leaderboards
- [ ] Multiple difficulty modes
- [ ] Boss battles every 10 levels
- [ ] Power-up drops from destroyed enemies
- [ ] Co-op multiplayer mode
- [ ] Custom ship designs
- [ ] Achievement system
- [ ] Background music with mute option
- [ ] Save game progress

## 🎮 Game Statistics

- **Total Lines of Code**: ~1,200
- **Development Time**: [2h]
- **File Size**: ~45 KB (single file!)
- **No Dependencies**: Pure vanilla JavaScript
- **Load Time**: < 1 second

---

<div align="center">

**Made with ❤️ and HTML/JavaScript By [Tech4File](https://github.com/Tech4File)**

⭐ Star this repository if you enjoy the game!

</div>
