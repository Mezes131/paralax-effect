import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './App.css'

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
  const [isLoaded, setIsLoaded] = useState(false)

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
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    
    if (!mountRef.current) {
      isInitializedRef.current = false
      return
    }
    
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer
    console.log('✅ Renderer created')

    // ========== ÉCLAIRAGE DRAMATIQUE ==========
    
    // Lumière ambiante douce
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(ambientLight)

    // PointLights colorées en mouvement
    const pointLight1 = new THREE.PointLight(0xff00ff, 3, 100)
    pointLight1.position.set(10, 10, 10)
    pointLight1.castShadow = true
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x00ffff, 3, 100)
    pointLight2.position.set(-10, -10, 10)
    pointLight2.castShadow = true
    scene.add(pointLight2)

    const pointLight3 = new THREE.PointLight(0xffff00, 2, 100)
    pointLight3.position.set(0, 10, -10)
    scene.add(pointLight3)

    // SpotLight avec ombres
    const spotLight = new THREE.SpotLight(0xffffff, 2, 100, Math.PI / 4, 0.5, 2)
    spotLight.position.set(0, 20, 0)
    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = 2048
    spotLight.shadow.mapSize.height = 2048
    scene.add(spotLight)

    // RimLight (lumière derrière)
    const rimLight = new THREE.DirectionalLight(0x0080ff, 1)
    rimLight.position.set(0, 0, -20)
    scene.add(rimLight)

    lightsRef.current = [pointLight1, pointLight2, pointLight3, spotLight, rimLight]
    console.log('✅ Lights created')

    // ========== COMPOSITION 1: "PORTAL" ==========
    // Grand Torus + petit TorusKnot au centre + Spheres flottantes
    
    const portalGroup = new THREE.Group()
    portalGroup.userData = { type: 'portal', speed: 0.3 }
    
    // Anneau extérieur - Métal brossé cyan
    const outerRingGeometry = new THREE.TorusGeometry(2.2, 0.4, 32, 100)
    const outerRingMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0x00ffff,
      emissiveIntensity: 0.4
    })
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial)
    outerRing.position.set(0, 0, 0)
    outerRing.rotation.x = Math.PI / 2 // Rotation pour orientation horizontale
    outerRing.userData = { 
      type: 'outer-ring', 
      speed: 0.3, 
      rotationSpeed: 0.01,
      originalPosition: [0, 0, 0]
    }
    portalGroup.add(outerRing)
    objectsRef.current.push(outerRing)
    
    // Anneau intérieur - Verre/cristal transparent avec émission magenta
    const innerRingGeometry = new THREE.TorusGeometry(1.5, 0.25, 32, 100)
    const innerRingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff00ff,
      transmission: 0.8,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0xff00ff,
      emissiveIntensity: 0.6
    })
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial)
    innerRing.position.set(0, 0, 0)
    innerRing.rotation.x = Math.PI / 2 // Même orientation que l'anneau extérieur
    innerRing.rotation.z = Math.PI / 4 // Légère rotation pour effet visuel
    innerRing.userData = { 
      type: 'inner-ring', 
      speed: 0.35, 
      rotationSpeed: -0.012, // Rotation inverse pour contraste
      originalPosition: [0, 0, 0]
    }
    portalGroup.add(innerRing)
    objectsRef.current.push(innerRing)
    
    // Anneau intérieur (verre/cristal) - horizontal et plus visible
    const innerTorusGeometry = new THREE.TorusGeometry(1.0, 0.2, 32, 100)
    const innerTorusMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 0.5, // Réduit pour plus de visibilité
      opacity: 0.9, // Augmenté pour plus de visibilité
      transparent: true,
      roughness: 0.05,
      metalness: 0.4,
      color: 0xffffff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.8 // Intensité très augmentée
      // thickness retiré - n'existe pas dans Three.js r128
    })
    const innerTorus = new THREE.Mesh(innerTorusGeometry, innerTorusMaterial)
    innerTorus.position.set(0, 0, 0)
    innerTorus.rotation.z = Math.PI / 4 // Légère rotation pour effet visuel
    // Orientation horizontale (pas de rotation X) pour meilleure visibilité
    innerTorus.userData = { 
      type: 'inner-ring', 
      speed: 0.5, 
      rotationSpeed: -0.02, // Rotation inverse pour contraste
      originalPosition: [0, 0, 0]
    }
    portalGroup.add(innerTorus)
    objectsRef.current.push(innerTorus)
    
    // Spheres flottantes autour
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const radius = 3
      const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32) // Taille augmentée de 0.3 à 0.5
      const neonMaterial = new THREE.MeshStandardMaterial({
        emissive: 0xff00ff,
        emissiveIntensity: 1.2, // Intensité augmentée
        color: 0xff00ff,
        metalness: 0.8,
        roughness: 0.2
      })
      const sphere = new THREE.Mesh(sphereGeometry, neonMaterial)
      const baseX = Math.cos(angle) * radius
      const baseY = Math.sin(angle) * radius
      const baseZ = Math.sin(i) * 0.5
      sphere.position.set(baseX, baseY, baseZ)
      sphere.userData = {
        type: 'orbiting-sphere',
        speed: 0.4,
        rotationSpeed: 0.015,
        angle: angle,
        radius: radius,
        orbitSpeed: 0.01, // Vitesse d'orbite réduite pour être plus visible
        originalPosition: [baseX, baseY, baseZ],
        currentAngle: angle // Angle actuel pour l'animation
      }
      portalGroup.add(sphere)
      objectsRef.current.push(sphere)
    }
    
    portalGroup.position.set(0, 0, -5)
    scene.add(portalGroup)
    groupsRef.current.push(portalGroup)
    console.log('✅ Portal composition created')

    // ========== COMPOSITION 2: "CRISTAUX" ==========
    // Octahedrons de tailles variées avec matériaux transparents
    
    const crystalGroup = new THREE.Group()
    crystalGroup.userData = { type: 'crystals', speed: 0.2 }
    
    const crystalSizes = [1.2, 0.8, 0.6, 0.4, 0.3, 0.25, 0.2]
    const crystalPositions = [
      [0, 0, 2],
      [2, 1, 1],
      [-2, -1, 1.5],
      [1.5, -1.5, 0.5],
      [-1.5, 1.5, 2.5],
      [0, 2, 1],
      [-2, 2, 2]
    ]
    
    crystalSizes.forEach((size, index) => {
      const crystalGeometry = new THREE.OctahedronGeometry(size, 0)
      const crystalMat = new THREE.MeshPhysicalMaterial({
        transmission: 0.9,
        opacity: 0.7,
        transparent: true,
        roughness: 0.1,
        metalness: 0.3,
        color: new THREE.Color().setHSL(0.6 + index * 0.1, 0.8, 0.5)
      })
      const crystal = new THREE.Mesh(crystalGeometry, crystalMat)
      const pos = crystalPositions[index]
      crystal.position.set(...pos)
      crystal.userData = {
        type: 'crystal',
        speed: 0.2 + index * 0.05,
        rotationSpeed: 0.005 + index * 0.003,
        originalPosition: [...pos]
      }
      crystalGroup.add(crystal)
      objectsRef.current.push(crystal)
    })
    
    scene.add(crystalGroup)
    groupsRef.current.push(crystalGroup)
    console.log('✅ Crystals composition created')

    // ========== COMPOSITION 3: "GALAXY" ==========
    // IcosahedronGeometry en orbite + particules
    
    const galaxyGroup = new THREE.Group()
    galaxyGroup.userData = { type: 'galaxy', speed: 0.1 }
    
    // Centre - Icosahedron géant
    const icoGeometry = new THREE.IcosahedronGeometry(1.5, 0)
    const icoMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xffff00,
      emissiveIntensity: 0.4
    })
    const ico = new THREE.Mesh(icoGeometry, icoMaterial)
    ico.position.set(0, 0, 0)
    ico.userData = { 
      type: 'ico-center', 
      speed: 0.1, 
      rotationSpeed: 0.005,
      originalPosition: [0, 0, 0]
    }
    galaxyGroup.add(ico)
    objectsRef.current.push(ico)
    
    galaxyGroup.position.set(0, 0, 5)
    
    // Particules flottantes
    const particleCount = 50
    const particlesGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 20
      positions[i3 + 1] = (Math.random() - 0.5) * 20
      positions[i3 + 2] = (Math.random() - 0.5) * 20 + 5
      
      const color = new THREE.Color().setHSL(Math.random(), 1, 0.5)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    })
    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    particles.userData = { type: 'particles', speed: 0.05 }
    galaxyGroup.add(particles)
    objectsRef.current.push(particles)
    
    scene.add(galaxyGroup)
    groupsRef.current.push(galaxyGroup)
    console.log('✅ Galaxy composition created')

    // ========== COMPOSITION 4: "ABSTRACT" ==========
    // DodecahedronGeometry avec wireframe + version solide offset
    
    const abstractGroup = new THREE.Group()
    abstractGroup.userData = { type: 'abstract', speed: 0.25 }
    
    // Dodecahedron wireframe
    const dodecaGeometry = new THREE.DodecahedronGeometry(1, 0)
    const wireframeDodecaMat = new THREE.MeshStandardMaterial({
      color: 0xff0080,
      wireframe: true,
      emissive: 0xff0080,
      emissiveIntensity: 0.4
    })
    const wireframeDodeca = new THREE.Mesh(dodecaGeometry, wireframeDodecaMat)
    wireframeDodeca.position.set(-3, 0, 0)
    wireframeDodeca.userData = { 
      type: 'wireframe-dodeca', 
      speed: 0.25, 
      rotationSpeed: 0.012,
      originalPosition: [-3, 0, 0]
    }
    abstractGroup.add(wireframeDodeca)
    objectsRef.current.push(wireframeDodeca)
    
    // Dodecahedron solid offset
    const solidDodecaMat = new THREE.MeshStandardMaterial({
      color: 0xff0080,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xff0080,
      emissiveIntensity: 0.2
    })
    const solidDodeca = new THREE.Mesh(dodecaGeometry, solidDodecaMat)
    solidDodeca.position.set(-3.15, 0.15, -0.15)
    solidDodeca.userData = { 
      type: 'solid-dodeca', 
      speed: 0.25, 
      rotationSpeed: 0.01,
      originalPosition: [-3.15, 0.15, -0.15]
    }
    abstractGroup.add(solidDodeca)
    objectsRef.current.push(solidDodeca)
    
    // Nested geometry - Torus avec sphères à l'intérieur
    const nestedTorusGeometry = new THREE.TorusGeometry(1.5, 0.4, 16, 100)
    const nestedTorusMaterial = new THREE.MeshStandardMaterial({
      color: 0x0080ff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0080ff,
      emissiveIntensity: 0.3
    })
    const nestedTorus = new THREE.Mesh(nestedTorusGeometry, nestedTorusMaterial)
    nestedTorus.position.set(3, 0, 0)
    nestedTorus.userData = { 
      type: 'nested-torus', 
      speed: 0.25, 
      rotationSpeed: 0.008,
      originalPosition: [3, 0, 0]
    }
    abstractGroup.add(nestedTorus)
    objectsRef.current.push(nestedTorus)
    
    // Sphères à l'intérieur du torus
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2
      const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16)
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.6,
        metalness: 0.7,
        roughness: 0.3
      })
      const innerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      const baseX = Math.cos(angle) * 1.5
      const baseY = Math.sin(angle) * 0.3
      innerSphere.position.set(3 + baseX, baseY, 0)
      innerSphere.userData = {
        type: 'inner-sphere',
        speed: 0.3,
        rotationSpeed: 0.02,
        angle: angle,
        orbitSpeed: 0.5, // Vitesse d'orbite réduite (en radians par seconde à 60 FPS)
        orbitRadius: 1.5,
        originalPosition: [3 + baseX, baseY, 0],
        currentAngle: angle // Angle actuel pour l'animation
      }
      abstractGroup.add(innerSphere)
      objectsRef.current.push(innerSphere)
    }
    
    abstractGroup.position.set(0, 0, -8)
    
    scene.add(abstractGroup)
    groupsRef.current.push(abstractGroup)
    console.log('✅ Abstract composition created')

    // ========== OBJET GÉANT EN FOND ==========
    const giantGeometry = new THREE.BoxGeometry(8, 8, 0.5)
    const giantMaterial = new THREE.MeshStandardMaterial({
      color: 0x000033,
      emissive: 0x000066,
      emissiveIntensity: 0.2,
      metalness: 0.5,
      roughness: 0.5
    })
    const giantBox = new THREE.Mesh(giantGeometry, giantMaterial)
    giantBox.position.set(0, 0, -15)
    giantBox.userData = { type: 'giant-background', speed: 0.05, rotationSpeed: 0.001 }
    scene.add(giantBox)
    objectsRef.current.push(giantBox)
    console.log('✅ Giant background created')

    console.log(`✅ Total objects created: ${objectsRef.current.length}`)
    console.log(`📊 Scene children count: ${scene.children.length}`)

    // Gestion du redimensionnement
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Gestion du mouvement de la souris
    const handleMouseMove = (event) => {
      targetMouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      targetMouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Fonction de lerp
    const lerp = (start, end, factor) => {
      return start + (end - start) * factor
    }

    // Animation loop avec deltaTime
    let lastTime = Date.now()
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      
      // Calculer le deltaTime pour des animations fluides
      const currentTime = Date.now()
      const deltaTime = (currentTime - lastTime) * 0.001 // en secondes
      lastTime = currentTime

      // Lerp pour mouvement fluide
      const lerpFactor = 0.05
      mouseRef.current.x = lerp(mouseRef.current.x, targetMouseRef.current.x, lerpFactor)
      mouseRef.current.y = lerp(mouseRef.current.y, targetMouseRef.current.y, lerpFactor)

      // Appliquer le parallaxe aux groupes d'abord
      groupsRef.current.forEach((group) => {
        if (group && group.userData) {
          const groupSpeed = group.userData.speed || 0.3
          group.position.x = mouseRef.current.x * groupSpeed * 2
          group.position.y = mouseRef.current.y * groupSpeed * 2
        }
      })
      
      // Appliquer le parallaxe et animations aux objets
      objectsRef.current.forEach((object) => {
        if (!object || !object.userData) return
        
        const { speed, rotationSpeed, angle, orbitSpeed, orbitRadius, type, originalPosition } = object.userData
        
        // Rotation continue
        if (rotationSpeed) {
          object.rotation.x += rotationSpeed * deltaTime * 60 // Normaliser à 60 FPS
          object.rotation.y += rotationSpeed * 0.7 * deltaTime * 60
          object.rotation.z += rotationSpeed * 0.3 * deltaTime * 60
        }
        
        // Orbite pour les objets en orbite
        if (type && (type.includes('orbiting') || type.includes('inner-sphere')) && 
            angle !== undefined && orbitRadius !== undefined && orbitSpeed) {
          // Utiliser l'angle stocké et l'incrémenter progressivement
          const currentAngle = object.userData.currentAngle !== undefined 
            ? object.userData.currentAngle 
            : angle
          const newAngle = currentAngle + orbitSpeed * deltaTime * 60 // Normaliser à 60 FPS
          object.userData.currentAngle = newAngle
          
          if (originalPosition) {
            object.position.x = originalPosition[0] + Math.cos(newAngle) * orbitRadius
            object.position.y = originalPosition[1] + Math.sin(newAngle) * orbitRadius
            object.position.z = originalPosition[2] || 0
          } else {
            object.position.x = Math.cos(newAngle) * orbitRadius
            object.position.y = Math.sin(newAngle) * orbitRadius
          }
        } else if (originalPosition) {
          // Déplacement parallaxe standard basé sur position originale
          object.position.x = originalPosition[0] + mouseRef.current.x * speed * 3
          object.position.y = originalPosition[1] + mouseRef.current.y * speed * 3
          if (originalPosition[2] !== undefined) {
            object.position.z = originalPosition[2]
          }
        }
      })

      // Rotation des groupes
      groupsRef.current.forEach((group) => {
        if (group && group.userData) {
          group.rotation.y += 0.002
        }
      })

      // Rotation des lumières
      const time = Date.now() * 0.0005
      if (lightsRef.current[0]) {
        lightsRef.current[0].position.x = Math.cos(time) * 10
        lightsRef.current[0].position.y = Math.sin(time) * 10
      }
      if (lightsRef.current[1]) {
        lightsRef.current[1].position.x = Math.cos(time + Math.PI) * 10
        lightsRef.current[1].position.y = Math.sin(time + Math.PI) * 10
      }
      if (lightsRef.current[2]) {
        lightsRef.current[2].position.x = Math.cos(time * 0.7) * 8
        lightsRef.current[2].position.z = Math.sin(time * 0.7) * 8
      }

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

  return (
    <div className="app-container">
      <div ref={mountRef} className="canvas-container" />
      
      <div className={`overlay ${isLoaded ? 'loaded' : ''}`}>
        <div className="content">
          <h1 className="title">PARALLAX EXPERIENCE</h1>
          <p className="subtitle">Bougez la souris pour explorer</p>
          <div className="instructions">
            <p>Compositions Awwwards : Portal • Cristaux • Galaxy • Abstract</p>
            <p>Wireframe + Solid • Nested Geometry • Orbites • Matériaux Premium</p>
          </div>
        </div>
      </div>
      </div>
  )
}

export default App
