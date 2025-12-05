import * as THREE from 'three'

export function createCrystalsComposition(scene, objectsRef) {
  if (!scene || !objectsRef) {
    console.error('❌ createCrystalsComposition: scene and objectsRef are required')
    return null
  }

  try {
    const crystalGroup = new THREE.Group()
    crystalGroup.userData = { type: 'crystals', speed: 0.2 }
  
  // Moins de cristaux, mieux espacés
  const crystalSizes = [0.85, 0.65, 0.5, 0.4, 0.3]
  // Positions avec plus d'espace entre elles
  const crystalPositions = [
    [0, 0.8, 2],          // Centre, avant
    [25, 1.2, 1],       // Droite, haut
    [-15, -1.2, 1.5],   // Gauche, bas
    [1.8, -20, 0.5],      // Droite, bas
    [-1.8, 20, 2.5]       // Gauche, haut
  ]
  
  crystalSizes.forEach((size, index) => {
    const crystalGeometry = new THREE.OctahedronGeometry(size, 0)
    const crystalMat = new THREE.MeshPhysicalMaterial({
      transmission: 0.9,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      metalness: 0.6,
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
  
  // Positionner le groupe de cristaux dans l'espace - plus espacé
  crystalGroup.position.set(-30, -200, 2)
  
    scene.add(crystalGroup)
    
    return crystalGroup
  } catch (error) {
    console.error('❌ Error creating crystals composition:', error)
    return null
  }
}

