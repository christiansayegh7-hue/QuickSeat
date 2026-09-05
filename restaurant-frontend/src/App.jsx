import { Route, Routes } from 'react-router-dom'
import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/layout/AdminLayout'
import { RequireAdmin, RequireAuth } from './components/ProtectedRoute'

import Home from './pages/Home'
import Restaurants from './pages/Restaurants'
import RestaurantDetails from './pages/RestaurantDetails'
import Booking from './pages/Booking'
import Login from './pages/Login'
import Register from './pages/Register'
import MyBookings from './pages/MyBookings'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

import Dashboard from './pages/admin/Dashboard'
import AdminRestaurants from './pages/admin/AdminRestaurants'
import AdminReservations from './pages/admin/AdminReservations'
import AdminUsers from './pages/admin/AdminUsers'
import AdminMenuItems from './pages/admin/AdminMenuItems'
import AdminReviews from './pages/admin/AdminReviews'
import AdminProfits from './pages/admin/AdminProfits'
import AdminReports from './pages/admin/AdminReports'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminSettings from './pages/admin/AdminSettings'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/restaurants/:id" element={<RestaurantDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth />}>
          <Route path="/restaurants/:id/book" element={<Booking />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="restaurants" element={<AdminRestaurants />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="menu-items" element={<AdminMenuItems />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="profits" element={<AdminProfits />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
