import React from 'react';
import Navbar from '../NavFoot/Navbar';
import Footer from '../NavFoot/Footer';
import { Outlet } from 'react-router';
import CartDrawer from '../components/CartDrawer';
import { BackToTop } from '../components/Utils';
import ScrollToTop from '../ScrollToTop';
import LiveChatWidget from '../components/LiveChatWidget';

const Layout = () => (
  <>
    <ScrollToTop />
    <Navbar />
    <CartDrawer />
    <LiveChatWidget />
    <BackToTop />
    <main>
      <Outlet />
    </main>
    <Footer />
  </>
);

export default Layout;
