import * as THREE from 'three'

export function createGalaxyComposition(scene, objectsRef) {
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
  
  console.log('✅ Galaxy composition created')
  return galaxyGroup
}

