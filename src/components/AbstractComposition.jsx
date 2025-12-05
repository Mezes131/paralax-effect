import * as THREE from 'three'

export function createAbstractComposition(scene, objectsRef) {
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
  
  console.log('✅ Abstract composition created')
  return abstractGroup
}

