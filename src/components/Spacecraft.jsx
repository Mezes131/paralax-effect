import * as THREE from 'three'

/**
 * Crée un système de traînée de fumée pour le vaisseau
 */
function createSmokeTrail(scene, objectsRef) {
  const particleCount = 100
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const baseColors = new Float32Array(particleCount * 3) // Couleurs de base pour l'opacité
  const sizes = new Float32Array(particleCount)
  const lifetimes = new Float32Array(particleCount)
  const velocities = new Float32Array(particleCount * 3)
  
  // Initialiser toutes les particules comme inactives
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    positions[i3] = 0
    positions[i3 + 1] = 0
    positions[i3 + 2] = 0
    colors[i3] = 0.3
    colors[i3 + 1] = 0.3
    colors[i3 + 2] = 0.4
    sizes[i] = 0
    lifetimes[i] = 0
    velocities[i3] = 0
    velocities[i3 + 1] = 0
    velocities[i3 + 2] = 0
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  
  const material = new THREE.PointsMaterial({
    size: 0.5,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  const particles = new THREE.Points(geometry, material)
  particles.userData = {
    type: 'smoke-trail',
    particleCount,
    lifetimes,
    velocities,
    baseColors,
    lastEmitTime: 0,
    emitInterval: 50 // Émettre une particule toutes les 50ms
  }
  
  scene.add(particles)
  objectsRef.current.push(particles)
  
  return particles
}

export function createSpacecraft(scene, objectsRef) {
  if (!scene || !objectsRef) {
    console.error('❌ createSpacecraft: scene and objectsRef are required')
    return null
  }

  try {
    const spacecraftGroup = new THREE.Group()
    spacecraftGroup.userData = { type: 'spacecraft', speed: 0 }
    
    // Créer la traînée de fumée
    const smokeTrail = createSmokeTrail(scene, objectsRef)
    if (smokeTrail) {
      spacecraftGroup.userData.smokeTrail = smokeTrail
    }
    
    // Corps principal du vaisseau - forme fuselée pointant vers l'avant (Z+)
    // Section avant (nez pointu)
    const noseGeometry = new THREE.ConeGeometry(0.15, 0.4, 12, 1)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a9eff,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0x0066ff,
      emissiveIntensity: 0.3
    })
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial)
    nose.rotation.y = Math.PI
    nose.position.set(0, 0, 0.7)
    nose.userData = { type: 'craft-nose', speed: 0, originalPosition: [0, 0, 0.7] }
    spacecraftGroup.add(nose)
    objectsRef.current.push(nose)
    
    // Section centrale (cylindre principal)
    const mainBodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 16)
    const mainBody = new THREE.Mesh(mainBodyGeometry, bodyMaterial)
    mainBody.position.set(0, 0, 0.1)
    mainBody.userData = { type: 'craft-body', speed: 0, originalPosition: [0, 0, 0.1] }
    spacecraftGroup.add(mainBody)
    objectsRef.current.push(mainBody)
    
    // Section arrière (élargie pour les propulseurs)
    const rearBodyGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.4, 16)
    const rearBody = new THREE.Mesh(rearBodyGeometry, bodyMaterial)
    rearBody.position.set(0, 0, -0.3)
    rearBody.userData = { type: 'craft-rear', speed: 0, originalPosition: [0, 0, -0.3] }
    spacecraftGroup.add(rearBody)
    objectsRef.current.push(rearBody)
    
    // Bandes décoratives sur le corps principal
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066cc,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0044aa,
      emissiveIntensity: 0.5
    })
    
    const band1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.02, 8, 16),
      bandMaterial
    )
    band1.rotation.x = Math.PI / 2
    band1.position.set(0, 0, 0.3)
    spacecraftGroup.add(band1)
    objectsRef.current.push(band1)
    
    const band2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.02, 8, 16),
      bandMaterial
    )
    band2.rotation.x = Math.PI / 2
    band2.position.set(0, 0, -0.1)
    spacecraftGroup.add(band2)
    objectsRef.current.push(band2)
    
    // Panneaux solaires sur les côtés
    const solarPanelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.3,
      roughness: 0.7,
      emissive: 0x0066ff,
      emissiveIntensity: 0.1
    })
    
    const solarPanelGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.02)
    const leftSolarPanel = new THREE.Mesh(solarPanelGeometry, solarPanelMaterial)
    leftSolarPanel.position.set(-0.35, 0, 0.2)
    leftSolarPanel.rotation.z = -0.2
    leftSolarPanel.userData = { type: 'craft-solar', speed: 0, originalPosition: [-0.35, 0, 0.2] }
    spacecraftGroup.add(leftSolarPanel)
    objectsRef.current.push(leftSolarPanel)
    
    const rightSolarPanel = new THREE.Mesh(solarPanelGeometry, solarPanelMaterial)
    rightSolarPanel.position.set(0.35, 0, 0.2)
    rightSolarPanel.rotation.z = 0.2
    rightSolarPanel.userData = { type: 'craft-solar', speed: 0, originalPosition: [0.35, 0, 0.2] }
    spacecraftGroup.add(rightSolarPanel)
    objectsRef.current.push(rightSolarPanel)
    
    // Cellules solaires (petits carrés brillants) - orientation corrigée pour éviter le carré blanc
    const cellMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066ff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x00aaff,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide // Rendre les deux faces visibles pour éviter les problèmes d'orientation
    })
    const cellGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.01)
    
    for (let i = 0; i < 3; i++) {
      const cell1 = new THREE.Mesh(cellGeometry, cellMaterial)
      cell1.position.set(-0.35, -0.1 + i * 0.1, 0.21)
      cell1.rotation.y = Math.PI / 2 // Rotation pour éviter qu'elle soit vue de face
      spacecraftGroup.add(cell1)
      objectsRef.current.push(cell1)
      
      const cell2 = new THREE.Mesh(cellGeometry.clone(), cellMaterial.clone())
      cell2.position.set(0.35, -0.1 + i * 0.1, 0.21)
      cell2.rotation.y = Math.PI / 2 // Rotation pour éviter qu'elle soit vue de face
      spacecraftGroup.add(cell2)
      objectsRef.current.push(cell2)
    }
    
    // Ailes latérales - design amélioré avec forme triangulaire
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066cc,
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0x0044aa,
      emissiveIntensity: 0.4
    })
    
    // Aile gauche - forme triangulaire plus aérodynamique (utiliser BoxGeometry avec scale)
    const leftWingGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.08)
    const leftWing = new THREE.Mesh(leftWingGeometry, wingMaterial)
    leftWing.rotation.z = -0.3 // Légère inclinaison vers le bas
    leftWing.rotation.y = Math.PI / 2 // Rotation pour éviter qu'elle soit vue de face
    leftWing.position.set(-0.4, 0, -0.15)
    leftWing.userData = { type: 'craft-wing', speed: 0, originalPosition: [-0.4, 0, -0.15] }
    spacecraftGroup.add(leftWing)
    objectsRef.current.push(leftWing)
    
    // Aile droite
    const rightWing = new THREE.Mesh(leftWingGeometry.clone(), wingMaterial)
    rightWing.rotation.z = 0.3 // Légère inclinaison vers le bas (symétrique)
    rightWing.rotation.y = Math.PI / 2 // Rotation pour éviter qu'elle soit vue de face
    rightWing.position.set(0.4, 0, -0.15)
    rightWing.userData = { type: 'craft-wing', speed: 0, originalPosition: [0.4, 0, -0.15] }
    spacecraftGroup.add(rightWing)
    objectsRef.current.push(rightWing)
    
    // Détails sur les ailes (bandes lumineuses) - orientation corrigée
    const wingDetailMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0088ff,
      emissiveIntensity: 0.8
    })
    const wingDetailGeometry = new THREE.BoxGeometry(0.4, 0.02, 0.1)
    
    const leftWingDetail = new THREE.Mesh(wingDetailGeometry, wingDetailMaterial)
    leftWingDetail.rotation.z = -0.3
    leftWingDetail.rotation.y = Math.PI / 2 // Rotation pour éviter qu'elle soit vue de face
    leftWingDetail.position.set(-0.4, 0.1, -0.15)
    spacecraftGroup.add(leftWingDetail)
    objectsRef.current.push(leftWingDetail)
    
    const rightWingDetail = new THREE.Mesh(wingDetailGeometry.clone(), wingDetailMaterial)
    rightWingDetail.rotation.z = 0.3
    rightWingDetail.rotation.y = Math.PI / 2 // Rotation pour éviter qu'elle soit vue de face
    rightWingDetail.position.set(0.4, 0.1, -0.15)
    spacecraftGroup.add(rightWingDetail)
    objectsRef.current.push(rightWingDetail)
    
    // Stabilisateurs verticaux
    const stabilizerGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.15)
    const stabilizerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0055aa,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x003388,
      emissiveIntensity: 0.3
    })
    
    const topStabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial)
    topStabilizer.position.set(0, 0.35, -0.2)
    topStabilizer.userData = { type: 'craft-stabilizer', speed: 0, originalPosition: [0, 0.35, -0.2] }
    spacecraftGroup.add(topStabilizer)
    objectsRef.current.push(topStabilizer)
    
    const bottomStabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial)
    bottomStabilizer.position.set(0, -0.35, -0.2)
    bottomStabilizer.userData = { type: 'craft-stabilizer', speed: 0, originalPosition: [0, -0.35, -0.2] }
    spacecraftGroup.add(bottomStabilizer)
    objectsRef.current.push(bottomStabilizer)
    
    // Propulseurs arrière améliorés - avec anneaux et design plus complexe
    const thrusterBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.1
    })
    
    // Base du propulseur gauche
    const thrusterBaseGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16)
    const leftThrusterBase = new THREE.Mesh(thrusterBaseGeometry, thrusterBaseMaterial)
    leftThrusterBase.rotation.x = Math.PI / 2
    leftThrusterBase.position.set(-0.3, 0, -0.65)
    spacecraftGroup.add(leftThrusterBase)
    objectsRef.current.push(leftThrusterBase)
    
    // Anneau du propulseur gauche
    const thrusterRingGeometry = new THREE.TorusGeometry(0.12, 0.02, 8, 16)
    const thrusterRingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066ff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0044aa,
      emissiveIntensity: 0.5
    })
    const leftThrusterRing = new THREE.Mesh(thrusterRingGeometry, thrusterRingMaterial)
    leftThrusterRing.rotation.x = Math.PI / 2
    leftThrusterRing.position.set(-0.3, 0, -0.65)
    spacecraftGroup.add(leftThrusterRing)
    objectsRef.current.push(leftThrusterRing)
    
    // Cœur lumineux du propulseur gauche
    const thrusterCoreGeometry = new THREE.SphereGeometry(0.1, 16, 16)
    const thrusterCoreMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.5,
      metalness: 0.3,
      roughness: 0.2
    })
    const leftThruster = new THREE.Mesh(thrusterCoreGeometry, thrusterCoreMaterial)
    leftThruster.position.set(-0.3, 0, -0.65)
    leftThruster.userData = {
      type: 'craft-thruster',
      speed: 0,
      originalPosition: [-0.3, 0, -0.65]
    }
    spacecraftGroup.add(leftThruster)
    objectsRef.current.push(leftThruster)
    
    // Propulseur droit (même structure)
    const rightThrusterBase = new THREE.Mesh(thrusterBaseGeometry.clone(), thrusterBaseMaterial)
    rightThrusterBase.rotation.x = Math.PI / 2
    rightThrusterBase.position.set(0.3, 0, -0.65)
    spacecraftGroup.add(rightThrusterBase)
    objectsRef.current.push(rightThrusterBase)
    
    const rightThrusterRing = new THREE.Mesh(thrusterRingGeometry.clone(), thrusterRingMaterial)
    rightThrusterRing.rotation.x = Math.PI / 2
    rightThrusterRing.position.set(0.3, 0, -0.65)
    spacecraftGroup.add(rightThrusterRing)
    objectsRef.current.push(rightThrusterRing)
    
    const rightThruster = new THREE.Mesh(thrusterCoreGeometry.clone(), thrusterCoreMaterial)
    rightThruster.position.set(0.3, 0, -0.65)
    rightThruster.userData = {
      type: 'craft-thruster',
      speed: 0,
      originalPosition: [0.3, 0, -0.65]
    }
    spacecraftGroup.add(rightThruster)
    objectsRef.current.push(rightThruster)
    
    // Cockpit amélioré - avec structure en dôme
    const cockpitBaseGeometry = new THREE.CylinderGeometry(0.18, 0.2, 0.15, 16)
    const cockpitBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066cc,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0044aa,
      emissiveIntensity: 0.3
    })
    const cockpitBase = new THREE.Mesh(cockpitBaseGeometry, cockpitBaseMaterial)
    cockpitBase.position.set(0, 0, 0.55)
    spacecraftGroup.add(cockpitBase)
    objectsRef.current.push(cockpitBase)
    
    // Dôme du cockpit (sphère transparente)
    const cockpitGeometry = new THREE.SphereGeometry(0.2, 24, 24)
    const cockpitMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      opacity: 0.7,
      transparent: true,
      roughness: 0.05,
      metalness: 0.1,
      emissive: 0x00aaff,
      emissiveIntensity: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    })
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial)
    cockpit.position.set(0, 0, 0.65)
    cockpit.userData = {
      type: 'craft-cockpit',
      speed: 0,
      originalPosition: [0, 0, 0.65]
    }
    spacecraftGroup.add(cockpit)
    objectsRef.current.push(cockpit)
    
    // Antenne sur le cockpit
    const antennaGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 8)
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066ff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0044aa,
      emissiveIntensity: 0.6
    })
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial)
    antenna.rotation.x = Math.PI / 2
    antenna.position.set(0, 0.25, 0.7)
    spacecraftGroup.add(antenna)
    objectsRef.current.push(antenna)
    
    // Pointe de l'antenne
    const antennaTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      antennaMaterial
    )
    antennaTip.position.set(0, 0.32, 0.7)
    spacecraftGroup.add(antennaTip)
    objectsRef.current.push(antennaTip)
    
    // Lumières de navigation
    const navLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1.0
    })
    const navLightGeometry = new THREE.SphereGeometry(0.03, 8, 8)
    
    const leftNavLight = new THREE.Mesh(navLightGeometry, navLightMaterial)
    leftNavLight.position.set(-0.3, 0, 0.3)
    leftNavLight.userData = { type: 'craft-nav-light', speed: 0, originalPosition: [-0.3, 0, 0.3] }
    spacecraftGroup.add(leftNavLight)
    objectsRef.current.push(leftNavLight)
    
    const rightNavLight = new THREE.Mesh(navLightGeometry.clone(), navLightMaterial.clone())
    rightNavLight.material.color.setHex(0x00ff00)
    rightNavLight.material.emissive.setHex(0x00ff00)
    rightNavLight.position.set(0.3, 0, 0.3)
    rightNavLight.userData = { type: 'craft-nav-light', speed: 0, originalPosition: [0.3, 0, 0.3] }
    spacecraftGroup.add(rightNavLight)
    objectsRef.current.push(rightNavLight)
    
    // Position initiale du vaisseau (hors champ de vue)
    spacecraftGroup.position.set(0, 0, -20)
    spacecraftGroup.visible = false // Caché par défaut
    
    // Cacher la traînée par défaut
    if (smokeTrail) {
      smokeTrail.visible = false
    }
    
    scene.add(spacecraftGroup)
    
    return spacecraftGroup
  } catch (error) {
    console.error('❌ Error creating spacecraft:', error)
    return null
  }
}

