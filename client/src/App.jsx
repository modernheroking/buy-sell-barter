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

  return (
    <div className={isCameraPage ? 'no-header-layout' : 'app-layout'}>
      {!isCameraPage && <Header />}
      {!isCameraPage && <Footer />}

      {/* ✅ Global popup - OUTSIDE Routes, INSIDE the ONE BrowserRouter - works on every page */}
      <TransactionCongrats />

      <main className={isCameraPage ? 'camera-main' : 'main'}>
        {/* ✅ NO <Router> here - BrowserRouter in App() is the only router */}
        <Routes>
          <Route path="/" element={<Market />} />
          <Route path="/market" element={<Market />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route path="/sellers" element={<ProtectedRoute><Sellers /></ProtectedRoute>} />
          <Route path="/sellers-upload" element={<ProtectedRoute><SellersUpload /></ProtectedRoute>} />
          <Route path="/sellers-description" element={<ProtectedRoute><SellersDescription /></ProtectedRoute>} />

          <Route path="/buyers" element={<ProtectedRoute><Buyers /></ProtectedRoute>} />
          <Route path="/buyers-upload" element={<ProtectedRoute><BuyersUpload /></ProtectedRoute>} />
          <Route path="/buyers-description" element={<ProtectedRoute><BuyersDescription /></ProtectedRoute>} />

          <Route path="/barters" element={<ProtectedRoute><Barters /></ProtectedRoute>} />
          <Route path="/barters-upload" element={<ProtectedRoute><BartersUpload /></ProtectedRoute>} />
          <Route path="/barters-description" element={<ProtectedRoute><BartersDescription /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/good/:id" element={<GoodDetails />} />
          <Route path="/user/:id" element={<PublicProfile />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/reviews" element={<ReviewPage />} />
          <Route path="/transaction/:id" element={<Transaction />} />
        </Routes>
      </main>
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