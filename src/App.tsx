import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import BottomNav from './components/layout/BottomNav';
import TopAppBar from './components/layout/TopAppBar';
import { cn } from './lib/utils';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import AddPriceScreen from './screens/AddPriceScreen';
import RankingsScreen from './screens/RankingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ItemDetailsScreen from './screens/ItemDetailsScreen';
import AIChatScreen from './screens/AIChatScreen';
import WatchlistScreen from './screens/WatchlistScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import { LogIn, MessageSquare } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Link, useLocation } from 'react-router-dom';

function AppContent() {
  const { user, loading, error, login, clearError } = useAuth();
  const location = useLocation();
  const [isKeySelected, setIsKeySelected] = useState(true); // Default to true, check in useEffect

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setIsKeySelected(true); // Assume success as per instructions
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-8 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8">
          <LogIn size={48} className="text-primary" />
        </div>
        <h1 className="font-headline text-4xl font-black text-primary mb-4 tracking-tight">Huntly</h1>
        <p className="text-on-surface-variant text-lg mb-10 max-w-md">The ultimate crowdsourced price tracker. Hunt for the best deals, verify market prices, and save more together.</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 max-w-md w-full text-sm relative">
            <p>{error}</p>
            <button 
              onClick={clearError}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <button 
          onClick={login}
          className="signature-gradient text-white px-10 py-5 rounded-full font-bold text-xl shadow-xl active:scale-95 transition-all w-full max-w-sm"
        >
          Sign in with Google
        </button>
        
        <p className="mt-8 text-xs text-outline max-w-xs">
          If the popup doesn't open, try opening the app in a new tab.
        </p>
      </div>
    );
  }

  const isChat = location.pathname === '/chat';

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {!isChat && <TopAppBar />}
      <main className={cn("flex-grow", !isChat && "pb-32")}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/add" element={<AddPriceScreen />} />
          <Route path="/rankings" element={<RankingsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/watchlist" element={<WatchlistScreen />} />
          <Route path="/shopping-list" element={<ShoppingListScreen />} />
          <Route path="/item/:id" element={<ItemDetailsScreen />} />
          <Route path="/chat" element={<AIChatScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!isChat && <BottomNav />}
      
      {/* Floating Chat Button */}
      {!isChat && (
        <Link 
          to="/chat" 
          className="fixed bottom-24 right-6 w-14 h-14 signature-gradient rounded-full flex items-center justify-center text-white shadow-2xl z-40 hover:scale-110 active:scale-95 transition-all border-2 border-white/20"
        >
          <MessageSquare size={28} />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></div>
        </Link>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
