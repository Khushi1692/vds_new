import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Catalog from './pages/Catalog/Catalog';
import AboutUs from './pages/AboutUs/AboutUs';
import WhyVDS from './pages/WhyVDS/WhyVDS';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import RequestQuote from './pages/RequestQuote/RequestQuote';
import Success from './pages/Success/Success';
import Cart from './pages/Cart/Cart';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import OrderHistory from './pages/Orders/OrderHistory';
import Quality from './pages/Quality/Quality';
import ARTGGuide from './pages/ARTGGuide/ARTGGuide';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder'}>
    <AuthProvider>
      <CartProvider>
      <BrowserRouter>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Catalog />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/orders" element={<OrderHistory />} />
        {/* <Route path="/categories" element={<Categories />} /> */}
        <Route path="/beyond-the-shelf" element={<Navigate to="/about" replace />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/why-vds" element={<WhyVDS />} />
        <Route path="/quality" element={<Quality />} />
        <Route path="/insights/artg-guide" element={<ARTGGuide />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/request-quote" element={<RequestQuote />} />
        <Route path="/success" element={<Success />} />
      </Routes>
      <Footer />
    </BrowserRouter>
    </CartProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}
