import * as THREE from 'three'

export function createCrystalsComposition(scene, objectsRef) {
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
  
  console.log('✅ Crystals composition created')
  return crystalGroup
}

