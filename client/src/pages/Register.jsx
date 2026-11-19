import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '', passwordConfirm: '' })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      setError('Passwords do not match.')
      return
    }

    setSending(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-sm-10 col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="h4 text-center mb-4">Create an account</h1>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    className="form-control"
                    value={form.username}
                    onChange={handleChange}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                  <div className="form-text">At least 6 characters.</div>
                </div>
                <div className="mb-3">
                  <label htmlFor="passwordConfirm" className="form-label">
                    Repeat password
                  </label>
                  <input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    className="form-control"
                    value={form.passwordConfirm}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
                <button type="submit" className="btn btn-success w-100" disabled={sending}>
                  {sending ? 'Creating...' : 'Register'}
                </button>
              </form>

              <p className="text-center mt-3 mb-0">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register