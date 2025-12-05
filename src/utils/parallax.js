/**
 * Fonction de lerp (linear interpolation) pour des transitions fluides
 * @param {number} start - Valeur de départ
 * @param {number} end - Valeur d'arrivée
 * @param {number} factor - Facteur d'interpolation (0-1)
 * @returns {number} - Valeur interpolée
 */
export function lerp(start, end, factor) {
  return start + (end - start) * factor
}

/**
 * Crée un gestionnaire d'événement pour le mouvement de la souris
 * @param {Object} targetMouseRef - Référence pour stocker la position cible de la souris
 * @returns {Function} - Fonction de gestionnaire d'événement
 */
export function createMouseMoveHandler(targetMouseRef) {
  return (event) => {
    targetMouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
    targetMouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
  }
}

/**
 * Applique l'effet de parallaxe aux groupes
 * @param {Array} groupsRef - Référence contenant les groupes Three.js
 * @param {Object} mouseRef - Référence contenant la position actuelle de la souris
 */
export function applyParallaxToGroups(groupsRef, mouseRef) {
  groupsRef.current.forEach((group) => {
    if (group && group.userData) {
      const groupSpeed = group.userData.speed || 0.3
      group.position.x = mouseRef.current.x * groupSpeed * 2
      group.position.y = mouseRef.current.y * groupSpeed * 2
    }
  })
}

/**
 * Applique l'effet de parallaxe et les animations aux objets
 * @param {Array} objectsRef - Référence contenant les objets Three.js
 * @param {Object} mouseRef - Référence contenant la position actuelle de la souris
 * @param {number} deltaTime - Temps écoulé depuis la dernière frame (en secondes)
 */
export function applyParallaxToObjects(objectsRef, mouseRef, deltaTime) {
  // Protection contre les gros deltaTime (onglet inactif, pause, etc.)
  const clampedDeltaTime = Math.min(deltaTime, 0.1) // Limiter à 100ms max
  
  objectsRef.current.forEach((object) => {
    if (!object || !object.userData) return
    
    const { speed, rotationSpeed, angle, orbitSpeed, orbitRadius, type, originalPosition } = object.userData
    
    // Rotation continue - utiliser le deltaTime réel sans normalisation
    if (rotationSpeed) {
      object.rotation.x += rotationSpeed * clampedDeltaTime
      object.rotation.y += rotationSpeed * 0.7 * clampedDeltaTime
      object.rotation.z += rotationSpeed * 0.3 * clampedDeltaTime
    }
    
    // Orbite pour les objets en orbite
    if (type && (type.includes('orbiting') || type.includes('inner-sphere')) && 
        angle !== undefined && orbitRadius !== undefined && orbitSpeed) {
      // Utiliser l'angle stocké et l'incrémenter progressivement
      const currentAngle = object.userData.currentAngle !== undefined 
        ? object.userData.currentAngle 
        : angle
      const newAngle = currentAngle + orbitSpeed * clampedDeltaTime
      object.userData.currentAngle = newAngle
      
      if (originalPosition) {
        object.position.x = originalPosition[0] + Math.cos(newAngle) * orbitRadius
        object.position.y = originalPosition[1] + Math.sin(newAngle) * orbitRadius
        object.position.z = originalPosition[2] || 0
      } else {
        object.position.x = Math.cos(newAngle) * orbitRadius
        object.position.y = Math.sin(newAngle) * orbitRadius
      }
    } else if (originalPosition) {
      // Déplacement parallaxe standard basé sur position originale
      object.position.x = originalPosition[0] + mouseRef.current.x * speed * 3
      object.position.y = originalPosition[1] + mouseRef.current.y * speed * 3
      if (originalPosition[2] !== undefined) {
        object.position.z = originalPosition[2]
      }
    }
  })
}

/**
 * Applique la rotation continue aux groupes
 * @param {Array} groupsRef - Référence contenant les groupes Three.js
 * @param {number} deltaTime - Temps écoulé depuis la dernière frame (en secondes)
 */
export function rotateGroups(groupsRef, deltaTime = 0.016) {
  // Protection contre les gros deltaTime
  const clampedDeltaTime = Math.min(deltaTime, 0.1)
  const rotationSpeed = 0.002 * 60 // Vitesse de rotation par seconde
  
  groupsRef.current.forEach((group) => {
    if (group && group.userData) {
      group.rotation.y += rotationSpeed * clampedDeltaTime
    }
  })
}

/**
 * Anime les lumières en rotation
 * @param {Array} lightsRef - Référence contenant les lumières Three.js
 */
export function animateLights(lightsRef) {
  const time = Date.now() * 0.0005
  if (lightsRef.current[0]) {
    lightsRef.current[0].position.x = Math.cos(time) * 10
    lightsRef.current[0].position.y = Math.sin(time) * 10
  }
  if (lightsRef.current[1]) {
    lightsRef.current[1].position.x = Math.cos(time + Math.PI) * 10
    lightsRef.current[1].position.y = Math.sin(time + Math.PI) * 10
  }
  if (lightsRef.current[2]) {
    lightsRef.current[2].position.x = Math.cos(time * 0.7) * 8
    lightsRef.current[2].position.z = Math.sin(time * 0.7) * 8
  }
}

/**
 * Met à jour la position de la souris avec interpolation fluide
 * @param {Object} mouseRef - Référence contenant la position actuelle de la souris
 * @param {Object} targetMouseRef - Référence contenant la position cible de la souris
 * @param {number} lerpFactor - Facteur d'interpolation (par défaut 0.05)
 */
export function updateMousePosition(mouseRef, targetMouseRef, lerpFactor = 0.05) {
  mouseRef.current.x = lerp(mouseRef.current.x, targetMouseRef.current.x, lerpFactor)
  mouseRef.current.y = lerp(mouseRef.current.y, targetMouseRef.current.y, lerpFactor)
}

