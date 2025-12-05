# Parallax Experience - Awwwards Style

An immersive 3D web experience with parallax effects, built with React and Three.js.

## 🎯 Features

- **3D Parallax Effect**: Multiple geometric objects move at different speeds based on mouse movement
- **Multiple 3D Compositions**: Portal, Crystals, Galaxy, Abstract, and StarField compositions positioned at different depths
- **Interactive Spacecraft**: Navigable 3D spacecraft that can be controlled
- **Guided Tour**: Automated tour system that showcases different compositions with smooth camera movements
- **Smooth Animations**: Lerping (interpolation) system for natural movements
- **Modern Design**: Dark gradients, neon materials, atmospheric lighting
- **Fullscreen Mode**: Immersive fullscreen experience with dynamic canvas resizing
- **Interactive UI**: Side panel with controls and information, navigation bar, and footer
- **Responsive**: Automatically adapts to window size
- **Optimized Performance**: 60 FPS with WebGL

## 🚀 Installation

```bash
npm install
```

## 💻 Development

```bash
npm run dev
```

The project will be accessible at `http://localhost:5173`

## 🏗️ Build

```bash
npm run build
```

## 📦 Preview

To preview the production build:

```bash
npm run preview
```

## 🎨 Technologies

- **React 19** with hooks (useState, useEffect, useRef, useImperativeHandle)
- **Three.js r128** for 3D rendering
- **Vite** for build and development
- **Font Awesome** for icons

## 📋 Technical Specifications

- Normalized mouse tracking (coordinates -1 to 1)
- Different parallax speeds for each object and composition
- Continuous rotation of geometric objects
- Multiple colored point lights (magenta, cyan, yellow)
- MeshStandardMaterial with neon emission
- Entrance animation on load
- Overlay interface with title and instructions
- 3D camera controls with rotation and panning
- Inactivity detection for UI elements
- Dynamic lighting animations

## 🎭 Usage

Simply move your mouse to explore the 3D experience. Objects closer to the camera move faster than distant objects, creating an immersive depth effect.

### Controls

- **Mouse Movement**: Controls parallax effect and camera interaction
- **Fullscreen Toggle**: Available in the side panel
- **Guided Tour**: Automated tour through different compositions (if implemented)
- **Side Panel**: Access controls and information about the project

## 📝 Project Structure

```
src/
  ├── App.jsx                    # Main component with state management
  ├── main.jsx                   # Application entry point
  ├── components/
  │   ├── ThreeScene.jsx        # Main Three.js scene component
  │   ├── PortalComposition.jsx # Portal 3D composition
  │   ├── CrystalsComposition.jsx # Crystals 3D composition
  │   ├── GalaxyComposition.jsx # Galaxy 3D composition
  │   ├── AbstractComposition.jsx # Abstract 3D composition
  │   ├── StarFieldComposition.jsx # Star field background
  │   ├── Spacecraft.jsx         # Interactive spacecraft component
  │   ├── GuidedTour.jsx        # Automated tour system
  │   ├── Lighting.jsx          # Lighting setup
  │   ├── GiantBackground.jsx   # Background elements
  │   ├── NavBar.jsx            # Navigation bar component
  │   ├── Header.jsx            # Header component
  │   ├── Footer.jsx            # Footer component
  │   └── SidePanel.jsx         # Side panel with controls
  ├── styles/
  │   ├── App.css               # Main application styles
  │   ├── index.css             # Global styles
  │   ├── NavBar.css            # Navigation bar styles
  │   ├── Footer.css            # Footer styles
  │   ├── Header.css            # Header styles
  │   └── SidePanel.css         # Side panel styles
  └── utils/
      └── parallax.js           # Parallax utility functions
```

## 🎨 Customization

You can easily modify:
- Geometric objects in composition components
- Colors and materials
- Parallax speeds in `utils/parallax.js`
- Object positions and depths
- Light colors in `components/Lighting.jsx`
- Guided tour waypoints in `components/GuidedTour.jsx`
- Camera settings and controls

## 📄 License

This project is a demonstration example.
