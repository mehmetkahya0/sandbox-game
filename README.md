# 🧪 Physics Sandbox Game

A modern, interactive physics simulation game built with HTML5 Canvas and JavaScript. Create, experiment, and watch realistic particle physics unfold in real-time!

![Game Preview](https://img.shields.io/badge/Status-Active-brightgreen)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange)
![CSS3](https://img.shields.io/badge/CSS3-Modern-blue)

## 🎮 Features

### 🌟 **19 Unique Elements**
- **Solids**: Dirt, Stone, Sand, Plant, Ice, Metal, Wood, Magnet
- **Liquids**: Water, Oil, Lava, Acid
- **Gases**: Fire, Steam, Gas, Plasma
- **Special**: Gunpowder, Electricity, Virus

### 🛠️ **Advanced Tools**
- **Brush** 🖌️ - Paint elements with adjustable size
- **Eraser** 🧽 - Remove elements
- **Eyedropper** 💧 - Sample existing elements
- **Line Tool** 📏 - Draw straight lines
- **Rectangle** ⬜ - Create rectangular shapes
- **Circle** ⭕ - Draw circular patterns
- **Explosion** 💥 - Create explosive reactions
- **Gravity** 🌍 - Manipulate gravitational fields
- **Wind** 💨 - Apply wind forces
- **Vacuum** 🌪️ - Attract particles
- **Heater** 🔥 - Increase temperature
- **Cooler** ❄️ - Decrease temperature

### ⚡ **Realistic Physics**
- **Gravity Simulation** - Elements fall and interact naturally
- **Density-Based Interactions** - Heavier elements sink, lighter ones float
- **Temperature System** - Heat affects element states and reactions
- **Pressure Dynamics** - Realistic fluid and gas behavior
- **Chemical Reactions** - Elements interact and transform
- **Magnetic Fields** - Metal elements respond to magnets

### 🎛️ **Advanced Controls**
- **Variable Brush Size** (1-20 pixels)
- **Adjustable Speed** (1-10x)
- **Pressure Control** (1-10 levels)
- **Wind Strength** (0-10 force)
- **Reverse Gravity** - Flip the world upside down
- **Time Control** - Manipulate time flow
- **Random Mode** - Chaos mode for experimentation

## 🚀 Getting Started

### Quick Start
1. **Clone the repository**
   ```bash
   git clone https://github.com/mehmetkahya0/sandbox-game.git
   cd sandbox-game
   ```

2. **Open in browser**
   ```bash
   # Simply open index.html in your web browser
   open index.html
   # Or serve with a local server
   python -m http.server 8000
   ```

3. **Start Creating!**
   - Select an element from the toolbar
   - Choose a tool (brush, line, circle, etc.)
   - Click and drag on the canvas to draw
   - Watch physics magic happen!

### 🎯 How to Play

#### Basic Controls
- **Left Click + Drag**: Draw selected element
- **Right Click + Drag**: Erase elements
- **Mouse Wheel**: Adjust brush size
- **Space**: Pause/Resume simulation

#### Element Interactions
- **Fire + Plant/Wood/Oil** = Combustion
- **Water + Fire** = Steam
- **Lava + Water** = Stone
- **Acid + Most Elements** = Dissolution
- **Electricity + Metal** = Conduction
- **Virus + Organic Matter** = Infection spread

#### Special Features
- **Continuous Flow**: Hold mouse for steady stream
- **Multi-tool Workflow**: Switch tools without changing elements
- **Save/Load**: Preserve your creations
- **Real-time Stats**: Monitor FPS, element count, temperature

## 🏗️ Technical Details

### Architecture
```
PhysicsSandbox Class
├── Grid System (400x300 cells)
├── Element Physics Engine
├── Real-time Rendering
├── Event Handling
└── UI Management
```

### Performance Optimizations
- **Efficient Grid System** - O(1) particle lookup
- **Selective Updates** - Only active areas calculated
- **Optimized Rendering** - Canvas double buffering
- **Memory Management** - Automatic cleanup of short-lived elements

### Element Properties
Each element has realistic physics properties:
```javascript
{
  color: [R, G, B, Alpha],
  density: 0.001 - 7.5,
  temperature: -273 to 10000°C,
  flammable: boolean,
  liquid/gas/solid: boolean,
  special: magnetic/corrosive/explosive
}
```

## 🎨 UI/UX Features

### Modern Design
- **Retro-Modern Aesthetic** - Pixel art meets modern UI
- **Gradient Animations** - Smooth hover effects
- **Glow Effects** - Neon-style highlights
- **Responsive Design** - Works on all screen sizes

### Accessibility
- **Keyboard Navigation** - Full keyboard support
- **Visual Feedback** - Clear state indicators
- **Intuitive Controls** - Easy-to-understand interface
- **Mobile Friendly** - Touch-optimized for mobile devices

## 🔧 Customization

### Adding New Elements
```javascript
// In script.js, add to this.elements object:
newElement: {
  color: [255, 0, 0, 255],
  density: 1.5,
  flammable: true,
  liquid: false,
  // ... other properties
}
```

### Creating New Tools
```javascript
// Add tool handling in handleMouseMove method
case 'newtool':
  // Your tool logic here
  break;
```

## 🐛 Known Issues & Limitations

- **Performance**: Large simulations may slow down on older devices
- **Browser Compatibility**: Requires modern browser with Canvas support
- **Memory Usage**: Complex scenes may use significant RAM

## 🛣️ Roadmap

### Upcoming Features
- [ ] **Sound Effects** - Audio feedback for interactions
- [ ] **Particle Trails** - Visual effect improvements
- [ ] **More Elements** - Concrete, Glass, Rubber, etc.
- [ ] **Advanced Tools** - Clone, Mirror, Rotate tools
- [ ] **Scene Presets** - Pre-built interesting scenarios
- [ ] **Multiplayer Mode** - Collaborative sandbox
- [ ] **3D Mode** - Experimental 3D physics

### Performance Improvements
- [ ] **WebGL Rendering** - GPU-accelerated graphics
- [ ] **Web Workers** - Multi-threaded physics calculations
- [ ] **Spatial Indexing** - Better collision detection

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Code Style
- Use ES6+ features
- Follow JSDoc commenting
- Maintain consistent indentation
- Add comments for complex physics logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Credits

**Developed by Mehmet Kahya**

### Inspiration
- Powder Game (Classic falling sand game)
- The Sandbox (Element interactions)
- Noita (Advanced physics simulation)

### Technologies
- **HTML5 Canvas** - Rendering engine
- **Vanilla JavaScript** - Core logic
- **CSS3** - Modern styling
- **Press Start 2P Font** - Retro typography

## 📊 Stats

- **Lines of Code**: ~2,500
- **Elements**: 19 unique types
- **Tools**: 12 specialized tools
- **Physics Properties**: 15+ per element
- **File Size**: < 100KB total

## 🔗 Links

- **Live Demo**: [Play Now](#)
- **Source Code**: [GitHub Repository](https://github.com/mehmetkahya0/sandbox-game)
- **Bug Reports**: [Issues](https://github.com/mehmetkahya0/sandbox-game/issues)
- **Developer**: [Mehmet Kahya](https://github.com/mehmetkahya0)

---

**Ready to experiment with physics? Start playing and discover the endless possibilities!** 🧪✨

*Made with ❤️ by Mehmet Kahya*
