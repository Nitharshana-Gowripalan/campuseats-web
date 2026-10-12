require('dotenv').config()

const cors = require('cors')
const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env before starting the API.')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const app = express()
const port = Number(process.env.PORT) || 5000

const defaultOrigins = [
  'http://localhost:5173',
  'https://campuseats-web-gamma.vercel.app',
]
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins])
const projectVercelOrigin = /^https:\/\/campuseats-web(?:-[a-z0-9-]+)?\.vercel\.app$/i

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || projectVercelOrigin.test(origin)) {
      return callback(null, true)
    }

    const error = new Error('Origin not allowed by CORS')
    error.status = 403
    return callback(error)
  },
}))
app.use(express.json({ limit: '1mb' }))

const fallbackMenu = [
  {
    id: 1,
    name: 'Campus Burger',
    description: 'Smash-grilled beef, sharp cheddar, house sauce, soft potato bun.',
    price: 9.5,
    category: 'Student favorite',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
    image_alt: 'Double cheeseburger with lettuce and tomato',
  },
  {
    id: 2,
    name: 'Chicken Submarine',
    description: 'Herb-roasted chicken, crunchy greens, pickled onion, garlic mayo.',
    price: 8.25,
    category: 'Made to order',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85',
    image_alt: 'Fresh chicken sandwich with greens',
  },
  {
    id: 3,
    name: 'Garden Pizza',
    description: 'Roasted peppers, basil, mozzarella, and a bright tomato base.',
    price: 11,
    category: 'Veggie pick',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85',
    image_alt: 'Vegetable pizza topped with basil',
  },
  {
    id: 4,
    name: 'Iced Coffee',
    description: 'Slow-brewed coffee over ice, with your choice of oat or dairy milk.',
    price: 4.5,
    category: 'Study fuel',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=85',
    image_alt: 'Iced coffee in a glass',
  },
]

app.get('/', (_req, res) => {
  res.json({ status: 'CampusEats API is running live!' })
})

app.get('/api/menu', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Unable to fetch menu items; returning fallback menu:', error.message)
      return res.json(fallbackMenu)
    }

    return res.json(data?.length ? data : fallbackMenu)
  } catch (error) {
    console.error('Menu request failed; returning fallback menu:', error.message)
    return res.json(fallbackMenu)
  }
})

app.post('/api/orders', async (req, res, next) => {
  try {
    const { items, customer_name: customerName, delivery_location: deliveryLocation } = req.body || {}

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ error: 'Provide between 1 and 50 order items.' })
    }

    for (const value of [customerName, deliveryLocation]) {
      if (value !== undefined && (typeof value !== 'string' || value.length > 200)) {
        return res.status(400).json({ error: 'Customer name and delivery location must be text under 200 characters.' })
      }
    }

    const requestedItems = items.map((item) => {
      const rawId = item?.menu_item_id ?? item?.id
      const id = typeof rawId === 'string' ? rawId.trim() : rawId

      if (
        (typeof id !== 'string' && !(typeof id === 'number' && Number.isSafeInteger(id))) ||
        (typeof id === 'string' && (id.length === 0 || id.length > 100)) ||
        !Number.isInteger(item?.quantity) ||
        item.quantity < 1 ||
        item.quantity > 50
      ) {
        return null
      }

      return { id, quantity: item.quantity }
    })

    if (requestedItems.some((item) => item === null)) {
      return res.status(400).json({
        error: 'Each item needs a valid menu_item_id and an integer quantity from 1 to 50.',
      })
    }

    const menuItemIds = [...new Set(requestedItems.map((item) => item.id))]
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price')
      .in('id', menuItemIds)

    if (menuError) {
      console.error('Unable to validate order items:', menuError.message)
      return res.status(503).json({ error: 'Menu items are currently unavailable.' })
    }

    const menuById = new Map((menuItems || []).map((item) => [String(item.id), item]))
    if (menuById.size !== menuItemIds.length) {
      return res.status(400).json({ error: 'One or more menu items could not be found.' })
    }

    let totalCents = 0
    const orderItems = requestedItems.map(({ id, quantity }) => {
      const menuItem = menuById.get(String(id))
      const unitPriceCents = Math.round(Number(menuItem.price) * 100)
      totalCents += unitPriceCents * quantity

      return {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        unit_price: unitPriceCents / 100,
        quantity,
      }
    })

    const order = {
      items: orderItems,
      total: totalCents / 100,
      status: 'pending',
      customer_name: customerName?.trim() || null,
      delivery_location: deliveryLocation?.trim() || null,
    }

    console.info('Received CampusEats order:', JSON.stringify(order))

    const { error: orderError } = await supabase.from('orders').insert(order)

    if (orderError) {
      console.error('Unable to save order:', orderError.message)
      return res.status(503).json({ error: 'Unable to place your order right now.' })
    }

    return res.status(201).json({
      message: 'Order received.',
      items: orderItems,
      total: order.total,
      status: order.status,
    })
  } catch (error) {
    return next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error.message)
  return res.status(error.status || 500).json({ error: 'An unexpected server error occurred.' })
})

app.listen(port, () => {
  console.log(`CampusEats API listening on port ${port}`)
})