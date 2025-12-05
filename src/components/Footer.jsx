import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faBolt, faCube, faGlobe, faEnvelope, faHeart, faMouse } from '@fortawesome/free-solid-svg-icons'
import { faReact, faJsSquare, faCss3Alt, faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons'
import '../styles/Footer.css'
import logo from '../assets/logo.png'

function Footer({ isLoaded }) {
  return (
    <footer className={`footer ${isLoaded ? 'loaded' : ''}`}>
      <div className="footer-content">
        <div className="footer-section">
          <h3>
            <FontAwesomeIcon icon={faInfoCircle} className="icon" />
            About
          </h3>
          <p className="section-description">
            An immersive 3D web experience exploring the possibilities of parallax effects. 
            Move your mouse to discover dynamic depth where each movement creates 
            a unique interaction with geometric objects.
          </p>
          
        </div>

        <div className="footer-section">
          <h3>
            <FontAwesomeIcon icon={faBolt} className="icon" />
            Technologies
          </h3>
          <div className="skills-grid">
            <div className="skill-item">
              <FontAwesomeIcon icon={faReact} className="skill-icon" />
              <span>React</span>
            </div>
            <div className="skill-item">
              <FontAwesomeIcon icon={faJsSquare} className="skill-icon" />
              <span>JavaScript</span>
            </div>
            <div className="skill-item">
              <FontAwesomeIcon icon={faCube} className="skill-icon" />
              <span>Three.js</span>
            </div>
            <div className="skill-item">
              <FontAwesomeIcon icon={faCss3Alt} className="skill-icon" />
              <span>CSS3</span>
            </div>
            <div className="skill-item">
              <FontAwesomeIcon icon={faBolt} className="skill-icon" />
              <span>Vite</span>
            </div>
            <div className="skill-item">
              <FontAwesomeIcon icon={faGlobe} className="skill-icon" />
              <span>WebGL</span>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <h3>
            <FontAwesomeIcon icon={faEnvelope} className="icon" />
            Contact
          </h3>
          <div className="contact-info">
            <div className="contact-item">
              <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
              <span>
                <a href="mailto:mezatioange@gmail.com">mezatioange@gmail.com</a>
              </span>
            </div>
            <div className="contact-item">
              <FontAwesomeIcon icon={faLinkedin} className="contact-icon" />
              <span>
                <a href="https://www.linkedin.com/in/ange-mezatio/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </span>
            </div>
            <div className="contact-item">
              <FontAwesomeIcon icon={faGithub} className="contact-icon" />
              <span>
                <a href="https://github.com/Mezes131" target="_blank" rel="noopener noreferrer">GitHub</a>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-line"></div>
        <p className="footer-heart">
          <FontAwesomeIcon icon={faHeart} className="heart-icon" />
          Developed by <img src={logo} alt="Logo" className="logo-img" />
        </p>
        <p className="copyright">
          © {new Date().getFullYear()} Mezes131. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer

