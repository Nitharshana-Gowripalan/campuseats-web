import { useEffect, useState } from 'react'
import './App.css'

const menuItems = [
  {
    id: 1,
    name: 'Campus Burger',
    description: 'Smash-grilled beef, sharp cheddar, house sauce, soft potato bun.',
    price: 9.5,
    category: 'Student favorite',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Double cheeseburger with lettuce and tomato',
  },
  {
    id: 2,
    name: 'Chicken Submarine',
    description: 'Herb-roasted chicken, crunchy greens, pickled onion, garlic mayo.',
    price: 8.25,
    category: 'Made to order',
    image:
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Fresh chicken sandwich with greens',
  },
  {
    id: 3,
    name: 'Garden Pizza',
    description: 'Roasted peppers, basil, mozzarella, and a bright tomato base.',
    price: 11,
    category: 'Veggie pick',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Vegetable pizza topped with basil',
  },
  {
    id: 4,
    name: 'Iced Coffee',
    description: 'Slow-brewed coffee over ice, with your choice of oat or dairy milk.',
    price: 4.5,
    category: 'Study fuel',
    image:
      'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Iced coffee in a glass',
  },
]

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function App() {
  const [cart, setCart] = useState({})
  const [lastOrder, setLastOrder] = useState(null)
  const [introActive, setIntroActive] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

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

  function placeOrder() {
    if (!cartCount) return

    setLastOrder({
      count: cartCount,
      total: cartTotal,
      placedAt: new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      }),
    })
    setCart({})
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

          <div className="menu-grid">
            {menuItems.map((item, index) => (
              <article className="menu-card" key={item.id} style={{ '--card-index': index }}>
                <div className="food-image-wrap">
                  <img className="food-image" src={item.image} alt={item.imageAlt} />
                  <span className="food-category">{item.category}</span>
                  <span className="food-number">0{index + 1}</span>
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
            ))}
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
            <button className="button button-primary checkout-button" type="button" onClick={placeOrder} disabled={!cartCount}>
              Place order <span aria-hidden="true">↗</span>
            </button>
            <p className="checkout-note">No hidden fees. Just really good food.</p>
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