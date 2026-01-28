export interface ColorPalette {
  primary: string;
  secondary: string;
  accent1: string;
  accent2: string;
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export const colors: ColorPalette = {
  primary: '#306393',      // Azul corporativo
  secondary: '#2da2eb',    // Azul claro
  accent1: '#2deb79',      // Verde institucional
  accent2: '#2debb8',      // Verde complementario
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};