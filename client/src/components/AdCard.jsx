import { Link } from 'react-router-dom'
import FavoriteButton from './FavoriteButton'
import { formatDate, formatPrice } from '../api'

function AdCard({ ad, onFavoriteChange }) {
  return (
    <div className="col">
      <Link to={`/ads/${ad.id}`} className="card h-100 shadow-sm text-decoration-none ad-card">
        <div className="position-relative">
          <img src={ad.image_url} className="card-img-top ad-card-img" alt={ad.title} />
          <div className="position-absolute top-0 end-0 m-2">
            <FavoriteButton
              key={`${ad.id}-${ad.is_favorite}`}
              adId={ad.id}
              initialValue={ad.is_favorite}
              onChange={onFavoriteChange}
              size="btn-sm"
            />
          </div>
        </div>
        <div className="card-body d-flex flex-column">
          <span className="badge bg-secondary align-self-start mb-2">{ad.category_name}</span>
          <h2 className="h6 card-title text-body">{ad.title}</h2>
          <p className="fs-5 fw-bold text-primary mb-2">{formatPrice(ad.price)}</p>
          <div className="mt-auto small text-muted d-flex justify-content-between">
            <span>
              <i className="bi bi-person"></i> {ad.author}
            </span>
            <span>
              <i className="bi bi-chat"></i> {ad.comment_count} · {formatDate(ad.created_at)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default AdCard