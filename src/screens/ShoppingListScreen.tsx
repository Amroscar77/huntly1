import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { MarketService } from '../lib/MarketService';
import { ShoppingCart, Trash2, Plus, Search, MapPin, Store, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ShoppingListScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [bestStores, setBestStores] = useState<any[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = MarketService.getShoppingList(user.uid, (items) => {
      setShoppingList(items);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (shoppingList.length > 0 && location) {
      MarketService.calculateBestStoreForList(user!.uid, shoppingList.map(i => i.itemName), [location.lat, location.lng])
        .then(setBestStores);
    } else {
      setBestStores([]);
    }
  }, [shoppingList, location, user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItem.trim()) return;
    setLoading(true);
    try {
      await MarketService.addToShoppingList(user.uid, newItem.trim());
      setNewItem('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8 pb-20 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-headline text-4xl font-black text-primary">Smart List</h1>
        <p className="text-on-surface-variant">Add items and find the cheapest store for your full basket.</p>
      </div>

      {/* Best Store Recommendation */}
      {bestStores.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-tertiary rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={24} className="text-primary-container" />
                <h2 className="font-headline text-2xl font-black tracking-tight">Best Deal Found!</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-container text-sm font-black uppercase tracking-widest mb-1">Recommended Store</p>
                  <h3 className="text-3xl font-black font-headline">{bestStores[0].name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-primary-container text-sm font-black uppercase tracking-widest mb-1">Total Basket</p>
                  <p className="text-3xl font-black font-headline">{bestStores[0].total} EGP</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                  <Store size={14} />
                  <span>Found {bestStores[0].count} of {shoppingList.length} items here</span>
                </div>
                <button 
                  onClick={() => navigate('/map')}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white text-primary px-6 py-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <MapPin size={14} />
                  Navigate
                </button>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* Other Stores Comparison */}
          {bestStores.length > 1 && (
            <div className="bg-surface-container-low rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-outline ml-1">Other Nearby Stores</h3>
              <div className="space-y-3">
                {bestStores.slice(1).map((store) => (
                  <div key={store.name} className="bg-white rounded-2xl p-4 border border-outline-variant/10 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-on-surface">{store.name}</h4>
                      <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Found {store.count} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-on-surface">{store.total} EGP</p>
                      <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">+{store.total - bestStores[0].total} EGP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Form */}
      <form onSubmit={handleAdd} className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10 shadow-xl flex gap-4">
        <div className="flex-grow relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Add item (e.g. Milk)"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <button
          disabled={loading || !newItem.trim()}
          className="signature-gradient text-white px-8 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          <Plus size={20} />
        </button>
      </form>

      {/* List */}
      <div className="space-y-4">
        {shoppingList.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
            <ShoppingCart size={48} className="mx-auto text-outline/30 mb-4" />
            <p className="text-outline font-bold">Your shopping list is empty.</p>
            <p className="text-xs text-outline/60 mt-1 uppercase tracking-widest">Add items to find the best nearby deals</p>
          </div>
        ) : (
          shoppingList.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-6 border border-outline-variant/10 shadow-lg flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <ShoppingCart size={24} />
                </div>
                <h3 className="font-bold text-on-surface capitalize">{item.itemName}</h3>
              </div>
              <button className="p-3 text-outline hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
