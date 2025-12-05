# Parallax Experience - Awwwards Style

Une expérience web interactive 3D avec effet parallaxe immersif, construite avec React et Three.js.

## 🎯 Fonctionnalités

- **Effet parallaxe 3D** : Plusieurs objets géométriques se déplacent à des vitesses différentes selon le mouvement de la souris
- **5 objets géométriques** : Sphères, torus, cubes, octaèdres et cônes positionnés à différentes profondeurs
- **Animation fluide** : Système de lerping (interpolation) pour des mouvements naturels
- **Design moderne** : Dégradés sombres, matériaux néon, éclairage atmosphérique
- **Responsive** : S'adapte automatiquement à la taille de la fenêtre
- **Performance optimisée** : 60 FPS avec WebGL

## 🚀 Installation

```bash
npm install
```

## 💻 Développement

```bash
npm run dev
```

Le projet sera accessible sur `http://localhost:5173`

## 🏗️ Build

```bash
npm run build
```

## 🎨 Technologies

- **React 19** avec hooks (useState, useEffect, useRef)
- **Three.js r128** pour le rendu 3D
- **Vite** pour le build et le développement

## 📋 Spécifications techniques

- Suivi de la souris normalisé (coordonnées -1 à 1)
- Vitesses de parallaxe différentes pour chaque objet
- Rotation continue des objets géométriques
- 3 lumières ponctuelles colorées (magenta, cyan, jaune)
- Matériaux MeshStandardMaterial avec émission néon
- Animation d'entrée au chargement
- Interface overlay avec titre et instructions

## 🎭 Utilisation

Bougez simplement la souris pour explorer l'expérience 3D. Les objets proches bougent plus vite que les objets lointains, créant un effet de profondeur immersif.

## 📝 Structure du projet

```
src/
  ├── App.jsx      # Composant principal avec Three.js
  ├── App.css      # Styles pour l'overlay et l'interface
  └── index.css    # Styles globaux
```

## 🎨 Personnalisation

Vous pouvez facilement modifier :
- Les objets géométriques dans `objectsConfig`
- Les couleurs et matériaux
- Les vitesses de parallaxe
- Les positions et profondeurs des objets
- Les couleurs des lumières

## 📄 Licence

Ce projet est un exemple de démonstration.
