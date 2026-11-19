import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { api } from '../api'

function FavoriteButton({ adId, initialValue, onChange, size = '' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isFavorite, setIsFavorite] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  async function toggle(event) {
    event.preventDefault()
    event.stopPropagation()

    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }

    setSaving(true)
    try {
      const data = await api(`/favorites/${adId}`, { method: isFavorite ? 'DELETE' : 'POST' })
      setIsFavorite(data.is_favorite)
      if (onChange) onChange(data.is_favorite)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-light favorite-btn ${size}`}
      onClick={toggle}
      disabled={saving}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <i className={`bi ${isFavorite ? 'bi-star-fill text-warning' : 'bi-star'}`}></i>
    </button>
  )
}

export default FavoriteButton