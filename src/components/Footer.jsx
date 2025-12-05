import '../styles/Footer.css'

function Footer({ isLoaded }) {
  return (
    <footer className={`footer ${isLoaded ? 'loaded' : ''}`}>
      <div className="footer-content">
        <div className="instructions">
          <p>Compositions Awwwards : Portal • Cristaux • Galaxy • Abstract</p>
          <p>Wireframe + Solid • Nested Geometry • Orbites • Matériaux Premium</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

