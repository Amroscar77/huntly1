import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { MarketService } from '../lib/MarketService';
import { Bell, Trash2, Plus, Search, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

export default function WatchlistScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = MarketService.getWatchlist(user.uid, (items) => {
      setWatchlist(items);
    });
    return () => unsub();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItem.trim()) return;
    setLoading(true);
    try {
      await MarketService.addToWatchlist(user.uid, newItem.trim(), targetPrice ? parseFloat(targetPrice) : undefined);
      setNewItem('');
      setTargetPrice('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8 pb-20 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-headline text-4xl font-black text-primary">Price Alerts</h1>
        <p className="text-on-surface-variant">Get notified when your favorite items drop in price.</p>
      </div>

      {/* Daily Summary */}
      <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <TrendingDown size={20} />
            </div>
            <h2 className="font-headline text-xl font-black text-on-surface">Daily Price Summary</h2>
          </div>
          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
            Prices for <span className="text-primary font-bold">Milk</span> and <span className="text-primary font-bold">Bread</span> are down by <span className="text-success font-bold">12%</span> in Maadi today.
          </p>
          <button className="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2">
            View Full Report
            <TrendingDown size={14} />
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Item name (e.g. Milk)"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="w-full sm:w-32 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">£</span>
            <input
              type="number"
              placeholder="Target"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl pl-8 pr-4 py-4 text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <button
            disabled={loading || !newItem.trim()}
            className="signature-gradient text-white px-8 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            <Plus size={20} />
          </button>
        </div>
      </form>

      {/* Watchlist */}
      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-outline ml-1">Your Watchlist</h3>
        {watchlist.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
            <Bell size={48} className="mx-auto text-outline/30 mb-4" />
            <p className="text-outline font-bold">Your watchlist is empty.</p>
            <p className="text-xs text-outline/60 mt-1 uppercase tracking-widest">Add items to get real-time alerts</p>
          </div>
        ) : (
          watchlist.map((item) => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/?q=${item.itemName}`)}
              className="bg-white rounded-3xl p-6 border border-outline-variant/10 shadow-lg flex items-center justify-between group animate-in fade-in slide-in-from-bottom duration-300 cursor-pointer hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <TrendingDown size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface capitalize">{item.itemName}</h3>
                  <p className="text-xs text-outline font-medium">
                    {item.targetPrice ? `Target: ${item.targetPrice} EGP` : 'Any price drop'}
                  </p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  // In a real app we'd have a delete method in MarketService
                  // For now we'll just log
                  console.log('Remove', item.id);
                }}
                className="p-3 text-outline hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Suggested Items */}
      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-outline ml-1">Suggested for You</h3>
        <div className="grid grid-cols-2 gap-4">
          {['Milk', 'Bread', 'Eggs', 'Coffee'].map((item) => (
            <button
              key={item}
              onClick={() => setNewItem(item)}
              className="bg-surface-container-low hover:bg-primary/5 border border-outline-variant/10 rounded-2xl p-4 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-on-surface">{item}</span>
                <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Popular in Cairo</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
