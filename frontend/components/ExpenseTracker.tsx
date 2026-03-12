'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, DollarSign, Calendar, Tag, Check } from 'lucide-react';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

interface ExpenseTrackerProps {
  onExpenseAdded?: () => void;
}

const categories = [
  { id: 'housing', label: 'Housing', emoji: '🏠' },
  { id: 'transportation', label: 'Transport', emoji: '🚗' },
  { id: 'food', label: 'Food', emoji: '🍔' },
  { id: 'utilities', label: 'Utilities', emoji: '💡' },
  { id: 'healthcare', label: 'Healthcare', emoji: '🏥' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'personal', label: 'Personal', emoji: '💅' },
  { id: 'education', label: 'Education', emoji: '📚' },
  { id: 'savings', label: 'Savings', emoji: '💰' },
  { id: 'investments', label: 'Investments', emoji: '📈' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

export default function ExpenseTracker({ onExpenseAdded }: ExpenseTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = async () => {
    if (!amount || !category || !date) {
      toast.error('Please fill all fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await getIdToken(user);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/budget/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          category,
          date,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add expense');
      }

      toast.success('Expense added successfully');
      resetForm();
      setIsOpen(false);
      onExpenseAdded?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating action button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50"
        style={{
          background: 'linear-gradient(135deg, #4F6EF7 0%, #8B5CF6 100%)',
        }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-10 sm:top-16 lg:inset-auto lg:left-1/2 lg:top-16 lg:-translate-x-1/2 lg:w-full lg:max-w-md z-50"
            >
              <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                  <h2 className="font-semibold text-lg text-foreground">Add Expense</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5 overflow-y-auto flex-1">
                  {/* Amount input */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Amount</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-accent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Date input */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Date</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-accent border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Category selection */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat) => (
                        <motion.button
                          key={cat.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCategory(cat.id)}
                          className={`relative p-3 rounded-xl border transition-all text-center ${
                            category === cat.id
                              ? 'border-[#4F6EF7] bg-[#4F6EF7]/10'
                              : 'border-border bg-accent/50 hover:bg-accent'
                          }`}
                        >
                          <span className="text-lg">{cat.emoji}</span>
                          <p className={`text-xs mt-1 ${category === cat.id ? 'text-[#4F6EF7] font-medium' : 'text-muted-foreground'}`}>
                            {cat.label}
                          </p>
                          {category === cat.id && (
                            <motion.div
                              layoutId="categoryCheck"
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#4F6EF7] flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-border flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 h-12 rounded-xl border border-border text-foreground font-medium hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || !amount || !category}
                    className="flex-1 h-12 rounded-xl font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #4F6EF7 0%, #8B5CF6 100%)',
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Add Expense
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
