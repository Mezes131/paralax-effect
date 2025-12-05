import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react'
import * as THREE from 'three'
import { createLighting } from './Lighting'
import { createPortalComposition } from './PortalComposition'
import { createCrystalsComposition } from './CrystalsComposition'
import { createGalaxyComposition } from './GalaxyComposition'
import { createAbstractComposition } from './AbstractComposition'
import { createStarFieldComposition } from './StarFieldComposition'
import { createSpacecraft } from './Spacecraft'
import { createGuidedTour } from './GuidedTour'
import {
  lerp,
  createMouseMoveHandler,
  updateMousePosition,
  applyParallaxToGroups,
  applyParallaxToObjects,
  rotateGroups,
  animateLights
} from '../utils/parallax'

const ThreeScene = forwardRef(({ isFullscreen, onLoaded, onShowCanvasTextChange, onTourStateChange }, ref) => {
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
  const spacecraftRef = useRef(null)
  const guidedTourRef = useRef(null)
  const isTourActiveRef = useRef(false)
  const [isTourActive, setIsTourActive] = useState(false)
  const fadeOverlayRef = useRef(null)
  const [fadeOpacity, setFadeOpacity] = useState(0)

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
    },
    startGuidedTour: () => {
      if (guidedTourRef.current) {
        isTourActiveRef.current = true
        setIsTourActive(true)
        // Notifier le parent que la visite démarre
        if (onTourStateChange) {
          onTourStateChange(true)
        }
        // Masquer le wrapper pendant la visite
        if (onShowCanvasTextChange) {
          onShowCanvasTextChange(false)
        }
        guidedTourRef.current.startTour()
      }
    },
    stopGuidedTour: () => {
      if (guidedTourRef.current) {
        guidedTourRef.current.stopTour()
      }
    },
    isTourActive: () => {
      return isTourActiveRef.current
    }
  }))

  // Synchroniser isFullscreenRef avec la prop isFullscreen
  useEffect(() => {
    isFullscreenRef.current = isFullscreen
  }, [isFullscreen])

  /**
   * Déclenche un fondu au noir progressif
   */
  const startFadeOut = (onComplete, onMidFade) => {
    const duration = 1000 // Durée du fondu en millisecondes
    const steps = 60 // Nombre d'étapes pour un fondu fluide
    const stepDuration = duration / steps
    let currentStep = 0
    let midFadeTriggered = false

    const fadeInterval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      // Utiliser une fonction d'easing pour un fondu plus naturel
      const easedProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      setFadeOpacity(easedProgress)

      // Déclencher les réinitialisations à mi-parcours du fondu (quand l'écran est bien noir)
      if (progress >= 0.5 && !midFadeTriggered && onMidFade) {
        midFadeTriggered = true
        onMidFade()
      }

      if (currentStep >= steps) {
        clearInterval(fadeInterval)
        if (onComplete) {
          onComplete()
        }
      }
    }, stepDuration)
  }

  /**
   * Met à jour la traînée de fumée du vaisseau
   */
  const updateSmokeTrail = (smokeTrail, spacecraft, deltaTime) => {
    if (!smokeTrail || !spacecraft) return
    
    const userData = smokeTrail.userData
    const positions = smokeTrail.geometry.attributes.position.array
    const colors = smokeTrail.geometry.attributes.color.array
    const sizes = smokeTrail.geometry.attributes.size.array
    const lifetimes = userData.lifetimes
    const velocities = userData.velocities
    const baseColors = userData.baseColors
    const particleCount = userData.particleCount
    
    const currentTime = Date.now()
    const timeSinceLastEmit = currentTime - userData.lastEmitTime
    
    // Obtenir la position des propulseurs dans l'espace monde
    const leftThruster = spacecraft.children.find(child => 
      child.userData && child.userData.type === 'craft-thruster' && child.position.x < 0
    )
    const rightThruster = spacecraft.children.find(child => 
      child.userData && child.userData.type === 'craft-thruster' && child.position.x > 0
    )
    
    if (!leftThruster || !rightThruster) return
    
    // Position mondiale des propulseurs
    const leftThrusterWorld = new THREE.Vector3()
    const rightThrusterWorld = new THREE.Vector3()
    leftThruster.getWorldPosition(leftThrusterWorld)
    rightThruster.getWorldPosition(rightThrusterWorld)
    
    // Direction arrière du vaisseau (direction de la traînée)
    // Le vaisseau roule en marche arrière, donc la fumée sort de l'arrière (qui pointe vers la direction de mouvement)
    const backward = new THREE.Vector3(0, 0, -1)
    backward.applyQuaternion(spacecraft.quaternion)
    backward.normalize()
    
    // Émettre de nouvelles particules
    if (timeSinceLastEmit >= userData.emitInterval) {
      userData.lastEmitTime = currentTime
      
      // Trouver une particule inactive (lifetime = 0)
      for (let i = 0; i < particleCount; i++) {
        if (lifetimes[i] <= 0) {
          const i3 = i * 3
          
          // Position initiale : alterner entre les deux propulseurs
          const thrusterPos = (i % 2 === 0) ? leftThrusterWorld : rightThrusterWorld
          positions[i3] = thrusterPos.x + (Math.random() - 0.5) * 0.1
          positions[i3 + 1] = thrusterPos.y + (Math.random() - 0.5) * 0.1
          positions[i3 + 2] = thrusterPos.z + (Math.random() - 0.5) * 0.1
          
          // Vitesse initiale : direction arrière (la fumée sort de l'arrière de la fusée) + turbulence
          const speed = 0.3 + Math.random() * 0.2
          velocities[i3] = backward.x * speed + (Math.random() - 0.5) * 0.1
          velocities[i3 + 1] = backward.y * speed + (Math.random() - 0.5) * 0.1
          velocities[i3 + 2] = backward.z * speed + (Math.random() - 0.5) * 0.1
          
          // Couleur : blanc/bleu pour la fumée (sauvegarder la couleur de base)
          baseColors[i3] = 0.5 + Math.random() * 0.3
          baseColors[i3 + 1] = 0.5 + Math.random() * 0.3
          baseColors[i3 + 2] = 0.6 + Math.random() * 0.2
          colors[i3] = baseColors[i3]
          colors[i3 + 1] = baseColors[i3 + 1]
          colors[i3 + 2] = baseColors[i3 + 2]
          
          // Taille initiale
          sizes[i] = 0.3 + Math.random() * 0.2
          
          // Durée de vie
          lifetimes[i] = 2000 + Math.random() * 1000 // 2-3 secondes
          
          break // Une particule à la fois
        }
      }
    }
    
    // Mettre à jour toutes les particules actives
    const deltaMs = deltaTime * 1000
    for (let i = 0; i < particleCount; i++) {
      if (lifetimes[i] > 0) {
        const i3 = i * 3
        
        // Mettre à jour la position
        positions[i3] += velocities[i3] * deltaTime
        positions[i3 + 1] += velocities[i3 + 1] * deltaTime
        positions[i3 + 2] += velocities[i3 + 2] * deltaTime
        
        // Ajouter de la turbulence
        velocities[i3] += (Math.random() - 0.5) * 0.01 * deltaTime
        velocities[i3 + 1] += (Math.random() - 0.5) * 0.01 * deltaTime
        velocities[i3 + 2] += (Math.random() - 0.5) * 0.01 * deltaTime
        
        // Réduire la vitesse (friction)
        velocities[i3] *= 0.98
        velocities[i3 + 1] *= 0.98
        velocities[i3 + 2] *= 0.98
        
        // Réduire la durée de vie
        lifetimes[i] -= deltaMs
        
        // Faire grandir et s'estomper la particule
        const lifeProgress = 1 - (lifetimes[i] / 2000)
        sizes[i] = (0.3 + Math.random() * 0.2) * (1 + lifeProgress * 2) // Grandit avec le temps
        
        // Opacité basée sur la durée de vie (utiliser les couleurs de base)
        const alpha = Math.max(0, lifetimes[i] / 2000)
        colors[i3] = baseColors[i3] * alpha
        colors[i3 + 1] = baseColors[i3 + 1] * alpha
        colors[i3 + 2] = baseColors[i3 + 2] * alpha
        
        // Réinitialiser si la particule est morte
        if (lifetimes[i] <= 0) {
          positions[i3] = 0
          positions[i3 + 1] = 0
          positions[i3 + 2] = 0
          sizes[i] = 0
        }
      }
    }
    
    // Marquer les attributs comme modifiés
    smokeTrail.geometry.attributes.position.needsUpdate = true
    smokeTrail.geometry.attributes.color.needsUpdate = true
    smokeTrail.geometry.attributes.size.needsUpdate = true
  }

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

    // ========== VAISSEAU SPATIAL ==========
    const spacecraft = createSpacecraft(sceneContainer, objectsRef)
    if (spacecraft) {
      spacecraftRef.current = spacecraft
    }

    // ========== SYSTÈME DE VISITE GUIDÉE ==========
    const guidedTour = createGuidedTour(
      scene,
      spacecraftRef,
      cameraRef,
      () => {
        // Callback appelé à la fin de la visite (après le fondu)
        // Les réinitialisations ont déjà été faites pendant le fondu
      },
      // Callback pour déclencher le fondu avant l'arrivée au dernier waypoint
      () => {
        // Déclencher le fondu au noir
        startFadeOut(
          // Callback à la fin du fondu
          () => {
            // Réinitialiser le fondu après un court délai pour permettre la transition
            setTimeout(() => {
              setFadeOpacity(0)
            }, 2000)
          },
          // Callback à mi-parcours du fondu (quand l'écran est bien noir)
          () => {
            // Effectuer toutes les réinitialisations pendant que l'écran est noir
            
            // Marquer la visite comme inactive
            isTourActiveRef.current = false
            setIsTourActive(false)
            
            // Synchroniser les refs de caméra avec la position actuelle pour éviter le recadrage
            if (cameraRef.current) {
              const camera = cameraRef.current
              const currentPos = camera.position
              
              // Convertir la position cartésienne en coordonnées sphériques
              const spherical = new THREE.Spherical()
              spherical.setFromVector3(currentPos)
              
              // Mettre à jour les refs de position et rotation pour correspondre à la position actuelle
              cameraPositionRef.current.z = spherical.radius
              cameraRotationRef.current.x = Math.PI / 2 - spherical.phi
              cameraRotationRef.current.y = spherical.theta
              
              // Synchroniser aussi les valeurs cibles pour éviter toute interpolation
              targetCameraPositionRef.current.z = spherical.radius
              targetCameraRotationRef.current.x = cameraRotationRef.current.x
              targetCameraRotationRef.current.y = cameraRotationRef.current.y
            }
            
            // Notifier le parent que la visite est terminée
            if (onTourStateChange) {
              onTourStateChange(false)
            }
            
            // Masquer le wrapper à la fin de la visite
            if (onShowCanvasTextChange) {
              onShowCanvasTextChange(false)
            }
          }
        )
      }
    )
    if (guidedTour) {
      guidedTourRef.current = guidedTour
    }
    


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
      // Ne pas masquer le texte si la visite est active
      if (isTourActiveRef.current) return
      
      // Masquer le texte quand la souris bouge dans le canvas
      if (onShowCanvasTextChange) {
        onShowCanvasTextChange(false)
      }
      
      // Réinitialiser le timer d'inactivité
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      
      // Réafficher le texte après 2 secondes d'inactivité (seulement si la visite n'est pas active)
      inactivityTimeoutRef.current = setTimeout(() => {
        if (onShowCanvasTextChange && !isTourActiveRef.current) {
          onShowCanvasTextChange(true)
        }
      }, 2000)
    }
    
    const handleCanvasMouseLeave = () => {
      // Ne pas réafficher le texte si la visite est active
      if (isTourActiveRef.current) return
      
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
      
      // Masquer le wrapper lors du zoom
      if (onShowCanvasTextChange && !isTourActiveRef.current) {
        onShowCanvasTextChange(false)
        // Réinitialiser le timer d'inactivité pour le zoom
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current)
        }
        inactivityTimeoutRef.current = setTimeout(() => {
          if (onShowCanvasTextChange && !isTourActiveRef.current) {
            onShowCanvasTextChange(true)
          }
        }, 2000)
      }
      
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

      // Si la visite guidée est active, la caméra est contrôlée par le système de visite
      if (!isTourActiveRef.current) {
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
      }

      // Appliquer le parallaxe aux groupes (seulement si pas de navigation active et pas de visite guidée)
      if (!isRotatingRef.current && !isPanningRef.current && !isTourActiveRef.current) {
        applyParallaxToGroups(groupsRef, mouseRef)
      }
      
      // Appliquer le parallaxe et animations aux objets (seulement si pas de visite guidée)
      if (!isTourActiveRef.current) {
        applyParallaxToObjects(objectsRef, mouseRef, deltaTime)
      }

      // Rotation des groupes (toujours active)
      rotateGroups(groupsRef, deltaTime)

      // Animation des lumières (toujours active)
      animateLights(lightsRef)
      
      // Animation du vaisseau spatial (rotation subtile et pulsation des propulseurs)
      if (spacecraftRef.current && spacecraftRef.current.visible) {
        // Rotation subtile seulement si pas de visite guidée (pour éviter les conflits)
        if (!isTourActiveRef.current) {
          spacecraftRef.current.rotation.y += 0.002 * deltaTime * 60
        }
        
        // Animation des propulseurs (pulsation)
        const time = Date.now() * 0.003
        spacecraftRef.current.children.forEach((child) => {
          if (child.userData && child.userData.type === 'craft-thruster') {
            const intensity = 0.8 + Math.sin(time) * 0.2
            if (child.material && child.material.emissiveIntensity !== undefined) {
              child.material.emissiveIntensity = intensity
            }
          }
        })
        
        // Animation de la traînée de fumée
        const smokeTrail = spacecraftRef.current.userData.smokeTrail
        if (smokeTrail && smokeTrail.visible) {
          updateSmokeTrail(smokeTrail, spacecraftRef.current, deltaTime)
        }
      }

      renderer.render(scene, camera)
    }

    // Rendu initial
    renderer.render(scene, camera)

    // Animation d'entrée
    setTimeout(() => {
      if (onLoaded) {
        onLoaded(true)
      }
      
      // Démarrer automatiquement la visite guidée après le chargement
      setTimeout(() => {
        if (guidedTourRef.current) {
          isTourActiveRef.current = true
          setIsTourActive(true)
          // Notifier le parent que la visite démarre
          if (onTourStateChange) {
            onTourStateChange(true)
          }
          // Masquer le wrapper pendant la visite
          if (onShowCanvasTextChange) {
            onShowCanvasTextChange(false)
          }
          guidedTourRef.current.startTour()
        }
      }, 1000) // Délai de 1 seconde après le chargement
    }, 100)

    // Démarrer l'animation
    animate()

    // Cleanup
    return () => {
      
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
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Retirer le canvas du DOM
      if (mountRef.current && renderer && renderer.domElement) {
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement)
        }
      }

      // Nettoyer toutes les ressources Three.js avec la fonction helper
      cleanupThreeResources(scene, renderer, objectsRef, groupsRef, lightsRef)
      
      // Réinitialiser les références
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      lightsRef.current = []
      
      // Maintenant on peut remettre isInitializedRef à false
      // car tout est nettoyé
      isInitializedRef.current = false
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

  const handleTourButtonClick = () => {
    if (isTourActive) {
      // Arrêter la visite si elle est active
      if (guidedTourRef.current) {
        guidedTourRef.current.stopTour()
      }
    } else {
      // Démarrer la visite
      if (guidedTourRef.current) {
        isTourActiveRef.current = true
        setIsTourActive(true)
        // Notifier le parent que la visite démarre
        if (onTourStateChange) {
          onTourStateChange(true)
        }
        // Masquer le wrapper pendant la visite
        if (onShowCanvasTextChange) {
          onShowCanvasTextChange(false)
        }
        guidedTourRef.current.startTour()
      }
    }
  }

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Overlay de fondu au noir */}
      <div
        ref={fadeOverlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000000',
          opacity: fadeOpacity,
          zIndex: 9999,
          pointerEvents: fadeOpacity > 0 ? 'auto' : 'none',
          transition: fadeOpacity === 0 ? 'opacity 0.3s ease-out' : 'none'
        }}
      />
      {/* Bouton de visite guidée */}
      <button
        onClick={handleTourButtonClick}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '8px 12px',
          backgroundColor: isTourActive ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 170, 255, 0.2)',
          color: '#ffffff',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          fontFamily: 'inherit'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = isTourActive ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 170, 255, 0.5)'
          e.target.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = isTourActive ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 170, 255, 0.2)'
          e.target.style.transform = 'scale(1)'
        }}
      >
        {isTourActive ? '⏸ Stop' : 'Start'}
      </button>
    </div>
  )
})

ThreeScene.displayName = 'ThreeScene'

export default ThreeScene

