import { useEffect, useState } from 'react'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5173').replace(/\/+$/, '')

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function App() {
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError] = useState('')
  const [cart, setCart] = useState({})
  const [lastOrder, setLastOrder] = useState(null)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const [orderError, setOrderError] = useState(false)
  const [introActive, setIntroActive] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadMenu() {
      try {
        const response = await fetch(`${API_URL}/api/menu`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Menu request failed')
        }

        const items = await response.json()
        if (!Array.isArray(items)) {
          throw new Error('Menu response was not an array')
        }

        setMenuItems(items)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMenuError('The menu is unavailable right now. Please try again soon.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setMenuLoading(false)
        }
      }
    }

    loadMenu()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!introActive) {
      return undefined
    }

    const introTimeout = window.setTimeout(() => setIntroActive(false), 3300)
    return () => window.clearTimeout(introTimeout)
  }, [introActive])

  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const cartTotal = menuItems.reduce(
    (sum, item) => sum + item.price * (cart[item.id] || 0),
    0,
  )
  const cartItems = menuItems.filter((item) => cart[item.id])

  function updateQuantity(itemId, change) {
    setCart((currentCart) => {
      const nextQuantity = (currentCart[itemId] || 0) + change
      const nextCart = { ...currentCart }

      if (nextQuantity <= 0) {
        delete nextCart[itemId]
      } else {
        nextCart[itemId] = nextQuantity
      }

      return nextCart
    })
  }

  async function placeOrder() {
    if (!cartCount || isSubmittingOrder) return

    setIsSubmittingOrder(true)
    setOrderMessage('')
    setOrderError(false)

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.entries(cart).map(([menu_item_id, quantity]) => ({
            menu_item_id,
            quantity,
          })),
        }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || 'Unable to place your order right now.')
      }

      setLastOrder({
        count: cartCount,
        total: result.total ?? cartTotal,
        placedAt: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
      })
      setCart({})
      setOrderMessage('Order saved successfully.')
    } catch (error) {
      setOrderError(true)
      setOrderMessage(error.message || 'Unable to place your order right now.')
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  return (
    <div className="app-shell">
      {introActive && (
        <div className="intro-overlay" aria-label="CampusEats animated introduction">
          <div className="intro-copy">
            <a className="intro-brand" href="#home" onClick={() => setIntroActive(false)}>
              <span className="brand-mark">C</span> CampusEats <span>🍔</span>
            </a>
            <p className="intro-kicker">FRESH FROM THE CAMPUS KITCHEN</p>
            <h1>Good food<br />is on the move.</h1>
            <p className="intro-subtitle">Your next study break starts here.</p>
          </div>
          <div className="intro-stage" aria-hidden="true">
            <div className="intro-table" />
            <div className="intro-burger">
              <img
                src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=90"
                alt=""
              />
            </div>
            <div className="intro-soda"><span>SODA</span><i>ICE COLD</i></div>
            <span className="intro-spark intro-spark-one">✳</span>
            <span className="intro-spark intro-spark-two">✦</span>
          </div>
          <button className="intro-skip" type="button" onClick={() => setIntroActive(false)}>
            Skip intro <span aria-hidden="true">↗</span>
          </button>
          <span className="intro-progress" aria-hidden="true" />
        </div>
      )}
      <header className="site-header">
        <a className="brand" href="#home" aria-label="CampusEats home">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>CampusEats <span className="brand-emoji">🍔</span></span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#home">Home</a>
          <a className="nav-link" href="#menu">Menu</a>
          <a className="nav-link" href="#orders">Orders</a>
        </nav>

        <a className="header-cart" href="#cart" aria-label={`Cart, ${cartCount} items`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.4L22 8H6" />
            <circle cx="10" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
          <span>Cart</span>
          <span className="cart-count">{cartCount}</span>
        </a>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> GOOD FOOD, RIGHT ON CAMPUS</p>
            <h1>Big flavor.<br /><span>Between classes.</span></h1>
            <p className="hero-description">
              Delicious campus meals delivered right to your dorm or lecture hall.
              Your next favorite is just a few taps away.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#menu">
                Explore the menu <span aria-hidden="true">↗</span>
              </a>
              <div className="delivery-note">
                <span className="delivery-icon" aria-hidden="true">⌁</span>
                <span><strong>15–25 min</strong><small>campus delivery</small></span>
              </div>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>J</span><span>M</span><span>A</span>
              </div>
              <p><strong>4.9 / 5</strong><span>loved by hungry students</span></p>
            </div>
          </div>

          <div className="hero-visual" aria-label="Fresh campus meal">
            <div className="hero-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=90"
                alt="Fresh cheeseburger with crisp lettuce and tomato"
              />
            </div>
            <div className="floating-note floating-note-top">
              <span className="floating-icon">✦</span>
              <span><strong>Made fresh</strong><small>never sits around</small></span>
            </div>
            <div className="floating-note floating-note-bottom">
              <span className="status-pulse" />
              <span><strong>Open now</strong><small>Campus kitchen</small></span>
            </div>
            <span className="hero-stamp" aria-hidden="true">GOOD<br />MOOD<br /><b>FOOD</b></span>
          </div>
          <div className="hero-bottom-line"><span>01</span><span>FRESH FROM THE CAMPUS KITCHEN</span><span>SCROLL TO EAT ↓</span></div>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE GOOD STUFF</p>
              <h2>A little something<br className="mobile-break" /> for every craving.</h2>
            </div>
            <p className="section-aside">Cooked with care. Delivered with a smile.<br />Pick your fuel for the day.</p>
          </div>

          <div className="menu-grid" aria-live="polite">
            {menuLoading ? (
              <p className="menu-message" role="status">Loading today’s menu…</p>
            ) : menuError ? (
              <p className="menu-message menu-message-error" role="alert">{menuError}</p>
            ) : menuItems.length === 0 ? (
              <p className="menu-message" role="status">There are no menu items available right now.</p>
            ) : (
              menuItems.map((item, index) => (
                <article className="menu-card" key={item.id} style={{ '--card-index': index }}>
                  <div className="food-image-wrap">
                    <img className="food-image" src={item.image} alt={item.image_alt || item.imageAlt || item.name} />
                    <span className="food-category">{item.category}</span>
                    <span className="food-number">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="food-info">
                    <div className="food-title-row">
                      <h3>{item.name}</h3>
                      <span className="food-price">{money.format(item.price)}</span>
                    </div>
                    <p>{item.description}</p>
                    <button className="add-button" type="button" onClick={() => updateQuantity(item.id, 1)}>
                      <span aria-hidden="true">+</span> Add to cart
                      {cart[item.id] > 0 && <span className="added-count">{cart[item.id]} in cart</span>}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="bottom-section">
          <div className="orders-panel" id="orders">
            <p className="eyebrow">YOUR ORDERS</p>
            <h2>{lastOrder ? 'On its way to your history.' : 'Good things are in the works.'}</h2>
            {lastOrder ? (
              <p className="order-message">
                Order placed at {lastOrder.placedAt} · {lastOrder.count} {lastOrder.count === 1 ? 'item' : 'items'} · {money.format(lastOrder.total)}
              </p>
            ) : (
              <p className="order-message">Place your first order and it’ll show up here.</p>
            )}
            <span className="orders-mark" aria-hidden="true">✳</span>
          </div>

          <aside className="cart-panel" id="cart" aria-live="polite">
            <div className="cart-panel-heading">
              <div>
                <p className="eyebrow">THE GOODIES</p>
                <h2>Your cart <span>({cartCount})</span></h2>
              </div>
              <span className="cart-bag" aria-hidden="true">⌑</span>
            </div>
            {cartItems.length ? (
              <ul className="cart-items">
                {cartItems.map((item) => (
                  <li className="cart-item" key={item.id}>
                    <img src={item.image} alt="" />
                    <div className="cart-item-details">
                      <strong>{item.name}</strong>
                      <span>{money.format(item.price)} each</span>
                    </div>
                    <div className="quantity-control" aria-label={`${item.name} quantity`}>
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button>
                      <span>{cart[item.id]}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-cart">Your cart is taking a little study break. Add a bite to get started.</p>
            )}
            <div className="cart-total-row"><span>Total</span><strong>{money.format(cartTotal)}</strong></div>
            <button className="button button-primary checkout-button" type="button" onClick={placeOrder} disabled={!cartCount || isSubmittingOrder}>
              {isSubmittingOrder ? 'Saving order…' : 'Place order'} <span aria-hidden="true">↗</span>
            </button>
            <p className={`checkout-note${orderError ? ' checkout-note-error' : ''}`} aria-live="polite">
              {orderMessage || 'No hidden fees. Just really good food.'}
            </p>
          </aside>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home"><span className="brand-mark" aria-hidden="true">C</span><span>CampusEats <span className="brand-emoji">🍔</span></span></a>
        <p>Made for campus life. Served with extra good vibes.</p>
        <a href="#home">Back to top ↑</a>
      </footer>
    </div>
  )
}

export default App