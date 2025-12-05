import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { createLighting } from './Lighting'
import { createPortalComposition } from './PortalComposition'
import { createCrystalsComposition } from './CrystalsComposition'
import { createGalaxyComposition } from './GalaxyComposition'
import { createAbstractComposition } from './AbstractComposition'
import { createGiantBackground } from './GiantBackground'
import { createStarFieldComposition } from './StarFieldComposition'
import {
  lerp,
  createMouseMoveHandler,
  updateMousePosition,
  applyParallaxToGroups,
  applyParallaxToObjects,
  rotateGroups,
  animateLights
} from '../utils/parallax'

const ThreeScene = forwardRef(({ isFullscreen, onLoaded, onShowCanvasTextChange }, ref) => {
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
  const inactivityTimeoutRef = useRef(null)
  
  // Références pour les contrôles de navigation 3D
  const isRotatingRef = useRef(false)
  const isPanningRef = useRef(false)
  const previousMousePositionRef = useRef({ x: 0, y: 0 })
  const cameraRotationRef = useRef({ x: 0, y: 0 })
  const targetCameraRotationRef = useRef({ x: 0, y: 0 })
  const cameraPositionRef = useRef({ x: 0, y: 0, z: 8 })
  const targetCameraPositionRef = useRef({ x: 0, y: 0, z: 8 })
  const scenePositionRef = useRef({ x: 0, y: 0, z: 0 })
  const targetScenePositionRef = useRef({ x: 0, y: 0, z: 0 })
  const sceneContainerRef = useRef(null)

  // Exposer les méthodes nécessaires au parent via ref
  useImperativeHandle(ref, () => ({
    updateSize: (newFullscreen) => {
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
  }))

  // Synchroniser isFullscreenRef avec la prop isFullscreen
  useEffect(() => {
    isFullscreenRef.current = isFullscreen
  }, [isFullscreen])

  // Fonction helper pour nettoyer les ressources Three.js
  const cleanupThreeResources = (scene, renderer, objectsRef, groupsRef, lightsRef) => {
    // Nettoyer les lumières
    if (lightsRef && lightsRef.current) {
      lightsRef.current.forEach((light) => {
        if (light && scene) {
          if (light.parent) {
            light.parent.remove(light)
          } else if (scene.children.includes(light)) {
            scene.remove(light)
          }
          if (light.dispose) light.dispose()
          if (light.shadow) {
            if (light.shadow.map) light.shadow.map.dispose()
            if (light.shadow.camera) light.shadow.camera = null
          }
        }
      })
      lightsRef.current = []
    }

    // Nettoyer les objets
    if (objectsRef && objectsRef.current) {
      objectsRef.current.forEach((object) => {
        if (object) {
          if (object.geometry) {
            if (object.geometry.isBufferGeometry) {
              const attributes = object.geometry.attributes
              for (const key in attributes) {
                const attribute = attributes[key]
                if (attribute && attribute.dispose) {
                  attribute.dispose()
                }
              }
            }
            object.geometry.dispose()
          }
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
    }

    // Nettoyer les groupes
    if (groupsRef && groupsRef.current) {
      groupsRef.current = []
    }

    // Nettoyer la scène
    if (scene) {
      while(scene.children.length > 0) {
        scene.remove(scene.children[0])
      }
    }

    // Nettoyer le renderer
    if (renderer) {
      renderer.dispose()
    }
  }

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
      // Retirer le canvas du DOM avant cleanup
      if (rendererRef.current && rendererRef.current.domElement && mountRef.current) {
        if (mountRef.current.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement)
        }
      }
      // Nettoyer toutes les ressources Three.js
      cleanupThreeResources(sceneRef.current, rendererRef.current, objectsRef, groupsRef, lightsRef)
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
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
    
    // Créer un groupe conteneur pour toute la scène (pour le pan)
    const sceneContainer = new THREE.Group()
    sceneContainerRef.current = sceneContainer
    scene.add(sceneContainer)
    
    // Initialiser la position de la scène
    scenePositionRef.current = { x: 0, y: 0, z: 0 }
    targetScenePositionRef.current = { x: 0, y: 0, z: 0 }
    
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
    
    // Initialiser les positions de caméra
    cameraPositionRef.current = { x: 0, y: 0, z: 8 }
    targetCameraPositionRef.current = { x: 0, y: 0, z: 8 }
    cameraRotationRef.current = { x: 0, y: 0 }
    targetCameraRotationRef.current = { x: 0, y: 0 }
    
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

    // ========== CIEL ÉTOILÉ (en premier pour être en arrière-plan) ==========
    const starFieldGroup = createStarFieldComposition(sceneContainer, objectsRef)
    if (starFieldGroup) {
      groupsRef.current.push(starFieldGroup)
    }

    // ========== COMPOSITION 1: "PORTAL" ==========
    const portalGroup = createPortalComposition(sceneContainer, objectsRef)
    if (portalGroup) {
      groupsRef.current.push(portalGroup)
    }

    // ========== COMPOSITION 2: "CRISTAUX" ==========
    const crystalGroup = createCrystalsComposition(sceneContainer, objectsRef)
    if (crystalGroup) {
      groupsRef.current.push(crystalGroup)
    }

    // ========== COMPOSITION 3: "GALAXY" ==========
    const galaxyGroup = createGalaxyComposition(sceneContainer, objectsRef)
    if (galaxyGroup) {
      groupsRef.current.push(galaxyGroup)
    }

    // ========== COMPOSITION 4: "ABSTRACT" ==========
    const abstractGroup = createAbstractComposition(sceneContainer, objectsRef)
    if (abstractGroup) {
      groupsRef.current.push(abstractGroup)
    }
    
    // Positions des groupes dans l'espace 3D (X, Y, Z) - mieux espacées :
    // - Portal: (4, 2, -6) - droite, haut, avant-plan
    // - Crystals: (-3, -2, 2) - gauche, bas, premier plan
    // - Galaxy: (-4, -3, 8) - gauche, bas, arrière-plan
    // - Abstract: (-5, 3, -10) - gauche, haut, très arrière-plan


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

    // Gestion du mouvement de la souris (global pour le parallaxe)
    const handleMouseMove = createMouseMoveHandler(targetMouseRef)
    window.addEventListener('mousemove', handleMouseMove)
    
    // Gestion de l'affichage du texte selon l'activité de la souris DANS LE CANVAS
    const handleCanvasMouseActivity = () => {
      // Masquer le texte quand la souris bouge dans le canvas
      if (onShowCanvasTextChange) {
        onShowCanvasTextChange(false)
      }
      
      // Réinitialiser le timer d'inactivité
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      
      // Réafficher le texte après 2 secondes d'inactivité
      inactivityTimeoutRef.current = setTimeout(() => {
        if (onShowCanvasTextChange) {
          onShowCanvasTextChange(true)
        }
      }, 2000)
    }
    
    const handleCanvasMouseLeave = () => {
      // Quand la souris quitte le canvas, réafficher le texte immédiatement
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      if (onShowCanvasTextChange) {
        onShowCanvasTextChange(true)
      }
    }
    
    // Attacher les événements uniquement au canvas
    const canvas = renderer.domElement
    canvas.addEventListener('mousemove', handleCanvasMouseActivity)
    canvas.addEventListener('mouseleave', handleCanvasMouseLeave)
    
    // ========== CONTRÔLES DE NAVIGATION 3D ==========
    
    // Zoom avec la molette
    const handleWheel = (event) => {
      event.preventDefault()
      const zoomSpeed = 0.1
      const delta = event.deltaY * zoomSpeed
      
      // Calculer la direction de la caméra
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)
      
      // Zoom en déplaçant la caméra le long de sa direction
      const zoomAmount = delta * zoomSpeed
      targetCameraPositionRef.current.z = Math.max(2, Math.min(60, targetCameraPositionRef.current.z - zoomAmount))
    }
    
    // Rotation avec clic gauche (drag)
    const handleMouseDown = (event) => {
      if (event.button === 0) { // Clic gauche
        isRotatingRef.current = true
        previousMousePositionRef.current = {
          x: event.clientX,
          y: event.clientY
        }
        canvas.style.cursor = 'grabbing'
      } else if (event.button === 2) { // Clic droit
        isPanningRef.current = true
        previousMousePositionRef.current = {
          x: event.clientX,
          y: event.clientY
        }
        canvas.style.cursor = 'move'
      }
    }
    
    const handleNavigationMouseMove = (event) => {
      if (isRotatingRef.current) {
        // Rotation de la caméra
        const deltaX = event.clientX - previousMousePositionRef.current.x
        const deltaY = event.clientY - previousMousePositionRef.current.y
        
        const rotationSpeed = 0.005
        targetCameraRotationRef.current.y += deltaX * rotationSpeed
        targetCameraRotationRef.current.x += deltaY * rotationSpeed
        
        // Limiter la rotation verticale pour éviter les inversions
        targetCameraRotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetCameraRotationRef.current.x))
        
        previousMousePositionRef.current = {
          x: event.clientX,
          y: event.clientY
        }
      } else if (isPanningRef.current) {
        // Déplacement (pan) de la scène
        const deltaX = event.clientX - previousMousePositionRef.current.x
        const deltaY = event.clientY - previousMousePositionRef.current.y
        
        const panSpeed = 0.005
        // Calculer les vecteurs de déplacement dans l'espace de la caméra
        const right = new THREE.Vector3()
        right.setFromMatrixColumn(camera.matrixWorld, 0)
        right.normalize()
        
        const up = new THREE.Vector3()
        up.setFromMatrixColumn(camera.matrixWorld, 1)
        up.normalize()
        
        // Déplacer la scène perpendiculairement à la direction de la caméra
        const panVector = new THREE.Vector3()
        panVector.addScaledVector(right, -deltaX * panSpeed)
        panVector.addScaledVector(up, deltaY * panSpeed)
        
        targetScenePositionRef.current.x += panVector.x
        targetScenePositionRef.current.y += panVector.y
        
        previousMousePositionRef.current = {
          x: event.clientX,
          y: event.clientY
        }
      }
    }
    
    const handleMouseUp = () => {
      isRotatingRef.current = false
      isPanningRef.current = false
      canvas.style.cursor = 'default'
    }
    
    // Empêcher le menu contextuel sur clic droit
    const handleContextMenu = (event) => {
      event.preventDefault()
    }
    
    // Ajouter les event listeners pour la navigation
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleNavigationMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('contextmenu', handleContextMenu)
    
    // Stocker les références pour le cleanup
    const canvasMouseMoveHandler = handleCanvasMouseActivity
    const canvasMouseLeaveHandler = handleCanvasMouseLeave
    const wheelHandler = handleWheel
    const mouseDownHandler = handleMouseDown
    const navigationMouseMoveHandler = handleNavigationMouseMove
    const mouseUpHandler = handleMouseUp
    const contextMenuHandler = handleContextMenu

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

      // Interpolation fluide de la rotation de la caméra
      const rotationLerpFactor = 0.1
      cameraRotationRef.current.x = lerp(cameraRotationRef.current.x, targetCameraRotationRef.current.x, rotationLerpFactor)
      cameraRotationRef.current.y = lerp(cameraRotationRef.current.y, targetCameraRotationRef.current.y, rotationLerpFactor)
      
      // Interpolation fluide de la position de la caméra
      const positionLerpFactor = 0.1
      cameraPositionRef.current.z = lerp(cameraPositionRef.current.z, targetCameraPositionRef.current.z, positionLerpFactor)
      
      // Interpolation fluide de la position de la scène (pour le pan)
      const scenePositionLerpFactor = 0.1
      scenePositionRef.current.x = lerp(scenePositionRef.current.x, targetScenePositionRef.current.x, scenePositionLerpFactor)
      scenePositionRef.current.y = lerp(scenePositionRef.current.y, targetScenePositionRef.current.y, scenePositionLerpFactor)
      
      // Appliquer la rotation à la caméra (coordonnées sphériques)
      const spherical = new THREE.Spherical()
      spherical.radius = cameraPositionRef.current.z
      spherical.phi = Math.PI / 2 - cameraRotationRef.current.x // Inclinaison verticale
      spherical.theta = cameraRotationRef.current.y // Rotation horizontale
      
      // Position de la caméra en coordonnées sphériques
      const cameraPos = new THREE.Vector3()
      cameraPos.setFromSpherical(spherical)
      
      camera.position.copy(cameraPos)
      
      // Faire regarder la caméra vers le centre
      camera.lookAt(0, 0, 0)
      
      // Appliquer le déplacement à la scène (pan)
      if (sceneContainerRef.current) {
        sceneContainerRef.current.position.x = scenePositionRef.current.x
        sceneContainerRef.current.position.y = scenePositionRef.current.y
        sceneContainerRef.current.position.z = scenePositionRef.current.z
      }

      // Appliquer le parallaxe aux groupes (seulement si pas de navigation active)
      if (!isRotatingRef.current && !isPanningRef.current) {
        applyParallaxToGroups(groupsRef, mouseRef)
      }
      
      // Appliquer le parallaxe et animations aux objets
      applyParallaxToObjects(objectsRef, mouseRef, deltaTime)

      // Rotation des groupes
      rotateGroups(groupsRef, deltaTime)

      // Animation des lumières
      animateLights(lightsRef)

      renderer.render(scene, camera)
    }

    // Rendu initial
    renderer.render(scene, camera)
    console.log('✅ Initial render completed')

    // Animation d'entrée
    setTimeout(() => {
      if (onLoaded) {
        onLoaded(true)
      }
    }, 100)

    // Démarrer l'animation
    animate()

    // Cleanup
    return () => {
      console.log('🧹 Cleanup function called')
      
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      
      // Retirer les événements du canvas
      if (renderer && renderer.domElement) {
        renderer.domElement.removeEventListener('mousemove', canvasMouseMoveHandler)
        renderer.domElement.removeEventListener('mouseleave', canvasMouseLeaveHandler)
        renderer.domElement.removeEventListener('wheel', wheelHandler)
        renderer.domElement.removeEventListener('mousedown', mouseDownHandler)
        renderer.domElement.removeEventListener('contextmenu', contextMenuHandler)
      }
      
      // Retirer les événements globaux de navigation
      window.removeEventListener('mousemove', navigationMouseMoveHandler)
      window.removeEventListener('mouseup', mouseUpHandler)
      
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      console.log('✅ Event listeners removed')
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
        console.log('✅ Animation frame cancelled')
      }

      // Retirer le canvas du DOM
      if (mountRef.current && renderer && renderer.domElement) {
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement)
          console.log('✅ Canvas removed from DOM')
        }
      }

      // Nettoyer toutes les ressources Three.js avec la fonction helper
      console.log(`🧹 Disposing resources...`)
      console.log(`   - ${lightsRef.current.length} lights`)
      console.log(`   - ${objectsRef.current.length} objects`)
      console.log(`   - ${groupsRef.current.length} groups`)
      cleanupThreeResources(scene, renderer, objectsRef, groupsRef, lightsRef)
      console.log('✅ All Three.js resources disposed')
      
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
  }, [onLoaded, onShowCanvasTextChange])

  // Initialiser le timer d'inactivité au chargement
  useEffect(() => {
    if (onLoaded) {
      // Réafficher le texte après 2 secondes si pas de mouvement
      inactivityTimeoutRef.current = setTimeout(() => {
        if (onShowCanvasTextChange) {
          onShowCanvasTextChange(true)
        }
      }, 2000)
    }

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
    }
  }, [onLoaded, onShowCanvasTextChange])

  return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
})

ThreeScene.displayName = 'ThreeScene'

export default ThreeScene

