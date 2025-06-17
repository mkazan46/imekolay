/**
 * Biçimlendirme İşlemleri için Yardımcı Fonksiyonlar
 */
import React from 'react';

/**
 * Para birimini formatlar (TL)
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '0,00 ₺';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0,00 ₺';
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

/**
 * Öğretmen durumuna göre stil sınıfını döndürür
 */
export const getStatusClass = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Devlet desteği durumuna göre stil sınıfını döndürür
 */
export const getDestekStatusClass = (status: string | null): string => {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  switch (status.toLowerCase()) {
    case 'onaylandı':
      return 'bg-green-100 text-green-800';
    case 'reddedildi':
      return 'bg-red-100 text-red-800';
    case 'beklemede':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Badge varyantını döndürür
 */
export const getBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
  switch (status) {
    case 'Beklemede':
      return "outline";
    case 'Onaylandı':
      return "default";
    case 'Reddedildi':
      return "destructive";
    default:
      return "secondary";
  }
};

/**
 * Arama terimini metinde vurgular
 */
export const highlightSearchTerm = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm.trim()) return text;
  
  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === searchTerm.toLowerCase() 
          ? <span key={i} className="bg-yellow-200">{part}</span> 
          : part
      )}
    </>
  );
}; 