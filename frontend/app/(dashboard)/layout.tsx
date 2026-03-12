'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, User } from 'lucide-react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import NotificationDropdown from '@/components/NotificationDropdown';
import { ThemeProvider } from '@/lib/themeContext';
import { CurrencyProvider } from '@/lib/currencyContext';
import { DashboardContext, DashboardContextValue } from '@/lib/dashboardContext';
import type { ExpenseItem, MonthlyBudget, SavingsGoal, UserSettings } from '@/lib/types';

const pathToTab: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/expenses': 'expenses',
  '/analytics': 'analytics',
  '/history': 'history',
  '/ai-chat': 'ai-chat',
  '/profile': 'profile',
  '/settings': 'settings',
};

const tabToPath: Record<string, string> = {
  dashboard: '/dashboard',
  expenses: '/expenses',
  analytics: '/analytics',
  history: '/history',
  'ai-chat': '/ai-chat',
  profile: '/profile',
  settings: '/settings',
};

const tabTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  expenses: 'Expenses',
  analytics: 'Analytics',
  history: 'History',
  'ai-chat': 'AI Assistant',
  profile: 'Profile',
  settings: 'Settings',
};

function mapExpenseDoc(document: any): ExpenseItem {
  const data = document.data() || {};
  const timestampDate = data.timestamp?.toDate?.() || null;
  return {
    id: document.id,
    category: String(data.category || 'Other'),
    amount: Number(data.amount || 0),
    date: String(data.date || ''),
    timestamp: timestampDate ? timestampDate.toISOString() : null,
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState<UserSettings>({ monthlyIncome: 0, savingsTarget: 0 });
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isLoadingRealtime, setIsLoadingRealtime] = useState(true);

  const todayDate = new Date().toISOString().slice(0, 10);
  const currentMonthId = todayDate.slice(0, 7);

  const activeTab = useMemo(() => pathToTab[pathname] || 'dashboard', [pathname]);

  const setActiveTab = useCallback((tab: string) => {
    const nextPath = tabToPath[tab] || '/dashboard';
    router.push(nextPath);
  }, [router]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    router.replace('/');
  }, [router]);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/');
      }
      setChecking(false);
    });
    return unsubscribe;
  }, [router]);

  // Realtime data listeners
  useEffect(() => {
    let activeListeners: Array<() => void> = [];

    const cleanupListeners = () => {
      for (const unsubscribe of activeListeners) {
        unsubscribe();
      }
      activeListeners = [];
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      cleanupListeners();

      if (!user) {
        setSettings({ monthlyIncome: 0, savingsTarget: 0 });
        setAllExpenses([]);
        setGoals([]);
        setMonthlyBudget(null);
        setDashboardError(null);
        setIsLoadingRealtime(false);
        return;
      }

      setIsLoadingRealtime(true);
      setDashboardError(null);

      const userDocRef = doc(db, 'users', user.uid);
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      const goalsRef = collection(db, 'users', user.uid, 'goals');
      const budgetDocRef = doc(db, 'users', user.uid, 'budgets', currentMonthId);

      activeListeners.push(
        onSnapshot(
          userDocRef,
          (snapshot) => {
            const userData = snapshot.data() || {};
            const profileSettings = userData.settings || {};
            setSettings({
              monthlyIncome: Number(profileSettings.monthlyIncome || 0),
              savingsTarget: Number(profileSettings.savingsTarget || 0),
            });
          },
          (error) => setDashboardError(error.message)
        )
      );

      activeListeners.push(
        onSnapshot(
          expensesRef,
          (snapshot) => {
            const items = snapshot.docs.map(mapExpenseDoc).sort((left, right) => {
              const leftTime = left.timestamp ? new Date(left.timestamp).getTime() : 0;
              const rightTime = right.timestamp ? new Date(right.timestamp).getTime() : 0;
              return rightTime - leftTime;
            });
            setAllExpenses(items);
            setIsLoadingRealtime(false);
          },
          (error) => setDashboardError(error.message)
        )
      );

      activeListeners.push(
        onSnapshot(
          goalsRef,
          (snapshot) => {
            const goalItems = snapshot.docs
              .map((document) => {
                const data = document.data() || {};
                return {
                  id: document.id,
                  name: String(data.name || ''),
                  targetAmount: Number(data.targetAmount || 0),
                  targetDate: String(data.targetDate || ''),
                  createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
                } as SavingsGoal;
              })
              .sort((left, right) => left.targetDate.localeCompare(right.targetDate));

            setGoals(goalItems);
          },
          (error) => setDashboardError(error.message)
        )
      );

      activeListeners.push(
        onSnapshot(
          budgetDocRef,
          (snapshot) => {
            if (!snapshot.exists()) {
              setMonthlyBudget(null);
              return;
            }
            const budgetData = snapshot.data() || {};
            setMonthlyBudget({
              month: String(budgetData.month || currentMonthId),
              totalIncome: Number(budgetData.totalIncome || 0),
              totalExpense: Number(budgetData.totalExpense || 0),
              totalSavings: Number(budgetData.totalSavings || 0),
              savingsRate: Number(budgetData.savingsRate || 0),
              savingsTarget: Number(budgetData.savingsTarget || 0),
            });
          },
          (error) => setDashboardError(error.message)
        )
      );
    });

    return () => {
      cleanupListeners();
      unsubscribeAuth();
    };
  }, [currentMonthId]);

  const contextValue: DashboardContextValue = useMemo(() => ({
    settings,
    allExpenses,
    goals,
    monthlyBudget,
    isLoadingRealtime,
    dashboardError,
    currentMonthId,
    todayDate,
    setActiveTab,
    handleLogout,
  }), [settings, allExpenses, goals, monthlyBudget, isLoadingRealtime, dashboardError, currentMonthId, todayDate, setActiveTab, handleLogout]);

  if (checking) {
    return null;
  }

  return (
    <ThemeProvider>
      <CurrencyProvider>
        <DashboardContext.Provider value={contextValue}>
          <div className="flex min-h-screen bg-background">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

            <div className="flex-1 flex flex-col min-w-0">
              <motion.header
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-8 py-4"
              >
                <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                      {tabTitles[activeTab] || 'Dashboard'}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-2.5 rounded-xl hover:bg-accent transition-colors relative">
                      <Search className="w-4 h-4 text-muted-foreground" />
                    </motion.button>

                    <NotificationDropdown />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab('profile')}
                      className="p-1.5 rounded-xl hover:bg-accent transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0B1A3E 0%, #4F6EF7 100%)' }}>
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </motion.button>
                  </div>
                </div>
              </motion.header>

              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </DashboardContext.Provider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
