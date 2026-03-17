import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUSINESS_DEFAULTS } from '../constants/defaults';
import { getAllQuotes } from '../firebase/quotes';
import { getAllInvoices } from '../firebase/invoices';
import { getAllClients } from '../firebase/clients';

const AppContext = createContext(null);

const initialState = {
  quotes: [],
  invoices: [],
  clients: [],
  settings: { ...BUSINESS_DEFAULTS },
  loading: false,
  quoteCount: 0,
  invoiceCount: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_QUOTES': return { ...state, quotes: action.payload, quoteCount: action.payload.length };
    case 'SET_INVOICES': return { ...state, invoices: action.payload, invoiceCount: action.payload.length };
    case 'SET_CLIENTS': return { ...state, clients: action.payload };
    case 'SET_SETTINGS': return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_QUOTE': return { ...state, quotes: [action.payload, ...state.quotes], quoteCount: state.quoteCount + 1 };
    case 'UPDATE_QUOTE': return {
      ...state,
      quotes: state.quotes.map((q) => q.id === action.payload.id ? { ...q, ...action.payload } : q),
    };
    case 'DELETE_QUOTE': return { ...state, quotes: state.quotes.filter((q) => q.id !== action.payload) };
    case 'ADD_INVOICE': return { ...state, invoices: [action.payload, ...state.invoices], invoiceCount: state.invoiceCount + 1 };
    case 'UPDATE_INVOICE': return {
      ...state,
      invoices: state.invoices.map((inv) => inv.id === action.payload.id ? { ...inv, ...action.payload } : inv),
    };
    case 'DELETE_INVOICE': return { ...state, invoices: state.invoices.filter((inv) => inv.id !== action.payload) };
    case 'ADD_CLIENT': return { ...state, clients: [action.payload, ...state.clients] };
    case 'DELETE_CLIENT': return { ...state, clients: state.clients.filter((c) => c.id !== action.payload) };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    loadSettings();
    refreshData();
  }, []);

  async function loadSettings() {
    try {
      const stored = await AsyncStorage.getItem('brndmonk_settings');
      if (stored) {
        dispatch({ type: 'SET_SETTINGS', payload: JSON.parse(stored) });
      }
    } catch (_) {}
  }

  async function saveSettings(settings) {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
    await AsyncStorage.setItem('brndmonk_settings', JSON.stringify({ ...state.settings, ...settings }));
  }

  async function refreshData() {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [quotes, invoices, clients] = await Promise.all([
        getAllQuotes(),
        getAllInvoices(),
        getAllClients(),
      ]);
      dispatch({ type: 'SET_QUOTES', payload: quotes });
      dispatch({ type: 'SET_INVOICES', payload: invoices });
      dispatch({ type: 'SET_CLIENTS', payload: clients });
    } catch (err) {
      // Firebase not configured yet — work with empty state
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  // Stats computed from state
  const stats = {
    totalQuotes: state.quotes.length,
    wonQuotes: state.quotes.filter((q) => q.status === 'won').length,
    totalInvoices: state.invoices.length,
    paidRevenue: state.invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.pricing?.grandTotal || 0), 0),
    pendingRevenue: state.invoices
      .filter((inv) => ['sent', 'viewed', 'partial'].includes(inv.status))
      .reduce((sum, inv) => {
        const total = inv.pricing?.grandTotal || 0;
        const paid = inv.paidAmount || 0;
        return sum + (total - paid);
      }, 0),
    overdueInvoices: state.invoices.filter((inv) => inv.status === 'overdue').length,
  };

  return (
    <AppContext.Provider value={{ state, dispatch, stats, saveSettings, refreshData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
