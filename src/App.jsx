import { useRef, useState } from 'react'
import './styles/App.css'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import SidePanel from './components/SidePanel'
import ThreeScene from './components/ThreeScene'

function App() {
  const threeSceneRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPanelExpanded, setIsPanelExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCanvasText, setShowCanvasText] = useState(true)
  const [isTourActive, setIsTourActive] = useState(false)
  const inactivityTimeoutRef = useRef(null)


  const handleTogglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded)
  }

  const handleToggleFullscreen = () => {
    const newFullscreen = !isFullscreen
    setIsFullscreen(newFullscreen)
    
    // Réinitialiser le timer d'inactivité lors du changement de mode
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }
    
    inactivityTimeoutRef.current = setTimeout(() => {
      setShowCanvasText(true)
    }, 2000)
    
    // Mettre à jour la taille du renderer via la ref
    if (threeSceneRef.current && threeSceneRef.current.updateSize) {
      threeSceneRef.current.updateSize(newFullscreen)
    }
  }

  return (
    <div className={`app-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isFullscreen && <NavBar isLoaded={isLoaded} />}
      
      <div className="canvas-wrapper">
        <div className={`canvas-container ${isFullscreen ? 'fullscreen' : ''}`}>
          <ThreeScene
            ref={threeSceneRef}
            isFullscreen={isFullscreen}
            onLoaded={setIsLoaded}
            onShowCanvasTextChange={setShowCanvasText}
            onTourStateChange={setIsTourActive}
          />
          <div className={`canvas-overlay ${isLoaded ? 'loaded' : ''} ${showCanvasText && !isTourActive ? 'visible' : 'hidden'}`}>
            <h1 className="canvas-title">PARALLAX EXPERIENCE</h1>
            <p className="canvas-subtitle">Move your mouse to explore</p>
          </div>
        </div>
      </div>

      {!isFullscreen && <Footer isLoaded={isLoaded} />}
      
      <SidePanel
        isExpanded={isPanelExpanded}
        onToggle={handleTogglePanel}
        onFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      >
        {{
          controls: (
            <div>
              <p>Adjust parallax intensity and animation speed here.</p>
              <p>This feature will be available soon...</p>
            </div>
          ),
          info: (
            <div>
              <p><strong>Parallax Experience</strong></p>
              <p>A 3D web experience showcasing dynamic parallax effects using React and Three.js.</p>
              <p>Move your mouse to interact with the scene.</p>
            </div>
          )
        }}
      </SidePanel>
    </div>
  )
}

export default App