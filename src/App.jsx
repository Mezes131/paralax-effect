import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './styles/App.css'
import { createLighting } from './components/Lighting'
import { createPortalComposition } from './components/PortalComposition'
import { createCrystalsComposition } from './components/CrystalsComposition'
import { createGalaxyComposition } from './components/GalaxyComposition'
import { createAbstractComposition } from './components/AbstractComposition'
import { createGiantBackground } from './components/GiantBackground'
import Header from './components/Header'
import Footer from './components/Footer'
import SidePanel from './components/SidePanel'
import {
  createMouseMoveHandler,
  updateMousePosition,
  applyParallaxToGroups,
  applyParallaxToObjects,
  rotateGroups,
  animateLights
} from './utils/parallax'

function App() {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const objectsRef = useRef([])
  const groupsRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const targetMouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef(null)
  const lightsRef = useRef([])
  const isInitializedRef = useRef(false)
  const isFullscreenRef = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPanelExpanded, setIsPanelExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    console.log('🔵 useEffect triggered')
    
    if (!mountRef.current) {
      console.warn('⚠️ mountRef.current is null, aborting initialization')
      return
    }

    // Vérifier si un canvas valide existe déjà dans le DOM
    const existingCanvas = mountRef.current.querySelector('canvas')
    if (existingCanvas && rendererRef.current && rendererRef.current.domElement === existingCanvas) {
      console.warn('⚠️ Valid canvas and renderer already exist, skipping initialization')
      console.warn(`   Scene exists: ${!!sceneRef.current}`)
      console.warn(`   Renderer exists: ${!!rendererRef.current}`)
      console.warn(`   Objects count: ${objectsRef.current.length}`)
      return
    }
    
    // Si un canvas existe mais n'est pas associé à notre renderer, le nettoyer
    if (existingCanvas && (!rendererRef.current || rendererRef.current.domElement !== existingCanvas)) {
      console.warn('⚠️ Orphaned canvas found, removing it...')
      if (existingCanvas.parentNode) {
        existingCanvas.parentNode.removeChild(existingCanvas)
        console.log('✅ Orphaned canvas removed')
      }
    }
    
    // Éviter les initialisations multiples
    if (isInitializedRef.current) {
      console.warn('⚠️ Already initialized, but proceeding with cleanup and reinit...')
      // Nettoyer le renderer existant s'il existe
      if (rendererRef.current) {
        if (rendererRef.current.domElement && mountRef.current.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement)
        }
        rendererRef.current.dispose()
        rendererRef.current = null
      }
      // Nettoyer la scène
      if (sceneRef.current) {
        while(sceneRef.current.children.length > 0) {
          sceneRef.current.remove(sceneRef.current.children[0])
        }
      }
      objectsRef.current = []
      groupsRef.current = []
      lightsRef.current = []
    }

    // Marquer comme initialisé IMMÉDIATEMENT pour éviter les doubles appels
    isInitializedRef.current = true
    console.log('✅ Marked as initialized')
    objectsRef.current = []
    groupsRef.current = []
    mouseRef.current = { x: 0, y: 0 }
    targetMouseRef.current = { x: 0, y: 0 }

    // Scène
    const scene = new THREE.Scene()
    sceneRef.current = scene
    console.log('✅ Scene created')

    // Caméra
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 8
    cameraRef.current = camera
    console.log('✅ Camera created')

    // Renderer avec ombres
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    })
    const initialWidth = Math.min(window.innerWidth * 0.7, 1200)
    const initialHeight = Math.min(window.innerHeight * 0.7, 800)
    renderer.setSize(initialWidth, initialHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.position = 'relative'
    renderer.domElement.style.borderRadius = '20px'
    
    if (!mountRef.current) {
      isInitializedRef.current = false
      return
    }
    
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer
    console.log('✅ Renderer created')

    // ========== ÉCLAIRAGE DRAMATIQUE ==========
    createLighting(scene, lightsRef)

    // ========== COMPOSITION 1: "PORTAL" ==========
    const portalGroup = createPortalComposition(scene, objectsRef)
    groupsRef.current.push(portalGroup)

    // ========== COMPOSITION 2: "CRISTAUX" ==========
    const crystalGroup = createCrystalsComposition(scene, objectsRef)
    groupsRef.current.push(crystalGroup)

    // ========== COMPOSITION 3: "GALAXY" ==========
    const galaxyGroup = createGalaxyComposition(scene, objectsRef)
    groupsRef.current.push(galaxyGroup)

    // ========== COMPOSITION 4: "ABSTRACT" ==========
    const abstractGroup = createAbstractComposition(scene, objectsRef)
    groupsRef.current.push(abstractGroup)

    // ========== OBJET GÉANT EN FOND ==========
    createGiantBackground(scene, objectsRef)

    console.log(`✅ Total objects created: ${objectsRef.current.length}`)
    console.log(`📊 Scene children count: ${scene.children.length}`)

    // Gestion du redimensionnement
    const handleResize = () => {
      // Utiliser une ref pour accéder à la valeur actuelle de isFullscreen
      const fullscreen = isFullscreenRef.current || false
      const width = fullscreen ? window.innerWidth : Math.min(window.innerWidth * 0.7, 1200)
      const height = fullscreen ? window.innerHeight : Math.min(window.innerHeight * 0.7, 800)
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      
      // Mettre à jour le canvas selon le mode
      const canvas = renderer.domElement
      if (!fullscreen) {
        canvas.style.position = 'relative'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.borderRadius = '20px'
      } else {
        canvas.style.position = 'absolute'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.top = '0'
        canvas.style.left = '0'
        canvas.style.borderRadius = '0'
      }
    }
    
    // Initialiser la taille
    handleResize()
    window.addEventListener('resize', handleResize)

    // Gestion du mouvement de la souris
    const handleMouseMove = createMouseMoveHandler(targetMouseRef)
    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop avec deltaTime
    let lastTime = Date.now()
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      
      // Calculer le deltaTime pour des animations fluides
      const currentTime = Date.now()
      const deltaTime = (currentTime - lastTime) * 0.001 // en secondes
      lastTime = currentTime

      // Mettre à jour la position de la souris avec interpolation fluide
      updateMousePosition(mouseRef, targetMouseRef)

      // Appliquer le parallaxe aux groupes
      applyParallaxToGroups(groupsRef, mouseRef)
      
      // Appliquer le parallaxe et animations aux objets
      applyParallaxToObjects(objectsRef, mouseRef, deltaTime)

      // Rotation des groupes
      rotateGroups(groupsRef)

      // Animation des lumières
      animateLights(lightsRef)

      renderer.render(scene, camera)
    }

    // Rendu initial
    renderer.render(scene, camera)
    console.log('✅ Initial render completed')

    // Animation d'entrée
    setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    // Démarrer l'animation
    animate()

    // Cleanup
    return () => {
      console.log('🧹 Cleanup function called')
      
      // Ne pas remettre isInitializedRef à false immédiatement
      // pour éviter que React StrictMode ne recrée tout
      // On le remettra seulement si le renderer n'existe plus
      
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      console.log('✅ Event listeners removed')
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
        console.log('✅ Animation frame cancelled')
      }

      // Nettoyer les objets
      console.log(`🧹 Disposing ${objectsRef.current.length} objects...`)
      objectsRef.current.forEach((object) => {
        if (object) {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => mat.dispose())
            } else {
              object.material.dispose()
            }
          }
        }
      })
      objectsRef.current = []
      groupsRef.current = []
      console.log('✅ Objects disposed')

      // Nettoyer la scène
      if (scene) {
        console.log(`🧹 Cleaning scene with ${scene.children.length} children`)
        while(scene.children.length > 0) {
          scene.remove(scene.children[0])
        }
        console.log('✅ Scene cleaned')
      }
      
      // Retirer le canvas
      if (mountRef.current && renderer && renderer.domElement) {
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement)
          console.log('✅ Canvas removed from DOM')
        }
      }
      
      // Disposer du renderer
      if (renderer) {
        renderer.dispose()
        console.log('✅ Renderer disposed')
      }
      
      // Réinitialiser les références
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      lightsRef.current = []
      
      // Maintenant on peut remettre isInitializedRef à false
      // car tout est nettoyé
      isInitializedRef.current = false
      console.log('✅ Cleanup completed, isInitializedRef reset to false')
    }
  }, [])

  const handleTogglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded)
  }

  const handleToggleFullscreen = () => {
    const newFullscreen = !isFullscreen
    setIsFullscreen(newFullscreen)
    isFullscreenRef.current = newFullscreen
    
    // Mettre à jour la taille du renderer
    if (rendererRef.current && cameraRef.current) {
      const width = newFullscreen ? window.innerWidth : Math.min(window.innerWidth * 0.7, 1200)
      const height = newFullscreen ? window.innerHeight : Math.min(window.innerHeight * 0.7, 800)
      
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
      
      const canvas = rendererRef.current.domElement
      if (newFullscreen) {
        canvas.style.position = 'absolute'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.top = '0'
        canvas.style.left = '0'
        canvas.style.borderRadius = '0'
      } else {
        canvas.style.position = 'relative'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.borderRadius = '20px'
      }
    }
  }

  return (
    <div className={`app-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isFullscreen && <Header isLoaded={isLoaded} />}
      
      <div className="canvas-wrapper">
        <div ref={mountRef} className={`canvas-container ${isFullscreen ? 'fullscreen' : ''}`}>
          {!isFullscreen && (
            <div className={`canvas-overlay ${isLoaded ? 'loaded' : ''}`}>
              <h1 className="canvas-title">PARALLAX EXPERIENCE</h1>
              <p className="canvas-subtitle">Move your mouse to explore</p>
            </div>
          )}
        </div>
      </div>

      {!isFullscreen && <Footer isLoaded={isLoaded} />}
      
      <SidePanel
        isExpanded={isPanelExpanded}
        onToggle={handleTogglePanel}
        onFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      >
        {{
          controls: (
            <div>
              <p>Adjust parallax intensity and animation speed here.</p>
            </div>
          ),
          info: (
            <div>
              <p><strong>Parallax Experience</strong></p>
              <p>A 3D web experience showcasing dynamic parallax effects using React and Three.js.</p>
              <p>Move your mouse to interact with the scene.</p>
            </div>
          )
        }}
      </SidePanel>
    </div>
  )
}

export default App