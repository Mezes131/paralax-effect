import * as THREE from 'three'

export function createStarFieldComposition(scene, objectsRef) {
  if (!scene || !objectsRef) {
    console.error('❌ createStarFieldComposition: scene and objectsRef are required')
    return null
  }

  try {
    const starFieldGroup = new THREE.Group()
    starFieldGroup.userData = { type: 'starfield', speed: 0 }
    
    // Créer un grand nombre de particules pour le ciel étoilé
    const starCount = 5000
    const starsGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)
    
    // Zone de distribution très large pour couvrir tout l'espace visible
    // Distribution uniforme dans un cube pour éviter la concentration au centre
    const spreadDistance = 200 // Distance maximale depuis le centre sur chaque axe
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      
      // Distribution uniforme dans un cube (évite la concentration au centre)
      // Utiliser une distribution qui favorise les zones éloignées
      const minDistance = 20 // Distance minimale pour éviter le centre
      const maxDistance = spreadDistance
      
      // Distribution uniforme dans une coquille sphérique (entre minDistance et maxDistance)
      const radius = minDistance + Math.random() * (maxDistance - minDistance)
      const theta = Math.random() * Math.PI * 2 // Angle horizontal
      const phi = Math.acos(Math.random() * 2 - 1) // Angle vertical pour distribution uniforme
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)
      
      // Couleurs variées pour les étoiles (blanc, bleu, jaune, rouge)
      const colorType = Math.random()
      let starColor
      if (colorType < 0.6) {
        // Étoiles blanches/bleues (majorité)
        starColor = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.2, 0.7 + Math.random() * 0.3)
      } else if (colorType < 0.85) {
        // Étoiles jaunes
        starColor = new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 0.5, 0.6 + Math.random() * 0.3)
      } else {
        // Étoiles rouges/orange (rares)
        starColor = new THREE.Color().setHSL(Math.random() * 0.1, 0.8, 0.5 + Math.random() * 0.3)
      }
      
      colors[i3] = starColor.r
      colors[i3 + 1] = starColor.g
      colors[i3 + 2] = starColor.b
      
      // Tailles variées pour les étoiles
      sizes[i] = 0.05 + Math.random() * 0.15
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    // Matériau pour les étoiles avec PointsMaterial (plus simple et performant)
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    stars.userData = { type: 'stars', speed: 0 }
    starFieldGroup.add(stars)
    objectsRef.current.push(stars)
    
    // Positionner le ciel étoilé au centre (il entoure toute la scène)
    starFieldGroup.position.set(0, 0, 0)
    
    scene.add(starFieldGroup)
    
    console.log(`✅ Star field created with ${starCount} stars`)
    return starFieldGroup
  } catch (error) {
    console.error('❌ Error creating star field:', error)
    return null
  }
}

