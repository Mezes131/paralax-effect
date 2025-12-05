import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons'
import '../styles/NavBar.css'
import logo from '../assets/logo.png'

function NavBar({ isLoaded }) {
  return (
    <nav className={`navbar ${isLoaded ? 'loaded' : ''}`}>
      <div className="navbar-content">
        <div className="navbar-left">
            <h1 className="navbar-title">PARALLAX EXPERIENCE</h1>
            <p className="navbar-autor">
                Developed by <img src={logo} alt="Logo" className="logo-img" />
            </p>
        </div>
        <div className="navbar-right">
          <span className="follow-text">Follow me</span>
          <a 
            href="https://www.linkedin.com/in/ange-mezatio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link linkedin-link"
            title="Follow on LinkedIn"
          >
            <FontAwesomeIcon icon={faLinkedin} />
          </a>
          <a 
            href="https://github.com/Mezes131" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link github-link"
            title="Follow on GitHub"
          >
            <FontAwesomeIcon icon={faGithub} />
          </a>
        </div>
      </div>
    </nav>
  )
}

export default NavBar

