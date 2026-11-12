import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Market from './market.jsx';
import Buyers from './buyers.jsx';
import Sellers from './sellers.jsx';
import Barters from './barters.jsx';
import Terms from './terms.jsx';
import Faq from './faq.jsx';
import Profile from './profile.jsx';
import EditProfile from './edit-profile.jsx';
import GoodDetails from './good-details.jsx';
import PublicProfile from './public-profile.jsx';
import Chats from './chats.jsx';
import Chat from './chat.jsx';
import ReviewPage from './reviews.jsx';
import Transaction from './transaction.jsx';
import TransactionCongrats from './transaction-congrats.jsx';
import ForgotPassword from './forgot-password.jsx';
import ResetPassword from './reset-password.jsx';

import SellersUpload from './sellers-upload.jsx';
import BuyersUpload from './buyers-upload.jsx';
import BartersUpload from './barters-upload.jsx';
import SellersDescription from './sellers-description.jsx';
import BuyersDescription from './buyers-description.jsx';
import BartersDescription from './barters-description.jsx';

import Header from './header.jsx';
import Footer from './footer.jsx';
import Register from './register.jsx';
import Login from './login.jsx';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function Layout() {
  const location = useLocation();

  const isCameraPage = [
    '/sellers-upload',
    '/buyers-upload',
    '/barters-upload',
  ].includes(location.pathname);

  // ✅ FIX: Chat gets full screen - no Header, no Footer
  const isChatPage = location.pathname.startsWith('/chat/');
  const hideChrome = isCameraPage || isChatPage;

  return (
    <div className={isCameraPage ? 'no-header-layout' : isChatPage ? 'chat-layout' : 'app-layout'}>
      {!hideChrome && <Header />}

      {/* ✅ Global popup - OUTSIDE Routes, INSIDE the ONE BrowserRouter - works on every page */}
      <TransactionCongrats />

      <main className={isCameraPage ? 'camera-main' : isChatPage ? 'chat-main' : 'main'}>
        {/* ✅ NO <Router> here - BrowserRouter in App() is the only router */}
        <Routes>
          <Route path="/" element={<Market />} />
          <Route path="/market" element={<Market />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ✅ PUBLIC - Guests CAN view, no login needed */}
          <Route path="/sellers" element={<Sellers />} />
          <Route path="/buyers" element={<Buyers />} />
          <Route path="/barters" element={<Barters />} />
          <Route path="/good/:id" element={<GoodDetails />} />
          <Route path="/user/:id" element={<PublicProfile />} />
          <Route path="/sellers-description" element={<SellersDescription />} />
          <Route path="/buyers-description" element={<BuyersDescription />} />
          <Route path="/barters-description" element={<BartersDescription />} />

          {/* 🔒 PRIVATE - Login required: Uploads + You/Profile + Chat + Transaction */}
          <Route path="/sellers-upload" element={<ProtectedRoute><SellersUpload /></ProtectedRoute>} />
          <Route path="/buyers-upload" element={<ProtectedRoute><BuyersUpload /></ProtectedRoute>} />
          <Route path="/barters-upload" element={<ProtectedRoute><BartersUpload /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
          <Route path="/transaction/:id" element={<ProtectedRoute><Transaction /></ProtectedRoute>} />
        </Routes>
      </main>

      {/* ✅ FIX: Footer AFTER main, not before. Hidden on chat/camera. */}
      {!hideChrome && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;