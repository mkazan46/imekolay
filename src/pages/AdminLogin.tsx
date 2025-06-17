import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from '@/components/Logo';
import { Lock, Mail, ChevronRight, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { checkAdminLogin } from '@/lib/supabase'; // Basit admin giriş fonksiyonu

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Sayfa yüklendiğinde admin oturumu kontrol et
  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    
    // Eğer zaten admin girişi yapılmışsa direkt admin paneline yönlendir
    if (isAdmin) {
      // console.log\('Admin oturumu aktif, yönetici paneline yönlendiriliyor...');
      navigate('/admin');
    }
  }, [navigate]);

  // Input validation
  const validateEmail = useCallback((value: string) => {
    if (!value) {
      setEmailError('E-posta adresi gerekli');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Geçerli bir e-posta adresi girin');
      return false;
    }
    
    setEmailError('');
    return true;
  }, []);

  const validatePassword = useCallback((value: string) => {
    if (!value) {
      setPasswordError('Şifre gerekli');
      return false;
    }
    
    if (value.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalı');
      return false;
    }
    
    setPasswordError('');
    return true;
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) validateEmail(value);
  }, [emailError, validateEmail]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) validatePassword(value);
  }, [passwordError, validatePassword]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Basit admin giriş kontrolü
      const result = await checkAdminLogin(email, password);
      
      if (!result.success) {
        toast({
          title: "Giriş Başarısız",
          description: "E-posta veya şifre hatalı.",
          variant: "destructive",
        });
        return;
      }
      
      // Admin oturumu başlat
      sessionStorage.setItem('isAdmin', 'true');
      sessionStorage.setItem('adminData', JSON.stringify(result.admin));
      
      toast({
        title: "Başarılı",
        description: `Hoş geldiniz, ${result.admin.name}. Yönetici paneline yönlendiriliyorsunuz...`,
      });
      
      // Kısa bir gecikme ile yönlendir (toast mesajının görünmesi için)
      setTimeout(() => {
        navigate('/admin');
      }, 800);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Hata",
        description: "Giriş yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, validateEmail, validatePassword, toast, navigate]);

  // Optimize button loading state with useMemo
  const buttonContent = useMemo(() => {
    if (isLoading) {
      return (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Giriş Yapılıyor...
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center">
        Giriş Yap
        <ChevronRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
      </span>
    );
  }, [isLoading]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md mx-auto overflow-hidden animate-fade-in glass-panel shadow-xl">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto pb-2 relative">
            <Logo />
            <div className="absolute -right-1 -top-1 bg-primary rounded-full p-1">
              <Shield size={16} className="text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Yönetici Paneli Girişi
          </CardTitle>
          <CardDescription className="text-base">
            Kavlaklı Mesleki Eğitim Merkezi Yönetim Sistemi
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 font-medium">
                  <Mail size={16} className="text-muted-foreground" />
                  E-posta Adresi
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="E-posta adresinizi giriniz"
                  className={`h-12 input-focus-effect ${emailError ? 'border-destructive' : ''}`}
                  autoComplete="email"
                />
                {emailError && <p className="text-destructive text-xs mt-1">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 font-medium">
                  <Lock size={16} className="text-muted-foreground" />
                  Şifre
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Şifrenizi giriniz"
                  className={`h-12 input-focus-effect ${passwordError ? 'border-destructive' : ''}`}
                  autoComplete="current-password"
                />
                {passwordError && <p className="text-destructive text-xs mt-1">{passwordError}</p>}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium btn-hover-effect group transition-all"
              disabled={isLoading}
            >
              {buttonContent}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <a href="/" className="underline hover:text-primary transition-colors">
                Öğretmen girişine dön
              </a>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pt-2 pb-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kavlaklı Mesleki Eğitim Merkezi - Tüm Hakları Saklıdır
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
