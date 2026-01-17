import { createClient } from '@supabase/supabase-js';
import { Product, PriceHistory, Profile, Benefit, UserMembership, SavedCart } from '../types';

const getEnvVar = (key: string) => {
  const value = import.meta.env[key];
  if (value === undefined) {
    console.warn(`Environment variable ${key} is not defined`);
  }
  return value;
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
const SUPABASE_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

export const supabase = createClient(
  isValidUrl(SUPABASE_URL) ? SUPABASE_URL : 'https://placeholder.supabase.co',
  SUPABASE_KEY || 'placeholder-key'
);

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase.from('productos').select('*');
  if (error) throw error;
  return data;
};

export const getProductHistory = async (productId: number): Promise<PriceHistory[]> => {
  const { data, error } = await supabase
    .from('historial_precios')
    .select('*')
    .eq('producto_id', productId)
    .order('fecha', { ascending: true });
  if (error) throw error;
  return data;
};

export const getPriceHistory = async (days: number = 7): Promise<PriceHistory[]> => {
  const { data, error } = await supabase.rpc('get_price_history_last_n_days', { days });
  if (error) {
    console.error('Error fetching price history:', error);
    return [];
  };
  return data || [];
};

export const getProductHistoryByName = async (productName: string, days: number = 30): Promise<PriceHistory[]> => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const { data, error } = await supabase
    .from('historial_precios')
    .select('*')
    .eq('nombre_producto', productName)
    .gte('fecha', date.toISOString().split('T')[0])
    .order('fecha', { ascending: true });
  if (error) {
    console.error('Error fetching product history by name:', error);
    return [];
  }
  return data || [];
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('perfiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
};

export const getConfig = async (): Promise<Record<string, string>> => {
  const { data, error } = await supabase.from('configuracion').select('*');
  if (error) {
    console.warn('Could not fetch config. Returning default empty object.', error.message);
    return {};
  }
  const config: Record<string, string> = {};
    data?.forEach((row: any) => { config[row.clave as keyof typeof config] = row.valor; });
  return config;
};

export const getBenefits = async (day: number): Promise<Benefit[]> => {
  const { data, error } = await supabase.rpc('get_benefits_for_day', { query_day: day });
  if (error) throw error;
  return data;
};

export const getCatalogoMembresias = async (): Promise<any[]> => {
  const { data, error } = await supabase.from('catalogo_membresias').select('*');
  if (error) throw error;
  return data;
};

export const updateMemberships = async (userId: string, memberships: UserMembership[]) => {
  const { error } = await supabase
    .from('perfiles')
    .update({ membresias: memberships })
    .eq('id', userId);
  if (error) throw error;
};

export const getSavedCarts = async (userId: string): Promise<SavedCart[]> => {
  const { data, error } = await supabase
    .from('carritos_guardados')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const saveCart = async (userId: string, titulo: string, items: Record<number, number>): Promise<SavedCart> => {
  const { data, error } = await supabase
    .from('carritos_guardados')
    .insert({ user_id: userId, titulo, items })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCart = async (cartId: string, updates: Partial<SavedCart>): Promise<SavedCart> => {
  const { data, error } = await supabase
    .from('carritos_guardados')
    .update(updates)
    .eq('id', cartId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteCart = async (cartId: string) => {
  const { error } = await supabase.from('carritos_guardados').delete().eq('id', cartId);
  if (error) throw error;
};

export const getSharedCart = async (cartId: string): Promise<SavedCart | null> => {
  const { data, error } = await supabase
    .from('carritos_guardados')
    .select('*')
    .eq('id', cartId)
    .eq('is_public', true)
    .single();
  if (error) {
    console.error("Error fetching shared cart:", error);
    return null;
  }
  return data;
};