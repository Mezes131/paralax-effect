import * as THREE from 'three'

/**
 * Crée un système de visite guidée avec trajectoire prédéfinie
 * @param {THREE.Scene} scene - Scène Three.js
 * @param {Object} spacecraftRef - Référence au vaisseau spatial
 * @param {Object} cameraRef - Référence à la caméra
 * @param {Function} onTourComplete - Callback appelé à la fin de la visite
 * @param {Function} onFadeOutRequest - Callback pour demander un fondu au noir
 * @returns {Object} - Objet avec les méthodes de contrôle de la visite
 */
export function createGuidedTour(scene, spacecraftRef, cameraRef, onTourComplete, onFadeOutRequest) {
  if (!scene || !spacecraftRef || !cameraRef) {
    console.error('❌ createGuidedTour: scene, spacecraftRef and cameraRef are required')
    return null
  }

  // Points d'intérêt de la scène (positions des compositions)
  // Durées ajustées pour une visite totale d'environ 30 secondes
  const waypoints = [
    { position: new THREE.Vector3(4, 2, -6), lookAt: new THREE.Vector3(4, 2, -6), label: 'Portal', duration: 6000, pause: 2000 },
    { position: new THREE.Vector3(-3, -2, 2), lookAt: new THREE.Vector3(-3, -2, 2), label: 'Crystals', duration: 6000, pause: 2000 },
    { position: new THREE.Vector3(-4, -3, 8), lookAt: new THREE.Vector3(-4, -3, 8), label: 'Galaxy', duration: 7000, pause: 2000 },
    { position: new THREE.Vector3(-5, 3, -10), lookAt: new THREE.Vector3(-5, 3, -10), label: 'Abstract', duration: 6000, pause: 2000 },
    { position: new THREE.Vector3(0, 0, 8), lookAt: new THREE.Vector3(0, 0, 0), label: 'Overview', duration: 5000, pause: 0 }
  ]

  let currentWaypointIndex = 0
  let isTourActive = false
  let animationFrameId = null
  let startTime = 0
  let spacecraftStartPos = new THREE.Vector3()
  let cameraStartPos = new THREE.Vector3()
  let cameraStartLookAt = new THREE.Vector3()
  let isTransitioningToNext = false // Flag pour éviter les multiples setTimeout
  let fadeOutTriggered = false // Flag pour éviter de déclencher le fondu plusieurs fois
  
  // Pour les rotations fluides
  let targetRotationQuaternion = new THREE.Quaternion()
  let currentRotationQuaternion = new THREE.Quaternion()
  const rotationLerpSpeed = 0.08 // Vitesse d'interpolation des rotations (0-1) - réduite pour plus de fluidité
  
  // Pour les transitions de caméra fluides
  let cameraTargetLookAt = new THREE.Vector3()
  let cameraCurrentLookAt = new THREE.Vector3()
  const cameraLookAtLerpSpeed = 0.15 // Vitesse d'interpolation du lookAt de la caméra
  const cameraPositionLerpSpeed = 0.12 // Vitesse d'interpolation de la position de la caméra

  
 


  /**
   * Fonction d'easing plus douce (ease-in-out-cubic) pour des transitions encore plus fluides
   */
  function easeInOutCubic(t) {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * Met à jour la position du vaisseau et de la caméra pendant la visite
   */
  function updateTour(currentTime) {
    if (!isTourActive || currentWaypointIndex >= waypoints.length) {
      stopTour()
      return
    }

    const waypoint = waypoints[currentWaypointIndex]
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / waypoint.duration, 1)
    // Utiliser une fonction d'easing plus douce pour des transitions plus fluides
    const easedProgress = easeInOutCubic(progress)

    const spacecraft = spacecraftRef.current
    const camera = cameraRef.current

    // Détecter si on approche du dernier waypoint et déclencher le fondu
    const isLastWaypoint = currentWaypointIndex === waypoints.length - 1
    const fadeTriggerProgress = 0.70 // Déclencher le fondu à 85% de la progression vers le dernier waypoint
    if (isLastWaypoint && progress >= fadeTriggerProgress && !fadeOutTriggered && onFadeOutRequest) {
      fadeOutTriggered = true
      onFadeOutRequest()
    }

    // Calculer la position du vaisseau
    if (progress < 1) {
      // Réinitialiser le flag de transition pendant le mouvement (mais pas fadeOutTriggered)
      isTransitioningToNext = false
      
      // Pendant le trajet vers le waypoint
      if (spacecraft) {
        const targetPos = waypoint.position.clone()
        const currentPos = spacecraftStartPos.clone().lerp(targetPos, easedProgress)
        spacecraft.position.copy(currentPos)
        spacecraft.visible = true
        
        // Rotation fluide vers la direction opposée au mouvement (marche arrière)
        // Le vaisseau doit pointer vers l'arrière (dans la direction opposée au mouvement)
        const direction = targetPos.clone().sub(currentPos).normalize()
        if (direction.length() > 0.01) {
          // Inverser la direction pour que la fusée pointe vers l'arrière
          const backwardDirection = direction.clone().multiplyScalar(-1)
          
          // Créer un quaternion cible pour que le vaisseau pointe dans la direction opposée
          // Le vaisseau pointe vers +Z par défaut, donc on utilise lookAt avec backwardDirection comme target
          const up = new THREE.Vector3(0, 1, 0)
          const targetMatrix = new THREE.Matrix4()
          // lookAt(eye, target, up) - le vaisseau regarde depuis l'origine vers la direction inversée
          targetMatrix.lookAt(new THREE.Vector3(0, 0, 0), backwardDirection, up)
          targetRotationQuaternion.setFromRotationMatrix(targetMatrix)
          
          // Interpoler la rotation actuelle vers la rotation cible pour une transition fluide
          currentRotationQuaternion.slerp(targetRotationQuaternion, rotationLerpSpeed)
          spacecraft.quaternion.copy(currentRotationQuaternion)
        }

        // Position de la caméra : au-dessus et en arrière de la fusée, pointant vers l'avant
        if (camera) {
          const cameraOffset = new THREE.Vector3(0, 2, -5) // Au-dessus et en arrière
          const cameraTargetPos = currentPos.clone().add(cameraOffset)
          
          // Interpolation fluide de la position de la caméra avec lerp factor
          const cameraCurrentPos = cameraStartPos.clone().lerp(cameraTargetPos, easedProgress)
          
          // Interpolation supplémentaire pour adoucir encore plus
          const currentCameraPos = camera.position.clone()
          const smoothedPos = currentCameraPos.clone().lerp(cameraCurrentPos, cameraPositionLerpSpeed)
          camera.position.copy(smoothedPos)
          
          // Interpolation fluide du lookAt de la caméra
          cameraTargetLookAt.copy(currentPos)
          cameraCurrentLookAt.lerp(cameraTargetLookAt, cameraLookAtLerpSpeed)
          camera.lookAt(cameraCurrentLookAt)
        }
      } else if (camera) {
        // Si pas de vaisseau, déplacer directement la caméra vers le waypoint
        const targetPos = waypoint.position.clone()
        const cameraOffset = new THREE.Vector3(0, 2, -5) // Même offset que pour le vaisseau
        const cameraTargetPos = targetPos.clone().add(cameraOffset)
        const cameraCurrentPos = cameraStartPos.clone().lerp(cameraTargetPos, easedProgress)
        
        // Interpolation supplémentaire pour adoucir
        const currentCameraPos = camera.position.clone()
        const smoothedPos = currentCameraPos.clone().lerp(cameraCurrentPos, cameraPositionLerpSpeed)
        camera.position.copy(smoothedPos)
        
        // Interpolation fluide du lookAt
        cameraTargetLookAt.copy(targetPos)
        cameraCurrentLookAt.lerp(cameraTargetLookAt, cameraLookAtLerpSpeed)
        camera.lookAt(cameraCurrentLookAt)
      }
    } else {
      // Arrivé au waypoint, pause pour observer (mais continuer l'interpolation pour fluidité)
      if (spacecraft) {
        spacecraft.position.copy(waypoint.position)
      }
      
      if (camera) {
        // Position de la caméra au-dessus et en arrière de la fusée
        const cameraOffset = new THREE.Vector3(0, 2, -5)
        const cameraTargetPos = waypoint.position.clone().add(cameraOffset)
        
        // Interpolation fluide continue vers la position finale (même au waypoint)
        const currentCameraPos = camera.position.clone()
        const smoothedPos = currentCameraPos.clone().lerp(cameraTargetPos, cameraPositionLerpSpeed * 1.5) // Légèrement plus rapide au waypoint
        camera.position.copy(smoothedPos)
        
        // Interpolation fluide du lookAt (continue même au waypoint)
        cameraTargetLookAt.copy(waypoint.lookAt)
        cameraCurrentLookAt.lerp(cameraTargetLookAt, cameraLookAtLerpSpeed * 1.5) // Légèrement plus rapide au waypoint
        camera.lookAt(cameraCurrentLookAt)
      }

      // Passer au waypoint suivant après la pause (une seule fois)
      if (!isTransitioningToNext) {
        isTransitioningToNext = true
        const pauseDuration = waypoint.pause || 2000
        
        setTimeout(() => {
          if (isTourActive && isTransitioningToNext) {
            currentWaypointIndex++
            isTransitioningToNext = false
            if (currentWaypointIndex < waypoints.length) {
              startWaypointTransition()
            } else {
              stopTour()
            }
          }
        }, pauseDuration)
      }
    }

    if (isTourActive) {
      animationFrameId = requestAnimationFrame(updateTour)
    }
  }

  /**
   * Démarre la transition vers le waypoint suivant
   */
  function startWaypointTransition() {
    if (currentWaypointIndex >= waypoints.length) return

    const spacecraft = spacecraftRef.current
    const camera = cameraRef.current

    if (spacecraft && camera) {
      spacecraftStartPos.copy(spacecraft.position)
      cameraStartPos.copy(camera.position)
      
      // Initialiser le lookAt de la caméra avec la direction actuelle
      const currentLookAt = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(10).add(camera.position)
      cameraStartLookAt.copy(currentLookAt)
      cameraCurrentLookAt.copy(currentLookAt)
      cameraTargetLookAt.copy(currentLookAt)
      
      startTime = performance.now()
      animationFrameId = requestAnimationFrame(updateTour)
    }
  }

  /**
   * Démarre la visite guidée
   */
  function startTour() {
    if (isTourActive) return

    console.log('🚀 Starting guided tour...')
    isTourActive = true
    currentWaypointIndex = 0
    isTransitioningToNext = false
    fadeOutTriggered = false // Réinitialiser le flag de fondu

    // Position initiale du vaisseau (hors champ)
    const spacecraft = spacecraftRef.current
    const camera = cameraRef.current

    if (spacecraft && camera) {
      spacecraft.position.set(0, 0, -20)
      spacecraft.visible = true
      
      // Initialiser les quaternions de rotation
      currentRotationQuaternion.copy(spacecraft.quaternion)
      targetRotationQuaternion.copy(spacecraft.quaternion)
      
      // Activer la traînée de fumée
      if (spacecraft.userData && spacecraft.userData.smokeTrail) {
        spacecraft.userData.smokeTrail.visible = true
      }
      
      spacecraftStartPos.copy(spacecraft.position)
      cameraStartPos.copy(camera.position)
      startWaypointTransition()
    } else {
      console.warn('⚠️ Spacecraft or camera not available, tour cannot start')
    }
  }

  /**
   * Arrête la visite guidée
   */
  function stopTour() {
    if (!isTourActive) return

    console.log('✅ Guided tour completed')
    isTourActive = false
    isTransitioningToNext = false
    fadeOutTriggered = false // Réinitialiser le flag de fondu
    
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    // Cacher le vaisseau et sa traînée
    if (spacecraftRef.current) {
      spacecraftRef.current.visible = false
      if (spacecraftRef.current.userData && spacecraftRef.current.userData.smokeTrail) {
        spacecraftRef.current.userData.smokeTrail.visible = false
      }
    }

    // Callback de fin de visite
    if (onTourComplete) {
      onTourComplete()
    }
  }

  /**
   * Interrompt la visite guidée
   */
  function interruptTour() {
    stopTour()
  }

  return {
    startTour,
    stopTour,
    interruptTour,
    isActive: () => isTourActive,
    getCurrentWaypoint: () => currentWaypointIndex < waypoints.length ? waypoints[currentWaypointIndex] : null
  }
}

