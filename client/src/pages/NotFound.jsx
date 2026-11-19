import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="container py-5 text-center">
      <h1 className="display-4">404</h1>
      <p className="lead">This page does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to all ads
      </Link>
    </div>
  )
}

export default NotFound