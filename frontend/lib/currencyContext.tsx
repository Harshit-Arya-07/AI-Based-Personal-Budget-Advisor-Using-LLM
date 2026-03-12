'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { authedGet, authedPut } from '@/lib/api';
import { 
  formatCurrency as formatCurrencyUtil, 
  formatCompactCurrency as formatCompactCurrencyUtil,
  getCurrencySymbol as getCurrencySymbolUtil,
  DEFAULT_CURRENCY,
  CurrencyInfo,
  getCurrencyInfo,
} from '@/lib/currency';
import { toast } from 'sonner';

interface CurrencyContextValue {
  currency: string;
  currencyInfo: CurrencyInfo;
  setCurrency: (code: string) => Promise<void>;
  formatCurrency: (amount: number) => string;
  formatCompact: (amount: number) => string;
  symbol: string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firestore for real-time updates
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCurrencyState(DEFAULT_CURRENCY);
        setIsLoading(false);
        return;
      }

      // Listen to user document for currency changes
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.preferredCurrency) {
              setCurrencyState(data.preferredCurrency);
            }
          }
          setIsLoading(false);
        },
        (error) => {
          console.error('Error listening to currency preference:', error);
          setIsLoading(false);
        }
      );

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  // Update currency in Firestore
  const setCurrency = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      await authedPut('/api/user/preferences', { preferredCurrency: code });
      setCurrencyState(code);
      toast.success(`Currency changed to ${code}`);
    } catch (error) {
      console.error('Failed to update currency:', error);
      toast.error('Failed to update currency preference');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Format helpers bound to current currency
  const formatCurrency = useCallback(
    (amount: number) => formatCurrencyUtil(amount, currency),
    [currency]
  );

  const formatCompact = useCallback(
    (amount: number) => formatCompactCurrencyUtil(amount, currency),
    [currency]
  );

  const symbol = getCurrencySymbolUtil(currency);
  const currencyInfo = getCurrencyInfo(currency);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyInfo,
        setCurrency,
        formatCurrency,
        formatCompact,
        symbol,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}

// Hook for components that just need formatting without the full context
export function useCurrencyFormat() {
  const { currency, formatCurrency, formatCompact, symbol } = useCurrency();
  return { currency, formatCurrency, formatCompact, symbol };
}
