export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'same-origin',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data.errors ? data.errors.join(' ') : data.error || 'Something went wrong.'
    throw new Error(message)
  }

  return data
}

export const ADMIN_URL = import.meta.env.DEV ? 'http://localhost:3000/admin' : '/admin'

export function formatPrice(price) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(price)
}

export function formatDate(sqlDate) {
  return new Date(sqlDate.replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}