import * as THREE from 'three'

export function createLighting(scene, lightsRef) {
  if (!scene || !lightsRef) {
    console.error('❌ createLighting: scene and lightsRef are required')
    return []
  }

  try {
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
    
    return lightsRef.current
  } catch (error) {
    console.error('❌ Error creating lighting:', error)
    lightsRef.current = []
    return []
  }
}

