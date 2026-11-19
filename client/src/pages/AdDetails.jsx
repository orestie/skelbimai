import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import FavoriteButton from '../components/FavoriteButton'
import { useAuth } from '../AuthContext'
import { api, formatDate, formatPrice } from '../api'

function AdDetails() {
  const { id } = useParams()
  const { user } = useAuth()

  const [ad, setAd] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setLoading(true)
    api(`/ads/${id}`)
      .then(setAd)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, user])

  async function handleComment(event) {
    event.preventDefault()
    setCommentError('')
    setSending(true)

    try {
      const comment = await api(`/ads/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentText }),
      })
      setAd({ ...ad, comments: [...ad.comments, comment] })
      setCommentText('')
    } catch (err) {
      setCommentError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="container py-5 text-center text-muted">Loading...</div>
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">{error}</div>
        <Link to="/" className="btn btn-primary">
          Back to all ads
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <Link to="/" className="btn btn-link px-0 mb-3">
        <i className="bi bi-arrow-left"></i> Back to all ads
      </Link>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card shadow-sm overflow-hidden">
            <img src={ad.image_url} alt={ad.title} className="ad-details-img" />
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <span className="badge bg-secondary mb-2">{ad.category_name}</span>
                  <h1 className="h3">{ad.title}</h1>
                </div>
                <FavoriteButton key={`${ad.id}-${ad.is_favorite}`} adId={ad.id} initialValue={ad.is_favorite} />
              </div>
              <p className="display-6 fw-bold text-primary">{formatPrice(ad.price)}</p>
              <p className="mb-4" style={{ whiteSpace: 'pre-line' }}>
                {ad.description}
              </p>
              <div className="small text-muted d-flex justify-content-between border-top pt-3">
                <span>
                  <i className="bi bi-person"></i> {ad.author}
                </span>
                <span>
                  <i className="bi bi-calendar"></i> {formatDate(ad.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-4">
        <div className="card-body p-4">
          <h2 className="h5 mb-3">
            <i className="bi bi-chat-dots"></i> Comments ({ad.comments.length})
          </h2>

          {ad.comments.length === 0 && (
            <p className="text-muted">No comments yet. Ask the seller a question!</p>
          )}

          <ul className="list-unstyled">
            {ad.comments.map((comment) => (
              <li key={comment.id} className="border-bottom py-3">
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <strong className="text-body">
                    <i className="bi bi-person-circle"></i> {comment.author}
                  </strong>
                  <span>{formatDate(comment.created_at)}</span>
                </div>
                <div style={{ whiteSpace: 'pre-line' }}>{comment.text}</div>
              </li>
            ))}
          </ul>

          {user ? (
            <form onSubmit={handleComment} className="mt-3">
              {commentError && <div className="alert alert-danger py-2">{commentError}</div>}
              <textarea
                className="form-control mb-2"
                rows="3"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                maxLength={500}
                required
              ></textarea>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                <i className="bi bi-send"></i> {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          ) : (
            <div className="alert alert-light border mt-3 mb-0">
              <Link to="/login" state={{ from: `/ads/${id}` }}>Log in</Link> or{' '}
              <Link to="/register">register</Link> to write a comment.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdDetails