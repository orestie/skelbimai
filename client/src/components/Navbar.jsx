import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { ADMIN_URL } from '../api'

function Navbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const close = () => setOpen(false)

  async function handleLogout() {
    await logout()
    close()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/" onClick={close}>
          <i className="bi bi-megaphone-fill"></i> Skelbimai
        </Link>

        <button className="navbar-toggler" type="button" onClick={() => setOpen(!open)}>
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end onClick={close}>
                All ads
              </NavLink>
            </li>
            {user && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/favorites" onClick={close}>
                  <i className="bi bi-star-fill"></i> Favorites
                </NavLink>
              </li>
            )}
          </ul>

          <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center py-2 py-md-0">
            {user ? (
              <>
                <span className="text-white me-md-2">
                  <i className="bi bi-person-circle"></i> {user.username}
                </span>
                <a className="btn btn-light btn-sm" href={ADMIN_URL}>
                  <i className="bi bi-speedometer2"></i> My account
                </a>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-light btn-sm" to="/login" onClick={close}>
                  Login
                </Link>
                <Link className="btn btn-light btn-sm" to="/register" onClick={close}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar