import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft, 
  faChevronRight, 
  faExpand, 
  faCompress,
  faGamepad,
  faChartLine,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons'
import '../styles/SidePanel.css'

const SidePanel = ({ 
  children, 
  isExpanded, 
  onToggle, 
  onFullscreen,
  isFullscreen 
}) => {
  const [activeTab, setActiveTab] = useState('controls')

  const tabs = [
    { id: 'controls', label: 'Controls', icon: faGamepad },
    { id: 'info', label: 'Info', icon: faChartLine },
    { id: 'help', label: 'Help', icon: faQuestionCircle }
  ]

  return (
    <div className={`side-panel ${isExpanded ? 'expanded' : ''} ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Buttons container on the edge */}
      <div className="side-panel-buttons">
        {/* Main toggle button */}
        <button 
          className="side-panel-toggle"
          onClick={onToggle}
          title={isExpanded ? 'Close Panel' : 'Open Panel'}
        >
          <span className="toggle-icon">
            <FontAwesomeIcon icon={isExpanded ? faChevronLeft : faChevronRight} />
          </span>
        </button>

        {/* Fullscreen button */}
        <button 
          className="side-panel-toggle"
          onClick={onFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          <span className="fullscreen-icon">
            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
          </span>
        </button>
      </div>

      {/* Panel content */}
      <div className="side-panel-content">
        {/* Tabs */}
        <div className="side-panel-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <FontAwesomeIcon icon={tab.icon} />
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="tab-content">
          {activeTab === 'controls' && (
            <div className="tab-panel">
              <h3>
                <FontAwesomeIcon icon={faGamepad} />
                Controls
              </h3>
              {children?.controls || <p>Control settings will appear here.</p>}
            </div>
          )}
          
          {activeTab === 'info' && (
            <div className="tab-panel">
              <h3>
                <FontAwesomeIcon icon={faChartLine} />
                Information
              </h3>
              {children?.info || <p>Project information will appear here.</p>}
            </div>
          )}
          
          {activeTab === 'help' && (
            <div className="tab-panel">
              <h3>
                <FontAwesomeIcon icon={faQuestionCircle} />
                Help
              </h3>
              <div className="help-content">
                <h4>Navigation</h4>
                <ul>
                  <li><strong>Mouse Movement</strong> : Control parallax effect</li>
                  <li><strong>Fullscreen Mode</strong> : Click the expand button for immersive experience</li>
                </ul>
                
                <h4>Parallax Effect</h4>
                <ul>
                  <li>Move your mouse to see objects react dynamically</li>
                  <li>Different layers move at different speeds creating depth</li>
                  <li>Objects rotate and respond to your cursor position</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SidePanel

