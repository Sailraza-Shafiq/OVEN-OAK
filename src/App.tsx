import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedProducts } from './components/FeaturedProducts';
import { CategoriesSection } from './components/CategoriesSection';
import { BestSellers } from './components/BestSellers';
import { AboutBakery } from './components/AboutBakery';
import { Testimonials } from './components/Testimonials';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { Toast } from './components/Toast';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

const MainAppContent: React.FC = () => {
  const { isAdminView, isAdminAuthenticated, isCheckingSession, setIsAdminView } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Continually monitor URL path for /admin or #admin
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.endsWith('/admin') || path.includes('/admin/') || hash === '#admin' || hash.startsWith('#/admin')) {
        setIsAdminView(true);
      }
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    window.addEventListener('hashchange', checkPath);
    return () => {
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('hashchange', checkPath);
    };
  }, [setIsAdminView]);

  // If owner navigated to /admin
  if (isAdminView) {
    if (isCheckingSession) {
      return (
        <div className="min-h-screen bg-white text-[#3B241C] flex items-center justify-center font-mono text-xs uppercase tracking-widest">
          Verifying Session...
        </div>
      );
    }
    if (!isAdminAuthenticated) {
      return (
        <>
          <AdminLogin />
          <Toast />
        </>
      );
    }
    return (
      <>
        <AdminDashboard />
        <Toast />
      </>
    );
  }

  // Public Storefront View (Strictly NO Admin button displayed anywhere)
  return (
    <div className="min-h-screen bg-white text-[#3B241C] flex flex-col font-sans selection:bg-[#3B241C] selection:text-white">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Categories Section (Small Pizza, Cakes, Brownies, Buns, Fresh Bread, Blue Band, Chips, Cold Drinks) */}
        <CategoriesSection onSelectCategory={(catId) => setSelectedCategory(catId)} />

        {/* Featured Products with PKR (Rs.) pricing and live category filters */}
        <FeaturedProducts 
          selectedCategoryFilter={selectedCategory} 
          onFilterChange={(catId) => setSelectedCategory(catId)}
        />

        {/* Permanent Best Sellers */}
        <BestSellers />

        {/* About Bakery & Craftsmanship */}
        <AboutBakery />

        {/* Attributable Patrons Testimonials */}
        <Testimonials />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Cart, Modals & Toast */}
      <CartDrawer />
      <CheckoutModal />
      <ProductDetailModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <MainAppContent />
    </CartProvider>
  );
}
