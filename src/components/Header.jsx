import '../styles/Header.css'

function Header({ isLoaded }) {
  return (
    <header className={`header ${isLoaded ? 'loaded' : ''}`}>
      <div className="header-content">
        <h1 className="title">PARALLAX EXPERIENCE</h1>
        <p className="subtitle">Move your mouse to explore</p>
      </div>
    </header>
  )
}

export default Header

