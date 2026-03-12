import { db } from '../config/firebaseAdmin.js';
import admin from 'firebase-admin';

// User operations
export async function getUserProfile(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  
  if (!userDoc.exists) {
    return null;
  }

  const data = userDoc.data();
  return {
    id: uid,
    name: data.name || '',
    email: data.email || '',
    photoURL: data.photoURL || '',
    settings: data.settings || { monthlyIncome: 0, savingsTarget: 0 },
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
  };
}

export async function createOrUpdateUser(uid, userData) {
  const userRef = db.collection('users').doc(uid);
  const existing = await userRef.get();

  if (existing.exists) {
    await userRef.update({
      name: userData.name || existing.data().name,
      email: userData.email || existing.data().email,
      photoURL: userData.photoURL || existing.data().photoURL,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await userRef.set({
      name: userData.name || '',
      email: userData.email || '',
      photoURL: userData.photoURL || '',
      settings: { monthlyIncome: 0, savingsTarget: 0 },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return getUserProfile(uid);
}

export async function updateUserSettings(uid, settings) {
  const userRef = db.collection('users').doc(uid);
  await userRef.set(
    {
      settings: {
        monthlyIncome: Number(settings.monthlyIncome) || 0,
        savingsTarget: Number(settings.savingsTarget) || 0,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return getUserProfile(uid);
}

// Expense operations
export async function getExpenses(uid, monthId = null) {
  const expensesRef = db.collection('users').doc(uid).collection('expenses');
  let query = expensesRef.orderBy('timestamp', 'desc');

  const snapshot = await query.get();
  let expenses = snapshot.docs.map(doc => ({
    id: doc.id,
    category: doc.data().category || 'Other',
    amount: Number(doc.data().amount) || 0,
    date: doc.data().date || '',
    timestamp: doc.data().timestamp?.toDate?.()?.toISOString?.() || null,
  }));

  if (monthId) {
    expenses = expenses.filter(exp => exp.date.startsWith(monthId));
  }

  return expenses;
}

export async function getAllExpenses(uid) {
  const expensesRef = db.collection('users').doc(uid).collection('expenses');
  const snapshot = await expensesRef.orderBy('timestamp', 'desc').get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    category: doc.data().category || 'Other',
    amount: Number(doc.data().amount) || 0,
    date: doc.data().date || '',
    timestamp: doc.data().timestamp?.toDate?.()?.toISOString?.() || null,
  }));
}

export async function addExpense(uid, expenseData) {
  const expensesRef = db.collection('users').doc(uid).collection('expenses');
  
  const docRef = await expensesRef.add({
    category: expenseData.category || 'Other',
    amount: Number(expenseData.amount) || 0,
    date: expenseData.date || new Date().toISOString().slice(0, 10),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update monthly budget aggregation
  await updateMonthlyBudget(uid, expenseData.date);

  return { id: docRef.id };
}

export async function deleteExpense(uid, expenseId) {
  const expenseRef = db.collection('users').doc(uid).collection('expenses').doc(expenseId);
  const doc = await expenseRef.get();

  if (!doc.exists) {
    throw new Error('Expense not found');
  }

  const expenseDate = doc.data().date;
  await expenseRef.delete();

  // Update monthly budget aggregation
  if (expenseDate) {
    await updateMonthlyBudget(uid, expenseDate);
  }

  return { deleted: true };
}

// Goals operations
export async function getGoals(uid) {
  const goalsRef = db.collection('users').doc(uid).collection('goals');
  const snapshot = await goalsRef.orderBy('targetDate', 'asc').get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name || '',
    targetAmount: Number(doc.data().targetAmount) || 0,
    targetDate: doc.data().targetDate || '',
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || null,
  }));
}

export async function addGoal(uid, goalData) {
  const goalsRef = db.collection('users').doc(uid).collection('goals');

  const docRef = await goalsRef.add({
    name: goalData.name || '',
    targetAmount: Number(goalData.targetAmount) || 0,
    targetDate: goalData.targetDate || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: docRef.id };
}

export async function deleteGoal(uid, goalId) {
  const goalRef = db.collection('users').doc(uid).collection('goals').doc(goalId);
  const doc = await goalRef.get();

  if (!doc.exists) {
    throw new Error('Goal not found');
  }

  await goalRef.delete();
  return { deleted: true };
}

// Budget operations
export async function getMonthlyBudget(uid, monthId) {
  const budgetRef = db.collection('users').doc(uid).collection('budgets').doc(monthId);
  const doc = await budgetRef.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    month: monthId,
    totalIncome: Number(data.totalIncome) || 0,
    totalExpense: Number(data.totalExpense) || 0,
    totalSavings: Number(data.totalSavings) || 0,
    savingsRate: Number(data.savingsRate) || 0,
    savingsTarget: Number(data.savingsTarget) || 0,
  };
}

export async function updateMonthlyBudget(uid, date) {
  const monthId = date.slice(0, 7);
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data() || {};
  const settings = userData.settings || {};
  const monthlyIncome = Number(settings.monthlyIncome) || 0;
  const savingsTarget = Number(settings.savingsTarget) || 0;

  const expenses = await getExpenses(uid, monthId);
  const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalSavings = monthlyIncome - totalExpense;
  const savingsRate = monthlyIncome > 0 ? (totalSavings / monthlyIncome) * 100 : 0;

  const budgetRef = db.collection('users').doc(uid).collection('budgets').doc(monthId);
  await budgetRef.set({
    month: monthId,
    totalIncome: monthlyIncome,
    totalExpense: Number(totalExpense.toFixed(2)),
    totalSavings: Number(totalSavings.toFixed(2)),
    savingsRate: Number(savingsRate.toFixed(2)),
    savingsTarget,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// History operations
export async function getExpenseHistory(uid) {
  const expenses = await getAllExpenses(uid);

  // Group by date
  const groupedByDate = new Map();
  for (const expense of expenses) {
    if (!groupedByDate.has(expense.date)) {
      groupedByDate.set(expense.date, { date: expense.date, total: 0, items: [] });
    }
    const group = groupedByDate.get(expense.date);
    group.total += expense.amount;
    group.items.push(expense);
  }

  const sortedGroups = Array.from(groupedByDate.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(group => ({
      ...group,
      total: Number(group.total.toFixed(2)),
    }));

  // Monthly summary
  const monthlyTotals = new Map();
  for (const expense of expenses) {
    const month = expense.date.slice(0, 7);
    monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + expense.amount);
  }

  const monthlySummary = Array.from(monthlyTotals.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, total]) => ({
      month,
      totalExpense: Number(total.toFixed(2)),
    }));

  return { groupedByDate: sortedGroups, monthlySummary };
}

export default {
  getUserProfile,
  createOrUpdateUser,
  updateUserSettings,
  getExpenses,
  getAllExpenses,
  addExpense,
  deleteExpense,
  getGoals,
  addGoal,
  deleteGoal,
  getMonthlyBudget,
  updateMonthlyBudget,
  getExpenseHistory,
};
