export interface Product {
  id: number;
  nombre: string;
  categoria: string;
  ticker?: string;
  p_coto: number;
  p_carrefour: number;
  p_dia: number;
  p_jumbo: number;
  p_masonline: number;
  imagen_url?: string; // Agregado
  oferta_gondola?: any; // Agregado
}

export interface PriceHistory {
  id: number;
  fecha: string;
  nombre_producto: string; // Asegurado
  precio_minimo: number;
  supermercado: string;
}

export interface Membership {
  slug: string;
  nombre: string;
  categoria: string;
  logo_url: string;
  opciones?: string[]; // Agregado
}

export interface UserMembership {
  slug: string;
  tipo: string; // Cambiado de literal a string para evitar errores
}

export interface Profile {
  id: string;
  email: string;
  nombre?: string; // Agregado
  apellido?: string;
  subscription: 'free' | 'pro' | 'premium';
  subscription_end?: string | null;
  membresias: UserMembership[];
}

export interface SavedCart {
  id: string;
  name: string; // Agregado
  items: Record<number, number>;
  created_at: string;
}

export interface Benefit {  // <--- REVISA ESTA PALABRA
  id: number;
  dia_semana: number;
  supermercado: string;
  entidad_nombre: string;
  descuento: number;
  link_referido?: string;
}

export interface ProductStats { // <--- REVISA ESTA PALABRA
  min: number;
  spread: string;
  trendClass: string;
  icon: string;
  isUp: boolean;
  isDown: boolean;
}



export type TabType = 'home' | 'carnes' | 'verdu' | 'varios' | 'favs' | 'about' | 'terms' | 'contact';