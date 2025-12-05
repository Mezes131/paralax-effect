import * as THREE from 'three'

export function createPortalComposition(scene, objectsRef) {
  if (!scene || !objectsRef) {
    console.error('❌ createPortalComposition: scene and objectsRef are required')
    return null
  }

  try {
    const portalGroup = new THREE.Group()
    portalGroup.userData = { type: 'portal', speed: 0.3 }
  
  // Anneau extérieur - Métal brossé cyan (taille réduite pour plus de finesse)
  const outerRingGeometry = new THREE.TorusGeometry(1.8, 0.3, 32, 100)
  const outerRingMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    metalness: 0.95,
    roughness: 0.05,
    emissive: 0x00ffff,
    emissiveIntensity: 0.35
  })
  const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial)
  outerRing.position.set(0, 0, 0)
  outerRing.rotation.x = Math.PI / 2
  outerRing.userData = { 
    type: 'outer-ring', 
    speed: 0.3, 
    rotationSpeed: 0.008,
    originalPosition: [0, 0, 0]
  }
  portalGroup.add(outerRing)
  objectsRef.current.push(outerRing)
  
  // Anneau intérieur - Verre/cristal transparent avec émission magenta
  const innerRingGeometry = new THREE.TorusGeometry(1.2, 0.2, 32, 100)
  const innerRingMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff00ff,
    transmission: 0.85,
    opacity: 0.85,
    transparent: true,
    roughness: 0.08,
    metalness: 0.2,
    emissive: 0xff00ff,
    emissiveIntensity: 0.5
  })
  const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial)
  innerRing.position.set(0, 0, 0)
  innerRing.rotation.x = Math.PI / 2
  innerRing.rotation.z = Math.PI / 4
  innerRing.userData = { 
    type: 'inner-ring', 
    speed: 0.35, 
    rotationSpeed: -0.01,
    originalPosition: [0, 0, 0]
  }
  portalGroup.add(innerRing)
  objectsRef.current.push(innerRing)
  
  // Anneau central (verre/cristal) - plus subtil
  const innerTorusGeometry = new THREE.TorusGeometry(0.8, 0.15, 32, 100)
  const innerTorusMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 0.6,
    opacity: 0.85,
    transparent: true,
    roughness: 0.05,
    metalness: 0.4,
    color: 0xffffff,
    emissive: 0xff00ff,
    emissiveIntensity: 0.6
  })
  const innerTorus = new THREE.Mesh(innerTorusGeometry, innerTorusMaterial)
  innerTorus.position.set(0, 0, 0)
  innerTorus.rotation.z = Math.PI / 4
  innerTorus.userData = { 
    type: 'inner-ring', 
    speed: 0.5, 
    rotationSpeed: -0.015,
    originalPosition: [0, 0, 0]
  }
  portalGroup.add(innerTorus)
  objectsRef.current.push(innerTorus)
  
  // Spheres flottantes autour - moins nombreuses et mieux espacées
  const sphereCount = 5
  const sphereSizes = [0.4, 0.35, 0.3, 0.38, 0.32]
  for (let i = 0; i < sphereCount; i++) {
    const angle = (i / sphereCount) * Math.PI * 2
    const radius = 5.2 + Math.sin(i * 0.7) * 0.2 // Rayon plus grand pour plus d'espace
    const sphereSize = sphereSizes[i]
    const sphereGeometry = new THREE.SphereGeometry(sphereSize, 32, 32)
    const neonMaterial = new THREE.MeshStandardMaterial({
      emissive: 0xff00ff,
      emissiveIntensity: 0.9,
      color: 0xff00ff,
      metalness: 0.8,
      roughness: 0.2
    })
    const sphere = new THREE.Mesh(sphereGeometry, neonMaterial)
    const baseX = Math.cos(angle) * radius
    const baseY = Math.sin(angle) * radius
    const baseZ = Math.sin(i * 1.2) * 0.6 // Plus d'espace en Z
    sphere.position.set(baseX, baseY, baseZ)
    sphere.userData = {
      type: 'orbiting-sphere',
      speed: 0.4,
      rotationSpeed: 0.012,
      angle: angle,
      radius: radius,
      orbitSpeed: 0.008,
      originalPosition: [baseX, baseY, baseZ],
      currentAngle: angle
    }
    portalGroup.add(sphere)
    objectsRef.current.push(sphere)
  }
  
    portalGroup.position.set(4, 2, -6)
    scene.add(portalGroup)
    
    console.log('✅ Portal composition created')
    return portalGroup
  } catch (error) {
    console.error('❌ Error creating portal composition:', error)
    return null
  }
}

