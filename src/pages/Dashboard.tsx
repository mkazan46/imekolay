import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, FileText, Download, Save, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  getTeacherBusinesses, 
  getTeacherStudents, 
  updateMultipleOgrenciOdemeEvraki,
  Business,
  Ogrenci,
  getSystemStatus
} from '@/lib/supabase';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import './dashboard.css';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [students, setStudents] = useState<Ogrenci[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Ogrenci[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modifiedRows, setModifiedRows] = useState<Record<number, boolean>>({});
  const [openBusinesses, setOpenBusinesses] = useState<Record<number, boolean>>({});
  const [currentTeacher, setCurrentTeacher] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [odemeEvrakiFilter, setOdemeEvrakiFilter] = useState<string>("tümü");
  const [systemStatus, setSystemStatus] = useState<{isActive: boolean, message: string}>({ isActive: true, message: "" });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Yetkilendirme kontrolü öncesinde sistem durumu kontrolü yap
  useEffect(() => {
    const checkSystemStatus = async () => {
      const status = await getSystemStatus();
      setSystemStatus(status);
    };
    
    checkSystemStatus();
  }, []);
  
  // Yetkilendirme kontrolü ve öğretmen bilgilerini getir
  useEffect(() => {
    // Sistem kapalıysa diğer işlemleri yapmadan uyarı göster
    if (!systemStatus.isActive) {
      return;
    }
    
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      // Session bulunamadı, localStorageden son giriş yapan öğretmeni kontrol et
      const savedTeacherData = localStorage.getItem('lastTeacherData');
      if (savedTeacherData) {
        try {
          const teacher = JSON.parse(savedTeacherData);
          // console.log\("Son giriş yapan öğretmen verisi kullanılıyor:", teacher.name || "İsimsiz");
          
          toast({
            title: "Bilgi",
            description: "Son oturumunuz tekrar yüklendi.",
          });
          
          // Öğretmen verisini geçici olarak kaydet
          sessionStorage.setItem('teacherData', savedTeacherData);
          sessionStorage.setItem('isLoggedIn', 'true');
          
          // Ayrıca son seçilen öğretmen ID'sini de sakla
          if (teacher.id) {
            const teacherId = teacher.id.toString();
            // console.log\("Son giriş yapan öğretmen ID'si kaydediliyor:", teacherId);
            localStorage.setItem('lastSelectedTeacher', teacherId);
          }
          
          setCurrentTeacher(teacher);
          return;
        } catch (error) {
          console.error("Kayıtlı öğretmen verileri yüklenemedi:", error);
        }
      }
      
      // Kayıtlı oturum bulunamadı, giriş sayfasına yönlendir
      toast({
        title: "Yetkisiz Erişim",
        description: "Bu sayfaya erişim için giriş yapmanız gerekmektedir.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    // Öğretmen bilgilerini getir
    const teacherData = sessionStorage.getItem('teacherData');
    if (teacherData) {
      const teacher = JSON.parse(teacherData);
      setCurrentTeacher(teacher);
      
      // Öğretmen bilgilerini localStorage'a kaydet (kalıcı olarak)
      // console.log\("Öğretmen verisi localStorage'a kaydediliyor:", teacher.name || "İsimsiz");
      localStorage.setItem('lastTeacherData', teacherData);
      
      // Ayrıca son seçilen öğretmen ID'sini de sakla
      if (teacher.id) {
        const teacherId = teacher.id.toString();
        // console.log\("Öğretmen ID'si lastSelectedTeacher olarak kaydediliyor:", teacherId);
        localStorage.setItem('lastSelectedTeacher', teacherId);
      }
    } else {
      toast({
        title: "Hata",
        description: "Öğretmen bilgileri bulunamadı.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [navigate, toast, systemStatus]);
  
  // Öğretmenin işletmelerini ve öğrencilerini getir
  useEffect(() => {
    const fetchData = async () => {
      if (!currentTeacher) return;

      setIsLoading(true);
      try {
        // Öğretmenin işletmelerini getir
        const { data: businessesData, error: businessError } = await getTeacherBusinesses(currentTeacher.id);
        
        if (businessError) {
          console.error("İşletmeler getirilirken hata oluştu:", businessError);
          toast({
            title: "Hata",
            description: "İşletme verileri yüklenirken bir hata oluştu.",
            variant: "destructive",
          });
          // Hata durumunda örnek veri yükle
          setBusinesses([
            { id: 1, name: "ABC Kuyumculuk", address: "İstanbul", phone: "123456789", contact_person: "Ahmet Bey", industry: "Kuyumculuk", atanan_ogretmenler: currentTeacher.id },
            { id: 2, name: "XYZ Elektronik", address: "Ankara", phone: "987654321", contact_person: "Mehmet Bey", industry: "Elektronik", atanan_ogretmenler: currentTeacher.id },
          ]);
        } else {
          // İşletmeleri alfabetik olarak sırala
          const sortedBusinesses = [...(businessesData || [])].sort((a, b) => 
            (a.name || "").localeCompare(b.name || "", 'tr')
          );
          setBusinesses(sortedBusinesses);
        }

        // Öğretmenin öğrencilerini getir
        const { data: studentsData, error: studentsError } = await getTeacherStudents(currentTeacher.id);
        
        if (studentsError) {
          console.error("Öğrenciler getirilirken hata oluştu:", studentsError);
          toast({
            title: "Hata", 
            description: "Öğrenci verileri yüklenirken bir hata oluştu.",
            variant: "destructive",
          });
          // Hata durumunda örnek veri yükle
          setStudents([
            { id: 1, sira_no: 1, kimlik_no: "12345678901", ad_soyad: "Ali Yılmaz", sinif: "10-A", isletme_id: 1, isletme_adi: "ABC Kuyumculuk", ucret: 500, odeme_evraki_durumu: "Ödeme Evrağı Teslim Edildi", tarih: "15.10.2023" },
            { id: 2, sira_no: 2, kimlik_no: "23456789012", ad_soyad: "Ayşe Demir", sinif: "11-B", isletme_id: 1, isletme_adi: "ABC Kuyumculuk", ucret: 750, odeme_evraki_durumu: "Ödeme Evrağı Zamanında Teslim Edilmedi", tarih: "20.09.2023" },
            { id: 3, sira_no: 3, kimlik_no: "34567890123", ad_soyad: "Mehmet Kaya", sinif: "9-C", isletme_id: 2, isletme_adi: "XYZ Elektronik", ucret: 450, odeme_evraki_durumu: "Ödeme Evrağı Teslim Edildi", tarih: "05.11.2023" },
            { id: 4, sira_no: 4, kimlik_no: "45678901234", ad_soyad: "Fatma Çelik", sinif: "12-A", isletme_id: 2, isletme_adi: "XYZ Elektronik", ucret: 600, odeme_evraki_durumu: "Ödeme Evrağı Zamanında Teslim Edilmedi", tarih: "30.08.2023" },
          ]);
        } else {
          // Öğrencileri işletme adına ve sonra ad soyadına göre sırala
          const sortedStudents = [...(studentsData || [])].sort((a, b) => {
            // Önce işletme adına göre sırala
            const businessComparison = (a.isletme_adi || "").localeCompare(b.isletme_adi || "", 'tr');
            
            // İşletme adları aynıysa, öğrenci adına göre sırala
            if (businessComparison === 0) {
              return (a.ad_soyad || "").localeCompare(b.ad_soyad || "", 'tr');
            }
            
            // İşletme adları farklıysa, işletme adına göre sırala
            return businessComparison;
          });
          setStudents(sortedStudents);
        }
      } catch (error) {
        console.error('Veri getirilirken hata oluştu:', error);
        toast({
          title: "Hata",
          description: "Veriler yüklenirken bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentTeacher) {
      fetchData();
    }
  }, [currentTeacher, toast]);

  // Türkçe karakterleri ve büyük/küçük harf duyarlılığını kaldıran yardımcı fonksiyon
  const normalizeText = useCallback((text: string = "") => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/i̇/g, 'i') // i ile nokta
      .replace(/İ/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u');
  }, []);

  // Ödeme evrakı durumunu değiştir
  const handleOdemeEvrakiChange = useCallback((studentId: number) => {
    // Öğrenciyi bul
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    // Yeni durumu belirle
    const isCurrentlyChecked = student.odeme_evraki_durumu === "Ödeme Evrağı Teslim Edildi";
    const newStatus = isCurrentlyChecked 
      ? "Ödeme Evrağı Zamanında Teslim Edilmedi" 
      : "Ödeme Evrağı Teslim Edildi";
    
    // Değişiklik kaydı oluştur
    setModifiedRows(prev => ({
      ...prev,
      [studentId]: !isCurrentlyChecked
    }));
    
    // Öğrencinin durumunu güncelle
    setStudents(prev => prev.map(s => 
      s.id === studentId 
        ? { ...s, odeme_evraki_durumu: newStatus } 
        : s
    ));
  }, [students]);

  // Arama için filtreleme
  useEffect(() => {
    if (!students.length) return;
    
    const normalizedSearchTerm = normalizeText(searchTerm);
    
    const filtered = students.filter(student => {
      // Her öğrenci alanını normalize et
      const normalizedName = normalizeText(student.ad_soyad || "");
      const normalizedKimlikNo = normalizeText(student.kimlik_no || "");
      const normalizedBusinessName = normalizeText(student.isletme_adi || "");
      
      // Normalize edilmiş arama terimi ile karşılaştır
      const matchesSearchTerm = normalizedName.includes(normalizedSearchTerm) || 
             normalizedKimlikNo.includes(normalizedSearchTerm) || 
             normalizedBusinessName.includes(normalizedSearchTerm);
      
      // Ödeme evrakı durumu filtrelemesi
      const matchesOdemeEvraki = odemeEvrakiFilter === "tümü" || 
                                student.odeme_evraki_durumu === odemeEvrakiFilter;
      
      // Her iki kritere de uymalı
      return matchesSearchTerm && matchesOdemeEvraki;
    });
    
    // Öğrencileri sırala: Önce işletme adına göre, sonra öğrenci adına göre
    const sortedFiltered = [...filtered].sort((a, b) => {
      // Önce işletme adına göre sırala
      const businessComparison = (a.isletme_adi || "").localeCompare(b.isletme_adi || "", 'tr');
      
      // İşletme adları aynıysa, öğrenci adına göre sırala
      if (businessComparison === 0) {
        return (a.ad_soyad || "").localeCompare(b.ad_soyad || "", 'tr');
      }
      
      // İşletme adları farklıysa, işletme adına göre sırala
      return businessComparison;
    });
    
    setFilteredStudents(sortedFiltered);
    // Toplam sayfa sayısını güncelle
    setTotalPages(Math.ceil(sortedFiltered.length / itemsPerPage));
    
    // Arama yapıldığında ilk sayfaya dön
    if (searchTerm !== prevSearchRef.current || odemeEvrakiFilter !== prevFilterRef.current) {
      setCurrentPage(1);
      prevSearchRef.current = searchTerm;
      prevFilterRef.current = odemeEvrakiFilter;
    }
  }, [searchTerm, students, itemsPerPage, odemeEvrakiFilter]);

  // Önceki değerleri takip etmek için ref oluştur
  const prevSearchRef = useRef(searchTerm);
  const prevFilterRef = useRef(odemeEvrakiFilter);
  
  // Sayfalama için öğrenci listesini oluştur
  const paginatedStudents = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredStudents, itemsPerPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // İşletmeyi aç/kapat
  const toggleBusiness = useCallback((businessId: number) => {
    setOpenBusinesses(prev => ({
      ...prev,
      [businessId]: !prev[businessId]
    }));
  }, []);

  // Değişiklikleri kaydet
  const handleSaveChanges = useCallback(async () => {
    if (Object.keys(modifiedRows).length === 0) {
      toast({
        title: "Bilgi",
        description: "Kaydedilecek değişiklik bulunmuyor.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Değişiklikleri hazırla
      const updates = Object.entries(modifiedRows).map(([studentId, isChecked]) => {
        // İlgili öğrenciyi bul ve onun tablo adını al
        const student = students.find(s => s.id === parseInt(studentId));
        
        return {
        id: parseInt(studentId),
        odeme_evraki_durumu: isChecked 
          ? "Ödeme Evrağı Teslim Edildi" 
            : "Ödeme Evrağı Zamanında Teslim Edilmedi",
          table_name: student?.table_name // Öğrencinin bulunduğu tablo adını da gönder
        };
      });
      
      // API'ye gönder
      const { success, error } = await updateMultipleOgrenciOdemeEvraki(updates);
      
      if (success) {
        // Daha görünür bir başarı mesajı göster
        toast({
          title: "BAŞARILI",
          description: "Değişiklikler başarıyla kaydedildi.",
          variant: "success", // Yeşil renklerde göstermek için
          className: "bg-green-500 text-white font-bold border-none" // Ek stil
        });
        
        // Değişiklik kaydını temizle
        setModifiedRows({});
        
        // 2 saniye sonra giriş ekranına yönlendir
        setTimeout(() => {
          sessionStorage.removeItem('teacherData');
          sessionStorage.removeItem('isLoggedIn');
          navigate('/');
        }, 2000);
      } else {
        console.error("Ödeme evrakı durumu güncellenirken hata:", error);
        toast({
          title: "Hata",
          description: "Değişiklikler kaydedilirken bir hata oluştu.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Ödeme evrakı durumu güncellenirken hata:", error);
      toast({
        title: "Hata",
        description: "Değişiklikler kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [modifiedRows, toast, navigate, students]);

  const handleLogout = () => {
    // Session temizle
    sessionStorage.removeItem('teacherData');
    sessionStorage.removeItem('isLoggedIn');
    
    // localStorage bilgilerini SILME (Son öğretmen bilgisi korunacak)
    // localStorage.removeItem('lastTeacherData');
    // localStorage.removeItem('lastSelectedTeacher');
    
    // Anasayfaya yönlendir
    navigate('/');
    
    toast({
      title: "Bilgi",
      description: "Çıkış başarıyla yapıldı.",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  // TC Kimlik numarasını maskele (ilk 2 ve son 2 hane görünür, diğerleri *)
  const maskTCKimlikNo = (tcNo: string) => {
    if (!tcNo || tcNo.length < 5) return tcNo;
    
    const firstTwoDigits = tcNo.substring(0, 2);
    const lastTwoDigits = tcNo.substring(tcNo.length - 2);
    const maskedPart = '*'.repeat(tcNo.length - 4);
    
    return `${firstTwoDigits}${maskedPart}${lastTwoDigits}`;
  };

  // İşletmeye ait öğrencileri filtrele
  const getBusinessStudents = useCallback((businessId: number) => {
    const businessName = businesses.find(b => b.id === businessId)?.name || "";
    return (searchTerm ? filteredStudents : students).filter(student => 
      student.isletme_adi === businessName
    );
  }, [filteredStudents, students, businesses, searchTerm]);

  // Ödeme evrakı durumlarını hesapla
  const odemeEvrakiData = useMemo(() => {
    if (!students.length) return [];
    
    // Durumları say
    const teslimEdildiCount = students.filter(s => s.odeme_evraki_durumu === "Ödeme Evrağı Teslim Edildi").length;
    const teslimEdilmediCount = students.filter(s => s.odeme_evraki_durumu === "Ödeme Evrağı Zamanında Teslim Edilmedi").length;
    
    return [
      { name: 'Teslim Edildi', value: teslimEdildiCount, color: '#10b981' }, // daha canlı yeşil
      { name: 'Teslim Edilmedi', value: teslimEdilmediCount, color: '#f43f5e' }, // daha canlı kırmızı
    ];
  }, [students]);
  
  // Ödeme evrakı durumlarını yüzdeye çevir
  const hesaplaYuzde = (value: number) => {
    const toplam = students.length;
    if (!toplam) return 0;
    return Math.round((value / toplam) * 100);
  };
  
  // Pasta grafiği render fonksiyonu
  const renderPieChart = useCallback(() => {
    if (!students.length) return null;
    
    // Öğrenci sayısı için toplam hesapla
    const totalStudents = students.length;
    
    // Teslim edildi yüzdesi hesapla (daire içindeki metin için)
    const teslimYuzdesi = hesaplaYuzde(odemeEvrakiData[0]?.value || 0);
    
    return (
      <div className="hidden md:flex border rounded-lg bg-white shadow-sm h-auto items-center gap-3 px-3 py-2">
        {/* Sol taraf: Pasta grafik */}
        <div className="w-16 h-16 lg:w-20 lg:h-20 relative min-w-[64px] min-h-[64px]">
          {/* Kesin boyutlar belirleyerek grafiğin görünmesini sağlayalım */}
          <PieChart width={64} height={64} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <filter id="shadow" height="200%" width="200%" x="-50%" y="-50%">
                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#00000033" />
              </filter>
              {/* Gradient tanımları */}
              <linearGradient id="colorTeslimEdildi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="colorTeslimEdilmedi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
            <Pie
              data={odemeEvrakiData}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius="58%"
              outerRadius="90%"
              paddingAngle={3}
              dataKey="value"
              animationDuration={1200}
              animationBegin={200}
              animationEasing="ease-out"
              filter="url(#shadow)"
            >
              {odemeEvrakiData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 0 ? 'url(#colorTeslimEdildi)' : 'url(#colorTeslimEdilmedi)'} 
                  stroke="#fff"
                  strokeWidth={1}
                />
              ))}
            </Pie>
          </PieChart>
          
          {/* Orta kısımdaki yüzde göstergesi */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-sm lg:text-base font-bold text-gray-800">{teslimYuzdesi}%</div>
          </div>
        </div>
        
        {/* Sağ taraf: Açıklamalar */}
        <div className="flex flex-col text-xs space-y-0.5">
          <div className="text-xs font-medium mb-0.5">Ödeme Evrakı</div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(to bottom, #34d399, #10b981)' }}></div>
            <span><span className="font-medium">Teslim:</span> {odemeEvrakiData[0]?.value || 0} öğr.</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(to bottom, #fb7185, #f43f5e)' }}></div>
            <span><span className="font-medium">Edilmedi:</span> {odemeEvrakiData[1]?.value || 0} öğr.</span>
          </div>
        </div>
      </div>
    );
  }, [students, odemeEvrakiData, hesaplaYuzde]);

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 md:p-6 lg:p-8">
      {!systemStatus.isActive ? (
        <Card className="shadow-lg border-0 rounded-xl mb-6 overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-red-50 to-red-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center">
                <Logo />
                <div className="ml-4">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">Kavlaklı Mesleki Eğitim Merkezi</h1>
                  <p className="text-sm text-muted-foreground">Dekont Takip Sistemi v2 - Öğretmen Paneli</p>
                </div>
              </div>
              
              <div className="flex md:items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                <Button variant="outline" onClick={handleLogout} className="h-10 w-full md:w-auto">
                  Çıkış Yap
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block p-6 rounded-full bg-red-100 mb-6">
                <XCircle className="w-16 h-16 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-700 mb-4">SİSTEM BU AY KULLANIMA KAPATILMIŞTIR</h2>
              <p className="text-sm text-gray-500 mb-8">Lütfen sistem tekrar açıldığında giriş yapınız.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-0 rounded-xl mb-6 overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center">
                <Logo />
                <div className="ml-4">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">Kavlaklı Mesleki Eğitim Merkezi</h1>
                  <p className="text-sm text-muted-foreground">Dekont Takip Sistemi v2 - Öğretmen Paneli</p>
                </div>
              </div>
              
              <div className="flex md:items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                {renderPieChart()}
                
                <Button variant="outline" onClick={handleLogout} className="h-10 w-full md:w-auto">
                  Çıkış Yap
                </Button>
              </div>
            </div>
          </CardHeader>

          <div className="border-t border-gray-100"></div>
          
          <div className="px-6 pt-4 pb-2">
            <CardTitle className="text-xl text-gray-800">Öğrenci ve Devlet Desteği Bilgileri</CardTitle>
            <CardDescription className="mt-1">
              Atandığınız işletmelerdeki öğrencilerin listesi ve ödeme bilgileri aşağıda görüntülenmektedir.
            </CardDescription>
          </div>
          
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="İsim, TC No veya İşletme Adı ara..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveChanges} 
                  className="bg-green-600 hover:bg-green-700 text-white h-12 px-4 min-w-[200px] text-base"
                  disabled={isLoading || Object.keys(modifiedRows).length === 0}
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                  DEĞİŞİKLİKLERİ KAYDET {Object.keys(modifiedRows).length > 0 && `(${Object.keys(modifiedRows).length})`}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="mt-2 text-sm text-muted-foreground">Veriler yükleniyor...</div>
                </div>
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Henüz atanmış işletmeniz bulunmamaktadır.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-md border overflow-hidden overflow-x-auto pb-2">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px] text-sm sm:text-base py-3 sm:py-4">Sıra</TableHead>
                        <TableHead className="text-sm sm:text-base py-3 sm:py-4 hidden sm:table-cell">İşletme Adı</TableHead>
                        <TableHead className="text-sm sm:text-base py-3 sm:py-4">Ad Soyad</TableHead>
                        <TableHead className="text-sm sm:text-base py-3 sm:py-4 hidden md:table-cell">Kimlik No</TableHead>
                        <TableHead className="text-right text-sm sm:text-base py-3 sm:py-4 hidden sm:table-cell">Ücret</TableHead>
                        <TableHead className="text-center text-sm sm:text-base py-3 sm:py-4">
                          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                            <span className="hidden xs:inline">Ödeme Evrağı Durumu</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-accent">
                                  <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 sm:w-72">
                                <DropdownMenuItem 
                                  onClick={() => setOdemeEvrakiFilter("tümü")}
                                  className={`${odemeEvrakiFilter === "tümü" ? "bg-accent" : ""} py-2 sm:py-3 text-sm sm:text-base`}
                                >
                                  Tümü
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setOdemeEvrakiFilter("Ödeme Evrağı Teslim Edildi")}
                                  className={`${odemeEvrakiFilter === "Ödeme Evrağı Teslim Edildi" ? "bg-accent" : ""} py-2 sm:py-3 text-sm sm:text-base`}
                                >
                                  <span className="hidden sm:inline">Ödeme Evrağı Teslim Edildi</span>
                                  <span className="sm:hidden">Teslim Edildi</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setOdemeEvrakiFilter("Ödeme Evrağı Zamanında Teslim Edilmedi")}
                                  className={`${odemeEvrakiFilter === "Ödeme Evrağı Zamanında Teslim Edilmedi" ? "bg-accent" : ""} py-2 sm:py-3 text-sm sm:text-base`}
                                >
                                  <span className="hidden sm:inline">Ödeme Evrağı Zamanında Teslim Edilmedi</span>
                                  <span className="sm:hidden">Teslim Edilmedi</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 sm:py-6 text-muted-foreground text-sm sm:text-base">
                            Öğrenci bulunamadı.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedStudents().map((student, index) => (
                          <TableRow key={student.id} className="border-b border-border">
                            <TableCell className="text-sm sm:text-base py-2 sm:py-4 border-r">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                            <TableCell className="text-sm sm:text-base py-2 sm:py-4 hidden sm:table-cell border-r">{student.isletme_adi}</TableCell>
                            <TableCell className="text-sm sm:text-base py-2 sm:py-4 border-r">
                              <div>
                                {student.ad_soyad}
                                <div className="text-xs text-muted-foreground sm:hidden mt-1">
                                  {student.isletme_adi}
                                </div>
                                <div className="text-xs text-muted-foreground sm:hidden mt-1">
                                  {formatCurrency(student.ucret)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm sm:text-base py-2 sm:py-4 hidden md:table-cell border-r">{maskTCKimlikNo(student.kimlik_no)}</TableCell>
                            <TableCell className="text-right text-sm sm:text-base py-2 sm:py-4 hidden sm:table-cell border-r">{formatCurrency(student.ucret)}</TableCell>
                            <TableCell className="text-center py-2 sm:py-4">
                              <div className="relative flex items-center h-8 sm:h-12">
                                <div className="absolute left-1 sm:left-3 top-1/2 transform -translate-y-1/2 z-10">
                                  <Checkbox
                                    checked={student.odeme_evraki_durumu === "Ödeme Evrağı Teslim Edildi"}
                                    onCheckedChange={() => handleOdemeEvrakiChange(student.id)}
                                    className="h-4 w-4 sm:h-6 sm:w-6"
                                  />
                                </div>
                                <div className="ml-8 sm:ml-12 w-full">
                                  <div className={
                                    student.odeme_evraki_durumu === "Ödeme Evrağı Teslim Edildi" 
                                      ? "text-green-600 text-xs sm:text-sm md:text-base font-medium bg-green-100 px-1 sm:px-3 py-1 sm:py-2 rounded-full text-center w-full mx-auto"
                                      : "text-red-600 text-xs sm:text-sm md:text-base font-medium bg-red-100 px-1 sm:px-3 py-1 sm:py-2 rounded-full text-center w-full mx-auto"
                                  }>
                                    <span className="hidden sm:inline">{student.odeme_evraki_durumu}</span>
                                    <span className="sm:hidden">
                                      {student.odeme_evraki_durumu === "Ödeme Evrağı Teslim Edildi" 
                                        ? "Edildi" 
                                        : "Edilmedi"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Mobil uyumlu sayfalama */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent className="flex-wrap gap-2">
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                            className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} h-10 min-w-10 text-base`}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Mevcut sayfanın yakınındaki 2 sayfa ve ilk/son sayfalar gösterilsin
                            return page === 1 || 
                                   page === totalPages || 
                                   Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, index, array) => (
                            <div key={page} className="contents">
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <PaginationItem>
                                  <div className="px-2">...</div>
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink 
                                  onClick={() => setCurrentPage(page)} 
                                  isActive={currentPage === page}
                                  className="cursor-pointer h-10 min-w-10 text-base"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            </div>
                          ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                            className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} h-10 min-w-10 text-base`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
                
                {/* Sayfa bilgisi */}
                <div className="text-base text-center text-muted-foreground mt-4">
                  Toplam {filteredStudents.length} öğrenci, Sayfa {currentPage} / {totalPages}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
