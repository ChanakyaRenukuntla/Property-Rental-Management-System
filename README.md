# 🏢 PropEase — MERN Stack Rental Management System

A full-stack property rental management system built with MongoDB, Express.js, React, and Node.js.

---

## 📁 FOLDER STRUCTURE

```
propease/
│
├── backend/                    ← Node.js + Express (the API server)
│   ├── config/                 ← (optional) DB config helpers
│   ├── controllers/            ← Business logic for each feature
│   │   ├── auth.controller.js
│   │   ├── property.controller.js
│   │   ├── tenant.controller.js
│   │   ├── payment.controller.js
│   │   ├── maintenance.controller.js
│   │   └── message.controller.js
│   ├── middleware/
│   │   └── auth.js             ← JWT token verification guard
│   ├── models/                 ← MongoDB schemas (blueprints for data)
│   │   ├── User.js
│   │   ├── Property.js
│   │   ├── Payment.js
│   │   ├── Maintenance.js
│   │   └── Message.js
│   ├── routes/                 ← URL path definitions
│   │   ├── auth.routes.js
│   │   ├── property.routes.js
│   │   ├── tenant.routes.js
│   │   ├── payment.routes.js
│   │   ├── maintenance.routes.js
│   │   └── message.routes.js
│   ├── .env.example            ← Copy to .env and fill in values
│   ├── package.json
│   └── server.js               ← Main entry point (start here!)
│
└── frontend/                   ← React app
    ├── public/
    │   └── index.html
    └── src/
        ├── context/
        │   └── AuthContext.js  ← Global auth state (login/logout)
        ├── pages/
        │   ├── auth/
        │   │   ├── LoginPage.js
        │   │   └── SignupPage.js
        │   ├── owner/
        │   │   ├── OwnerDashboard.js   ← Shell with sidebar
        │   │   ├── OwnerHome.js        ← Stats overview
        │   │   ├── OwnerProperties.js  ← Add/edit/delete properties
        │   │   ├── OwnerTenants.js     ← Manage tenants
        │   │   ├── OwnerPayments.js    ← Record payments
        │   │   ├── OwnerMaintenance.js ← Respond to requests
        │   │   └── OwnerMessages.js    ← Chat with tenants
        │   └── tenant/
        │       ├── TenantDashboard.js  ← Shell with sidebar
        │       ├── TenantHome.js       ← My home + owner contact
        │       ├── TenantProperties.js ← Browse all listings
        │       ├── TenantPayments.js   ← Payment history
        │       ├── TenantMaintenance.js← Submit requests
        │       └── TenantMessages.js   ← Chat with owner
        ├── components/
        │   └── common/
        │       ├── Sidebar.js  ← Shared sidebar for both dashboards
        │       └── Toast.js    ← Notification popup
        ├── services/
        │   └── api.js          ← ALL Axios calls to backend (central file)
        ├── styles/
        │   └── global.css      ← Dark theme CSS variables + shared styles
        ├── App.js              ← Routes (React Router)
        └── index.js            ← React entry point
```

---

## 🗄️ DATABASE RELATIONSHIPS

```
User (role: owner)
  └── has many → Properties
        └── has one → User (role: tenant)  [currentTenant]
        └── has many → Payments
        └── has many → Maintenance requests
        └── has many → Messages

User (role: tenant)
  └── assigned to → Property
  └── has many → Payments (records of rent paid)
  └── has many → Maintenance requests (submitted)
  └── has many → Messages (with owner)
```

**In MongoDB, relationships use ObjectId references:**
```javascript
// In Property model:
owner:         { type: ObjectId, ref: 'User' }   // links to User (owner)
currentTenant: { type: ObjectId, ref: 'User' }   // links to User (tenant)

// .populate() replaces the ID with actual data:
Property.find().populate('owner', 'name email')
// → owner becomes { name: "Rahul", email: "rahul@..." } instead of just an ID
```

---

## 🔐 JWT AUTHENTICATION FLOW

```
1. User fills signup/login form in React
2. React sends POST request to /api/auth/login via Axios
3. Backend checks email + password in MongoDB
4. If valid → backend creates a JWT token (like a digital ID card)
5. Token is sent back to React
6. React stores token in localStorage
7. Every future request automatically includes: Authorization: Bearer <token>
8. Backend middleware (auth.js) verifies the token on protected routes
9. If token expired/invalid → 401 response → frontend redirects to /login
```

---

## 🚀 SETUP INSTRUCTIONS

### Step 1: Prerequisites
Make sure you have installed:
- **Node.js** (v18+): https://nodejs.org
- **MongoDB** (local) OR **MongoDB Atlas** (free cloud): https://mongodb.com/atlas
- **Git** (optional)

---

### Step 2: Set up the Backend

```bash
# 1. Go into the backend folder
cd propease/backend

# 2. Install all dependencies
npm install

# 3. Create your .env file (copy from example)
cp .env.example .env

# 4. Open .env and fill in:
#    MONGO_URI=mongodb://localhost:27017/propease   (local MongoDB)
#    OR
#    MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/propease  (Atlas)
#    JWT_SECRET=any_long_random_string_here

# 5. Start the backend server
npm run dev
# You should see:
# ✅ MongoDB connected successfully
# 🚀 Server is running on http://localhost:5000
```

---

### Step 3: Set up the Frontend

```bash
# Open a NEW terminal window

# 1. Go into the frontend folder
cd propease/frontend

# 2. Install all dependencies
npm install

# 3. Start the React development server
npm start
# Browser opens automatically at http://localhost:3000
```

---

### Step 4: Using the App

1. Go to **http://localhost:3000**
2. Click **Sign up** → create an **Owner** account
3. Sign up again → create a **Tenant** account
4. Log in as **Owner** → add properties, then assign the tenant
5. Log in as **Tenant** → see your home, submit maintenance, send messages
6. Log back in as **Owner** → respond to maintenance, record payments, reply to messages

---

## 🔌 HOW FRONTEND CONNECTS TO BACKEND (Axios Examples)

All API calls are in `frontend/src/services/api.js`.

### Example 1: Fetch all properties
```javascript
// In any React component:
import { propertyAPI } from '../../services/api';

useEffect(() => {
  const fetchProperties = async () => {
    try {
      const response = await propertyAPI.getAll();
      // response.data.properties = array of property objects from MongoDB
      setProperties(response.data.properties);
    } catch (error) {
      console.error('Error:', error.response?.data?.message);
    }
  };
  fetchProperties();
}, []);
```

This translates to: `GET http://localhost:5000/api/properties`
With header: `Authorization: Bearer eyJhbGciO...` (auto-added by Axios interceptor)

---

### Example 2: Add a new property
```javascript
const newProperty = {
  title: "2BHK in Banjara Hills",
  rent: 25000,
  bedrooms: 2,
  address: { city: "Hyderabad", state: "Telangana" }
};

const response = await propertyAPI.create(newProperty);
// Sends: POST http://localhost:5000/api/properties
// Body: { title, rent, bedrooms, address }
// Response: { success: true, property: { _id, title, ... } }
```

---

### Example 3: Login flow
```javascript
// 1. User submits login form
const response = await authAPI.login({ email, password });

// 2. Backend returns:
// { success: true, token: "eyJ...", user: { id, name, email, role } }

// 3. We save to localStorage + context
login(response.data.user, response.data.token);

// 4. From now on, every Axios request auto-sends the token in headers
```

---

## 🏗️ MVC ARCHITECTURE EXPLAINED

MVC = Model, View, Controller

| Layer | In Our App | Role |
|-------|-----------|------|
| **Model** | `backend/models/*.js` | Defines data structure in MongoDB |
| **View** | `frontend/src/pages/*.js` | What the user sees (React components) |
| **Controller** | `backend/controllers/*.js` | The logic that connects View ↔ Model |
| **Route** | `backend/routes/*.js` | Maps URLs to the right controller |

**Request flow:**
```
Browser (React)
  → Axios sends HTTP request
    → Express Route matches the URL
      → Controller function runs
        → Model queries MongoDB
          → Response sent back
            → React updates the UI
```

---

## 📡 ALL API ENDPOINTS

### Auth
| Method | URL | Description | Auth? |
|--------|-----|-------------|-------|
| POST | /api/auth/signup | Register new user | No |
| POST | /api/auth/login | Login | No |
| GET | /api/auth/me | Get my profile | Yes |

### Properties
| Method | URL | Description | Role |
|--------|-----|-------------|------|
| GET | /api/properties | Get properties | Both |
| POST | /api/properties | Add property | Owner |
| PUT | /api/properties/:id | Update property | Owner |
| DELETE | /api/properties/:id | Delete property | Owner |
| PUT | /api/properties/:id/assign-tenant | Assign tenant | Owner |

### Tenants
| Method | URL | Description | Role |
|--------|-----|-------------|------|
| GET | /api/tenants | Get owner's tenants | Owner |
| GET | /api/tenants/all-users | All tenant accounts | Owner |
| GET | /api/tenants/my-home | Tenant's property | Tenant |

### Payments
| Method | URL | Description | Role |
|--------|-----|-------------|------|
| GET | /api/payments | Get payments | Both |
| POST | /api/payments | Record payment | Owner |
| PUT | /api/payments/:id | Update payment | Owner |
| DELETE | /api/payments/:id | Delete payment | Owner |

### Maintenance
| Method | URL | Description | Role |
|--------|-----|-------------|------|
| GET | /api/maintenance | Get requests | Both |
| POST | /api/maintenance | Submit request | Tenant |
| PUT | /api/maintenance/:id | Update status | Owner |

### Messages
| Method | URL | Description | Role |
|--------|-----|-------------|------|
| GET | /api/messages/conversations | All chats | Both |
| GET | /api/messages/:userId | Chat with user | Both |
| POST | /api/messages | Send message | Both |
| GET | /api/messages/unread | Unread count | Both |

---

## 🎓 VIVA ANSWERS (Key Concepts)

**Q: What is MERN?**
A: MERN is a JavaScript full-stack framework: MongoDB (database), Express.js (backend framework), React (frontend), Node.js (runtime environment). All four use JavaScript, making it easy to work with.

**Q: What is MongoDB? How is it different from SQL?**
A: MongoDB is a NoSQL database that stores data as JSON-like documents instead of rows/columns. It's flexible — no fixed schema required. We use Mongoose to define schemas/models on top of it.

**Q: What is JWT?**
A: JSON Web Token. After login, the server creates a signed token containing the user's ID. The client sends this token with every request. The server verifies it to know who is making the request — without needing sessions or database lookups.

**Q: What is middleware?**
A: Functions that run between the request arriving and the route handler executing. Our `protect` middleware checks the JWT token on every protected route. If invalid, it stops the request and returns 401.

**Q: What is .populate() in Mongoose?**
A: When a document stores another document's ObjectId as a reference, `.populate()` replaces that ID with the actual full document. Like a SQL JOIN, but for MongoDB.

**Q: What is React Context?**
A: A way to share state across all components without passing props manually. Our `AuthContext` holds the logged-in user data and is accessible from any component using the `useAuth()` hook.

**Q: What is the role of Axios interceptors?**
A: Interceptors run before every request or after every response. We use a request interceptor to automatically attach the JWT token to every API call — so we don't have to add it manually every time.

**Q: How does role-based access work?**
A: After login, the user object includes a `role` field ('owner' or 'tenant'). React Router shows different dashboards based on this role. On the backend, the `authorize('owner')` middleware checks the role before allowing access to owner-only routes.
