import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';

// Çevre değişkenlerinden Supabase bilgilerini al
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Eğer çevre değişkenleri bulunamazsa hata göster
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL veya Anahtar bulunamadı. Lütfen .env dosyasını kontrol edin.');
}

// Singleton pattern - tek bir Supabase istemcisi oluştur
let supabaseInstance = null;

export const getSupabase = () => {
  if (supabaseInstance === null) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

// Bağlantı testi fonksiyonu
export const testConnection = async () => {
  try {
    // console.log("Supabase bağlantısı test ediliyor...");
    // console.log("URL:", supabaseUrl);
    // console.log("Anahtar:", supabaseAnonKey ? "Var (gizli)" : "Yok");
    
    // Doğrudan kullanicilar tablosunu kullanarak bağlantıyı test et
    const { data: usersData, error: usersError } = await supabase
      .from('kullanicilar')
      .select('count')
      .limit(1);
      
    if (usersError) {
      // Kullanicilar tablosu bulunamadıysa, isletmeler tablosunu dene
      const { data: businessData, error: businessError } = await supabase
        .from('isletmeler')
        .select('count')
        .limit(1);
        
      if (businessError) {
        console.error("Supabase bağlantı hatası:", businessError);
        return { 
          success: false, 
          message: `Bağlantı hatası: ${businessError.message}`,
          error: businessError 
        };
      }
      
      // console.log("Bağlantı başarılı, işletmeler tablosu mevcut.");
      return { success: true, message: "Bağlantı başarılı. İşletmeler tablosu erişilebilir." };
    }
    
    // console.log("Bağlantı başarılı, kullanıcılar tablosu mevcut.");
    
    // kullanicilar tablosunun varlığını kontrol et
    // console.log("kullanicilar tablosu kontrol ediliyor...");
    return { success: true, message: "Bağlantı başarılı. Kullanıcılar tablosu erişilebilir." };
    
  } catch (error) {
    console.error("Supabase bağlantı hatası:", error);
    return { 
      success: false, 
      message: `Bağlantı hatası: ${JSON.stringify(error)}`,
      error 
    };
  }
};

// Öğretmen türünü tanımla
export interface Teacher {
  id: string;
  name: string;
  password: string | null;
  is_first_login: boolean;
  login_attempts: number;
  locked_until: string | null;
  created_at?: string;
}

// Öğrenci türünü tanımla
export interface Student {
  id: number;
  name: string;
  tcn: string;
  class: string;
  paymentStatus: string;
  amount: string;
  date: string;
}

// İşyeri türünü tanımla
export interface Business {
  id: number;
  name: string; // Arayüzde name olarak kullanalım ama veritabanında isletme_adi
  address: string;
  phone: string;
  contact_person: string;
  industry?: string;  // İşletme sektörü/endüstri alanı
  atanan_ogretmenler?: string; // Atanan öğretmenin ID'si
}

// Devlet Desteği türünü tanımla
export interface DevletDestegi {
  id?: number;
  destek_turu: string;
  miktar: string;
  durum: string;
  tarih: string;
  dosya_url?: string;
  aciklama?: string;
  created_at?: string;
}

// Öğrenci bilgileri
export interface Ogrenci {
  id: number;
  sira_no?: number;
  ogr_id?: number;
  kimlik_no: string;
  ad_soyad: string;
  sinif?: string;
  isletme_id: number;
  isletme_adi: string;
  ucret: number;
  odeme_evraki_durumu: string;
  tarih?: string;
  table_name?: string; // Verinin geldiği tablo adı
}

// Auth helper functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Şifre ile öğretmen doğrulama
export const verifyTeacherWithPassword = async (teacherId: string, password: string): Promise<{ 
  data: Teacher | null, 
  error: any, 
  isFirstLogin: boolean 
}> => {
  // Öğretmen bilgilerini getir
  const { data, error } = await supabase
    .from('kullanicilar')
    .select('*')
    .eq('id', teacherId)
    .single();

  if (error || !data) {
    return { data: null, error, isFirstLogin: false };
  }

  // Hesabın kilitli olup olmadığını kontrol et - dummy check için atla
  if (password !== "dummy-check") {
    const isLocked = await isAccountLocked(teacherId);
    if (isLocked) {
      return { 
        data: null, 
        error: { 
          message: "Hesabınız çok fazla başarısız giriş denemesi nedeniyle kilitlenmiştir. Lütfen sistem yöneticinizle iletişime geçin." 
        }, 
        isFirstLogin: false 
      };
    }
  }

  // İlk giriş mi kontrol et
  const isFirstLogin = data.is_first_login === true || data.password === null;
  
  // Sadece kontrol için kullanılan dummy-check değeri ise
  if (password === "dummy-check") {
    return { data: null, error: null, isFirstLogin };
  }
  
  // İlk giriş ise başarılı kabul et
  if (isFirstLogin) {
    return { data, error: null, isFirstLogin: true };
  }
  
  // Şifreyi bcrypt ile doğrula
  let passwordMatches = false;
  try {
    // Eğer data.password formatı hash değilse (eski kayıtlar için)
    // bcrypt hash'leri her zaman $2a$, $2b$ veya $2y$ ile başlar
    if (data.password && !data.password.startsWith('$2')) {
      // Düz metin karşılaştırması
      passwordMatches = data.password === password;
      
      // Eski düz metin şifreyi otomatik olarak hashle ve kaydet
      if (passwordMatches) {
        await upgradePlaintextPassword(teacherId, password);
      }
    } else {
      // Normal bcrypt şifre kontrolü
      passwordMatches = await bcrypt.compare(password, data.password || '');
    }
  } catch (err) {
    console.error("Şifre doğrulama hatası:", err);
    passwordMatches = false;
  }
  
  if (!passwordMatches) {
    // Başarısız giriş denemesi sayısını artır
    const attempts = (data.login_attempts || 0) + 1;
    const isLocked = attempts >= 5;
    
    // Güncellenecek verileri hazırla
    const updateData: any = { login_attempts: attempts };
    
    // Eğer 5 başarısız deneme olduysa hesabı kilitle
    if (isLocked) {
      // 24 saat kilitle
      updateData.locked_until = new Date(Date.now() + 24*60*60*1000).toISOString();
    }
    
    // Veritabanını güncelle
    await supabase
      .from('kullanicilar')
      .update(updateData)
      .eq('id', teacherId);
      
    // Kalan deneme sayısını veya kilitlenme durumunu bildir
    const remainingAttempts = 5 - attempts;
    let errorMessage = "";
    
    if (isLocked) {
      errorMessage = "Çok fazla başarısız giriş denemesi. Hesabınız 24 saat süreyle kilitlenmiştir. Sistem yöneticinizle iletişime geçiniz.";
    } else {
      errorMessage = `Hatalı şifre. Kalan deneme: ${remainingAttempts}`;
    }
    
    return { 
      data: null, 
      error: { message: errorMessage }, 
      isFirstLogin: false 
    };
  }
  
  // Başarılı girişte deneme sayısını sıfırla ve kilit varsa kaldır
  await supabase
    .from('kullanicilar')
    .update({ login_attempts: 0, locked_until: null })
    .eq('id', teacherId);
  
  return { data, error: null, isFirstLogin: false };
};

// Düz metin şifreyi hash'e yükseltme (geçiş için yardımcı fonksiyon)
async function upgradePlaintextPassword(teacherId: string, plaintextPassword: string): Promise<void> {
  try {
    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plaintextPassword, salt);
    
    // Veritabanını güncelle
    await supabase
      .from('kullanicilar')
      .update({ password: hashedPassword })
      .eq('id', teacherId);
      
    // console.log(`Öğretmen ID ${teacherId} için şifre güvenli hashli formata yükseltildi`);
  } catch (error) {
    console.error("Şifre yükseltme hatası:", error);
  }
}

// Hesap kilitli mi kontrol et
export const isAccountLocked = async (teacherId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('kullanicilar')
    .select('locked_until, login_attempts')
    .eq('id', teacherId)
    .single();
    
  if (error || !data) return false;
  
  // locked_until null ise veya şu andan önceyse kilitli değil
  if (!data.locked_until) return false;
  
  const lockedUntil = new Date(data.locked_until);
  const now = new Date();
  
  // Kilit süresi dolduysa ve hala kilitliyse kilidi kaldır
  if (lockedUntil <= now) {
    // Kilit süresinin bittiğini fark ettik, kilidi kaldır ama başarısız giriş sayısını sıfırlama
    // Böylece kullanıcı sadece 5 deneme daha yapabilir, yani yeniden kilit işlemi kolaylaşır
    await supabase
      .from('kullanicilar')
      .update({ locked_until: null })
      .eq('id', teacherId);
    return false;
  }
  
  return true;
};

// Şifre belirle (ilk giriş veya şifre sıfırlama için)
export const setTeacherPassword = async (teacherId: string, password: string): Promise<{ success: boolean, error: any }> => {
  try {
    // Şifreyi güvenli bir şekilde hashle (10 round salt)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Hashlenen şifreyi veritabanına kaydet
    const { error } = await supabase
      .from('kullanicilar')
      .update({ 
        password: hashedPassword, // Hash edilmiş şifre
        is_first_login: false,
        login_attempts: 0,
        locked_until: null
      })
      .eq('id', teacherId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Şifre belirleme hatası:", error);
    return { success: false, error };
  }
};

// Database helper functions
export const getTeachers = async (): Promise<{ data: Teacher[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('kullanicilar')
    .select('*')
    .order('name', { ascending: true });
  return { data, error };
};

export const verifyTeacher = async (teacherId: string, tcNumber: string): Promise<{ data: Teacher | null, error: any }> => {
  // Sadece TC numarası ile kontrol, ID ile sorgulama kaldırıldı
  const { data, error } = await supabase
    .from('kullanicilar')
    .select('*')
    .eq('tc_no', tcNumber)
    .single();

  // TC numarası doğru ama ID farklı olabilir, bu durumda ID'yi kontrol et
  if (data && data.id !== teacherId) {
    // console.log(`Öğretmen TC doğrulandı fakat ID değişmiş. Eski ID: ${teacherId}, Yeni ID: ${data.id}`);
    // Burada ek işlemler yapılabilir, örneğin yeni ID kullanılabilir
  }  
  
  return { data, error };
};

export const getStudents = async (): Promise<{ data: Student[] | null, error: any }> => {
  // Students tablosuna erişim olmadığı için varsayılan boş dizi döndürüyoruz
  // 404 hatası almamak için supabase sorgusu kaldırıldı
  return { data: [], error: null };
};

export const getBusinesses = async (): Promise<{ data: Business[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('isletmeler')
    .select('*');
    
  // Veritabanı alanlarını arayüz alanlarına dönüştür
  const formattedData = data ? data.map(business => ({
    id: business.id,
    name: business.isletme_adi || "",
    address: business.address || business.adres || "",
    phone: business.phone || business.telefon || "",
    contact_person: business.contact_person || business.yetkili_kisi || "",
    industry: business.industry || business.sektor || "",
    atanan_ogretmenler: business.atanan_ogretmenler
  })) : null;
  
  return { data: formattedData, error };
};

export const getGovernmentSupport = async () => {
  return { data: [], error: null };
};

// Kullanicilar (Öğretmenler) CRUD operations
export const createTeacher = async (teacher: Omit<Teacher, 'id' | 'created_at'>) => {
  return await supabase
    .from('kullanicilar')
    .insert([teacher])
    .select();
};

export const updateTeacher = async (id: string, updates: Partial<Omit<Teacher, 'id' | 'created_at'>>) => {
  return await supabase
    .from('kullanicilar')
    .update(updates)
    .eq('id', id)
    .select();
};

export const deleteTeacher = async (id: string) => {
  const { error } = await supabase
    .from('kullanicilar')
    .delete()
    .eq('id', id);
  return { error };
};

export const getTeacherById = async (id: string) => {
  const { data, error } = await supabase
    .from('kullanicilar')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
};

// Business-Teacher Assignment operations
export const assignTeacherToBusiness = async (teacherId: string, businessId: number) => {
  const { error } = await supabase
    .from('isletmeler')
    .update({ atanan_ogretmenler: teacherId })
    .eq('id', businessId);
  return { error };
};

export const removeTeacherFromBusiness = async (teacherId: string, businessId: number) => {
  const { error } = await supabase
    .from('isletmeler')
    .update({ atanan_ogretmenler: null })
    .eq('id', businessId)
    .eq('atanan_ogretmenler', teacherId); // İlave kontrol - sadece bu öğretmen atanmışsa kaldır
  return { error };
};

export const getTeacherAssignments = async () => {
  const { data, error } = await supabase
    .from('isletmeler')
    .select(`
      id,
      isletme_adi,
      atanan_ogretmenler
    `)
    .not('atanan_ogretmenler', 'is', null); // Sadece atanmış olanları getir
  
  // Verileri eski formata dönüştür
  const formattedData = data ? data.map(business => ({
    business_id: business.id,
    teacher_id: business.atanan_ogretmenler,
    business_name: business.isletme_adi // İşletme adı da ekleyelim
  })) : [];
  
  return { data: formattedData, error };
};

// Admin yönetimi
export const createAdmin = async (email: string, password: string, name: string) => {
  // 1. Önce auth ile kullanıcı oluştur
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'admin', // Kullanıcı metadatasına admin rolü ekle
        name: name
      }
    }
  });

  if (authError) {
    return { error: authError };
  }

  // 2. Kullanıcı oluşturulduysa admins tablosuna ekle
  if (authData?.user) {
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
      return { error: insertError };
    }
  }

  return { data: authData, error: null };
};

// Admin kontrolü 
export const isAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const role = user?.user_metadata?.role;
  return role === 'admin' || role === 'superadmin';
};

// Tüm adminleri getir
export const getAdmins = async () => {
  const { data, error } = await supabase
    .from('admins')
    .select('*');
  return { data, error };
};

// Basit admin giriş kontrolü
export const checkAdminLogin = async (email: string, password: string) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();
  
  // Hata varsa veya data null ise giriş başarısız
  if (error || !data) {
    return { success: false, error: error || new Error('Geçersiz kullanıcı bilgileri') };
  }
  
  // Giriş başarılı, admin bilgileri döndür
  return { 
    success: true, 
    admin: {
      id: data.id,
      name: data.name,
      email: data.email
    } 
  };
};

// kullanicilar tablosunu oluştur ve örnek veriler ekle
export const createUsersTableIfNotExists = async () => {
  try {
    // console.log("kullanicilar tablosu oluşturma kontrolü başlatılıyor...");
    
    // Önce tablonun varlığını kontrol et
    const { data, error } = await supabase
      .from('kullanicilar')
      .select('count')
      .maybeSingle();
    
    if (error && error.code === 'PGRST116') {
      // Tablo bulunamadı hatası (Supabase'in PostgreSQL REST API hatası)
      // console.log("kullanicilar tablosu bulunamadı");
      
      // NOT: Supabase'de RPC ile tablo oluşturmak, güvenlik kısıtlamaları nedeniyle 
      // doğrudan desteklenmez. Tabloyu Supabase UI'dan oluşturmanız gerekecektir.
      return { 
        success: false, 
        message: `kullanicilar tablosu bulunamadı. Lütfen Supabase Dashboard'dan şu şekilde bir tablo oluşturun:
        - Tablo adı: kullanicilar
        - Sütunlar: 
          * id (uuid, primary key)
          * name (text)
          * tc_no (text)
          * created_at (timestamp with time zone, default: now())`,
      };
      
    } else if (error) {
      // Diğer hatalar
      console.error("Tablo kontrolü sırasında hata:", error);
      return { 
        success: false, 
        message: `Tablo kontrolü hatası: ${error.message}`,
        error 
      };
    } else {
      // Tablo var, bir şey yapmaya gerek yok
      // console.log("kullanicilar tablosu zaten mevcut, kayıt sayısı:", data?.count);
      return { success: true, message: "Tablo zaten mevcut" };
    }
  } catch (error) {
    console.error("Genel hata:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Bilinmeyen hata",
      error 
    };
  }
};

// Devlet Destekleri için fonksiyonlar
export const getDevletDestekleri = async (): Promise<{ data: DevletDestegi[] | null, error: any }> => {
  return { data: [], error: null };
};

export const getDevletDestegiById = async (id: number): Promise<{ data: DevletDestegi | null, error: any }> => {
  const { data, error } = await supabase
    .from('devlet_destegi')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
};

export const createDevletDestegi = async (destekData: Omit<DevletDestegi, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('devlet_destegi')
    .insert([destekData])
    .select();
  return { data, error };
};

export const updateDevletDestegi = async (id: number, updates: Partial<DevletDestegi>) => {
  const { data, error } = await supabase
    .from('devlet_destegi')
    .update(updates)
    .eq('id', id)
    .select();
  return { data, error };
};

export const deleteDevletDestegi = async (id: number) => {
  const { error } = await supabase
    .from('devlet_destegi')
    .delete()
    .eq('id', id);
  return { error };
};

// Dosya yükleme ve indirme işlemleri
export const uploadDevletDestegiFile = async (file: File, fileName: string) => {
  const { data, error } = await supabase.storage
    .from('devlet-destegi-dosyalari')
    .upload(fileName, file);
  return { data, error };
};

export const getFileUrl = async (filePath: string) => {
  const { data } = await supabase.storage
    .from('devlet-destegi-dosyalari')
    .getPublicUrl(filePath);
  return data.publicUrl;
};

export const downloadFile = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('devlet-destegi-dosyalari')
    .download(filePath);
  return { data, error };
};

// Tablo yoksa oluştur fonksiyonu
export const createTableIfNotExists = async (tableName: string) => {
  try {
    // Tablonun var olup olmadığını kontrol et (eğer tablo yoksa hata döndürecek)
    const { error } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') { // Tablo bulunamadı hatası
      // console.log(`${tableName} tablosu bulunamadı, oluşturuluyor...`);
      
      try {
        // SQL sorgusu ile doğrudan Postgres veritabanına erişim
        // Supabase'in Function özelliğini kullanmak için Supabase dashboard'da
        // bir SQL function eklememiz gerekiyor
        
        // Bunun yerine, bu SQL'i sadece geliştirici konsoluna yazdıralım ve
        // tabloyu manuel olarak oluşturmalarını isteyeceğiz
        
        const sqlTemplate = `
          -- Bu SQL sorgusunu Supabase SQL Editöründe çalıştırın:
          CREATE TABLE IF NOT EXISTS "${tableName}" (
            id SERIAL PRIMARY KEY,
            sira_no INTEGER,
            ogr_id INTEGER,
            kimlik_no VARCHAR,
            ad_soyad VARCHAR,
            dal_adi VARCHAR,
            isletme_id INTEGER,
            isletme_adi VARCHAR,
            baslama DATE,
            ayrilis DATE,
            toplam_sure INTEGER,
            eksik_gun INTEGER,
            gun INTEGER,
            ucret NUMERIC,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            odeme_evraki_durumu VARCHAR
          );
        `;
        
        // console.log("Tablo oluşturmak için kullanılacak SQL:");
        // console.log(sqlTemplate);
        
        // Önceden tanımlanmış destek tablosunu kopyalayarak yeni tablo oluşturmayı deneyelim
        // Bu, mevcut destek tablosunun yapısını kullanarak yeni bir tablo oluşturur
        
        const { error: copyError } = await supabase.rpc('clone_table', { 
          source_table: 'devlet_destegi', 
          target_table: tableName 
        });
        
        if (copyError) {
          console.error("Tablo klonlama hatası:", copyError);
          return { 
            success: false, 
            message: `Tablo oluşturulamadı. Lütfen Supabase SQL Editöründe şu komutu çalıştırın: ${sqlTemplate}`,
            sqlCode: sqlTemplate 
          };
        }
        
        return { success: true, message: `${tableName} tablosu başarıyla oluşturuldu` };
      } catch (err) {
        console.error("Tablo oluşturma hatası:", err);
        
        // SQL çalıştırma başarısız oldu, kullanıcıya SQL sorgusunu manuel olarak çalıştırmalarını önereceğiz
        const sqlTemplate = `
          CREATE TABLE IF NOT EXISTS "${tableName}" (
            id SERIAL PRIMARY KEY,
            sira_no INTEGER,
            ogr_id INTEGER,
            kimlik_no VARCHAR,
            ad_soyad VARCHAR,
            dal_adi VARCHAR,
            isletme_id INTEGER,
            isletme_adi VARCHAR,
            baslama DATE,
            ayrilis DATE, 
            toplam_sure INTEGER,
            eksik_gun INTEGER,
            gun INTEGER,
            ucret NUMERIC,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            odeme_evraki_durumu VARCHAR
          );
        `;
        
        return { 
          success: false, 
          message: `Tablo otomatik olarak oluşturulamadı. Lütfen Supabase SQL Editöründe tabloyu manuel olarak oluşturun.`,
          sqlCode: sqlTemplate 
        };
      }
    }
    
    return { success: true, message: `${tableName} tablosu zaten mevcut` };
  } catch (error) {
    console.error(`Tablo kontrolü sırasında hata:`, error);
    return { success: false, message: `Tablo kontrolü sırasında hata: ${error}` };
  }
};

// Öğretmenin atandığı işletmeleri getir
export const getTeacherBusinesses = async (teacherId: string): Promise<{ data: Business[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('isletmeler')
    .select('*')
    .eq('atanan_ogretmenler', teacherId);
    
  // Veritabanı alanlarını arayüz alanlarına dönüştür
  const formattedData = data ? data.map(business => ({
    id: business.id,
    name: business.isletme_adi || "",
    address: business.address || business.adres || "",
    phone: business.phone || business.telefon || "",
    contact_person: business.contact_person || business.yetkili_kisi || "",
    industry: business.industry || business.sektor || "",
    atanan_ogretmenler: business.atanan_ogretmenler
  })) : null;
  
  return { data: formattedData, error };
};

// İşletmedeki öğrencileri getir
export const getBusinessStudents = async (businessId: number): Promise<{ data: Ogrenci[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('ogrenciler')
    .select('*')
    .eq('isletme_id', businessId);
    
  return { data, error };
};

// Bir öğretmenin tüm işletmelerindeki öğrencileri getir
export const getTeacherStudents = async (teacherId: string): Promise<{ data: Ogrenci[] | null, error: any }> => {
  // Önce öğretmenin işletmelerini bulalım
  const { data: businesses, error: businessError } = await getTeacherBusinesses(teacherId);
  
  if (businessError || !businesses) {
    return { data: null, error: businessError };
  }
  
  // İşletme yoksa boş dizi döndür
  if (businesses.length === 0) {
    return { data: [], error: null };
  }
  
  // İşletme adlarını al
  const businessNames = businesses.map(b => b.name);
  
  // Sabit tablo adını kullan
  const tableName = "devlet_destegi";
  
  // console.log(`Öğretmen için veri çekilecek tablo: ${tableName}`);
  
  // Bu işletme adına sahip öğrencileri sabit tablodan getir
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .in('isletme_adi', businessNames);
  
  if (error) {
    return { data: null, error };
  }
  
  return { data, error: null };
};

// Öğrenci ödeme evrakı durumunu güncelle
export const updateOgrenciOdemeEvraki = async (ogrenciId: number, durum: string): Promise<{ success: boolean, error: any }> => {
  // Sabit tablo adını kullan
  const tableName = "devlet_destegi";
  
  // console.log(`Öğrenci güncelleniyor, kullanılan tablo: ${tableName}`);
  
  const { error } = await supabase
    .from(tableName)
    .update({ odeme_evraki_durumu: durum })
    .eq('id', ogrenciId);
    
  return { success: !error, error };
};

// Birden fazla öğrencinin ödeme evrakı durumunu güncelle
export const updateMultipleOgrenciOdemeEvraki = async (
  updates: { id: number, odeme_evraki_durumu: string }[]
): Promise<{ success: boolean, error: any }> => {
  // Sabit tablo adını kullan
  const tableName = "devlet_destegi";
  
  // console.log(`Çoklu güncelleme için tablo: ${tableName}`);
  
  // Her güncelleme için ayrı sorgu yap
  const promises = updates.map(update => {
    return supabase
      .from(tableName)
      .update({ odeme_evraki_durumu: update.odeme_evraki_durumu })
      .eq('id', update.id);
  });
  
  try {
    const results = await Promise.all(promises);
    const hasError = results.some(result => result.error);
    
    return { 
      success: !hasError, 
      error: hasError ? results.find(r => r.error)?.error : null 
    };
  } catch (error) {
    return { success: false, error };
  }
};

// Tüm öğretmenleri getir
export const getAllTeachers = async () => {
  return await supabase
    .from('kullanicilar')
    .select('*')
    .order('name', { ascending: true });
};

// Kullanıcılar tablosundaki tüm kayıtları getir (Herhangi bir filtreleme olmadan)
export const getAllUsersRaw = async () => {
  const { data, error } = await supabase
    .from('kullanicilar')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Kullanıcılar tablosu çekilirken hata:', error);
  } else {
    // console.log('Kullanıcılar tablosu başarıyla çekildi:', data.length, 'kayıt');
    data.forEach((user, index) => {
      // console.log(`${index + 1}. Kayıt: ${user.name}`);
    });
  }
  
  return { data, error };
};

// Sistem durumu için arayüz
export interface SystemStatus {
  id: number;
  is_active: boolean;
  message: string;
  updated_at: string;
}

// Sistem durumunu getir (açık/kapalı)
export const getSystemStatus = async (): Promise<{ isActive: boolean, message: string }> => {
  try {
    // Sistem durumu tablosundan veri çek
    const { data, error } = await supabase
      .from('system_status')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Sistem durumu çekilirken hata:', error);
      
      // Varsayılan olarak sistem açık
      return { isActive: true, message: "Sistem aktif" };
    }
    
    return { 
      isActive: data?.is_active ?? true,
      message: data?.message || "Sistem durumu bilgisi"
    };
  } catch (error) {
    console.error('Sistem durumu kontrol edilirken hata:', error);
    // Hata durumunda varsayılan olarak sistem açık
    return { isActive: true, message: "Sistem aktif (varsayılan)" };
  }
};

// Sistem durumunu güncelle
export const updateSystemStatus = async (isActive: boolean, message: string): Promise<{ success: boolean, error?: any }> => {
  try {
    const { error } = await supabase
      .from('system_status')
      .upsert({
        id: 1, // Sadece tek kayıt kullanacağız
        is_active: isActive,
        message: message,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (error) {
      console.error('Sistem durumu güncellenirken hata:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Sistem durumu güncellenirken beklenmeyen hata:', error);
    return { success: false, error };
  }
};

// Sistem durumu tablosunu oluştur (eğer yoksa)
export const createSystemStatusTableIfNotExists = async () => {
  try {
    // Tabloyu kontrol et
    const { data, error } = await supabase
      .from('system_status')
      .select('count')
      .maybeSingle();
    
    if (error && error.code === 'PGRST116') {
      // Tablo bulunamadı, kullanıcıya bildir
      // console.log("system_status tablosu bulunamadı");
      
      return { 
        success: false, 
        message: `system_status tablosu bulunamadı. Lütfen Supabase Dashboard'dan şu şekilde bir tablo oluşturun:
        - Tablo adı: system_status
        - Sütunlar: 
          * id (integer, primary key)
          * is_active (boolean, default: true)
          * message (text)
          * updated_at (timestamp with time zone, default: now())`,
      };
    } else if (error) {
      console.error("Tablo kontrolü sırasında hata:", error);
      return { 
        success: false, 
        message: `Tablo kontrolü hatası: ${error.message}`,
        error 
      };
    } else {
      // console.log("system_status tablosu mevcut, kayıt sayısı:", data?.count);
      
      // Tablo var ama boşsa varsayılan değer ekle
      if (data?.count === 0) {
        const { error: insertError } = await supabase
          .from('system_status')
          .insert({
            id: 1,
            is_active: true,
            message: "Sistem aktif",
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error("Varsayılan sistem durumu eklenirken hata:", insertError);
        } else {
          // console.log("Varsayılan sistem durumu eklendi");
        }
      }
      
      return { success: true, message: "Tablo kontrol edildi ve hazır" };
    }
  } catch (error) {
    console.error("Genel hata:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Bilinmeyen hata",
      error 
    };
  }
};

// İşletme silme fonksiyonu
export const deleteBusiness = async (businessId: number) => {
  const { error } = await supabase
    .from('isletmeler')
    .delete()
    .eq('id', businessId);
  return { error };
};
