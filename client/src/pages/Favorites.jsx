import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AdCard from '../components/AdCard'
import { useAuth } from '../AuthContext'
import { api } from '../api'

function Favorites() {
  const { user, loading: authLoading } = useAuth()
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api('/favorites')
      .then(setAds)
      .finally(() => setLoading(false))
  }, [user])

  if (authLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  function removeFromList(adId, isFavorite) {
    if (!isFavorite) {
      setAds(ads.filter((ad) => ad.id !== adId))
    }
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">
        <i className="bi bi-star-fill text-warning"></i> My favorite ads
      </h1>

      {!loading && ads.length === 0 && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-star display-4 d-block mb-3"></i>
          You have no favorite ads yet. Click the star on any ad to save it here.
          <div className="mt-3">
            <Link to="/" className="btn btn-primary">
              Browse ads
            </Link>
          </div>
        </div>
      )}

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
        {ads.map((ad) => (
          <AdCard
            key={ad.id}
            ad={ad}
            onFavoriteChange={(isFavorite) => removeFromList(ad.id, isFavorite)}
          />
        ))}
      </div>
    </div>
  )
}

export default Favorites