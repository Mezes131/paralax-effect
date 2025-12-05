import * as THREE from 'three'

export function createAbstractComposition(scene, objectsRef) {
  if (!scene || !objectsRef) {
    console.error('❌ createAbstractComposition: scene and objectsRef are required')
    return null
  }

  try {
    const abstractGroup = new THREE.Group()
    abstractGroup.userData = { type: 'abstract', speed: 0.25 }
 
  
  
    abstractGroup.position.set(-5, 3, -10)
    
    scene.add(abstractGroup)
    
    console.log('✅ Abstract composition created')
    return abstractGroup
  } catch (error) {
    console.error('❌ Error creating abstract composition:', error)
    return null
  }
}

