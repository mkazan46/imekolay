// Admin hesabı oluşturma scripti
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Çalışan dosya yolunu al
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env dosyasını yükle
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Çevre değişkenlerinden Supabase bilgilerini al
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL veya Anahtar bulunamadı. Lütfen .env dosyasını kontrol edin.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const email = 'kznmehmet46@gmail.com';
  const password = '46774677';
  const name = 'Mehmet Admin';

  // console.log\(`Admin oluşturuluyor: ${email}`);

  try {
    // 1. Auth ile kullanıcı oluştur
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // E-posta doğrulama yapmadan onaylar
      user_metadata: {
        role: 'admin',
        name: name
      }
    });

    if (authError) {
      console.error('Auth hatası:', authError.message);
      return;
    }

    // console.log\('Kullanıcı oluşturuldu:', authData.user.id);

    // 2. Admins tablosunu kontrol et
    const { error: tableCheckError } = await supabase.from('admins').select('count').limit(1);
    
    // Tablo yoksa oluştur
    if (tableCheckError && tableCheckError.code === '42P01') {
      // console.log\('Admins tablosu oluşturuluyor...');
      
      // Supabase SQL ile tablo oluştur
      // Not: Admin arayüzü üzerinden SQL editöründen de yapılabilir
      const createTableQuery = `
        CREATE TABLE public.admins (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login TIMESTAMP WITH TIME ZONE
        );
        
        ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Admins can read all records" 
          ON public.admins
          FOR SELECT 
          USING (auth.uid() IN (SELECT id FROM public.admins));
      `;
      
      // Bu fonksiyonu kullanmak için Supabase'de "exec" adlı bir function tanımlanmalı
      // veya alternatif olarak Supabase Dashboard'dan SQL editörü kullanılabilir
      // console.log\('UYARI: Tabloyu otomatik oluşturamıyoruz. Lütfen Supabase Dashboard\'dan aşağıdaki SQL sorgusunu çalıştırın:');
      // console.log\(createTableQuery);
    }

    // 3. Kullanıcıyı admins tablosuna ekle
    if (!tableCheckError) {
      const { error: insertError } = await supabase
        .from('admins')
        .insert([
          {
            id: authData.user.id,
            name: name,
            email: email
          }
        ]);

      if (insertError) {
        console.error('Admin tablosuna ekleme hatası:', insertError.message);
        return;
      }

      // console.log\('Admin başarıyla oluşturuldu.');
    } else {
      // console.log\('Kullanıcı oluşturuldu, ancak Admins tablosuna eklenemedi.');
      // console.log\('Lütfen Supabase Dashboard\'dan tabloyu manuel olarak oluşturun ve sonra kullanıcıyı ekleyin.');
    }

    // console.log\('E-posta:', email);
    // console.log\('Şifre:', password);
    // console.log\('Admin paneline giriş yapabilirsiniz: http://localhost:8084/admin-login');

  } catch (error) {
    console.error('Beklenmeyen hata:', error.message);
  }
}

createAdmin(); 
