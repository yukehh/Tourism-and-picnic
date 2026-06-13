import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router';
import router from './router/router';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

AOS.init({ duration: 700, easing: 'ease-out', once: true });

createRoot(document.getElementById('root')).render(
  <CartProvider>
    <WishlistProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </WishlistProvider>
  </CartProvider>
);
