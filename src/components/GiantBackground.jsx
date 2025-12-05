import * as THREE from 'three'

export function createGiantBackground(scene, objectsRef) {
  if (!scene || !objectsRef) {
    console.error('❌ createGiantBackground: scene and objectsRef are required')
    return null
  }

  try {
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
  giantBox.userData = { 
    type: 'giant-background', 
    speed: 0.05, 
    rotationSpeed: 0.001
   }
    scene.add(giantBox)
    objectsRef.current.push(giantBox)
    
    return giantBox
  } catch (error) {
    console.error('❌ Error creating giant background:', error)
    return null
  }
}

