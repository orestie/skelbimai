import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdCard from '../components/AdCard'
import { useAuth } from '../AuthContext'
import { api } from '../api'

function Home() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const q = searchParams.get('q') || ''

  const [categories, setCategories] = useState([])
  const [ads, setAds] = useState([])
  const [searchText, setSearchText] = useState(q)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/categories').then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (q) params.set('q', q)

    setLoading(true)
    setError('')
    api(`/ads?${params}`)
      .then(setAds)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
      }, [category, q, user])

  function updateFilters(newCategory, newQ) {
    const params = {}
    if (newCategory) params.category = newCategory
    if (newQ.trim()) params.q = newQ.trim()
    setSearchParams(params)
  }

  function handleSubmit(event) {
    event.preventDefault()
    updateFilters(category, searchText)
  }

  function clearFilters() {
    setSearchText('')
    setSearchParams({})
  }

  return (
    <>
      <div className="search-hero py-4 mb-4">
        <div className="container">
          <h1 className="h3 text-white mb-3">Find what you need</h1>
          <form className="row g-2" onSubmit={handleSubmit}>
            <div className="col-12 col-md-6">
              <input
                type="search"
                className="form-control form-control-lg"
                placeholder="Search by word or phrase..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>
            <div className="col-8 col-md-4">
              <select
                className="form-select form-select-lg"
                value={category}
                onChange={(event) => updateFilters(event.target.value, searchText)}
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-4 col-md-2 d-grid">
              <button type="submit" className="btn btn-warning btn-lg">
                <i className="bi bi-search"></i>
                <span className="d-none d-lg-inline"> Search</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container pb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted">
            {loading ? 'Loading...' : `${ads.length} ad${ads.length === 1 ? '' : 's'} found`}
          </span>
          {(category || q) && (
            <button className="btn btn-link btn-sm" onClick={clearFilters}>
              <i className="bi bi-x-circle"></i> Clear filters
            </button>
          )}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && ads.length === 0 && !error && (
          <div className="text-center text-muted py-5">
            <i className="bi bi-search display-4 d-block mb-3"></i>
            No ads match your search.
          </div>
        )}

        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      </div>
    </>
  )
}

export default Home