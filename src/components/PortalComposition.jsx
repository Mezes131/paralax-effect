import * as THREE from 'three'

export function createPortalComposition(scene, objectsRef) {
  if (!scene || !objectsRef) {
    console.error('❌ createPortalComposition: scene and objectsRef are required')
    return null
  }

  try {
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
    
    console.log('✅ Portal composition created')
    return portalGroup
  } catch (error) {
    console.error('❌ Error creating portal composition:', error)
    return null
  }
}

