import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './App.css'

function App() {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const objectsRef = useRef([])
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

    // Éviter les initialisations multiples
    if (isInitializedRef.current) {
      console.warn('⚠️ Already initialized, skipping...')
      console.warn(`   Current scene children: ${sceneRef.current?.children.length || 0}`)
      console.warn(`   Current objectsRef length: ${objectsRef.current?.length || 0}`)
      return
    }
    
    // Vérifier s'il y a déjà un canvas dans le DOM
    if (mountRef.current.querySelector('canvas')) {
      console.warn('⚠️ Canvas already exists in DOM, removing it first...')
      const existingCanvas = mountRef.current.querySelector('canvas')
      if (existingCanvas && existingCanvas.parentNode) {
        existingCanvas.parentNode.removeChild(existingCanvas)
        console.log('✅ Existing canvas removed')
      }
    }

    console.log('🧹 Cleaning up any existing instances...')
    
    // Nettoyer d'abord s'il y a déjà une instance (sécurité)
    if (rendererRef.current) {
      console.log('🗑️ Disposing existing renderer')
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (mountRef.current && rendererRef.current.domElement && mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        console.log('✅ Canvas removed from DOM')
      }
      rendererRef.current.dispose()
      rendererRef.current = null
    }

    // Nettoyer la scène existante si elle existe
    if (sceneRef.current) {
      const meshCount = sceneRef.current.children.filter(c => c instanceof THREE.Mesh).length
      const lightCount = sceneRef.current.children.filter(c => c instanceof THREE.Light).length
      console.log(`🧹 Cleaning scene with ${sceneRef.current.children.length} children (${meshCount} meshes, ${lightCount} lights)`)
      
      // Nettoyer tous les meshes
      const meshesToRemove = sceneRef.current.children.filter(c => c instanceof THREE.Mesh)
      meshesToRemove.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) mesh.material.dispose()
        sceneRef.current.remove(mesh)
      })
      
      // Nettoyer toutes les lumières
      const lightsToRemove = sceneRef.current.children.filter(c => c instanceof THREE.Light)
      lightsToRemove.forEach(light => {
        sceneRef.current.remove(light)
      })
      
      console.log(`✅ Scene cleaned, now has ${sceneRef.current.children.length} children`)
    }

    // Marquer comme initialisé
    isInitializedRef.current = true
    console.log('✅ Marked as initialized')

    // Vider les références
    objectsRef.current = []
    mouseRef.current = { x: 0, y: 0 }
    targetMouseRef.current = { x: 0, y: 0 }
    console.log('✅ References cleared')

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
    camera.position.z = 5
    cameraRef.current = camera
    console.log('✅ Camera created at z=5')

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    
    if (!mountRef.current) {
      isInitializedRef.current = false
      return
    }
    
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer
    console.log('✅ Renderer created and canvas appended to DOM')
    console.log(`📊 Scene children count: ${scene.children.length}`)

    // Lumières
    const ambientLight = new THREE.AmbientLight(0x404040, 1)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0xff00ff, 2, 100)
    pointLight1.position.set(5, 5, 5)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x00ffff, 2, 100)
    pointLight2.position.set(-5, -5, 5)
    scene.add(pointLight2)

    const pointLight3 = new THREE.PointLight(0xffff00, 2, 100)
    pointLight3.position.set(0, 5, -5)
    scene.add(pointLight3)

    // Stocker les références aux lumières
    lightsRef.current = [pointLight1, pointLight2, pointLight3]
    console.log('✅ Lights created and added to scene')
    console.log(`📊 Scene children count after lights: ${scene.children.length}`)

    // Configuration des objets avec différentes profondeurs et vitesses
    const objectsConfig = [
      { 
        type: 'sphere', 
        position: [0, 0, -2], 
        speed: 0.8, 
        color: 0xff00ff,
        size: 1.0
      },
      { 
        type: 'torus', 
        position: [2, 1, -1], 
        speed: 0.6, 
        color: 0x00ffff,
        size: 0.8
      },
      { 
        type: 'box', 
        position: [-2, -1, 0], 
        speed: 0.4, 
        color: 0xffff00,
        size: 0.9
      },
      { 
        type: 'octahedron', 
        position: [1.5, -1.5, 1], 
        speed: 0.3, 
        color: 0xff0080,
        size: 0.7
      },
      { 
        type: 'cone', 
        position: [-1.5, 1.5, 2], 
        speed: 0.2, 
        color: 0x0080ff,
        size: 0.8
      },
    ]

    // Création des objets géométriques
    console.log(`🎨 Creating ${objectsConfig.length} objects...`)
    objectsConfig.forEach((config, index) => {
      let geometry
      switch (config.type) {
        case 'sphere':
          geometry = new THREE.SphereGeometry(config.size, 32, 32)
          break
        case 'torus':
          geometry = new THREE.TorusGeometry(config.size, 0.3, 16, 100)
          break
        case 'box':
          geometry = new THREE.BoxGeometry(config.size, config.size, config.size)
          break
        case 'octahedron':
          geometry = new THREE.OctahedronGeometry(config.size, 0)
          break
        case 'cone':
          geometry = new THREE.ConeGeometry(config.size, config.size * 1.5, 32)
          break
        default:
          geometry = new THREE.SphereGeometry(config.size, 32, 32)
      }

      const material = new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...config.position)
      const rotationSpeed = 0.01 + Math.random() * 0.02
      mesh.userData = {
        originalPosition: [...config.position],
        speed: config.speed,
        rotationSpeed: rotationSpeed,
        index: index,
        type: config.type
      }
      
      scene.add(mesh)
      objectsRef.current.push(mesh)
      console.log(`  ✅ Created ${config.type} #${index} at [${config.position.join(', ')}] with speed ${config.speed}, rotationSpeed ${rotationSpeed.toFixed(4)}`)
    })
    
    console.log(`✅ Total objects created: ${objectsRef.current.length}`)
    console.log(`📊 Scene children count after objects: ${scene.children.length}`)
    console.log(`📊 Objects in objectsRef: ${objectsRef.current.length}`)
    
    // Vérification de duplication
    const meshesInScene = scene.children.filter(c => c instanceof THREE.Mesh)
    if (meshesInScene.length !== objectsRef.current.length) {
      console.error(`❌ DUPLICATION DETECTED! Scene has ${meshesInScene.length} meshes but objectsRef has ${objectsRef.current.length} objects`)
      console.error('   Meshes in scene:', meshesInScene.map(m => m.userData?.type || 'unknown'))
      console.error('   Objects in ref:', objectsRef.current.map(o => o?.userData?.type || 'unknown'))
    } else {
      console.log(`✅ No duplication detected: ${meshesInScene.length} meshes match ${objectsRef.current.length} objects`)
    }
    
    // Vérifier que tous les objets ont les bonnes propriétés userData
    objectsRef.current.forEach((obj, idx) => {
      if (!obj.userData || !obj.userData.originalPosition || !obj.userData.speed || !obj.userData.rotationSpeed) {
        console.error(`❌ Object #${idx} (${obj.userData?.type || 'unknown'}) is missing required userData:`, obj.userData)
      }
    })


    // Gestion du redimensionnement
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Gestion du mouvement de la souris
    let mouseMoveCount = 0
    const handleMouseMove = (event) => {
      // Normaliser les coordonnées entre -1 et 1
      targetMouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      targetMouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
      mouseMoveCount++
      if (mouseMoveCount === 1 || mouseMoveCount % 50 === 0) {
        console.log(`🖱️ Mouse move #${mouseMoveCount}: target=(${targetMouseRef.current.x.toFixed(3)}, ${targetMouseRef.current.y.toFixed(3)})`)
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    console.log('✅ Mouse move listener added')

    // Fonction de lerp (interpolation)
    const lerp = (start, end, factor) => {
      return start + (end - start) * factor
    }

    // Animation loop
    let frameCount = 0
    let lastLogTime = Date.now()
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      frameCount++

      // Lerp pour mouvement fluide de la souris
      const lerpFactor = 0.05
      mouseRef.current.x = lerp(mouseRef.current.x, targetMouseRef.current.x, lerpFactor)
      mouseRef.current.y = lerp(mouseRef.current.y, targetMouseRef.current.y, lerpFactor)

      // Log périodique pour déboguer
      const now = Date.now()
      if (now - lastLogTime > 2000) { // Log toutes les 2 secondes
        console.log(`🎬 Frame #${frameCount} | Objects in scene: ${scene.children.filter(c => c instanceof THREE.Mesh).length} | Objects in ref: ${objectsRef.current.length} | Mouse: (${mouseRef.current.x.toFixed(3)}, ${mouseRef.current.y.toFixed(3)})`)
        lastLogTime = now
      }

      // Appliquer le parallaxe aux objets
      let animatedCount = 0
      objectsRef.current.forEach((object, index) => {
        if (!object || !object.userData) {
          console.warn(`⚠️ Object at index ${index} is null or missing userData`)
          return
        }
        
        const { originalPosition, speed, rotationSpeed } = object.userData
        
        if (originalPosition === undefined || speed === undefined || rotationSpeed === undefined) {
          console.warn(`⚠️ Object #${index} (${object.userData.type || 'unknown'}) missing userData properties:`, object.userData)
          return
        }
        
        // Déplacement basé sur la position de la souris avec vitesse différente
        object.position.x = originalPosition[0] + mouseRef.current.x * speed * 2
        object.position.y = originalPosition[1] + mouseRef.current.y * speed * 2
        
        // Rotation continue
        object.rotation.x += rotationSpeed
        object.rotation.y += rotationSpeed * 0.7
        
        animatedCount++
      })

      if (frameCount === 1 || (frameCount % 60 === 0 && now - lastLogTime > 2000)) {
        console.log(`🎯 Animated ${animatedCount}/${objectsRef.current.length} objects`)
      }

      // Rotation des lumières pour effet dynamique
      const time = Date.now() * 0.0005
      if (lightsRef.current[0]) {
        lightsRef.current[0].position.x = Math.cos(time) * 5
        lightsRef.current[0].position.y = Math.sin(time) * 5
      }
      if (lightsRef.current[1]) {
        lightsRef.current[1].position.x = Math.cos(time + Math.PI) * 5
        lightsRef.current[1].position.y = Math.sin(time + Math.PI) * 5
      }

      renderer.render(scene, camera)
    }

    // Rendu initial pour s'assurer que tout est visible
    renderer.render(scene, camera)
    console.log('✅ Initial render completed')
    console.log(`📊 Final scene children count: ${scene.children.length}`)
    console.log(`📊 Breakdown: ${scene.children.filter(c => c instanceof THREE.Mesh).length} meshes, ${scene.children.filter(c => c instanceof THREE.Light).length} lights`)

    // Animation d'entrée
    setTimeout(() => {
      setIsLoaded(true)
      console.log('✅ UI overlay loaded')
    }, 100)

    // Démarrer l'animation
    console.log('🚀 Starting animation loop...')
    animate()

    // Cleanup
    return () => {
      console.log('🧹 Cleanup function called')
      isInitializedRef.current = false
      
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      console.log('✅ Event listeners removed')
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
        console.log('✅ Animation frame cancelled')
      }

      // Nettoyer les objets Three.js
      console.log(`🧹 Disposing ${objectsRef.current.length} objects...`)
      let disposedCount = 0
      objectsRef.current.forEach((object, index) => {
        if (object) {
          if (object.geometry) {
            object.geometry.dispose()
            disposedCount++
          }
          if (object.material) {
            object.material.dispose()
          }
          if (scene && scene.children.includes(object)) {
            scene.remove(object)
          }
        }
      })
      console.log(`✅ Disposed ${disposedCount} objects`)
      objectsRef.current = []

      // Nettoyer les lumières
      if (scene) {
        const lightsToRemove = []
        scene.children.forEach((child) => {
          if (child instanceof THREE.Light) {
            lightsToRemove.push(child)
          }
        })
        console.log(`🧹 Removing ${lightsToRemove.length} lights from scene`)
        lightsToRemove.forEach(light => scene.remove(light))
        scene.clear()
        console.log(`✅ Scene cleared, remaining children: ${scene.children.length}`)
      }
      
      // Retirer le canvas du DOM
      if (mountRef.current && renderer && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement)
        console.log('✅ Canvas removed from DOM')
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
      console.log('✅ All references cleared')
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
            <p>Une expérience 3D interactive</p>
            <p>avec effet parallaxe immersif</p>
          </div>
        </div>
      </div>
      </div>
  )
}

export default App
