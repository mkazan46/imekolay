import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Logo from './Logo';
import { ChevronRight, User, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  getTeachers, 
  verifyTeacherWithPassword, 
  isAccountLocked,
  setTeacherPassword,
  Teacher,
  supabase
} from '@/lib/supabase';

// Öğretmen listesi komponentini optimize et
const TeachersList = memo(({ 
  isLoadingTeachers, 
  teachers, 
  selectedTeacher, 
  onTeacherSelect 
}: { 
  isLoadingTeachers: boolean; 
  teachers: Teacher[]; 
  selectedTeacher: string;
  onTeacherSelect: (value: string) => void;
}) => {
  // Debug için son seçilen öğretmen bilgisini kontrol etme
  console.log("TeachersList render - selectedTeacher:", selectedTeacher);
  console.log("TeachersList render - teachers:", teachers.length);
  
  // Seçilen öğretmen detaylarını al
  const selectedTeacherDetails = teachers.find(
    t => t.id && t.id.toString() === selectedTeacher
  );
  console.log("TeachersList render - selectedTeacherDetails:", selectedTeacherDetails?.name || "Bulunamadı");
  
  return (
  <div className="space-y-2">
      <Label htmlFor="teacher-trigger" className="flex items-center gap-2 font-medium">
      <User size={16} className="text-muted-foreground" />
        Öğretmen
    </Label>
      <Select 
        defaultValue={selectedTeacher} 
        value={selectedTeacher} 
        onValueChange={onTeacherSelect}
      >
        <SelectTrigger id="teacher-trigger" className="w-full h-12 border-input bg-background">
        <SelectValue placeholder="Öğretmen seçiniz">
            {selectedTeacherDetails ? selectedTeacherDetails.name : "Öğretmen seçiniz"}
        </SelectValue>
      </SelectTrigger>
        <SelectContent 
          position="popper" 
          side="bottom"
          align="center"
          sideOffset={4}
          alignOffset={0}
          avoidCollisions={true}
          collisionPadding={{ top: 20, bottom: 20, left: 20, right: 20 }}
          className="w-[calc(100vw-48px)] sm:w-full max-h-[50vh] border border-border bg-card z-[9999] overflow-visible shadow-lg"
        >
          <div className="p-1 pt-3">
        {isLoadingTeachers ? (
              <div className="py-4 px-2 text-center">Yükleniyor...</div>
        ) : teachers.length > 0 ? (
              <div className="overflow-y-auto max-h-[45vh]">
                {teachers.map((teacher) => (
            <SelectItem 
              key={teacher.id} 
                    value={teacher.id.toString()}
                    className="cursor-pointer py-4 hover:bg-accent text-base mb-1"
            >
              {teacher.name}
            </SelectItem>
                ))}
              </div>
        ) : (
              <div className="py-4 px-2 text-center">Öğretmen bulunamadı</div>
        )}
          </div>
      </SelectContent>
    </Select>
  </div>
  );
});

// Şifre belirleme bileşeni
const PasswordSetupForm = ({ 
  teacherId, 
  teacherName,
  onSuccess, 
  onCancel 
}: { 
  teacherId: string;
  teacherName: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter uzunluğunda olmalıdır.",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Hata",
        description: "Şifreler eşleşmiyor.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { success, error } = await setTeacherPassword(teacherId, password);
      
      if (error) {
        toast({
          title: "Hata",
          description: "Şifre belirlenirken bir hata oluştu.",
          variant: "destructive",
        });
        return;
      }
      
      if (success) {
        toast({
          title: "Başarılı",
          description: "Şifreniz başarıyla belirlendi. Şimdi giriş yapabilirsiniz.",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Şifre belirlenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden animate-fade-in glass-panel">
      <CardHeader className="space-y-4 text-center pb-6">
        <div className="mx-auto pb-2">
          <Logo />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Şifre Belirleme
        </CardTitle>
        <CardDescription className="text-base">
          Merhaba {teacherName}, lütfen kullanacağınız bir şifre belirleyin.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 font-medium">
                <KeyRound size={16} className="text-muted-foreground" />
                Yeni Şifre
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Yeni şifrenizi giriniz"
                  className="h-12 border-input bg-background pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2 font-medium">
                <KeyRound size={16} className="text-muted-foreground" />
                Şifre Tekrar
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifrenizi tekrar giriniz"
                className="h-12 border-input bg-background"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline"
              className="w-full h-12 text-base font-medium"
              onClick={onCancel}
            >
              İptal
            </Button>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium btn-hover-effect group transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Şifre Belirleniyor...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Şifreyi Belirle
                  <ChevronRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const LoginForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [checkingFirstLogin, setCheckingFirstLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Öğretmen seçildiğinde ilk giriş mi kontrol et - useEffect'ten önce tanımlanmalı
  const checkIfFirstLogin = useCallback(async (teacherId: string) => {
    if (!teacherId) return;
    
    setCheckingFirstLogin(true);
    try {
      // Dummy password kullanarak doğrulama yapalım
      const { isFirstLogin: isFirst } = await verifyTeacherWithPassword(teacherId, "dummy-check");
      setIsFirstLogin(isFirst);
    } catch (error) {
      console.error("İlk giriş kontrolü sırasında hata:", error);
      setIsFirstLogin(false);
    } finally {
      setCheckingFirstLogin(false);
    }
  }, []);

  // Performans için işlevleri useCallback ile sarıyoruz
  const handleTeacherSelect = useCallback((value: string) => {
    console.log("🔄 handleTeacherSelect çağrıldı, value:", value);
    setSelectedTeacher(value);
    // Son seçilen öğretmeni localStorage'a kaydet
    localStorage.setItem('lastSelectedTeacher', value);
    
    setPassword('');
    setConfirmPassword('');
    // Öğretmen seçildiğinde ilk giriş mi kontrol et
    checkIfFirstLogin(value);
  }, [checkIfFirstLogin]);

  // Öğretmen verilerini getir
  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoadingTeachers(true);
      try {
        // Tüm kullanıcıları getir - hiçbir filtreleme olmadan
        const { data, error } = await supabase
          .from('kullanicilar')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Öğretmen listesi alınırken hata:', error);
          throw error;
        }
        
        console.log('Tüm kullanıcılar başarıyla getirildi:', data?.length || 0, 'kayıt');
        // Her kullanıcının adını konsola yazdır
        data?.forEach((user, index) => {
          console.log(`${index + 1}. Kullanıcı:`, user.name);
        });
        
        // Tüm kullanıcıları state'e kaydet
        setTeachers(data || []);
      } catch (error) {
        console.error('Öğretmen listesi alınırken hata:', error);
        toast({
          title: "Hata",
          description: "Öğretmen listesi yüklenirken bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, [toast]);

  // Öğretmen listesi yüklendiğinde son seçilen öğretmeni seç
  useEffect(() => {
    // Öğretmen listesi yüklenmişse devam et
    if (teachers.length === 0 || isLoadingTeachers) {
      return;
    }
    
    console.log("🔄 Öğretmen listesi hazır, son seçilen öğretmen kontrol ediliyor");
    
    // Tarayıcıda daha önce hiç giriş yapılıp yapılmadığını kontrol et
    const visitedBefore = localStorage.getItem('visitedBefore');
    
    // localStorage'dan son seçilen öğretmeni al
    const lastSelectedTeacher = localStorage.getItem('lastSelectedTeacher');
    console.log("🔍 localStorage'dan alınan öğretmen ID:", lastSelectedTeacher);
    
    // İlk ziyaret ise, listenin başındaki öğretmeni seç
    if (!visitedBefore) {
      console.log("🆕 İlk ziyaret tespit edildi, listenin başındaki öğretmen seçiliyor");
      localStorage.setItem('visitedBefore', 'true'); // İlk ziyaret kaydediliyor
      
      // Listenin başındaki öğretmeni seç
      if (teachers.length > 0) {
        const firstTeacherId = teachers[0].id.toString();
        console.log("🔄 İlk öğretmen seçiliyor:", firstTeacherId, "Adı:", teachers[0].name);
        setSelectedTeacher(firstTeacherId);
        checkIfFirstLogin(firstTeacherId);
      }
      return;
    }
    
    // Daha önce ziyaret edilmiş, son seçilen öğretmeni kontrol et
    if (lastSelectedTeacher && lastSelectedTeacher.trim() !== '') {
      // Listede bu öğretmen var mı kontrol et
      const foundTeacher = teachers.find(
        (t) => t.id && t.id.toString() === lastSelectedTeacher
      );
      
      if (foundTeacher) {
        console.log("✅ Öğretmen bulundu:", foundTeacher.name);
        const teacherId = foundTeacher.id.toString();
        
        // Sadece farklıysa güncelle
        if (teacherId !== selectedTeacher) {
          console.log("🔄 setSelectedTeacher çağrılıyor:", teacherId);
          setSelectedTeacher(teacherId);
          checkIfFirstLogin(teacherId);
        } else {
          console.log("ℹ️ Öğretmen zaten seçili:", teacherId);
        }
      } else if (teachers.length > 0) {
        // Bulunamadıysa ilk öğretmeni seç
        console.log("⚠️ Son seçilen öğretmen listede bulunamadı, ilk öğretmen seçiliyor");
        const firstTeacherId = teachers[0].id.toString();
        setSelectedTeacher(firstTeacherId);
        checkIfFirstLogin(firstTeacherId);
      }
    } else if (teachers.length > 0) {
      // localStorage'da kayıt yoksa ilk öğretmeni seç
      console.log("ℹ️ localStorage'da kayıtlı öğretmen bulunamadı, ilk öğretmen seçiliyor");
      const firstTeacherId = teachers[0].id.toString();
      setSelectedTeacher(firstTeacherId);
      checkIfFirstLogin(firstTeacherId);
    }
  }, [teachers, isLoadingTeachers, selectedTeacher, checkIfFirstLogin]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Her yeni giriş denemesinde önceki hata mesajını temizle
    setLoginError(null);
    
    if (!selectedTeacher) {
      toast({
        title: "Hata",
        description: "Lütfen bir öğretmen seçin.",
        variant: "destructive",
      });
      return;
    }
    
    // İlk giriş ise şifre belirleme işlemi yap
    if (isFirstLogin) {
      if (password.length < 5) {
        setLoginError("Şifre en az 5 karakter uzunluğunda olmalıdır.");
        toast({
          title: "Hata",
          description: "Şifre en az 5 karakter uzunluğunda olmalıdır.",
          variant: "destructive",
        });
        return;
      }
      
      if (password !== confirmPassword) {
        setLoginError("Şifreler eşleşmiyor.");
        toast({
          title: "Hata",
          description: "Şifreler eşleşmiyor.",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoading(true);
      
      try {
        const { success, error } = await setTeacherPassword(selectedTeacher, password);
        
        if (error) {
          setLoginError("Şifre belirlenirken bir hata oluştu.");
          toast({
            title: "Hata",
            description: "Şifre belirlenirken bir hata oluştu.",
            variant: "destructive",
          });
          return;
        }
        
        if (success) {
          // Şifre belirlendikten sonra hemen giriş yap
          const { data } = await verifyTeacherWithPassword(selectedTeacher, password);
          
          if (data) {
            sessionStorage.setItem('teacherData', JSON.stringify(data));
            sessionStorage.setItem('isLoggedIn', 'true');
            
            toast({
              title: "Başarılı",
              description: "Şifreniz belirlendi ve giriş yapıldı.",
            });
            
            navigate('/dashboard');
          }
        }
      } catch (error) {
        setLoginError("Şifre belirlenirken bir hata oluştu.");
        toast({
          title: "Hata",
          description: "Şifre belirlenirken bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Normal giriş
    if (!password) {
      setLoginError("Lütfen şifrenizi girin.");
      toast({
        title: "Hata",
        description: "Lütfen şifrenizi girin.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Artık verifyTeacherWithPassword içinde hesap kilitleme kontrolü yapılıyor
      // o yüzden ayrıca isAccountLocked kontrolüne gerek yok
      
      const { data, error } = await verifyTeacherWithPassword(selectedTeacher, password);
      
      if (error) {
        setLoginError(error.message || "Giriş yapılırken bir hata oluştu.");
        toast({
          title: "Hata",
          description: error.message || "Giriş yapılırken bir hata oluştu.",
          variant: "destructive",
        });
        return;
      }
      
      if (!data) {
        setLoginError("Giriş bilgileri hatalı.");
        toast({
          title: "Hata",
          description: "Giriş bilgileri hatalı.",
          variant: "destructive",
        });
        return;
      }
      
      // Kullanıcı bilgilerini saklama (session storage kullanıldı - daha güvenli bir yöntem eklenebilir)
      sessionStorage.setItem('teacherData', JSON.stringify(data));
      sessionStorage.setItem('isLoggedIn', 'true');
      
      toast({
        title: "Başarılı",
        description: "Giriş başarıyla yapıldı.",
      });
      
      navigate('/dashboard');
    } catch (error) {
      setLoginError("Giriş yapılırken bir hata oluştu.");
      toast({
        title: "Hata",
        description: "Giriş yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedTeacher, password, confirmPassword, isFirstLogin, toast, navigate]);

  // Buton içeriğini memo ile optimize ediyoruz
  const buttonContent = useMemo(() => {
    if (isLoading) {
      return (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {isFirstLogin ? "Şifre Oluşturuluyor..." : "Giriş Yapılıyor..."}
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center">
        {isFirstLogin ? "Şifreyi Kaydet ve Giriş Yap" : "Giriş Yap"}
        <ChevronRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
      </span>
    );
  }, [isLoading, isFirstLogin]);

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden animate-fade-in glass-panel">
      <CardHeader className="space-y-4 text-center pb-6">
        <div className="mx-auto pb-2">
          <Logo />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Kavlaklı Mesleki Eğitim Merkezi
        </CardTitle>
        <CardDescription className="text-base">
          Dekont Takip Sistemi v2
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-6">
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <TeachersList 
              isLoadingTeachers={isLoadingTeachers}
              teachers={teachers}
              selectedTeacher={selectedTeacher}
              onTeacherSelect={handleTeacherSelect}
            />

            {checkingFirstLogin ? (
              <div className="text-center py-2">
                <svg className="animate-spin h-5 w-5 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <>
                {isFirstLogin && selectedTeacher ? (
                  <>
                    <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 p-3 rounded-md text-sm">
                      İlk kez giriş yapıyorsunuz. Lütfen bir şifre belirleyin.
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="flex items-center gap-2 font-medium">
                        <KeyRound size={16} className="text-muted-foreground" />
                        Şifre
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder="En az 5 karakter"
                          className="h-12 border-input bg-background pr-10"
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </div>

            <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="flex items-center gap-2 font-medium">
                <KeyRound size={16} className="text-muted-foreground" />
                        Şifre Tekrar
              </Label>
              <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder="Şifrenizi tekrar giriniz"
                        className="h-12 border-input bg-background"
                        autoComplete="new-password"
              />
            </div>
                  </>
                ) : (
                  selectedTeacher && (
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="flex items-center gap-2 font-medium">
                        <KeyRound size={16} className="text-muted-foreground" />
                        Şifre
                      </Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder="Şifrenizi giriniz"
                          className="h-12 border-input bg-background pr-10"
                          autoComplete="current-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </div>
                  )
                )}
                
                {/* Hata mesajları için alan */}
                {loginError && (
                  <div className="bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 p-3 rounded-md text-sm font-medium border border-red-200 dark:border-red-800">
                    {loginError}
                  </div>
                )}
              </>
            )}
          </div>

          {selectedTeacher && !checkingFirstLogin && (
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium btn-hover-effect group transition-all"
            disabled={isLoading}
          >
            {buttonContent}
          </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
