import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  getTeachers, 
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherById,
  getBusinesses, 
  getGovernmentSupport, 
  getTeacherAssignments,
  assignTeacherToBusiness,
  removeTeacherFromBusiness,
  testConnection,
  createUsersTableIfNotExists,
  Teacher,
  Business,
  DevletDestegi,
  getDevletDestekleri,
  createDevletDestegi,
  updateDevletDestegi,
  deleteDevletDestegi,
  uploadDevletDestegiFile,
  downloadFile,
  getFileUrl,
  supabase,
  createTableIfNotExists,
  getAllUsersRaw, // Yeni fonksiyonu ekle
  updateSystemStatus,
  getSystemStatus,
  createSystemStatusTableIfNotExists,
   setTeacherPassword,
  deleteBusiness,
} from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';
import { 
  Search, 
  UserPlus, 
  Save, 
  Users, 
  Award, 
  Database, 
  LogOut,
  Building,
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  ArrowRightCircle,
  BarChart3,
  FileText,
  Download,
  PlusCircle,
  Upload,
  Loader2,
  Shield,
  Calendar,
  FileDown,
  Filter,
  MoreVertical,
  Key,
  Unlock,
  Copy,
  User,
  CheckCircle,
  XCircle,
  CircleCheck,
  CircleDashed,
  CirclePlus,
  ChevronLeft,
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card as DragCard,
  CardContent as DragCardContent,
  CardHeader as DragCardHeader,
  CardTitle as DragCardTitle,
  CardDescription as DragCardDescription,
} from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import { Badge } from "@/components/ui/badge";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TeacherCombobox } from '@/components/teacher-selection';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

// Arayüzler
interface Assignment {
  teacher_id: string;
  business_id: number;
  id?: number;
  created_at?: string;
}

interface GovernmentSupport {
  id: number;
  supportType: string;
  amount: string;
  status: string;
  date: string;
}

interface BusinessTeacher {
  id: string;
  name: string;
  business: string;
  status: string;
}

// Öğretmen form state'i için tip tanımı
interface TeacherFormData {
  name: string;
  password: string | null;
  is_first_login: boolean;
  login_attempts: number;
  locked_until: string | null;
}

// İşletme Kartı Bileşeni
const BusinessCard = ({ 
  business, 
  assignedTeacher
}: { 
  business: Business; 
  assignedTeacher?: Teacher; 
}) => (
  <DragCard className="mb-4 bg-white shadow-md hover:shadow-lg transition-shadow border border-blue-100">
    <DragCardHeader className="pb-2 bg-blue-50">
      <DragCardTitle className="text-lg font-medium flex justify-between items-center text-blue-800">
        {business.name}
        {business.industry && (
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{business.industry}</span>
        )}
      </DragCardTitle>
      <DragCardDescription className="text-sm text-blue-600">
        {business.address}
      </DragCardDescription>
    </DragCardHeader>
    <DragCardContent>
      <div className="min-h-[80px] rounded-md p-2 bg-muted/40">
        {assignedTeacher ? (
          <div className="p-3 mb-2 rounded-md bg-card">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-sm">{assignedTeacher.name}</div>
              </div>
              <button 
                className="text-gray-500 hover:text-red-500 transition-colors focus:outline-none"
                title="Atamayı Kaldır"
              >
                <ArrowRightCircle size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            Öğretmen ataması yok
          </div>
        )}
      </div>
    </DragCardContent>
  </DragCard>
);

// Ana Bileşen
const AdminDashboard = () => {
  // State tanımlamaları
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [governmentSupportData, setGovernmentSupportData] = useState<GovernmentSupport[]>([]);
  const [businessesData, setBusinessesData] = useState<Business[]>([]);
  const [businessTeachers, setBusinessTeachers] = useState<BusinessTeacher[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [businessDataLoaded, setBusinessDataLoaded] = useState(false); // Flag to track if business data has been loaded
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // İşletme Yönetimi için ekranlar arası geçiş
  const [businessManagementScreen, setBusinessManagementScreen] = useState<"active" | "passive" | "new" | null>(null);
  
  // İşletme silme işlemi için state
  const [isBusinessDeleteDialogOpen, setIsBusinessDeleteDialogOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<number | null>(null);
  const [isDeletingBusiness, setIsDeletingBusiness] = useState(false);
  
  // Assignment yönetimi
  const [businessAssignments, setBusinessAssignments] = useState<{[key: number]: Teacher}>({});
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [assignedTeachers, setAssignedTeachers] = useState<Assignment[]>([]);

  // Öğretmen form state'i
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState<TeacherFormData>({
    name: '',
    password: null,
    is_first_login: true,
    login_attempts: 0,
    locked_until: null
  });
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);

  // Öğretmen arama için state ekle
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  
  // İşletme arama için state ekle
  const [businessSearchTerm, setBusinessSearchTerm] = useState("");

  // Devlet Destekleri state'i
  const [destekler, setDestekler] = useState<DevletDestegi[]>([]);
  const [selectedDestek, setSelectedDestek] = useState<any>({});
  const [destekDialogOpen, setDestekDialogOpen] = useState(false);
  const [destekFormData, setDestekFormData] = useState<Omit<DevletDestegi, 'id' | 'created_at'>>({
    destek_turu: '',
    miktar: '',
    durum: 'Beklemede',
    tarih: new Date().toISOString().split('T')[0],
    aciklama: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDestekLoading, setIsDestekLoading] = useState(false);
  const [isDestekModalOpen, setIsDestekModalOpen] = useState(false);
  const [isDestekDeleteDialogOpen, setIsDestekDeleteDialogOpen] = useState(false);
  const [destekIdToDelete, setDestekIdToDelete] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aşağıdaki satırı ekleyeceğim - Devlet destekleri için ayrı bir arama terimi
  const [destekSearchTerm, setDestekSearchTerm] = useState("");

  // Ödeme Evrakı Durumu state'i
  const [evrakData, setEvrakData] = useState<any[]>([]);
  const [modifiedRows, setModifiedRows] = useState<Record<number, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [isEvrakLoading, setIsEvrakLoading] = useState(false);
  const [evrakDataLoaded, setEvrakDataLoaded] = useState(false); // Verilerin yüklenip yüklenmediğini takip etmek için
  const [evrakSearchTerm, setEvrakSearchTerm] = useState(""); // Ödeme evrakı için arama terimi

  // Excel dosyası için referans
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const [isExcelUploading, setIsExcelUploading] = useState<boolean>(false);
  // Yeni state ekleme
  const [isTableCreating, setIsTableCreating] = useState(false);

  // Devlet Desteği tablosundan çekilen unique işletme adları
  const [uniqueBusinessNames, setUniqueBusinessNames] = useState<{id: number, name: string}[]>([]);

  // State tanımlamalarına şunu ekle
  const [selectedBusinessesByTeacher, setSelectedBusinessesByTeacher] = useState<Record<string, number[]>>({});

  // Rapor state'leri ekle
  const getPreviousMonth = () => {
    const now = new Date();
    // Bir önceki ayı hesapla
    let prevMonth = now.getMonth(); // 0-11 (0=Ocak, 11=Aralık)
    let prevYear = now.getFullYear();
    
    // Ocak ayındaysak (0), önceki ay Aralık (11) ve önceki yıl olacak
    if (prevMonth === 0) {
      prevMonth = 11; // Aralık
      prevYear -= 1;
    } else {
      prevMonth -= 1;
    }
    
    // YYYY-MM formatına çevir
    return `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}`;
  };
  
  const [reportMonth, setReportMonth] = useState<string>(getPreviousMonth()); // Bir önceki ay
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedTeacherForReport, setSelectedTeacherForReport] = useState<string>("all");
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [isBusinessSelectionModalOpen, setIsBusinessSelectionModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedBusinesses, setSelectedBusinesses] = useState<{ [key: string]: number[] }>({});
  const [unassignedBusinesses, setUnassignedBusinesses] = useState<Business[]>([]);

  const [loading, setLoading] = useState(false);
  
  // Bir önceki ayı hesapla
  const getPreviousMonthForReports = () => {
    const now = new Date();
    let prevMonth = now.getMonth(); // 0-11 (0=Ocak, 11=Aralık)
    
    // Ocak ayındaysak (0), önceki ay Aralık (11)
    if (prevMonth === 0) {
      prevMonth = 12; // Aralık
    } else {
      prevMonth -= 1;
    }
    
    // 1-12 formatına çevir ve 2 basamaklı hale getir
    return (prevMonth + 1).toString().padStart(2, '0');
  };
  
  // Önceki aydaki yıl değeri - Ocak ayında bir önceki yıl, diğer aylarda mevcut yıl
  const getPreviousMonthYear = () => {
    const now = new Date();
    return (now.getMonth() === 0) ? (now.getFullYear() - 1).toString() : now.getFullYear().toString();
  };
  
  const [selectedYear, setSelectedYear] = useState<string>(getPreviousMonthYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(getPreviousMonthForReports());
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  // Yeni state ekleyelim
  const [odemeEvraki, setOdemeEvraki] = useState<string>("tümü");

  // State tanımlamalarına yeni state'ler ekliyorum
  const [newBusinessesFromDestegiTable, setNewBusinessesFromDestegiTable] = useState<{name: string, count: number}[]>([]);
  const [isLoadingNewBusinesses, setIsLoadingNewBusinesses] = useState(false);
  const [isAddingNewBusinesses, setIsAddingNewBusinesses] = useState(false);

  // Sistem durumu için state ekle
  const [systemIsActive, setSystemIsActive] = useState<boolean>(true);
  const [systemStatusMessage, setSystemStatusMessage] = useState<string>("Sistem aktif");
  const [isUpdatingSystemStatus, setIsUpdatingSystemStatus] = useState<boolean>(false);

  // İşletmeleri getiren fonksiyon
  const fetchBusinesses = async () => {
    try {
      const { data: businesses, error } = await getBusinesses();
      if (error) {
        throw error;
      }
      setBusinessesData(businesses || []);
    } catch (error: any) {
      console.error('İşletmeleri getirme hatası:', error);
      toast({
        title: "Hata",
        description: "İşletmeler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Atanmamış işletmeleri getir
  const fetchUnassignedBusinesses = useCallback(() => {
    // Aktif işletmeleri bul
    const activeBusinessNames = evrakData
      .map(evrak => evrak.isletme_adi?.toLowerCase().trim())
      .filter(Boolean);

    // Tüm işletmelerden atanmamış VE aktif olanları filtrele
    const unassigned = businessesData.filter(business => {
      const isUnassigned = !business.atanan_ogretmenler;
      const isActive = activeBusinessNames.includes(business.name.toLowerCase().trim());
      return isUnassigned && isActive;
    });
    
    // İşletmeleri isme göre alfabetik sırala (A-Z)
    const sortedBusinesses = [...unassigned].sort((a, b) => {
      const nameA = (a.name || '').toLocaleLowerCase('tr-TR');
      const nameB = (b.name || '').toLocaleLowerCase('tr-TR');
      return nameA.localeCompare(nameB, 'tr-TR');
    });
    
    setUnassignedBusinesses(sortedBusinesses);
  }, [businessesData, evrakData]);

  // Component mount olduğunda ve businessesData değiştiğinde unassigned işletmeleri güncelle
  useEffect(() => {
    fetchUnassignedBusinesses();
  }, [businessesData, fetchUnassignedBusinesses]);

  // İşletme seçim modalı içeriği
  const renderBusinessSelectionModal = () => (
    <Dialog open={isBusinessSelectionModalOpen} onOpenChange={setIsBusinessSelectionModalOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>İşletme Seç</DialogTitle>
          <DialogDescription>
            Öğretmene atamak istediğiniz işletmeleri seçin. İşletmeler alfabetik sırada (A-Z) listelenmektedir.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            {unassignedBusinesses.length > 0 ? (
              unassignedBusinesses.map((business) => (
                <div key={business.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedBusinesses[selectedTeacherId]?.includes(business.id)}
                    onCheckedChange={(checked) => {
                      if (selectedTeacherId) {
                        toggleBusinessSelection(selectedTeacherId, business.id);
                      }
                    }}
                  />
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {business.name}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Atanabilecek işletme bulunmamaktadır. Tüm işletmeler öğretmenlere atanmış durumda.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsBusinessSelectionModalOpen(false);
              setSelectedBusinesses({});
            }}
          >
            İptal
          </Button>
          <Button
            onClick={() => {
              if (selectedTeacherId && selectedBusinesses[selectedTeacherId]?.length > 0) {
                handleAssignMultipleBusinesses(selectedTeacherId, selectedBusinesses[selectedTeacherId]);
                setIsBusinessSelectionModalOpen(false);
                setSelectedBusinesses({});
              }
            }}
            disabled={!selectedTeacherId || !selectedBusinesses[selectedTeacherId]?.length}
          >
            Seçilen İşletmeleri Ata ({selectedBusinesses[selectedTeacherId]?.length || 0})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Sayfa yüklendiğinde mevcut sistem durumunu kontrol et
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const status = await getSystemStatus();
        setSystemIsActive(status.isActive);
        setSystemStatusMessage(status.message);
      } catch (error) {
        console.error("Sistem durumu kontrol edilirken hata:", error);
        toast({
          title: "Hata",
          description: "Sistem durumu kontrol edilirken bir hata oluştu.",
          variant: "destructive",
        });
      }
    };
    
    checkSystemStatus();
  }, [toast]);

  // Sistem durumunu değiştir
  const toggleSystemStatus = async () => {
    try {
      setIsUpdatingSystemStatus(true);
      
      // Yeni durumu ve mesajı belirle
      const newStatus = !systemIsActive;
      const newMessage = newStatus 
        ? "Sistem aktif" 
        : "SİSTEM BU AY KULLANIMA KAPATILMIŞTIR";
      
      // Durumu güncelle
      const result = await updateSystemStatus(newStatus, newMessage);
      
      if (result.success) {
        setSystemIsActive(newStatus);
        setSystemStatusMessage(newMessage);
        
        toast({
          title: newStatus ? "Sistem Açıldı" : "Sistem Kapatıldı",
          description: newStatus
            ? "Sistem başarıyla aktif edildi. Öğretmenler giriş yapabilir."
            : "Sistem başarıyla kapatıldı. Öğretmenler artık giriş yapamaz.",
        });
      } else {
        toast({
          title: "Güncelleme Hatası",
          description: "Sistem durumu güncellenirken bir hata oluştu.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Sistem durumu güncellenirken hata:", error);
      toast({
        title: "Hata",
        description: "Sistem durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSystemStatus(false);
    }
  };
  
  // Admin oturum kontrolü
  useEffect(() => {
    const isAdminLoggedIn = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdminLoggedIn) {
      toast({
        title: "Yetkisiz Erişim",
        description: "Bu sayfaya erişim için yönetici girişi yapmanız gerekmektedir.",
        variant: "destructive",
      });
      navigate('/admin-login');
    } else {
      // Supabase bağlantısını ve tabloları test et
      testConnection().then(result => {
        if (!result.success) {
          console.error('Supabase bağlantı testi hatası:', result);
          
          // Tablo yoksa oluşturmayı deneyelim
          if (result.error && result.message.includes('kullanicilar tablosu hatası')) {
            toast({
              title: "Veritabanı Tablosu Eksik",
              description: "kullanicilar tablosu bulunamadı. Otomatik oluşturma deneniyor...",
              variant: "destructive",
            });
            
            // Tabloyu oluşturma ve örnek veri ekleme
            createUsersTableIfNotExists().then(createResult => {
              if (createResult.success) {
                toast({
                  title: "Tablo Oluşturuldu",
                  description: createResult.message,
                });
                
                // Veriler yeniden yüklensin
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } else {
                toast({
                  title: "Tablo Oluşturma Hatası",
                  description: createResult.message,
                  variant: "destructive",
                });
              }
            });
          } else {
            toast({
              title: "Veritabanı Hatası",
              description: `Supabase bağlantı testi başarısız: ${result.message}`,
              variant: "destructive",
            });
          }
        } else {
          // console.log('Supabase bağlantı testi başarılı:', result);
          
          // Sistem durumu tablosunu kontrol et
          createSystemStatusTableIfNotExists().then(statusResult => {
            if (!statusResult.success) {
              toast({
                title: "Sistem Durumu Tablosu Eksik",
                description: statusResult.message,
                variant: "destructive",
              });
            }
          });
        }
      });
    }
  }, [navigate, toast]);

  // Veri çekme işlevi - memoize edilmiş
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // API çağrılarını tekli olarak yaparak hataları ayrı ayrı yakalayalım
      // console.log("Öğretmen verilerini çekmeye başlıyor...");
      const teachersResponse = await getTeachers();
      // console.log("Öğretmen cevabı:", teachersResponse);
      
      if (teachersResponse.error) {
        console.error("Öğretmen verileri çekilirken hata:", teachersResponse.error);
        throw new Error(`Öğretmen verileri çekilemedi: ${JSON.stringify(teachersResponse.error)}`);
      }
      
      // Sessizce devlet desteği verilerini çek
      const supportResponse = await getGovernmentSupport();
      
      // Not: İşletme verileri artık doğrudan isletmeler tablosundan çekiliyor
      // fetchUniqueBusinessNames fonksiyonu ile, bu nedenle burada atlanıyor
      
      // console.log("Atama verilerini çekmeye başlıyor...");
      const assignmentsResponse = await getTeacherAssignments();
      // console.log("Atama cevabı:", assignmentsResponse);
      
      if (assignmentsResponse.error) {
        console.error("Atama verileri çekilirken hata:", assignmentsResponse.error);
        // Devam etmeyi dene, ancak hatayı logla
      }
      
      // Veri ayarlamaları
      const teachersData = teachersResponse.data || [];
      const supportData = []; // Boş array kullan
      const assignmentData = assignmentsResponse.data || [];
      
      // console.log("Öğretmen verileri:", teachersData.length, "kayıt");
      // console.log("Destek verileri:", supportData.length, "kayıt");
      // console.log("Atama verileri:", assignmentData.length, "kayıt");
      
      setTeachers(teachersData);
      setGovernmentSupportData(supportData);
      // Not: setBusinessesData burada yapılmıyor, çünkü fetchUniqueBusinessNames tarafından yönetiliyor
      
      // Assignment işlemleri
      const assignedTeachersMap: {[key: number]: Teacher} = {};
      const availableTeachersArray = [...teachersData];
      
      // Atama verilerini işle
      if (assignmentData && assignmentData.length > 0) {
      assignmentData.forEach(assignment => {
          const { teacher_id, business_id } = assignment;
        const teacher = teachersData.find(t => t.id === teacher_id);
        if (teacher) {
          assignedTeachersMap[business_id] = teacher;
          const teacherIndex = availableTeachersArray.findIndex(t => t.id === teacher_id);
          if (teacherIndex !== -1) {
            availableTeachersArray.splice(teacherIndex, 1);
          }
          }
        });
      }

      // İşletme verilerini kontrol et ve atanmış öğretmenleri güncelle
      if (businessesData && businessesData.length > 0) {
        const cleanedBusinessData = [...businessesData];
        let hasCleanedData = false;
        
        businessesData.forEach((business, index) => {
          if (business.atanan_ogretmenler) {
            const teacher = teachersData.find(t => t.id === business.atanan_ogretmenler);
            if (teacher && !assignedTeachersMap[business.id]) {
              assignedTeachersMap[business.id] = teacher;
              const teacherIndex = availableTeachersArray.findIndex(t => t.id === business.atanan_ogretmenler);
              if (teacherIndex !== -1) {
                availableTeachersArray.splice(teacherIndex, 1);
              }
            } else if (!teacher) {
              // Öğretmen bulunamazsa, kullanıcıları bilgilendir
              console.error(`Öğretmen bulunamadı: ${business.atanan_ogretmenler}`);
              
              // İşletmedeki atamayı temizle
              cleanedBusinessData[index] = {
                ...business,
                atanan_ogretmenler: null
              };
              hasCleanedData = true;
              
              // Veritabanında da atamayı temizle
              (async () => {
                try {
                  const { error } = await supabase
                    .from('isletmeler')
                    .update({ atanan_ogretmenler: null })
                    .eq('id', business.id);
                    
                  if (error) {
                    console.error(`İşletme ${business.id} veritabanında güncellenirken hata:`, error);
                  } else {
                    // console.log(`İşletme ${business.id} hatalı öğretmen ataması veritabanında temizlendi`);
                  }
                } catch (e) {
                  console.error(`İşletme ${business.id} veritabanında güncellenirken hata:`, e);
                }
              })();
            }
          }
        });
        
        // Eğer temizlenecek veri varsa, state'i ve session storage'ı güncelle
        if (hasCleanedData) {
          setBusinessesData(cleanedBusinessData);
          
          // SessionStorage'a güncel verileri kaydet
          try {
            sessionStorage.setItem('businessData', JSON.stringify(cleanedBusinessData));
            // console.log("Temizlenmiş işletme verileri önbelleğe kaydedildi");
          } catch (e) {
            console.error("İşletme verilerini önbelleğe kaydetme hatası:", e);
          }
        }
      }

        setBusinessAssignments(assignedTeachersMap);
        setAvailableTeachers(availableTeachersArray);
      setAssignedTeachers(assignmentData);

      } catch (error) {
      console.error('Veri yükleme hatası:', error);
      console.error('Hata detayları:', JSON.stringify(error, null, 2));
      
      // Hata türünü ve mesajını görüntüle
      if (error instanceof Error) {
        console.error('Hata mesajı:', error.message);
        console.error('Hata adı:', error.name);
        console.error('Hata stack:', error.stack);
      }
      
        toast({
          title: "Hata",
        description: "Veri yüklenirken bir hata oluştu. Konsolu kontrol edin.",
          variant: "destructive",
        });
    } finally {
      setIsLoading(false);
      }
  }, [toast]);

  // İlk yüklemede veri çekme
  useEffect(() => {
    // Önce sessionStorage'dan işletme verilerini kontrol et
    const cachedBusinessData = sessionStorage.getItem('businessData');
    const cachedEvrakData = sessionStorage.getItem('evrakData');
    
    if (cachedBusinessData && cachedEvrakData) {
      try {
        const parsedBusinessData = JSON.parse(cachedBusinessData);
        const parsedEvrakData = JSON.parse(cachedEvrakData);
        setBusinessesData(parsedBusinessData);
        setEvrakData(parsedEvrakData);
        setBusinessDataLoaded(true);
        setEvrakDataLoaded(true);
        // console.log("İşletme ve evrak verileri önbellekten yüklendi");
      } catch (error) {
        console.error("Önbellek verisi ayrıştırma hatası:", error);
        // Hata durumunda önbelleği temizle
        sessionStorage.removeItem('businessData');
        sessionStorage.removeItem('evrakData');
        // Verileri yeniden yükle
        loadInitialData();
      }
    } else {
      // Önbellekte veri yoksa verileri yükle
      loadInitialData();
    }
  }, []); // Sadece uygulama başlangıcında çalışır

  // Verileri yükleme fonksiyonu
  const loadInitialData = async () => {
    // console.log("Veriler ilk kez yükleniyor...");
    setIsLoading(true);
    try {
      // İşletme verilerini yükle
      await fetchUniqueBusinessNames();
      // Evrak verilerini yükle
      await fetchEvrakData();
      
      // Verileri önbelleğe kaydet
      try {
        sessionStorage.setItem('businessData', JSON.stringify(businessesData));
        sessionStorage.setItem('evrakData', JSON.stringify(evrakData));
        // console.log("Veriler önbelleğe kaydedildi");
      } catch (e) {
        console.error("Verileri önbelleğe kaydetme hatası:", e);
      }
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setBusinessDataLoaded(true);
      setEvrakDataLoaded(true);
    }
  };

  // Event handlers
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleLogout = useCallback(() => {
    toast({
      title: "Bilgi",
      description: "Çıkış yapılıyor...",
    });
    
    // Admin oturumunu sonlandır
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminData');
    
    setTimeout(() => {
      navigate('/admin-login');
    }, 800);
  }, [navigate, toast]);

  // Drag and Drop işleyicisi
  const handleDragEnd = useCallback(async (result: any) => {
    // console.log('handleDragEnd çalıştı - result:', result);
    
    const { source, destination, draggableId } = result;
    
    // Geçersiz bırakma alanları kontrolü
    if (!destination) {
      // console.log('Geçerli bir hedef bırakma alanı yok');
      return;
    }
    
    // Aynı yere bırakma kontrolü
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      // console.log('Aynı yere bırakıldı, işlem yok');
      return;
    }
    
    // console.log(`Sürükleme: ${source.droppableId} -> ${destination.droppableId}`);
    
    // Farklı listeler arası sürükleme
    if (source.droppableId !== destination.droppableId) {
      // Öğretmen ID'sini draggableId'den çıkar
      const teacherId = draggableId.split('-')[1];
      // console.log('Öğretmen ID:', teacherId);
      
      const teacher = teachers.find(t => t.id == teacherId);
      
      if (!teacher) {
        console.error('Öğretmen bulunamadı! draggableId:', draggableId, 'teacherId:', teacherId);
        // console.log('Mevcut öğretmenler:', teachers);
        return;
      }
      
      // console.log('Öğretmen bulundu:', teacher);
      
      if (source.droppableId === 'available-teachers' && destination.droppableId.startsWith('business-')) {
        // Öğretmen atama
        const businessId = parseInt(destination.droppableId.split('-')[1]);
        
        try {
          const { error } = await assignTeacherToBusiness(teacherId, businessId);
          if (error) throw error;

          // State güncelleme
          setBusinessAssignments(prev => ({
            ...prev,
            [businessId]: teacher
          }));
          
          setAssignedTeachers(prev => [...prev, {
            teacher_id: teacherId,
            business_id: businessId,
            business_name: businessesData.find(b => b.id === businessId)?.name || ''
          }]);
          
          setAvailableTeachers(prev => prev.filter(t => t.id !== teacherId));
          
          // İşletmenin atanan_ogretmenler değişkenini güncelle, böylece filtrelemede gizlenecek
          setBusinessesData(prev => prev.map(business => 
            business.id === businessId 
              ? { ...business, atanan_ogretmenler: teacherId }
              : business
          ));
          
          toast({
            title: "Atama Başarılı",
            description: `${teacher.name} öğretmeni ${businessesData.find(b => b.id === businessId)?.name} işletmesine atandı.`,
          });
        } catch (error) {
          console.error('Atama hatası:', error);
          toast({
            title: "Hata",
            description: "Öğretmen ataması yapılırken bir hata oluştu.",
            variant: "destructive",
          });
        }
      } else if (source.droppableId.startsWith('business-') && destination.droppableId === 'available-teachers') {
        // İşletmeden öğretmen çıkarma
        const businessId = parseInt(source.droppableId.split('-')[1]);
        const business = businessesData.find(b => b.id === businessId);
        
        try {
          const { error } = await removeTeacherFromBusiness(teacherId, businessId);
          if (error) throw error;

          // State güncelleme
          setBusinessAssignments(prev => {
            const newAssignments = { ...prev };
            delete newAssignments[businessId];
            return newAssignments;
          });
          
          // İşletmenin atanan_ogretmenler değerini null yap
          setBusinessesData(prevData => {
            const updatedData = prevData.map(b => {
              if (b.id === businessId) {
                return {
                  ...b,
                  atanan_ogretmenler: null
                };
              }
              return b;
            });
            
            // SessionStorage'a güncel verileri kaydet
            try {
              sessionStorage.setItem('businessData', JSON.stringify(updatedData));
              // console.log("Güncellenen işletme verileri önbelleğe kaydedildi");
            } catch (e) {
              console.error("İşletme verilerini önbelleğe kaydetme hatası:", e);
            }
            
            return updatedData;
          });
          
          setAssignedTeachers(prev => prev.filter(assignment => 
            !(assignment.teacher_id === teacherId && assignment.business_id === businessId)
          ));
          
          // Öğretmen listesinde değişiklik yapmıyoruz, öğretmenler zaten orada
          
          toast({
            title: "Atama İptal Edildi",
            description: `${teacher.name} öğretmeninin ${business?.name || 'ilgili işletmedeki'} ataması kaldırıldı.`,
          });
        } catch (error) {
          console.error('Atama kaldırma hatası:', error);
          toast({
            title: "Hata",
            description: "Öğretmen ataması kaldırılırken bir hata oluştu.",
            variant: "destructive",
          });
        }
      }
    }
  }, [businessAssignments, teachers, assignTeacherToBusiness, removeTeacherFromBusiness, toast]);

  // Filtreleme işlevleri
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  const filteredBusinesses = businessesData.filter(business =>
    business.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status sınıfı yardımcı işlevi
  const getStatusClass = (status: string) => {
    switch(status) {
      case "Onaylandı":
      case "Aktif":
        return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium";
      case "Beklemede":
        return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium";
      case "Reddedildi":
      case "Pasif":
        return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium";
      default:
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
    }
  };

  // Form işlemleri
  const resetTeacherForm = () => {
    setTeacherForm({
      name: '',
      password: null,
      is_first_login: true,
      login_attempts: 0,
      locked_until: null
    });
    setCurrentTeacher(null);
    setIsEditingTeacher(false);
  };

  const handleTeacherInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Select elemanları için özel işleme
    if (name === 'is_first_login') {
      setTeacherForm(prev => ({
        ...prev,
        [name]: value === 'true'
      }));
      return;
    }
    
    // login_attempts için sayısal dönüşüm
    if (name === 'login_attempts') {
      setTeacherForm(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
      return;
    }
    
    setTeacherForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTeacher = () => {
    resetTeacherForm();
    setIsEditingTeacher(false);
    setIsTeacherDialogOpen(true);
  };

  const handleEditTeacher = async (teacherId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await getTeacherById(teacherId);
      
      if (error) throw error;
      
      if (data) {
        setCurrentTeacher(data);
        setTeacherForm({
          name: data.name || '',
          password: data.password || null,
          is_first_login: data.is_first_login,
          login_attempts: data.login_attempts,
          locked_until: data.locked_until
        });
        setIsEditingTeacher(true);
        setIsTeacherDialogOpen(true);
      }
    } catch (error) {
      console.error('Öğretmen bilgisi alınırken hata:', error);
      toast({
        title: "Hata",
        description: "Öğretmen bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeacher = (teacherId: string) => {
    setTeacherToDelete(teacherId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    
    try {
      setIsLoading(true);
      const { error } = await deleteTeacher(teacherToDelete);
      
      if (error) throw error;
      
      // State'den de kaldır
      setTeachers(prev => prev.filter(t => t.id !== teacherToDelete));
      setAvailableTeachers(prev => prev.filter(t => t.id !== teacherToDelete));
      
      // Atama varsa onu da kaldır
      const assignmentKeys = Object.keys(businessAssignments);
      for (const key of assignmentKeys) {
        const businessId = parseInt(key);
        if (businessAssignments[businessId]?.id === teacherToDelete) {
          await removeTeacherFromBusiness(teacherToDelete, businessId);
          setBusinessAssignments(prev => {
            const newAssignments = { ...prev };
            delete newAssignments[businessId];
            return newAssignments;
          });
          setAssignedTeachers(prev => prev.filter(a => 
            !(a.teacher_id === teacherToDelete && a.business_id === businessId)
          ));
        }
      }
      
      toast({
        title: "Başarılı",
        description: "Öğretmen başarıyla silindi.",
      });
      
      setIsDeleteDialogOpen(false);
      setTeacherToDelete(null);
    } catch (error) {
      console.error('Öğretmen silinirken hata:', error);
      toast({
        title: "Hata",
        description: "Öğretmen silinirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Şifre sıfırlama işlemi
  const handleResetPassword = async (teacherId: string) => {
    try {
      setIsLoading(true);
      
      // Öğretmenin şifresini sıfırla ve ilk giriş durumunu true yap
      const { error } = await updateTeacher(teacherId, {
        password: null,
        is_first_login: true,
        login_attempts: 0,
        locked_until: null
      });
      
      if (error) throw error;
      
      // State'i güncelle
      setTeachers(prev => prev.map(t => 
        t.id === teacherId 
          ? { ...t, password: null, is_first_login: true, login_attempts: 0, locked_until: null }
          : t
      ));
      
      toast({
        title: "Başarılı",
        description: "Öğretmenin şifresi sıfırlandı. İlk girişte yeni şifre belirlemesi gerekecek.",
      });
    } catch (error: any) {
      console.error('Şifre sıfırlama hatası:', error);
      toast({
        title: "Hata",
        description: "Şifre sıfırlanırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Hesap blokajını kaldır
  const handleUnlockAccount = async (teacherId: string) => {
    try {
      setIsLoading(true);
      
      // Öğretmenin hesabını aktif et
      const { error } = await updateTeacher(teacherId, {
        login_attempts: 0,
        locked_until: null
      });
      
      if (error) throw error;
      
      // State'i güncelle
      setTeachers(prev => prev.map(t => 
        t.id === teacherId 
          ? { ...t, login_attempts: 0, locked_until: null }
          : t
      ));
      
      toast({
        title: "Başarılı",
        description: "Öğretmenin hesap blokajı kaldırıldı.",
      });
    } catch (error: any) {
      console.error('Hesap blokajı kaldırma hatası:', error);
      toast({
        title: "Hata",
        description: "Hesap blokajı kaldırılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Öğretmen ekleme/güncelleme işlemi
  const handleSubmitTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form değerlerini temizle (trim)
    const formData: Omit<Teacher, 'id' | 'created_at'> = {
      name: teacherForm.name.trim(),
      password: null, // Şifre null olarak ayarla
      is_first_login: true, // İlk giriş true olarak ayarla
      login_attempts: 0, // Giriş denemesi 0 olarak ayarla
      locked_until: null // Hesap kilidi null olarak ayarla
    };
    
    // Form doğrulama
    if (!formData.name) {
      toast({
        title: "Hata",
        description: "Öğretmen adı zorunludur.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (isEditingTeacher && currentTeacher) {
        // Mevcut öğretmeni güncelle
        const { data, error } = await updateTeacher(currentTeacher.id, formData);
        
        if (error) throw error;
        
        if (data && data[0]) {
          // State'i güncelle
          setTeachers(prev => prev.map(t => t.id === currentTeacher.id ? data[0] : t));
          
          toast({
            title: "Başarılı",
            description: "Öğretmen bilgileri başarıyla güncellendi.",
          });
        }
      } else {
        // Yeni öğretmen ekle
        const { data, error } = await createTeacher(formData);
        
        if (error) throw error;
        
        if (data && data[0]) {
          // State'e ekle
          setTeachers(prev => [...prev, data[0]]);
          
          toast({
            title: "Başarılı",
            description: `${data[0].name} başarıyla eklendi. Öğretmen ilk girişinde şifresini belirleyecek.`,
          });
        }
      }
      
      // Formu sıfırla ve kapat
      resetTeacherForm();
      setIsTeacherDialogOpen(false);
    } catch (error: any) {
      console.error('Öğretmen işlemi sırasında hata:', error);
      toast({
        title: "Hata",
        description: isEditingTeacher 
          ? "Öğretmen güncellenirken bir hata oluştu." 
          : "Öğretmen eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Devlet Destekleri verilerini getir
  const fetchDevletDestekleri = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getDevletDestekleri();
      // error kontrolünü kaldırdık, hata olmayacak çünkü boş dizi dönüyoruz
      setDestekler(data || []);
    } catch (error) {
      // Hata mesajını gösterme
      setDestekler([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Format para birimi - TL 
  const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return "0,00 ₺";
    
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return "0,00 ₺";
    
    return numericValue.toLocaleString('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    });
  };

  // Tablo adını belirle (artık tek bir tablo kullanıyoruz - devlet_destegi)
  const getTableName = () => {
    // Artık tüm veriler "devlet_destegi" tablosunda saklanıyor, 
    // bu nedenle dinamik tablo adı oluşturmaya gerek yok
    return "devlet_destegi";
    
    /* Eski dinamik kod yorum satırına alındı
    const now = new Date();
    let currentMonth = now.getMonth() + 1; // 1-12 arası
    let currentYear = now.getFullYear();
    
    // Bir önceki ayı hesapla
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    
    // Eğer ocak ayındaysak (1), bir önceki yılın aralık ayına git
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }
    
    // Ayı iki haneli formata çevir
    const formattedMonth = prevMonth.toString().padStart(2, '0');
    
    return `devlet_destegi${prevYear}${formattedMonth}`;
    */
  };

  // Ödeme evrakı tablosunu yükle - Yeniden düzenlendi - Artık devlet_destegi tablosundan çekiyor
  const fetchEvrakData = useCallback(async () => {
    setIsEvrakLoading(true);
    try {
      // Sabit tablo adını kullanıyoruz
      const tableName = "devlet_destegi";
      // console.log("Veri çekilecek tablo:", tableName);
      
      // Tablonun var olup olmadığını kontrol et
      const { error: checkError } = await supabase
        .from(tableName)
        .select('count', { count: 'exact', head: true });

      if (checkError) {
        if (checkError.code === "PGRST116") {
          // console.log(`Tablo bulunamadı: ${tableName}`);
          toast({
            title: "Bilgi",
            description: `${tableName} tablosu henüz oluşturulmamış.`,
            variant: "default"
          });
          setEvrakData([]);
          return;
        }
        throw checkError;
      }

      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000; // Supabase'in maksimum limiti
      let hasMoreData = true;
      
      while (hasMoreData) {
        // console.log(`Sayfa ${page + 1} verisi alınıyor...`);
            
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('isletme_adi', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          if (page === 0) {
            // console.log("Tabloda veri bulunamadı");
            setEvrakData([]);
            return;
          }
          hasMoreData = false;
          continue;
        }
        
        allData = [...allData, ...data];
        
        if (data.length < pageSize) {
          hasMoreData = false;
        } else {
          page++;
        }
      }
      
      // console.log(`Toplam ${allData.length} kayıt yüklendi`);
      setEvrakData(allData);
      
      // Verileri sessionStorage'a kaydet
      try {
        sessionStorage.setItem('evrakData', JSON.stringify(allData));
        // console.log("Veriler önbelleğe kaydedildi");
      } catch (e) {
        console.error("Verileri önbelleğe kaydetme hatası:", e);
      }
      
    } catch (error) {
      console.error("Evrak verileri yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Evrak verileri yüklenemedi.",
        variant: "destructive"
      });
      setEvrakData([]);
    } finally {
      setIsEvrakLoading(false);
    }
  }, [toast]);
  
  // Yardımcı fonksiyon: Belirli bir tablodan veri çek
  const fetchTableData = async (tableName: string) => {
    let tableData: any[] = [];
      let page = 0;
      const pageSize = 1000; // Supabase'in maksimum limiti
      let hasMoreData = true;
      
      while (hasMoreData) {
        // Her seferinde 1000 kayıt çekelim
        const { data, error } = await supabase
          .from(tableName)
        .select('id, isletme_adi, ad_soyad, kimlik_no, ucret, odeme_evraki_durumu, tarih')
          .order('isletme_adi', { ascending: true }) // İşletme adına göre sırala
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) {
        // Tablo bulunamazsa atla
        if (error.code === "PGRST116") {
          // console.log(`${tableName} tablosu bulunamadı`);
          return [];
        }
          throw error;
        }
        
        if (data && data.length > 0) {
        tableData = [...tableData, ...data];
          page++;
          
          // Eğer sayfa boyutundan az veri geldiyse, tüm verileri almışız demektir
          if (data.length < pageSize) {
            hasMoreData = false;
          }
        } else {
          hasMoreData = false;
        }
      }
      
    return tableData;
  };

  // Sadece ilk yüklemede tüm verileri getir
  useEffect(() => {
    // Tüm verileri bir kerede yükle
    fetchData();
    fetchUniqueBusinessNames();
  }, [fetchData]);

  // Tab değiştiğinde sadece loading göstergesi güncelle
  useEffect(() => {
    // console.log("Tab değişti:", activeTab, "evrakDataLoaded:", evrakDataLoaded);
    
    if ((activeTab === 'payments' || activeTab === 'reports') && !evrakDataLoaded) {
      // Veriler daha önce yüklenmediyse yükle
      // console.log("Evrak verileri yükleniyor...");
      setIsEvrakLoading(true);
      fetchEvrakData().then(() => {
        // Verilerin yüklendiğini işaretle
        // console.log("Evrak verileri yüklendi");
        setEvrakDataLoaded(true);
      });
    } else if (activeTab === 'payments' || activeTab === 'reports') {
      // Veriler zaten yüklendiyse sadece kısa bir loading göstergesi
      setIsEvrakLoading(true);
      setTimeout(() => {
        setIsEvrakLoading(false);
      }, 200);
    }
  }, [activeTab, evrakDataLoaded, fetchEvrakData]);

  // Ödeme evrakı değişikliklerini kaydet
  const handleSaveOdemeEvraki = async () => {
    if (Object.keys(modifiedRows).length === 0) {
      toast({
        title: "Bilgi",
        description: "Kaydedilecek değişiklik bulunmuyor.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const changedIds = Object.keys(modifiedRows).map(id => parseInt(id));
      // console.log("Güncellenecek kayıt ID'leri:", changedIds);

      let successCount = 0;
      let failCount = 0;
      
      for (const id of changedIds) {
        const row = evrakData.find(item => item.id === id);
        if (!row) {
          // console.log(`ID:${id} için kayıt bulunamadı`);
          continue;
        }
        
        // Tek bir sabit tablo adı kullan
        const tableName = "devlet_destegi";
        
        try {
          const { error } = await supabase
            .from(tableName)
            .update({ odeme_evraki_durumu: row.odeme_evraki_durumu })
            .eq('id', id);
          
          if (error) {
            failCount++;
            console.error(`ID:${id} güncellenirken hata:`, error);
          } else {
            successCount++;
          }
        } catch (updateError) {
          failCount++;
          console.error(`ID:${id} güncellenirken hata:`, updateError);
        }
      }
      
      // Değişiklik takibini sıfırla
      setModifiedRows({});
      
      if (successCount > 0) {
        toast({
          title: "Başarılı",
          description: `${successCount} kayıt güncellendi${failCount > 0 ? `, ${failCount} güncelleme başarısız` : ''}`,
          variant: failCount > 0 ? "destructive" : "default"
        });
        
        // Verileri yeniden yükle
        await fetchEvrakData();
      } else if (failCount > 0) {
        toast({
          title: "Hata",
          description: `${failCount} kayıt güncellenemedi.`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Değişiklikler kaydedilirken hata:", error);
      toast({
        title: "Hata",
        description: `Değişiklikler kaydedilemedi: ${error.message || 'Bilinmeyen hata'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Şu anki aktif tablonun adını döndür - artık tek bir tablo kullanıyoruz
  const getCurrentTableName = () => {
    // Artık tüm veriler "devlet_destegi" tablosunda saklanıyor
    return "devlet_destegi";
    
    /* Eski dinamik kod yorum satırına alındı
    const now = new Date();
    let year, month;
    
    // Eğer reportMonth varsa, onu kullan
    if (reportMonth) {
      [year, month] = reportMonth.split('-');
      // Sayısal aya çevir
      month = parseInt(month);
    } 
    // Sadece reportYear varsa
    else if (reportYear) {
      year = reportYear;
      // Şu anki ayı al ve bir geri git
      month = now.getMonth(); // 0-11 arası değer (bu zaten bir önceki ay oluyor çünkü 0-indexed)
      if (month === 0) { // Ocak ayındaysak (index 0)
        month = 12; // Aralık ayına git
        year = (parseInt(year) - 1).toString(); // Önceki yıla git
      }
    }
    // Hiçbiri yoksa şimdiki zamanı kullan
    else {
      // Şu anki tarihten bir önceki ayı hesapla
      month = now.getMonth(); // 0-11 arası (ocak=0, şubat=1, ...)
      year = now.getFullYear();
      
      if (month === 0) { // Ocak ayındaysak (index 0)
        month = 12; // Aralık ayına git
        year -= 1; // Önceki yıla git
      }
      
      year = year.toString();
    }
    
    // Ay değerini iki basamaklı formata getir
    month = month.toString().padStart(2, '0');
    
    // Tablo adını oluştur: devlet_destegi202502
    const tableName = `devlet_destegi${year}${month}`;
    
    // console.log(`Aktif tablo (bir önceki ay): ${tableName} (Yıl: ${year}, Ay: ${month})`);
    return tableName;
    */
  };

  // Checkbox değişikliğini işle
  const handleOdemeEvrakiChange = (id: number) => {
    // Mevcut durumu kontrol et ve tersine çevir
    const row = evrakData.find(item => item.id === id);
    if (!row) return;
    
    // Yeni durumu belirle
    const newStatus = row.odeme_evraki_durumu === "Ödeme Evrağı Teslim Edildi" 
      ? "Ödeme Evrağı Zamanında Teslim Edilmedi" 
      : "Ödeme Evrağı Teslim Edildi";
    
    // Değişiklik kaydı
    setModifiedRows(prev => ({
      ...prev,
      [id]: true
    }));
    
    // UI için anlık güncelleme
    setEvrakData(prevData => {
      return prevData.map(item => {
        if (item.id === id) {
          return { ...item, odeme_evraki_durumu: newStatus };
        }
        return item;
      });
    });
  };

  // Arama ve filtreleme yardımcı fonksiyonu
  const getFilteredEvrakData = useMemo(() => {
    return evrakData.filter(item => {
      // Arama terimi filtresi
      if (evrakSearchTerm) {
      const searchLower = evrakSearchTerm.toLocaleLowerCase('tr-TR');
      const isletmeAdi = item.isletme_adi ? item.isletme_adi.toLocaleLowerCase('tr-TR') : '';
      const adSoyad = item.ad_soyad ? item.ad_soyad.toLocaleLowerCase('tr-TR') : '';
      
        // İşletmeye atanan öğretmeni bul
        const business = businessesData.find(b => b.name?.toLowerCase() === item.isletme_adi?.toLowerCase());
        const assignedTeacher = business ? teachers.find(t => t.id === business.atanan_ogretmenler) : null;
        const teacherName = assignedTeacher ? assignedTeacher.name.toLocaleLowerCase('tr-TR') : '';
        
        // İşletme adı, öğrenci adı veya atanan öğretmen adında arama yap
        if (!(isletmeAdi.includes(searchLower) || 
              adSoyad.includes(searchLower) || 
              teacherName.includes(searchLower))) {
          return false;
        }
      }
      
      // Ödeme evrakı durumu filtresi
      if (odemeEvraki !== "tümü") {
        if (item.odeme_evraki_durumu !== odemeEvraki) {
          return false;
        }
      }
      
      return true;
    });
  }, [evrakData, evrakSearchTerm, odemeEvraki, businessesData, teachers]);

  // Sayfalanmış veriyi hesapla
  const paginatedData = useMemo(() => {
    // Sayfalama için filtrelenmiş veriyi kullan
    const startIndex = (currentPage - 1) * itemsPerPage;
    return getFilteredEvrakData.slice(startIndex, startIndex + itemsPerPage);
  }, [getFilteredEvrakData, currentPage, itemsPerPage]);

  // Toplam sayfa sayısı
  const totalPages = useMemo(() => {
    return Math.ceil(getFilteredEvrakData.length / itemsPerPage);
  }, [getFilteredEvrakData, itemsPerPage]);

  // Excel template indirme işlemi
  const handleDownloadTemplate = () => {
    // Excel şablonu için fakedata oluştur
    const templateData = [
      {
        "SiraNo": 1,
        "OgrenciID": "12345",
        "KimlikNo": "12345678901",
        "AdSoyad": "Örnek Öğrenci",
        "DalAdi": "Örnek Dal",
        "IsletmeID": "1001",
        "IsletmeAdi": "Örnek İşletme",
        "Baslama": "01/02/2025",
        "Ayrilis": "28/02/2025",
        "ToplamSure": "28",
        "EksikGun": "0",
        "Gun": "20",
        "Ucret": "1250"
      }
    ];
    
    // Veriyi Excel dosyasına dönüştür
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Şablon");
    
    // Boş bir şablon satırı ekle
    XLSX.utils.sheet_add_json(ws, [{
      "SiraNo": "",
      "OgrenciID": "",
      "KimlikNo": "",
      "AdSoyad": "",
      "DalAdi": "",
      "IsletmeID": "",
      "IsletmeAdi": "",
      "Baslama": "",
      "Ayrilis": "",
      "ToplamSure": "",
      "EksikGun": "",
      "Gun": "",
      "Ucret": ""
    }], {origin: -1, skipHeader: true});
    
    // Dosyayı indir
    XLSX.writeFile(wb, "devlet_destegi_template.xlsx");
    
    toast({
      title: "İndirme Başarılı",
      description: "Şablon dosyası indirildi.",
      variant: "default"
    });
  };

  // Excel dosyası seçme diyaloğunu aç
  const handleExcelFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        handleUploadDevletDestegi(file);
      }
    };
    input.click();
  };

  // Tablo oluşturma işlemi
  const handleCreateTable = async () => {
    setIsTableCreating(true);
    
    try {
      const tableName = getTableName();
      
      // Önce var olan tabloyu kontrol et
      const { error: checkError } = await supabase
        .from(tableName)
        .select('count', { count: 'exact', head: true });
      
      if (checkError && checkError.code !== '42P01') {
        // 42P01 "relation does not exist" hata kodu, tablonun olmaması durumunu gösterir
        // Başka bir hata ise, işlemi durdur
        throw checkError;
      }
      
      // SQL sorgusu ile tablo oluştur
      const { error } = await supabase.rpc('create_devlet_destegi_table', {
        table_name: tableName
      });
      
      if (error) throw error;
      
      toast({
        title: "Başarılı",
        description: `${tableName} tablosu başarıyla oluşturuldu.`,
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('Tablo oluşturma hatası:', error);
      toast({
        title: "Hata",
        description: `Tablo oluşturulurken bir hata oluştu: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsTableCreating(false);
    }
  };

  // Devlet Desteği tab'ında kullanılan işlemler için gerekli yardımcı fonksiyonlar 
  // Dosya indirme işlemi
  const handleDownloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'indirilen-dosya';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSS sınıflarını durum değerine göre belirle
  const getDestekStatusClass = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch(status.toLowerCase()) {
      case 'onaylandı':
        return 'bg-green-100 text-green-800';
      case 'beklemede':
        return 'bg-yellow-100 text-yellow-800';
      case 'reddedildi':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Destek düzenleme işlemi
  const handleEditDestek = (destek: any) => {
    // Bu fonksiyon destek düzenleme formunu açar
    setSelectedDestek(destek);
    setIsDestekModalOpen(true);
  };

  // Destek silme işlemi
  const handleDeleteDestek = async (id: number) => {
    if (window.confirm('Bu desteği silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await supabase.from('devlet_destekleri').delete().eq('id', id);
        
        if (error) throw error;
        
        // Veriyi yeniden yükle
        fetchDevletDestekleri();
        
        toast({
          title: "Başarılı",
          description: "Destek kaydı başarıyla silindi.",
          variant: "default"
        });
      } catch (error: any) {
        toast({
          title: "Hata",
          description: `Destek silinirken bir hata oluştu: ${error.message}`,
          variant: "destructive"
        });
      }
    }
  };

  // Destek ekleme/düzenleme formu gönderimi
  const handleSubmitDestek = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const destekData = {
        ...selectedDestek,
        updated_at: new Date()
      };
      
      if (selectedDestek.id) {
        // Güncelleme işlemi
        const { error } = await supabase
          .from('devlet_destekleri')
          .update(destekData)
          .eq('id', selectedDestek.id);
          
        if (error) throw error;
        
        toast({
          title: "Başarılı",
          description: "Destek bilgileri güncellendi.",
          variant: "default"
        });
      } else {
        // Yeni kayıt ekleme
        const { error } = await supabase
          .from('devlet_destekleri')
          .insert({
            ...destekData,
            created_at: new Date()
          });
          
        if (error) throw error;
        
        toast({
          title: "Başarılı",
          description: "Yeni destek kaydı oluşturuldu.",
          variant: "default"
        });
      }
      
      // Modalı kapat ve veriyi yeniden yükle
      setIsDestekModalOpen(false);
      setSelectedDestek({});
      fetchDevletDestekleri();
      
    } catch (error: any) {
      toast({
        title: "Hata",
        description: `İşlem sırasında bir hata oluştu: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Destek formu input değişikliklerini işle
  const handleDestekInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSelectedDestek(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Dosya değişikliklerini işle
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // Dosya yükleme işlemleri burada
      const fileName = `destek_${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('destekler')
        .upload(fileName, file);
        
      if (error) throw error;
      
      // Dosya URL'ini al
      const { data: urlData } = supabase.storage
        .from('destekler')
        .getPublicUrl(fileName);
        
      // State'i güncelle
      setSelectedDestek(prev => ({
        ...prev,
        dosya_url: urlData.publicUrl
      }));
      
    } catch (error: any) {
      toast({
        title: "Dosya Yükleme Hatası",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Excel dosyasını yükle ve verileri işle
  const handleUploadDevletDestegi = async (file: File) => {
    setIsExcelUploading(true);
    
    try {
      // Dosyayı oku
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Tüm Excel verilerini oku (sınırlama olmadan)
          const excelData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          if (!excelData || excelData.length < 4) {
            throw new Error("Excel dosyası boş veya geçersiz format");
          }
          
          // Artık tek tablo adını kullanıyoruz: devlet_destegi
          const tableName = "devlet_destegi";
          // console.log("Kullanılan tablo:", tableName);
          
          // Önceki kayıtları temizle
          const { error: clearError } = await supabase
            .from(tableName)
            .delete()
            .gte('id', 0);
          
          if (clearError) {
            throw clearError;
          }
          
          // Verileri hazırla (4. satırdan başla, son satırı alma)
          const recordsToInsert = [];
          
          for (let i = 3; i < excelData.length - 1; i++) {
            const row: any = excelData[i];
            
            // Tüm sütunlar için veri kontrolü yap
            if (!row || row.length < 13 || (row[0] === undefined && row[1] === undefined)) {
              continue; // Geçersiz satırları atla
            }
            
            // Tarihleri ISO formatına dönüştür (GG.AA.YYYY -> YYYY-MM-DD)
            const baslamaTarihi = row[7] ? formatDateForPostgres(row[7]) : null;
            const ayrilisTarihi = row[8] ? formatDateForPostgres(row[8]) : null;
            
            // Veriyi oluştur
            const record = {
              sira_no: row[0] || i - 2,
              ogr_id: row[1] || null,
              kimlik_no: row[2] || null,
              ad_soyad: row[3] || null,
              dal_adi: row[4] || null,
              isletme_id: row[5] || null,
              isletme_adi: row[6] || null,
              baslama: baslamaTarihi,
              ayrilis: ayrilisTarihi,
              toplam_sure: row[9] || null,
              eksik_gun: row[10] || null,
              gun: row[11] || null,
              ucret: row[12] || null,
              odeme_evraki_durumu: "Ödeme Evrağı Zamanında Teslim Edilmedi", // Varsayılan durum
              yukleme_tarihi: new Date().toISOString() // Yükleme tarihini kaydedelim
            };
            
            recordsToInsert.push(record);
          }
          
          // Veri varsa DB'ye ekle
          if (recordsToInsert.length > 0) {
            // Toplu ekleme işlemi
            const { error: insertError } = await supabase
              .from(tableName)
              .insert(recordsToInsert);
            
            if (insertError) {
              throw insertError;
            }
            
            toast({
              title: "Başarılı",
              description: `${recordsToInsert.length} kayıt başarıyla yüklendi.`,
              variant: "default"
            });
            
            // Veriyi yeniden yükle
            fetchEvrakData();
          } else {
            throw new Error("İşlenecek veri bulunamadı");
          }
        } catch (processError: any) {
          console.error("Excel işleme hatası:", processError);
          toast({
            title: "Excel İşleme Hatası",
            description: processError.message,
            variant: "destructive"
          });
        } finally {
          setIsExcelUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Dosya Okuma Hatası",
          description: "Excel dosyası okunamadı",
          variant: "destructive"
        });
        setIsExcelUploading(false);
      };
      
      reader.readAsBinaryString(file);
      
    } catch (error: any) {
      console.error("Excel yükleme hatası:", error);
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
      setIsExcelUploading(false);
    }
  };

  // Tarih formatını PostgreSQL için dönüştürme (GG.AA.YYYY -> YYYY-MM-DD)
  const formatDateForPostgres = (dateStr: string | null): string | null => {
    try {
      // Tarih formatını kontrol et
      if (!dateStr) return null;
      
      // Türkçe format (GG.AA.YYYY)
      if (dateStr.includes('.')) {
        const parts = dateStr.split('.');
        if (parts.length !== 3) return null;
        
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        return `${year}-${month}-${day}`;
      }
      
      // Excel'den gelen tarih (DD/MM/YYYY)
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        return `${year}-${month}-${day}`;
      }
      
      // Zaten ISO formatında ise (YYYY-MM-DD)
      if (dateStr.includes('-') && dateStr.length === 10) {
        return dateStr;
      }
      
      // Diğer formatlar için basit kontrol - varsayılan olarak null dön
      return null;
    } catch (error) {
      console.error("Tarih dönüştürme hatası:", error, "Tarih:", dateStr);
      return null;
    }
  };

  // Destek silme onayı
  const confirmDeleteDestek = async () => {
    if (!destekIdToDelete) return;
    
    try {
      setIsDestekLoading(true);
      const { error } = await deleteDevletDestegi(destekIdToDelete);
      
      if (error) throw error;
      
      // State'den kaldır
      setDestekler(prev => prev.filter(d => d.id !== destekIdToDelete));
      
      toast({
        title: "Başarılı",
        description: "Devlet desteği kaydı başarıyla silindi.",
        variant: "default"
      });
      
      setIsDestekDeleteDialogOpen(false);
      setDestekIdToDelete(null);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: `Devlet desteği silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsDestekLoading(false);
    }
  };

  // İşletme verilerini doğrudan "isletmeler" tablosundan çek
  const fetchUniqueBusinessNames = async () => {
    try {
      setIsLoading(true);
      // console.log("İşletme verileri doğrudan 'isletmeler' tablosundan çekiliyor...");
      
      // Doğrudan "isletmeler" tablosunu kullan
        const { data, error } = await supabase
        .from('isletmeler')
        .select('*');
        
        if (error) {
        console.error("İşletme verileri çekilirken hata:", error);
        toast({
          title: "Hata",
          description: "İşletme verileri çekilirken bir sorun oluştu.",
          variant: "destructive"
        });
        return;
      }
      
      if (!data || data.length === 0) {
        // console.log("İşletmeler tablosunda veri bulunamadı!");
        return;
      }
      
      // console.log(`'isletmeler' tablosundan ${data.length} kayıt bulundu.`);
      
      // Verileri Business arayüzüne uygun formatta dönüştür
      const formattedBusinesses: Business[] = data.map((business: any, index) => {
        // İşletme adını standart bir formatta sakla - boşlukları temizle
        let businessName = business.name || business.isletme_adi || "";
        businessName = businessName.trim();
        
        return {
          id: business.id || (index + 1),
          name: businessName,
          address: business.address || "-",
          contact_person: business.contact_person || "-",
          phone: business.phone || "-",
          industry: business.industry || "",
          atanan_ogretmenler: business.atanan_ogretmenler
        }
      });
      
      // İşletmeleri alfabetik olarak sırala (A-Z)
      formattedBusinesses.sort((a, b) => {
        return a.name.localeCompare(b.name, 'tr-TR');
      });
      
      // console.log("İşletmeler alfabetik olarak sıralandı (A-Z)");
      
      // İşletme verilerini state ve önbelleğe kaydet
      setBusinessesData(formattedBusinesses);
      setBusinessDataLoaded(true);
      
      try {
        sessionStorage.setItem('businessData', JSON.stringify(formattedBusinesses));
        // console.log("İşletme verileri önbelleğe kaydedildi");
      } catch (e) {
        console.error("İşletme verilerini önbelleğe kaydetme hatası:", e);
      }
      
      // console.log("İşletme verileri güncellendi:", formattedBusinesses.length, "kayıt");
      
    } catch (error) {
      console.error('İşletme verileri alınırken hata:', error);
      toast({
        title: "Hata",
        description: "İşletme verileri işlenirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tab değiştiğinde ve ilk yüklemede işletmeleri getir
  useEffect(() => {
    if (activeTab === 'payments') {
      // Devlet Desteği Bilgileri sekmesi aktif olduğunda verileri yeniden yükle
      // console.log("Devlet Desteği Bilgileri sekmesi aktif, veriler yükleniyor...");
      setIsEvrakLoading(true);
      fetchEvrakData().then(() => {
        setEvrakDataLoaded(true);
        setIsEvrakLoading(false);
      }).catch(error => {
        console.error("Evrak verileri yüklenirken hata:", error);
      toast({
        title: "Hata",
          description: "Veriler yüklenirken bir hata oluştu.",
          variant: "destructive"
      });
        setIsEvrakLoading(false);
      });
    }
  }, [activeTab]);

  // Tab değiştiğinde businessManagementScreen'i sıfırla
  useEffect(() => {
    // activeTab değiştiğinde businessManagementScreen'i null'a çek
    setBusinessManagementScreen(null);
  }, [activeTab]);

  // Filtrelenmiş öğretmenler listesi
  const filteredTeachersList = useMemo(() => {
    if (!teacherSearchTerm.trim()) return teachers;
    
    return teachers.filter(teacher => 
      teacher.name.toLowerCase().includes(teacherSearchTerm.toLowerCase())
    );
  }, [teachers, teacherSearchTerm]);

  // Filtrelenmiş işletmeler listesi - ATAMA EKRANI için (sadece atanmamış işletmeler)
  const filteredBusinessesList = useMemo(() => {
    // Önce atanmamış işletmeleri filtrele - daha katı bir kontrol yapıyoruz
    const unassignedBusinesses = businessesData.filter(business => {
      // business.atanan_ogretmenler null veya undefined olmalı veya boş string olmalı
      // VE businessAssignments'da bu işletmeye atama yapılmamış olmalı
      return (!business.atanan_ogretmenler || business.atanan_ogretmenler === '') && 
             !businessAssignments[business.id];
    });
    
    // Sonra arama terimine göre filtrele (eğer arama terimi varsa)
    if (!businessSearchTerm.trim()) return unassignedBusinesses;
    
    return unassignedBusinesses.filter(business => 
      business.name.toLowerCase().includes(businessSearchTerm.toLowerCase())
    );
  }, [businessesData, businessSearchTerm, businessAssignments]);

  // Filtrelenmiş işletmeler listesi - İŞLETME YÖNETİMİ EKRANI için (tüm işletmeler)
  const filteredBusinessesForManagement = useMemo(() => {
    // Önce tüm işletmeleri al veya arama terimine göre filtrele
    let filteredBusinesses = !searchTerm.trim() 
      ? [...businessesData] 
      : businessesData.filter(business => 
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // İşletmeleri isme göre alfabetik olarak sırala (A-Z)
    filteredBusinesses.sort((a, b) => {
      const nameA = (a.name || '').toLocaleLowerCase('tr-TR');
      const nameB = (b.name || '').toLocaleLowerCase('tr-TR');
      return nameA.localeCompare(nameB, 'tr-TR');
    });
    
    return filteredBusinesses;
  }, [businessesData, searchTerm]);

  // Tab değiştiğinde filtreleme işlemini tekrar uygula
  useEffect(() => {
    if (activeTab === 'assignments') {
      // Atama ekranına geçildiğinde, businessData yüklüyse 
      // ve sessionStorage'dan gelmişse tekrar kontrol et
      if (businessDataLoaded) {
        // console.log("Atama ekranı için işletmeler yeniden filtreleniyor");
        // Business listesini yeniden işle ve sadece atanmamış işletmelerin 
        // görünmesini sağla
        const tempBusinessData = [...businessesData];
        setBusinessesData(tempBusinessData);  // Trigger filteredBusinessesList hesaplamasını
      }
    }
  }, [activeTab, businessDataLoaded]); // businessesData bağımlılığını kaldırdım

  // Öğretmeni işletmeye atama
  const handleAssignTeacher = async (teacherId: string, businessId: number) => {
    try {
      setIsLoading(true);
      
      // Supabase fonksiyonunu kullan
      const { error } = await assignTeacherToBusiness(teacherId, businessId);
      
      if (error) {
        throw error;
      }

      // Öğretmen bilgisini al
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) {
        throw new Error("Öğretmen bilgisi bulunamadı");
      }
      
      // İşletme bilgisini al
      const business = businessesData.find(b => b.id === businessId);
      if (!business) {
        throw new Error("İşletme bilgisi bulunamadı");
      }

      // State'leri güncelle
      // 1. İşletmenin atanan_ogretmenler değerini güncelle
      setBusinessesData(prev => prev.map(b => 
        b.id === businessId ? { ...b, atanan_ogretmenler: teacherId } : b
      ));
      
      // 2. assignedTeachers listesine ekle
      setAssignedTeachers(prev => [
        ...prev,
        {
          teacher_id: teacherId,
          business_id: businessId,
          business_name: business.name || ''
        }
      ]);

      // 3. İşletmeleri yeniden yükle
      await fetchBusinesses();
      
      // 4. Atanmamış işletmeleri güncelle
      fetchUnassignedBusinesses();
      
      toast({
        title: "Başarılı",
        description: `${teacher.name} öğretmeni ${business.name} işletmesine atandı`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('İşletme atama hatası:', error);
        toast({
          title: "Hata",
        description: error.message || "İşletme atama sırasında bir hata oluştu",
          variant: "destructive",
        });
    } finally {
      setIsLoading(false);
    }
  };

  // Çoklu işletme atama fonksiyonu 
  const handleAssignMultipleBusinesses = async (teacherId: string, businessIds: number[]) => {
    try {
      setIsLoading(true);
      
      // Öğretmen bilgisini al
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) {
        throw new Error("Öğretmen bilgisi bulunamadı");
      }
      
      // Her bir işletme için atama işlemini gerçekleştir
      let hasError = false;
      let successCount = 0;
      const successfulAssignments = [];
      
      for (const businessId of businessIds) {
        const { error } = await assignTeacherToBusiness(teacherId, businessId);
        
        if (error) {
          console.error(`İşletme (ID: ${businessId}) atama hatası:`, error);
          hasError = true;
        } else {
          successCount++;
          
          // İşletme bilgisini al
          const business = businessesData.find(b => b.id === businessId);
          if (business) {
            successfulAssignments.push({
        teacher_id: teacherId,
        business_id: businessId,
        business_name: business.name || ''
            });
          }
        }
      }
      
      // Başarılı atamalar olduysa state'leri güncelle
      if (successfulAssignments.length > 0) {
        // 1. İşletmelerin atanan_ogretmenler değerlerini güncelle
      setBusinessesData(prev => prev.map(b => 
          successfulAssignments.some(a => a.business_id === b.id)
          ? { ...b, atanan_ogretmenler: teacherId }
          : b
      ));
      
        // 2. assignedTeachers listesine ekle
        setAssignedTeachers(prev => [...prev, ...successfulAssignments]);
      }
      
      // 3. İşletmeleri yeniden yükle
      await fetchBusinesses();
      
      // 4. Atanmamış işletmeleri güncelle
      fetchUnassignedBusinesses();
      
      if (hasError) {
      toast({
          title: "Uyarı",
          description: `${successCount} işletme atandı, bazı işletmeler atanamadı.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Başarılı",
          description: `${businessIds.length} işletme başarıyla atandı`,
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Toplu işletme atama hatası:', error);
      toast({
        title: "Hata",
        description: error.message || "İşletme atama sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // İşletme seçim durumunu güncelle
  const toggleBusinessSelection = (teacherId: string, businessId: number) => {
    setSelectedBusinesses(prev => {
      const teacherSelections = prev[teacherId] || [];
      const isSelected = teacherSelections.includes(businessId);
      
      if (isSelected) {
        // İşletmeyi seçimden kaldır
        return {
          ...prev,
          [teacherId]: teacherSelections.filter(id => id !== businessId)
        };
        } else {
        // İşletmeyi seçime ekle
      return {
        ...prev,
          [teacherId]: [...teacherSelections, businessId]
      };
      }
    });
  };

  // Tablo adını oluşturan yardımcı fonksiyon
  const getTableNameForDate = (year: string, month: string): string => {
    // Artık tüm veriler "devlet_destegi" tablosunda saklanıyor
    return "devlet_destegi";
    
    /* Eski dinamik kod yorum satırına alındı
    // Ay değerini iki haneli formata çevir
    const formattedMonth = month.padStart(2, '0');
    return `devlet_destegi${year}${formattedMonth}`;
    */
  };

  // Ay seçimi için options oluşturan fonksiyon
  const getMonthOptions = (selectedYear: string) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-based to 1-based

    // Seçilen yıl için ayları oluştur
    const months = [];
    const maxMonth = selectedYear === currentYear.toString() ? currentMonth : 12;

    for (let month = 1; month <= maxMonth; month++) {
      months.push({
        value: month.toString().padStart(2, '0'),
        label: new Date(parseInt(selectedYear), month - 1, 1).toLocaleString('tr-TR', { month: 'long' })
      });
    }

    return months.reverse(); // En son ay en üstte olsun
  };

  // Öğretmenin atanan işletmelerini getiren fonksiyon
  const getTeacherBusinesses = async (teacherId: string) => {
    try {
      const { data, error } = await supabase
        .from('isletmeler')
        .select('*')
        .eq('atanan_ogretmenler', teacherId);

      if (error) throw error;

      // İşletme verilerini normalize et
      return (data || []).map(business => ({
        ...business,
        // İşletme adını name veya isletme_adi'ndan al
        name: (business.name || business.isletme_adi || '').trim()
      }));
    } catch (error) {
      console.error('İşletme verilerini getirme hatası:', error);
      return [];
    }
  };

  // Rapor önizleme verilerini hazırlayan fonksiyon
  const getPreviewData = async (teacherId: string | null = null) => {
    try {
      if (!selectedYear || !selectedMonth) return [];

      // Sabit tablo adını kullan
      const tableName = "devlet_destegi";
      // console.log('Önizleme için tablo:', tableName);

      // Önce öğretmenin işletmelerini al (eğer öğretmen seçiliyse)
      let teacherBusinessNames: string[] = [];
      if (teacherId && teacherId !== 'all') {
        const { data: businessData, error: businessError } = await supabase
          .from('isletmeler')
          .select('*')
          .eq('atanan_ogretmenler', teacherId);

        if (businessError) {
          console.error('İşletme verileri alınırken hata:', businessError);
        } else if (businessData) {
          teacherBusinessNames = businessData
            .map(b => (b.name || b.isletme_adi || '').trim().toLowerCase())
            .filter(name => name); // Boş olmayan işletme adlarını al
          
          // console.log('Öğretmenin işletmeleri:', teacherBusinessNames);
        }
      }

      // Devlet desteği verilerini al - seçilen yıl ve aya göre filtrele
      let query = supabase
        .from(tableName)
        .select('*')
        .order('isletme_adi', { ascending: true });
        
      // Yıl ve ay filtreleri ekle
      if (selectedYear && selectedMonth) {
        // Seçilen yıl ve aya göre filtrele (yukleme_tarihi alanına göre)
        const startDate = `${selectedYear}-${selectedMonth}-01`;
        const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
        const endDate = `${selectedYear}-${selectedMonth}-${lastDay}`;
        
        // Tarih aralığına göre filtrele
        query = query.gte('yukleme_tarihi', startDate).lte('yukleme_tarihi', endDate);
      }
      
      const { data: allData, error } = await query;

      if (error) {
        console.error('Devlet desteği verileri alınırken hata:', error);
        return [];
      }

      if (!allData || allData.length === 0) {
        // console.log('Devlet desteği verisi bulunamadı');
        return [];
      }

      // Eğer öğretmen seçiliyse, sadece o öğretmenin işletmelerini göster
      if (teacherId && teacherId !== 'all' && teacherBusinessNames.length > 0) {
        const filteredData = allData.filter(record => {
          // İşletme adını küçük harfe çevir (arama için)
          const isletmeAdi = (record.isletme_adi || '').toLowerCase().trim();
          
          // Öğretmenin işletmelerinden biri mi diye kontrol et
          return teacherBusinessNames.some(bizName => 
            isletmeAdi.includes(bizName) || bizName.includes(isletmeAdi)
          );
        });
        
        return filteredData;
      }
      
      return allData;
    } catch (error) {
      console.error("Önizleme verileri hazırlanırken hata:", error);
      return [];
    }
  };

  // Rapor önizleme içeriğini render eden fonksiyon
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Önizleme verilerini yükle
  useEffect(() => {
    const loadPreviewData = async () => {
      if (!selectedYear || !selectedMonth) return;
      
      setPreviewLoading(true);
      try {
        const data = await getPreviewData(selectedTeacher);
        // console.log('Yüklenen önizleme verisi:', data.length, 'kayıt');
        setPreviewData(data);
      } catch (error) {
        console.error('Önizleme verileri yüklenirken hata:', error);
        setPreviewData([]);
      } finally {
        setPreviewLoading(false);
      }
    };

    loadPreviewData();
  }, [selectedTeacher, selectedYear, selectedMonth]);

  // Önizleme içeriğini render et
  const renderPreviewContent = () => {
    if (previewLoading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            <div className="flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Veriler yükleniyor...</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (previewData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            <div className="text-center text-muted-foreground">
              {!selectedYear || !selectedMonth 
                ? "Lütfen yıl ve ay seçiniz"
                : selectedTeacher
                  ? "Seçilen öğretmen için bu dönemde kayıt bulunamadı"
                  : "Bu dönem için kayıt bulunamadı"}
            </div>
          </TableCell>
        </TableRow>
      );
    }

    // İlk 10 kaydı göster
    const displayData = previewData.slice(0, 10);

    return (
      <>
        {displayData.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{item.isletme_adi || "-"}</TableCell>
            <TableCell>{item.ad_soyad || "-"}</TableCell>
            <TableCell>{item.kimlik_no || "-"}</TableCell>
            <TableCell className="text-right">{formatCurrency(item.ucret)}</TableCell>
            <TableCell className="text-center">
              <div className={
                item.odeme_evraki_durumu === "Ödeme Evrağı Teslim Edildi" 
                  ? "text-green-600 text-sm font-medium bg-green-100 px-3 py-1.5 rounded-full text-center w-full mx-auto" 
                  : "text-red-600 text-sm font-medium bg-red-100 px-3 py-1.5 rounded-full text-center w-full mx-auto"
              }>
                {item.odeme_evraki_durumu}
              </div>
            </TableCell>
          </TableRow>
        ))}
        {previewData.length > 10 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-4">
              <div className="text-center text-muted-foreground italic">
                ... ve {previewData.length - 10} kayıt daha
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  };

  // Öğretmen bazlı rapor oluşturma fonksiyonu
  const generateTeacherReport = async (teacherId: string, teacherName: string, data: any[]) => {
    try {
      // Öğretmenin atandığı işletmeleri doğrudan isletmeler tablosundan al
      const teacherBusinesses = await getTeacherBusinesses(teacherId);
      // console.log(`${teacherName} için bulunan işletme sayısı:`, teacherBusinesses.length);

      if (teacherBusinesses.length === 0) {
        // console.log(`${teacherName} için atanmış işletme bulunamadı`);
        return null;
      }

      // İşletme adlarını normalize et ve boş olmayanları al
      const teacherBusinessNames = teacherBusinesses
        .filter(b => b.name) // Boş işletme adlarını filtrele
        .map(b => b.name.toLowerCase());

      // console.log('İşletmeler:', teacherBusinessNames);

      // Öğretmenin işletmelerine ait verileri filtrele
      const teacherData = data.filter(record => {
        const recordBusinessName = (record.isletme_adi || '').trim().toLowerCase();
        return teacherBusinessNames.includes(recordBusinessName);
      });

      // console.log(`${teacherName} için bulunan kayıt sayısı:`, teacherData.length);

      if (teacherData.length === 0) {
        // console.log(`${teacherName} için devlet desteği kaydı bulunamadı`);
        return null;
      }

      // Excel için veri hazırla - düz liste formatında
      const excelData = teacherData
        .sort((a, b) => (a.isletme_adi || '').localeCompare(b.isletme_adi || '', 'tr-TR'))
        .map((record, index) => ({
          'Sıra No': index + 1,
          'İşletme Adı': record.isletme_adi || '',
          'Öğrenci Adı': record.ad_soyad || '',
          'TC Kimlik No': record.kimlik_no || '',
          'Dal Adı': record.dal_adi || '',
          'Başlama': record.baslama || '',
          'Ayrılış': record.ayrilis || '',
          'Toplam Süre': record.toplam_sure || '',
          'Eksik Gün': record.eksik_gun || '',
          'Gün': record.gun || '',
          'Ücret': formatCurrency(record.ucret) || '',
          'Ödeme Evrakı Durumu': record.odeme_evraki_durumu || ''
        }));

      // Excel dosyası oluştur
      const ws = XLSX.utils.json_to_sheet([]);
      const wb = XLSX.utils.book_new();
      
      // Sayfa başlığı ekle
      const title = [
        [`${teacherName} - Devlet Desteği Raporu`],
        [`${selectedYear} Yılı ${selectedMonth}. Ay`],
        ['Atanan İşletme Sayısı: ' + teacherBusinesses.length],
        ['Toplam Öğrenci Sayısı: ' + teacherData.length],
        [''],  // Boş satır
      ];
      XLSX.utils.sheet_add_aoa(ws, title, { origin: 'A1' });

      // Veriyi başlıktan sonra ekle
      XLSX.utils.sheet_add_json(ws, excelData, { origin: 'A6', skipHeader: false });

      XLSX.utils.book_append_sheet(wb, ws, 'Devlet Desteği Raporu');

      // Sütun genişliklerini ayarla
      const colWidths = [
        { wch: 8 },  // Sıra No
        { wch: 40 }, // İşletme Adı
        { wch: 25 }, // Öğrenci Adı
        { wch: 15 }, // TC Kimlik No
        { wch: 20 }, // Dal Adı
        { wch: 12 }, // Başlama
        { wch: 12 }, // Ayrılış
        { wch: 12 }, // Toplam Süre
        { wch: 12 }, // Eksik Gün
        { wch: 8 },  // Gün
        { wch: 12 }, // Ücret
        { wch: 30 }  // Ödeme Evrakı Durumu
      ];
      ws['!cols'] = colWidths;

      // Stil ayarlamaları
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = 0; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (!cell) continue;

          // Stil ayarları
          cell.s = {
            font: { 
              bold: R <= 4 || R === 5, // Sadece başlıklar ve sütun başlıkları kalın
              color: R <= 4 ? { rgb: "000000" } : undefined // Başlıklar siyah
            },
            fill: R === 5 ? { fgColor: { rgb: "CCCCCC" } } : undefined, // Sütun başlıkları gri
            alignment: { 
              horizontal: "center",
              vertical: "center"
            }
          };
        }
        }
        
        // Dosyayı indir
      const fileName = `${teacherName.replace(/\s+/g, '_')}_devlet_destegi_${selectedYear}_${selectedMonth}.xlsx`;
      XLSX.writeFile(wb, fileName);
      return teacherData.length;
    } catch (error) {
      console.error(`${teacherName} için rapor oluşturma hatası:`, error);
      return null;
    }
  };

  // Ana rapor oluşturma fonksiyonunu güncelle
  const generateReport = async () => {
    try {
      setLoading(true);
      
      if (!selectedYear || !selectedMonth) {
        toast({
          title: "Uyarı",
          description: "Lütfen yıl ve ay seçiniz.",
          variant: "destructive",
        });
        return;
      }

      // Tablo adını oluştur
      const tableName = getTableNameForDate(selectedYear, selectedMonth);
      // console.log('Rapor için seçilen tablo:', tableName);

      // Tüm verileri almak için sayfalama kullan
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMoreData = true;

      while (hasMoreData) {
        // console.log(`Sayfa ${page + 1} verisi alınıyor...`);
        
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('isletme_adi', { ascending: true });

        if (error) {
          console.error('Tablo bulunamadı:', tableName, error);
          toast({
            title: "Hata",
            description: `${selectedYear} yılı ${selectedMonth}. ay için tablo bulunamadı.`,
            variant: "destructive",
          });
          return;
        }

        if (!data || data.length === 0) {
          if (page === 0) {
            toast({
              title: "Hata",
              description: "Seçilen kriterlere göre kayıt bulunamadı.",
              variant: "destructive",
            });
            return;
          }
          hasMoreData = false;
          continue;
        }

        allData = [...allData, ...data];
        // console.log(`Toplam ${allData.length} kayıt yüklendi...`);

        if (data.length < pageSize) {
          hasMoreData = false;
        } else {
          page++;
        }
      }

      // Seçilen öğretmene göre rapor oluştur
      if (selectedTeacher === 'all') {
        // Tüm kayıtları içeren tek bir rapor oluştur
        const excelData = allData
          .sort((a, b) => (a.isletme_adi || '').localeCompare(b.isletme_adi || '', 'tr-TR'))
          .map((record, index) => {
            // İşletmeyi bul
            const businessName = record.isletme_adi || '';
            const business = businesses.find(b => (b.name || '').trim().toLowerCase() === businessName.trim().toLowerCase());
            
            // Öğretmeni bul
            let teacherName = "";
            if (business && business.atanan_ogretmenler) {
              const teacher = teachers.find(t => t.id === business.atanan_ogretmenler);
              teacherName = teacher ? teacher.name : "";
            }
            
            return {
              'Sıra No': index + 1,
              'İşletme Adı': businessName,
              'Öğrenci Adı': record.ad_soyad || '',
              'TC Kimlik No': record.kimlik_no || '',
              'Dal Adı': record.dal_adi || '',
              'Başlama': record.baslama || '',
              'Ayrılış': record.ayrilis || '',
              'Toplam Süre': record.toplam_sure || '',
              'Eksik Gün': record.eksik_gun || '',
              'Gün': record.gun || '',
              'Ücret': formatCurrency(record.ucret) || '',
              'Ödeme Evrakı Durumu': record.odeme_evraki_durumu || '',
              'Atanan Öğretmen': teacherName
            };
          });

        // Excel dosyası oluştur
        const ws = XLSX.utils.json_to_sheet([]);
        const wb = XLSX.utils.book_new();
        
        // Sayfa başlığı ekle
        const title = [
          [`Devlet Desteği Raporu - Tüm Öğretmenler`],
          [`${selectedYear} Yılı ${selectedMonth}. Ay`],
          [`Toplam Kayıt Sayısı: ${allData.length}`],
          [''], // Boş satır
        ];
        XLSX.utils.sheet_add_aoa(ws, title, { origin: 'A1' });

        // Veriyi başlıktan sonra ekle
        XLSX.utils.sheet_add_json(ws, excelData, { origin: 'A5', skipHeader: false });

        XLSX.utils.book_append_sheet(wb, ws, 'Devlet Desteği Raporu');
        
        // Sütun genişliklerini ayarla
        const colWidths = [
          { wch: 8 },  // Sıra No
          { wch: 40 }, // İşletme Adı
          { wch: 25 }, // Öğrenci Adı
          { wch: 15 }, // TC Kimlik No
          { wch: 20 }, // Dal Adı
          { wch: 12 }, // Başlama
          { wch: 12 }, // Ayrılış
          { wch: 12 }, // Toplam Süre
          { wch: 12 }, // Eksik Gün
          { wch: 8 },  // Gün
          { wch: 12 }, // Ücret
          { wch: 30 }, // Ödeme Evrakı Durumu
          { wch: 25 }  // Atanan Öğretmen
        ];
        ws['!cols'] = colWidths;

        // Stil ayarlamaları
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let R = 0; R <= range.e.r; R++) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (!cell) continue;

            // Stil ayarları
            cell.s = {
              font: { 
                bold: R <= 3 || R === 4, // Sadece başlıklar ve sütun başlıkları kalın
                color: R <= 3 ? { rgb: "000000" } : undefined // Başlıklar siyah
              },
              fill: R === 4 ? { fgColor: { rgb: "CCCCCC" } } : undefined, // Sütun başlıkları gri
              alignment: { 
                horizontal: "center",
                vertical: "center"
              }
            };
          }
        }
        
        // Dosyayı indir
        const fileName = `devlet_destegi_tum_ogretmenler_${selectedYear}_${selectedMonth}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        toast({
          title: "Başarılı",
          description: `Toplam ${allData.length} kayıt içeren rapor oluşturuldu.`,
          variant: "default",
        });
      } else {
        // Seçili öğretmen için rapor oluştur
        const teacher = teachers.find(t => t.id === selectedTeacher);
        if (!teacher) {
          toast({
            title: "Hata",
            description: "Seçili öğretmen bulunamadı.",
            variant: "destructive",
          });
          return;
        }

        const recordCount = await generateTeacherReport(teacher.id, teacher.name, allData);
        if (recordCount) {
          toast({
            title: "Başarılı",
            description: `${teacher.name} için ${recordCount} kayıtlı rapor oluşturuldu.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Bilgi",
            description: `${teacher.name} için kayıt bulunamadı.`,
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Rapor oluşturma hatası:', error);
      toast({
        title: "Hata",
        description: "Rapor oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // handleTabChange fonksiyonunu burada yeniden tanımlıyoruz (fetchEvrakData tanımlandıktan sonra)
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setSearchTerm(''); // Sekme değiştiğinde aramayı sıfırla
    
    // İşletme sekmesine geçerken sadece ilk sefer yükleme göstergesi göster
    if (value === 'business' && !businessDataLoaded) {
      setIsLoading(true);
    } else if (value === 'business') {
      // İşletme verileri zaten yüklü, loading gösterme
      // console.log("İşletme verileri zaten yüklü olduğu için yükleme göstergesi atlanıyor");
    }
    
    // Raporlar sekmesi için artık otomatik veri sorgulaması yapmıyoruz
    // Kullanıcı rapor oluştur butonuna tıkladığında fetchEvrakData çağrılacak
    if (value === 'reports') {
      // console.log("Raporlar sekmesi aktif edildi. Veri sorgulaması rapor oluşturma sırasında yapılacak.");
      setEvrakDataLoaded(true); // Veri sorgulama işlemini atlamak için
    }
  }, [businessDataLoaded]);

  // Ay veya yıl seçimi değiştiğinde verileri yeniden yükle
  useEffect(() => {
    if (activeTab === 'reports' && (reportMonth || reportYear)) {
      // console.log("Rapor kriterleri değişti, veriler yeniden yükleniyor...");
      setIsEvrakLoading(true);
      
      fetchEvrakData().then(() => {
        setIsEvrakLoading(false);
      }).catch(error => {
        console.error("Evrak verileri yüklenirken hata:", error);
        toast({
          title: "Hata",
          description: "Rapor kriterleri için veriler yüklenemedi.",
          variant: "destructive",
        });
        setIsEvrakLoading(false);
      });
    }
  }, [activeTab, reportMonth, reportYear, fetchEvrakData, toast]);

  // İşletme atama modalını açan fonksiyon
  const openBusinessSelectionModal = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setSelectedBusinesses(prev => ({ ...prev, [teacherId]: prev[teacherId] || [] }));
    setIsBusinessSelectionModalOpen(true);
  };

  // Öğretmenleri getiren fonksiyon
  const fetchTeachers = async () => {
    try {
      const { data: teachersData, error } = await getTeachers();
      if (error) {
        throw error;
      }
      setTeachers(teachersData || []);
    } catch (error: any) {
      console.error('Öğretmenleri getirme hatası:', error);
      toast({
        title: "Hata",
        description: "Öğretmenler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Component mount olduğunda öğretmenleri ve işletmeleri yükle
  useEffect(() => {
    fetchTeachers();
    fetchBusinesses();
  }, []);

  // Badge bileşeni için variant tanımı
  const getBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "bloke":
        return "destructive";
      case "ilk_giris":
        return "secondary";
      case "aktif":
        return "outline";
      default:
        return "default";
    }
  };

  // Tablo oluşturma SQL kodunu oluştur
  const generateTableCreationSQL = (): string => {
    const now = new Date();
    let month = now.getMonth() + 1; // 1-12 arası (şimdiki ay)
    let year = now.getFullYear();
    
    // Bir önceki aya ait tablo adını belirle
    let prevMonth = month - 1;
    let prevYear = year;
    
    // Eğer ocak ayında isek bir önceki yılın aralık ayına git
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }
    
    // İki basamaklı ay formatı
    const formattedMonth = prevMonth.toString().padStart(2, '0');
    
    // Tablo adı
    const tableName = `devlet_destegi${prevYear}${formattedMonth}`;
    
    // SQL kodunu oluştur
    return `-- ${prevYear} yılı ${prevMonth}. ay (${getMonthName(prevMonth)}) için tablo oluşturma kodu:
CREATE TABLE IF NOT EXISTS ${tableName} (
  id SERIAL PRIMARY KEY,
  sira_no INTEGER,
  ogr_id INTEGER,
  kimlik_no CHARACTER VARYING,
  ad_soyad CHARACTER VARYING,
  dal_adi CHARACTER VARYING,
  isletme_id INTEGER,
  isletme_adi CHARACTER VARYING,
  baslama DATE,
  ayrilis DATE,
  toplam_sure INTEGER,
  eksik_gun INTEGER,
  gun INTEGER,
  ucret NUMERIC,
  odeme_evraki_durumu CHARACTER VARYING DEFAULT 'Ödeme Evrağı Zamanında Teslim Edilmedi',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Eğer veriler varsa temizle (opsiyonel)
-- DELETE FROM ${tableName} WHERE id > 0;

-- Oluşturma işlemi tamamlandı!
-- Bu kodu Supabase SQL Editörüne yapıştırıp çalıştırın.
-- Ardından Excel dosyanızı yükleyebilirsiniz.
`;
  };

  // Ay ismini döndür
  const getMonthName = (month: number): string => {
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    return months[month - 1]; // 1-12 arası değerleri 0-11 indexine çevir
  };

  // Son devlet desteği tablosundan işletme isimlerini çekecek yeni fonksiyon
  const fetchNewBusinessesFromDestegiTable = async () => {
    setIsLoadingNewBusinesses(true);
    try {
      // Artık sabit tabloyu kullan
      const currentTableName = "devlet_destegi";
      // console.log("Son devlet desteği tablosu:", currentTableName);
      
      let allBusinessNames: string[] = [];
      let page = 0;
      const pageSize = 1000; // Supabase'in maksimum limiti
      let hasMoreData = true;

      // Tüm sayfaları kontrol et
      while (hasMoreData) {
        // console.log(`Sayfa ${page + 1} kontrol ediliyor...`);
        
        const { data, error, count } = await supabase
          .from(currentTableName)
          .select('isletme_adi', { count: 'exact' })
          .not('isletme_adi', 'is', null)
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) {
          if (error.code === "PGRST116") {
            // Tablo bulunamadı hatası
            // console.log(`Tablo bulunamadı: ${currentTableName}`, error);
            toast({
              title: "Uyarı",
              description: `${currentTableName} tablosu bulunamadı.`,
              variant: "destructive"
            });
            setIsLoadingNewBusinesses(false);
            return;
          }
          throw error;
        }
        
        if (!data || data.length === 0) {
          if (page === 0) {
            // console.log("Tabloda veri bulunamadı");
            toast({
              title: "Bilgi",
              description: "Devlet desteği tablosunda herhangi bir işletme bulunamadı."
            });
            setIsLoadingNewBusinesses(false);
            return;
          }
          // Daha fazla veri yok
          hasMoreData = false;
          continue;
        }

        // İşletme adlarını diziye ekle
        const pageBusinessNames = data
          .filter(item => item.isletme_adi)
          .map(item => item.isletme_adi);
        
        allBusinessNames = [...allBusinessNames, ...pageBusinessNames];
        
        // Eğer bu sayfa tam dolmadıysa, son sayfadayız demektir
        if (data.length < pageSize) {
          hasMoreData = false;
        } else {
          page++;
        }

        // Her 1000 kayıtta bir ilerleme bilgisi ver
        // console.log(`Toplam ${allBusinessNames.length} işletme kontrol edildi...`);
      }
      
      // İşletme adlarını benzersiz hale getir ve sayısını bul
      const uniqueBusinessNames: {[key: string]: number} = {};
      allBusinessNames.forEach(name => {
        if (name) {
          // Karşılaştırma için isimleri normalize et (trim + lowercase)
          const normalizedName = name.trim().toLowerCase();
          uniqueBusinessNames[normalizedName] = (uniqueBusinessNames[normalizedName] || 0) + 1;
        }
      });
      
      // Mevcut işletmeler listesinde olmayan işletmeleri bul
      // Karşılaştırma için işletme isimlerini normalize ediyoruz (trim + lowercase)
      const existingBusinessNames = businessesData.map(b => b.name.trim().toLowerCase());
      
      const newBusinesses = Object.entries(uniqueBusinessNames)
        .filter(([name]) => !existingBusinessNames.includes(name))
        .map(([name, count]) => {
          // Orijinal formatta işletme adını al (ekranda göstermek için)
          const originalName = allBusinessNames.find(n => n.trim().toLowerCase() === name);
          return { name: originalName || name, count };
        });
      
      // console.log("Yeni işletmeler bulundu:", newBusinesses.length);
      setNewBusinessesFromDestegiTable(newBusinesses);
      
      // Sonuç mesajı
      if (newBusinesses.length === 0) {
        toast({
          title: "Bilgi",
          description: `${allBusinessNames.length} işletme kontrol edildi. Yeni eklenecek işletme bulunamadı.`
        });
      } else {
          toast({
            title: "Bilgi",
          description: `${allBusinessNames.length} işletme kontrol edildi. ${newBusinesses.length} yeni işletme bulundu.`
        });
      }
    } catch (error) {
      console.error("Yeni işletmeleri çekerken hata:", error);
      toast({
        title: "Hata",
        description: "Yeni işletmeleri kontrol ederken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingNewBusinesses(false);
    }
  };

  // Yeni bulunan işletmeleri isletmeler tablosuna ekle
  const addNewBusinessesToDatabase = async () => {
    if (newBusinessesFromDestegiTable.length === 0) return;
    
    setIsAddingNewBusinesses(true);
    try {
      // Eklenecek işletmeleri hazırla
      const businessesToAdd = newBusinessesFromDestegiTable.map(business => ({
        isletme_adi: business.name
      }));
      
      // Toplu ekleme işlemi
      const { data, error } = await supabase
        .from('isletmeler')
        .insert(businessesToAdd)
        .select();
      
      if (error) throw error;
        
        toast({
          title: "Başarılı",
        description: `${businessesToAdd.length} yeni işletme başarıyla eklendi.`,
        variant: "default"
        });
      
      // İşletme listesini güncelle
      await fetchUniqueBusinessNames();
      
      // Yeni işletme listesini temizle
      setNewBusinessesFromDestegiTable([]);
    } catch (error) {
      console.error("İşletme eklerken hata:", error);
      toast({
        title: "Hata",
        description: "İşletmeler eklenirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsAddingNewBusinesses(false);
    }
  };

  // Aktif ve pasif işletmeleri filtreleme fonksiyonları
  const getActiveBusinesses = useCallback(() => {
    if (!evrakData || evrakData.length === 0) return [];
    
    return filteredBusinessesForManagement.filter(business => 
      evrakData.some(evrak => 
        evrak.isletme_adi?.toLowerCase().trim() === business.name.toLowerCase().trim()
      )
    );
  }, [evrakData, filteredBusinessesForManagement]);

  const getPassiveBusinesses = useCallback(() => {
    if (!evrakData || evrakData.length === 0) return filteredBusinessesForManagement;
    
    return filteredBusinessesForManagement.filter(business => 
      !evrakData.some(evrak => 
        evrak.isletme_adi?.toLowerCase().trim() === business.name.toLowerCase().trim()
      )
    );
  }, [evrakData, filteredBusinessesForManagement]);

  // İşletmeden öğretmen atamasını kaldıran fonksiyon
  const handleRemoveAssignment = async (businessId: number, teacherId: string) => {
    try {
      setIsLoading(true);
      
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) {
        throw new Error('Öğretmen bulunamadı');
      }
      
      const business = businessesData.find(b => b.id === businessId);
      if (!business) {
        throw new Error('İşletme bulunamadı');
      }
      
      const { error } = await removeTeacherFromBusiness(teacherId, businessId);
      if (error) throw error;
      
      // State'leri güncelle - önce UI'ı güncelleyerek anlık tepki sağla
      const updatedBusinessAssignments = { ...businessAssignments };
      delete updatedBusinessAssignments[businessId];
      setBusinessAssignments(updatedBusinessAssignments);
      
      toast({
        title: "Başarılı",
        description: `${business.name} işletmesinden ${teacher.name} ataması kaldırıldı.`
      });
      
      // İşletme ve öğretmen listelerini yeniden yükle
      await fetchTeachers();
      await fetchBusinesses();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: `Atama kaldırılırken bir sorun oluştu: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Atanmamış işletmeleri filtrele ve önbelleğe al
  const unassignedBusinessesList = useMemo(() => {
    // Önce aktif işletmeleri bul (devlet desteği tablosunda yer alanlar)
    const activeBusinessNames = evrakData
      .map(evrak => evrak.isletme_adi?.toLowerCase().trim())
      .filter(Boolean);

    return businessesData
      .filter(business => {
        const isUnassigned = !business.atanan_ogretmenler;
        const isActive = activeBusinessNames.includes(business.name.toLowerCase().trim());
        return isUnassigned && isActive; // Sadece atanmamış VE aktif işletmeleri göster
      })
      .sort((a, b) => {
        const nameA = (a.name || '').toLocaleLowerCase('tr-TR');
        const nameB = (b.name || '').toLocaleLowerCase('tr-TR');
        return nameA.localeCompare(nameB, 'tr-TR');
      });
  }, [businessesData, evrakData]);

  // İşletme arama ve filtreleme
  const filteredAssignmentBusinesses = useMemo(() => {
    if (!businessSearchTerm) return unassignedBusinessesList;

    const searchTermLower = businessSearchTerm.toLocaleLowerCase('tr-TR');
    return unassignedBusinessesList.filter(business => 
      business.name.toLocaleLowerCase('tr-TR').includes(searchTermLower)
    );
  }, [unassignedBusinessesList, businessSearchTerm]);

  // Dropdown içeriği
  const renderAssignmentDropdown = (teacher: Teacher) => (
    <DropdownMenuContent className="w-[400px]" align="end" side="left">
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <DropdownMenuLabel className="text-base py-2">Atanacak İşletmeler</DropdownMenuLabel>
          <span className="text-sm text-muted-foreground">
            {(selectedBusinesses[teacher.id] || []).length} işletme seçildi
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İşletme ara..."
            className="pl-8 mb-2 border border-input"
            value={businessSearchTerm}
            onChange={(e) => setBusinessSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <DropdownMenuSeparator />
      <ScrollArea className="h-[300px] px-1">
        {filteredAssignmentBusinesses.length > 0 ? (
          filteredAssignmentBusinesses.map(business => {
            const isSelected = (selectedBusinesses[teacher.id] || []).includes(business.id);
            
            return (
              <div 
                key={business.id}
                className={cn(
                  "flex items-center space-x-2 py-2 px-3 rounded-md transition-colors",
                  "hover:bg-accent cursor-pointer",
                  isSelected && "bg-accent"
                )}
                onClick={() => toggleBusinessSelection(teacher.id, business.id)}
              >
                <Checkbox
                  checked={isSelected}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm truncate">
                      {businessSearchTerm ? (
                        highlightSearchTerm(business.name, businessSearchTerm)
                      ) : (
                        business.name
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-2 py-4 text-sm text-center text-muted-foreground">
            {businessSearchTerm 
              ? "Arama sonucu bulunamadı" 
              : "Atanabilecek işletme kalmadı"}
          </div>
        )}
      </ScrollArea>
      
      <DropdownMenuSeparator />
      <div className="p-2">
        <Button 
          onClick={() => handleAssignMultipleBusinesses(
            teacher.id, 
            selectedBusinesses[teacher.id] || []
          )}
          disabled={(selectedBusinesses[teacher.id] || []).length === 0}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {(selectedBusinesses[teacher.id] || []).length > 0 ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              {(selectedBusinesses[teacher.id] || []).length} İşletmeyi Ata
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              İşletme Seç
            </>
          )}
        </Button>
      </div>
    </DropdownMenuContent>
  );

  // Arama sonuçlarını highlight etme fonksiyonu
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchTerm.toLowerCase() 
            ? <span key={i} className="bg-yellow-100">{part}</span>
            : part
        )}
      </>
    );
  };

  // Öğretmen listesini getir
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        // Yeni fonksiyonu kullanarak tüm kullanıcıları getir
        const { data, error } = await getAllUsersRaw();

        if (error) {
          throw error;
        }

        if (data) {
          setTeachers(data);
        }
      } catch (error) {
        console.error('Öğretmenler getirilirken hata:', error);
        toast({
          title: "Hata",
          description: "Öğretmen listesi yüklenirken bir hata oluştu.",
          variant: "destructive",
        });
      }
    };

    fetchTeachers();
  }, [toast]);

  // Öğretmene atanan işletmeleri getir
  const getTeacherAssignedBusinesses = (teacherId: string) => {
    return businessesData.filter(business => business.atanan_ogretmenler === teacherId);
  };

  // İşletme silme fonksiyonu
  const handleDeleteBusiness = (businessId: number) => {
    // Silinecek işletmeyi belirle ve dialog'u aç
    setBusinessToDelete(businessId);
    setIsBusinessDeleteDialogOpen(true);
  };

  // İşletme silme onayı
  const confirmDeleteBusiness = async () => {
    if (!businessToDelete) return;
    
    try {
      setIsDeletingBusiness(true);
      
      // İşletmeyi veritabanından sil
      const { error } = await deleteBusiness(businessToDelete);
      if (error) throw error;
      
      // İşletmeyi state'den kaldır
      setBusinessesData(prev => prev.filter(b => b.id !== businessToDelete));
      
      // İşletme-öğretmen bağlantısını state'den kaldır
      const updatedBusinessAssignments = { ...businessAssignments };
      delete updatedBusinessAssignments[businessToDelete];
      setBusinessAssignments(updatedBusinessAssignments);
      
      toast({
        title: "Başarılı",
        description: "İşletme başarıyla silindi."
      });
      
      // Dialog'u kapat ve state'i temizle
      setIsBusinessDeleteDialogOpen(false);
      setBusinessToDelete(null);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: `İşletme silinirken bir sorun oluştu: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsDeletingBusiness(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Üst Çubuk */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
        <div className="flex flex-1 items-center gap-4">
          <Logo />
          <h1 className="flex-1 text-lg font-semibold">
            Kavlaklı MESEM Yönetim Paneli
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Kompakt sistem durumu kontrolü */}
          <div className={`flex items-center ${systemIsActive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border rounded-lg px-3 py-2 gap-2`} id="radix-:r0:">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${systemIsActive ? "bg-green-600" : "bg-red-600"}`}></span>
            <span className="text-xs font-medium">Sistem Durumu</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSystemStatus}
              disabled={isUpdatingSystemStatus}
              className={`ml-1 h-6 px-2 text-xs ${systemIsActive ? "text-red-600 hover:bg-red-100" : "text-green-600 hover:bg-green-100"}`}
            >
              {isUpdatingSystemStatus ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : systemIsActive ? (
                "Kapat"
              ) : (
                "Aç"
              )}
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Admin</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Yönetici İşlemleri</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Ayarlar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>Çıkış Yap</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Ana İçerik */}
      <div className="grid grid-cols-12 gap-4 p-6">
        {/* Sol Sidebar */}
        <div className="col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <div 
                onClick={() => handleTabChange('dashboard')} 
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${activeTab === 'dashboard' ? 'bg-accent font-medium' : ''}`}
              >
                <BarChart3 size={18} />
                <span>Özet</span>
              </div>
              <div 
                onClick={() => handleTabChange('teachers')} 
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${activeTab === 'teachers' ? 'bg-accent font-medium' : ''}`}
              >
                <Users size={18} />
                <span>Öğretmenler</span>
              </div>
              <div 
                onClick={() => handleTabChange('business')} 
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${activeTab === 'business' ? 'bg-accent font-medium' : ''}`}
              >
                <Building size={18} />
                <span>İşletmeler</span>
              </div>
              <div 
                onClick={() => handleTabChange('assignments')} 
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${activeTab === 'assignments' ? 'bg-accent font-medium' : ''}`}
              >
                <ArrowRightCircle size={18} />
                <span>Atamalar</span>
              </div>
              <div 
                onClick={() => handleTabChange('payments')} 
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${activeTab === 'payments' ? 'bg-accent font-medium' : ''}`}
              >
                <Award size={18} />
                <span>Devlet Desteği Bilgileri</span>
              </div>
              <div 
                onClick={() => handleTabChange('upload')} 
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${activeTab === 'upload' ? 'bg-accent font-medium' : ''}`}
              >
                <Upload size={18} />
                <span>Devlet Desteği Yükleme</span>
              </div>
              <div 
                onClick={() => handleTabChange('reports')} 
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${activeTab === 'reports' ? 'bg-accent font-medium' : ''}`}
              >
                <FileText size={18} />
                <span>Raporlar</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ İçerik */}
        <div className="col-span-10">
          {/* Başlık ve Arama Çubuğu */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{activeTab === 'dashboard' ? 'Genel Bakış' : 
              activeTab === 'teachers' ? 'Öğretmen Yönetimi' : 
              activeTab === 'business' ? 'İşletme Yönetimi' : 
              activeTab === 'assignments' ? 'Öğretmen Atamaları' : 
              activeTab === 'payments' ? 'Devlet Desteği Bilgileri' 
              : 'Raporlar'
            }</h2>
            <div className="flex items-center space-x-2">
              {activeTab === 'teachers' && (
                <Button 
                  className="flex gap-2" 
                  onClick={handleAddTeacher}
                  title="Supabase kullanicilar tablosuna yeni öğretmen ekle"
                >
                    <UserPlus size={18} />
                  Öğretmen Ekle
                  </Button>
                )}
              {activeTab === 'business' && (
                <Button className="flex gap-2">
                  <Building size={18} />
                  Yeni İşletme
                  </Button>
                )}
            </div>
          </div>

          {/* İçerik Alanı */}
          {isLoading ? (
            <Card className="w-full flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <div className="mt-4 text-muted-foreground">Veriler yükleniyor...</div>
              </div>
            </Card>
          ) : (
            <>
              {/* Özet Sayfası */}
              {activeTab === 'dashboard' && (
                <>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {/* Öğretmen İstatistikleri */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Öğretmenler</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{teachers.length}</div>
                        <p className="text-xs text-muted-foreground">
                          Toplam öğretmen sayısı
                        </p>
                      </CardContent>
                    </Card>

                    {/* İşletme İstatistikleri */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">İşletmeler</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{businessesData.length}</div>
                        <p className="text-xs text-muted-foreground">
                          Toplam kayıtlı işletme
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Öğretmenler Sayfası */}
              {activeTab === 'teachers' && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                          placeholder="Öğretmen ara..."
                          value={teacherSearchTerm}
                          onChange={(e) => setTeacherSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button 
                        className="flex gap-2" 
                        onClick={handleAddTeacher}
                      >
                        <UserPlus size={18} />
                        Öğretmen Ekle
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Öğretmen Adı</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Son Giriş Denemesi</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6">
                              <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                                <span>Veriler yükleniyor...</span>
              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredTeachers.length > 0 ? (
                          filteredTeachers.map((teacher) => (
                            <TableRow key={teacher.id}>
                              <TableCell className="font-medium">{teacher.id}</TableCell>
                              <TableCell>{teacher.name}</TableCell>
                              <TableCell>
                                {teacher.locked_until ? (
                                  <Badge variant={getBadgeVariant("bloke")}>Bloke</Badge>
                                ) : teacher.is_first_login ? (
                                  <Badge variant={getBadgeVariant("ilk_giris")}>İlk Giriş Bekliyor</Badge>
                                ) : (
                                  <Badge variant={getBadgeVariant("aktif")}>Aktif</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {teacher.login_attempts > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    {teacher.login_attempts} başarısız deneme
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical size={16} />
                                  </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditTeacher(teacher.id)}>
                                        <Edit size={14} className="mr-2" />
                                        Düzenle
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleResetPassword(teacher.id)}>
                                        <Key size={14} className="mr-2" />
                                        Şifre Sıfırla
                                      </DropdownMenuItem>
                                      {teacher.locked_until && (
                                        <DropdownMenuItem onClick={() => handleUnlockAccount(teacher.id)}>
                                          <Unlock size={14} className="mr-2" />
                                          Blokajı Kaldır
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                    onClick={() => handleDeleteTeacher(teacher.id)}
                                        className="text-red-600"
                                      >
                                        <Trash2 size={14} className="mr-2" />
                                        Sil
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
            </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                              Öğretmen bulunamadı
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* İşletmeler Sayfası */}
              {activeTab === 'business' && (
                <>
                {/* Butonlar */}
                {businessManagementScreen === null && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card 
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      onClick={() => setBusinessManagementScreen("active")}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <CircleCheck className="mr-2 h-5 w-5 text-green-600" />
                          Aktif İşletmeler
                        </CardTitle>
                        <CardDescription>
                          Bu ay devlet desteği tablosunda yer alan işletmeler ({getActiveBusinesses().length})
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full">Görüntüle</Button>
                      </CardContent>
                    </Card>

                    <Card 
                      className="cursor-pointer hover:bg-yellow-50 hover:border-yellow-200 transition-colors"
                      onClick={() => setBusinessManagementScreen("passive")}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <CircleDashed className="mr-2 h-5 w-5 text-yellow-600" />
                          Pasif İşletmeler
                        </CardTitle>
                        <CardDescription>
                          Bu ay devlet desteği tablosunda yer almayan işletmeler ({getPassiveBusinesses().length})
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full">Görüntüle</Button>
                      </CardContent>
                    </Card>

                    <Card 
                      className="cursor-pointer hover:bg-teal-50 hover:border-teal-200 transition-colors"
                      onClick={() => setBusinessManagementScreen("new")}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <CirclePlus className="mr-2 h-5 w-5 text-teal-600" />
                          Yeni İşletmeler
                        </CardTitle>
                        <CardDescription>
                          Devlet desteği tablosundan yeni işletme ekle
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full">Görüntüle</Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Geri butonu */}
                {businessManagementScreen !== null && (
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      onClick={() => setBusinessManagementScreen(null)}
                      className="flex items-center"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Tüm İşletme Kategorileri
                    </Button>
                  </div>
                )}

                {/* Aktif İşletmeler */}
                {businessManagementScreen === "active" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Aktif İşletmeler</CardTitle>
                    <CardDescription>
                      Bu ay devlet desteği tablosunda yer alan işletmeler ({getActiveBusinesses().length})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isEvrakLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Veriler yükleniyor...</span>
                      </div>
                    ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                            <TableHead>Sıra No</TableHead>
                      <TableHead>İşletme Adı</TableHead>
                      <TableHead>Öğretmen</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                          {getActiveBusinesses().map((business, index) => (
                            <TableRow key={business.id}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell>{business.name}</TableCell>
                          <TableCell>
                                {businessAssignments[business.id] ? (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {businessAssignments[business.id].name}
                            </span>
                                ) : (
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Atanmamış
                                  </span>
                                )}
                          </TableCell>
                          <TableCell className="text-right">
                                {businessAssignments[business.id] && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      handleRemoveAssignment(
                                        business.id, 
                                        businessAssignments[business.id].id
                                      )
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 mr-2"
                                  >
                                    <Trash2 size={16} className="mr-1" />
                                    Atamayı Kaldır
                                </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteBusiness(business.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X size={16} className="mr-1" />
                                  Sil
                                </Button>
                          </TableCell>
                        </TableRow>
                          ))}
                          {getActiveBusinesses().length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                Bu ay için aktif işletme bulunamadı
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
                )}

                {/* Pasif İşletmeler */}
                {businessManagementScreen === "passive" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pasif İşletmeler</CardTitle>
                    <CardDescription>
                      Bu ay devlet desteği tablosunda yer almayan işletmeler ({getPassiveBusinesses().length})
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isEvrakLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Veriler yükleniyor...</span>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sıra No</TableHead>
                            <TableHead>İşletme Adı</TableHead>
                            <TableHead>Öğretmen</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getPassiveBusinesses().map((business, index) => (
                            <TableRow key={business.id}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell>{business.name}</TableCell>
                              <TableCell>
                                {businessAssignments[business.id] ? (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                    {businessAssignments[business.id].name}
                                  </span>
                                ) : (
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Atanmamış
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {businessAssignments[business.id] && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      handleRemoveAssignment(
                                        business.id, 
                                        businessAssignments[business.id].id
                                      )
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 mr-2"
                                  >
                                    <Trash2 size={16} className="mr-1" />
                                    Atamayı Kaldır
                                </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteBusiness(business.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X size={16} className="mr-1" />
                                  Sil
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {getPassiveBusinesses().length === 0 && (
                      <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                Pasif işletme bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                    )}
                    </CardContent>
                  </Card>
                )}

                {/* Yeni işletmeleri ekleme kısmı */}
                {businessManagementScreen === "new" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Devlet Desteği Tablosundaki Yeni İşletmeler</CardTitle>
                    <CardDescription>
                      Son devlet desteği tablosunda olup işletmeler listesinde bulunmayan işletmeleri görüntüleyin ve ekleyin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <Button 
                        onClick={fetchNewBusinessesFromDestegiTable}
                        disabled={isLoadingNewBusinesses}
                        variant="outline"
                      >
                        {isLoadingNewBusinesses ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Kontrol Ediliyor...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            Yeni İşletmeleri Kontrol Et
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        onClick={addNewBusinessesToDatabase}
                        disabled={isAddingNewBusinesses || newBusinessesFromDestegiTable.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isAddingNewBusinesses ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ekleniyor...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Tüm Yeni İşletmeleri Ekle ({newBusinessesFromDestegiTable.length})
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* İşlem sonucu mesajı */}
                    <div className="text-center py-4 text-muted-foreground">
                      {isLoadingNewBusinesses ? (
                        "İşletmeler kontrol ediliyor..."
                      ) : (
                        newBusinessesFromDestegiTable.length > 0 
                          ? `${newBusinessesFromDestegiTable.length} yeni işletme bulundu. Eklemek için butonu kullanın.` 
                          : "Henüz yeni işletme kontrol edilmedi veya tüm işletmeler eklenmiş durumda."
                      )}
                    </div>
                    
                    {/* Yeni işletmeler tablosu */}
                    {newBusinessesFromDestegiTable.length > 0 && (
                      <div className="rounded-md border overflow-hidden mt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Sıra</TableHead>
                              <TableHead>İşletme Adı</TableHead>
                              <TableHead className="text-right">Öğrenci Sayısı</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {newBusinessesFromDestegiTable.map((business, index) => (
                              <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{business.name}</TableCell>
                                <TableCell className="text-right">{business.count}</TableCell>
                              </TableRow>
                            ))}
                </TableBody>
              </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )}
                </>
              )}

              {/* Atama Sayfası */}
              {activeTab === 'assignments' && (
                <div className="space-y-6">
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-blue-50">
                        <CardTitle className="text-lg text-blue-800">Öğretmen Atamaları</CardTitle>
                        <CardDescription className="text-blue-600">
                        İşletmelere öğretmen atamalarını kolayca yapın
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Arama ve Filtreleme */}
                      <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                          placeholder="Öğretmen ara..."
                          value={teacherSearchTerm}
                          onChange={(e) => setTeacherSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                      </div>
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            placeholder="İşletme ara..."
                            value={businessSearchTerm}
                            onChange={(e) => setBusinessSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* İki Sütunlu Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Öğretmenler Listesi - Collapsible Yapı */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Öğretmenler</CardTitle>
                            <CardDescription>
                              Öğretmen adına tıklayarak atanan işletmeleri görüntüleyin ve yönetin
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="max-h-[600px] overflow-y-auto">
                              {filteredTeachers.length > 0 ? (
                                filteredTeachers.map((teacher) => (
                                  <Collapsible key={teacher.id} className="border-b">
                                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent/50 cursor-pointer">
                                      <div className="flex items-center">
                                        <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                                          <User size={14} />
                                        </div>
                                        <div>
                                          <div className="font-medium">{teacher.name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {getTeacherAssignedBusinesses(teacher.id).length} işletme atanmış
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openBusinessSelectionModal(teacher.id);
                                          }}
                                          className="h-8"
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          İşletme Ata
                                        </Button>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                      </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="overflow-hidden">
                                      <div className="bg-accent/20 p-3 space-y-2">
                                        {getTeacherAssignedBusinesses(teacher.id).length > 0 ? (
                                          <div>
                                            <div className="text-sm font-medium mb-2">Atanan İşletmeler</div>
                                            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                                              {getTeacherAssignedBusinesses(teacher.id)
                                                .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
                                                .map(business => (
                                                  <div key={business.id} className="flex items-center justify-between bg-white p-2 rounded-md border">
                                                    <div className="text-sm truncate flex-1">{business.name}</div>
                                                    <Button 
                                                      size="sm" 
                                                      variant="ghost" 
                                                      className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                      onClick={() => handleRemoveAssignment(business.id, teacher.id)}
                                                    >
                                                      <X className="h-4 w-4 mr-1" />
                                                      Kaldır
                                                    </Button>
                                                  </div>
                                                ))
                                              }
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-sm text-center py-4 text-muted-foreground">
                                            Bu öğretmene henüz işletme atanmamış
                                          </div>
                                        )}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                ))
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  {teacherSearchTerm ? "Arama sonucu bulunamadı" : "Henüz öğretmen eklenmemiş"}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Atanmamış İşletmeler */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Atanmamış İşletmeler</CardTitle>
                            <CardDescription>
                              Bu ay devlet desteği tablosunda yer alan ve henüz öğretmen atanmamış işletmeler
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="max-h-[600px] overflow-y-auto">
                              {filteredAssignmentBusinesses.length > 0 ? (
                                filteredAssignmentBusinesses
                                  .sort((a, b) => {
                                    // A-Z sıralama (Türkçe karakter desteği ile)
                                    const nameA = (a.name || '').toLocaleLowerCase('tr-TR');
                                    const nameB = (b.name || '').toLocaleLowerCase('tr-TR');
                                    return nameA.localeCompare(nameB, 'tr-TR');
                                  })
                                  .map((business) => (
                                    <div
                                      key={business.id}
                                      className="flex items-center justify-between p-4 border-b hover:bg-accent/20"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{business.name}</div>
                                        <div className="text-xs text-muted-foreground">Atanmamış</div>
                                      </div>
                                      <Select
                                        onValueChange={(value) => handleAssignTeacher(value, business.id)}
                                        value=""
                                      >
                                        <SelectTrigger className="w-[140px]">
                                          <SelectValue placeholder="Öğretmen Ata" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {filteredTeachers.map(teacher => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                              {teacher.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ))
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  {businessSearchTerm
                                    ? "Arama sonucu bulunamadı"
                                    : "Atanmamış işletme bulunmuyor"
                                  }
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Devlet Desteği Bilgileri Sayfası */}
              {activeTab === 'payments' && (
                <>
                  <Card className="mb-6">
                    <CardContent>
                      {/* Search and Save Controls */}
                      <div className="flex justify-end items-center mb-6 mt-2 px-0">
                        <div className="relative mr-3">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            placeholder="İşletme Adı veya Ad Soyad ara..."
                            value={evrakSearchTerm}
                            onChange={(e) => setEvrakSearchTerm(e.target.value)}
                            className="pl-10 w-64 border-slate-200"
                          />
                        </div>
                        <Button 
                          onClick={handleSaveOdemeEvraki} 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={isLoading || Object.keys(modifiedRows).length === 0}
                        >
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          DEĞİŞİKLİKLERİ KAYDET {Object.keys(modifiedRows).length > 0 && `(${Object.keys(modifiedRows).length})`}
                        </Button>
                                            </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                          >
                            İlk
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            Önceki
                          </Button>
                          <span className="text-sm">
                            Sayfa {currentPage} / {totalPages}
                                            </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Sonraki
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            Son
                          </Button>
                                          </div>
                        <div className="text-sm text-muted-foreground">
                          Toplam {getFilteredEvrakData.length} kayıt
                                        </div>
                                    </div>

                      {/* Table */}
                      <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                              <TableHead className="w-16">Sıra No</TableHead>
                              <TableHead>İşletme Adı</TableHead>
                              <TableHead>Ad Soyad</TableHead>
                              <TableHead>Kimlik No</TableHead>
                              <TableHead className="text-right">Ücret</TableHead>
                              <TableHead>Atanan Öğretmen</TableHead>
                              <TableHead className="text-center w-[320px]">
                                <div className="flex items-center justify-center space-x-2">
                                  <span>Ödeme Evrakı Durumu</span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-accent">
                                        <Filter className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem 
                                        onClick={() => setOdemeEvraki("tümü")}
                                        className={odemeEvraki === "tümü" ? "bg-accent" : ""}
                                      >
                                        Tümü
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => setOdemeEvraki("Ödeme Evrağı Teslim Edildi")}
                                        className={odemeEvraki === "Ödeme Evrağı Teslim Edildi" ? "bg-accent" : ""}
                                      >
                                        Ödeme Evrağı Teslim Edildi
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => setOdemeEvraki("Ödeme Evrağı Zamanında Teslim Edilmedi")}
                                        className={odemeEvraki === "Ödeme Evrağı Zamanında Teslim Edilmedi" ? "bg-accent" : ""}
                                      >
                                        Ödeme Evrağı Zamanında Teslim Edilmedi
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                  <div className="flex justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                  </div>
                                  <div className="mt-2 text-center text-sm text-muted-foreground">
                                    Veriler yükleniyor...
                                  </div>
                          </TableCell>
                        </TableRow>
                            ) : evrakData.length === 0 ? (
                      <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                  <div className="text-center text-muted-foreground">
                                    Kayıt bulunamadı. Lütfen devlet desteği verileri yükleyin.
                                  </div>
                        </TableCell>
                      </TableRow>
                            ) : (
                              paginatedData.map((item, index) => {
                                // İşletmeye atanan öğretmeni bul
                                const business = businessesData.find(b => b.name?.toLowerCase() === item.isletme_adi?.toLowerCase());
                                const assignedTeacher = business ? teachers.find(t => t.id === business.atanan_ogretmenler) : null;

                                return (
                                <TableRow key={item.id}>
                                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                  <TableCell>{item.isletme_adi || "-"}</TableCell>
                                  <TableCell>{item.ad_soyad || "-"}</TableCell>
                                  <TableCell>{item.kimlik_no || "-"}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.ucret)}</TableCell>
                                    <TableCell>
                                      {assignedTeacher ? (
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                          {assignedTeacher.name}
                                        </span>
                                      ) : (
                                        <span className="text-gray-500 text-xs">Atanmamış</span>
                                      )}
                                    </TableCell>
                                  <TableCell className="text-center">
                                    <div className="relative flex items-center h-10">
                                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                                        <input
                                          type="checkbox"
                                          className="h-5 w-5"
                                          checked={item.odeme_evraki_durumu === "Ödeme Evrağı Teslim Edildi"}
                                          onChange={() => handleOdemeEvrakiChange(item.id)}
                                        />
                                      </div>
                                      <div className="ml-10 w-full">
                                        <div className={
                                          item.odeme_evraki_durumu === "Ödeme Evrağı Teslim Edildi" 
                                            ? "text-green-600 text-sm font-medium bg-green-100 px-3 py-1.5 rounded-full text-center w-full mx-auto" 
                                            : "text-red-600 text-sm font-medium bg-red-100 px-3 py-1.5 rounded-full text-center w-full mx-auto"
                                        }>
                                          {item.odeme_evraki_durumu === "Ödeme Evrağı Teslim Edildi" 
                                            ? "Ödeme Evrağı Teslim Edildi" 
                                            : "Ödeme Evrağı Zamanında Teslim Edilmedi"}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                );
                              })
                    )}
                  </TableBody>
                </Table>
              </div>

                      {/* Bottom Pagination Info */}
                      <div className="mt-4 text-sm text-muted-foreground text-center">
                        Gösterilen: {getFilteredEvrakData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, getFilteredEvrakData.length)} / {getFilteredEvrakData.length}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Devlet Desteği Yükleme Sayfası */}
              {activeTab === 'upload' && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Devlet Desteği Yükleme</CardTitle>
                        <CardDescription>
                          Excel dosyasından toplu devlet desteği verilerini yükleyin
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="border rounded-lg p-6 bg-slate-50">
                        <h3 className="text-lg font-medium mb-4">Excel Şablonu</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Devlet desteği verilerini yüklemek için aşağıdaki Excel şablonunu kullanın. Tüm sütunlar doldurulmalıdır.
                        </p>
            <Button 
                          className="flex gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                          onClick={handleDownloadTemplate}
                        >
                          <Download className="h-5 w-5" /> 
                          Excel Şablonunu İndir
                        </Button>
                      </div>

                      <div className="border rounded-lg p-6 bg-slate-50">
                        <h3 className="text-lg font-medium mb-4">Veri Yükleme</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Doldurulmuş Excel dosyasını sisteme yükleyin. Bu işlem mevcut verilerin üzerine yazacaktır.
                        </p>
                        <div className="flex gap-4 mb-4">
                          <Button 
                            className="flex gap-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleExcelFileSelect}
                            disabled={isExcelUploading}
                          >
                            <Upload size={18} />
                            {isExcelUploading ? 'Yükleniyor...' : 'Excel Dosyası Yükle'}
                          </Button>
                        </div>
                        
                        {/* Manuel Tablo Oluşturma bölümü kaldırıldı */}
                      </div>

                      <div className="border rounded-lg p-6 bg-blue-50">
                        <h3 className="text-lg font-medium mb-4 text-blue-800">Bilgiler</h3>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-blue-700">
                          <li>Excel dosyası 4. satırdan itibaren okunacaktır. İlk 3 satır başlıklar için ayrılmıştır.</li>
                          <li>Tüm kayıtlar için "Ödeme Evrağı Zamanında Teslim Edilmedi" durumu varsayılan olarak atanacaktır.</li>
                          <li>Yükleme işlemi mevcut verilerin üzerine yazacaktır, dikkatli olun!</li>
                          <li>Excel'deki sütun düzeni şu şekilde olmalıdır: A-Sıra No, B-Öğrenci ID, C-Kimlik No, D-Ad Soyad, E-Dal Adı, F-İşletme ID, G-İşletme Adı, H-Başlama, I-Ayrılış, J-Toplam Süre, K-Eksik Gün, L-Gün, M-Ücret</li>
                        </ul>
          </div>
        </CardContent>
      </Card>
                </>
              )}

              {/* Raporlar Sayfası */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Devlet Desteği Ödeme Durumu Raporları</CardTitle>
                      <CardDescription>
                        İstediğiniz kriterlere göre devlet desteği ödeme evrakı durumlarını raporlayın
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Yıl Seçimi */}
                        <div className="space-y-2">
                          <Label htmlFor="report-year">Yıl</Label>
                          <Select 
                            value={selectedYear} 
                            onValueChange={(value) => {
                              setSelectedYear(value);
                              // Yıl değiştiğinde ay seçimini sıfırla
                              setSelectedMonth('');
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Yıl seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() - i;
                                return (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Ay Seçimi */}
                        <div className="space-y-2">
                          <Label htmlFor="report-month">Ay</Label>
                          <Select 
                            value={selectedMonth} 
                            onValueChange={setSelectedMonth}
                            disabled={!selectedYear}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={selectedYear ? "Ay seçiniz" : "Önce yıl seçiniz"} />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedYear && getMonthOptions(selectedYear).map(month => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Öğretmen Seçimi */}
                        <div className="space-y-2">
                          <Label htmlFor="report-teacher">Öğretmen</Label>
                          <Select 
                            value={selectedTeacher} 
                            onValueChange={setSelectedTeacher}
                            disabled={!selectedYear || !selectedMonth}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={
                                !selectedYear || !selectedMonth 
                                  ? "Önce yıl ve ay seçiniz" 
                                  : "Öğretmen seçiniz"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tüm Öğretmenler</SelectItem>
                            {teachers.map(teacher => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                          </Select>
                        </div>
                        </div>
                        
                      {/* Seçilen Tablo Bilgisi */}
                      {selectedYear && selectedMonth && (
                        <div className="text-sm text-muted-foreground">
                          Seçilen tablo: {getTableNameForDate(selectedYear, selectedMonth)}
                          </div>
                      )}
                      
                      {/* Rapor Oluştur Butonu */}
                      <Button 
                        className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
                        disabled={isGeneratingReport || !selectedYear || !selectedMonth}
                        onClick={generateReport}
                      >
                        {isGeneratingReport ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Rapor Oluşturuluyor...
                          </>
                        ) : (
                          <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Excel Raporu Oluştur ve İndir
            </>
          )}
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {/* Rapor Önizleme */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Rapor Önizleme</CardTitle>
                      <CardDescription>
                        {selectedTeacher === 'all' 
                          ? 'Tüm öğretmenler için rapor önizlemesi'
                          : selectedTeacher 
                            ? `${teachers.find(t => t.id === selectedTeacher)?.name || ''} için rapor önizlemesi`
                            : 'Öğretmen seçilmedi'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Sıra No</TableHead>
                              <TableHead>İşletme Adı</TableHead>
                              <TableHead>Öğrenci Adı</TableHead>
                              <TableHead>TC Kimlik No</TableHead>
                              <TableHead className="text-right">Ücret</TableHead>
                              <TableHead className="text-center">Ödeme Evrakı Durumu</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  <div className="flex justify-center items-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="ml-2">Veriler yükleniyor...</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              renderPreviewContent()
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
              </div>
                      </div>
      
      {/* Öğretmen Ekleme/Düzenle Dialog */}
      <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditingTeacher ? 'Öğretmen Düzenle' : 'Yeni Öğretmen Ekle'}</DialogTitle>
            <DialogDescription>
              {isEditingTeacher 
                ? 'Öğretmen bilgilerini güncelleyin.' 
                : 'Öğretmen adını girin. Öğretmen ilk girişinde kendi şifresini belirleyecektir.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitTeacher} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Ad Soyad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={teacherForm.name}
                onChange={handleTeacherInputChange}
                className="col-span-3"
                required
                placeholder="Öğretmenin adı ve soyadı"
              />
              </div>

            <DialogFooter>
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsTeacherDialogOpen(false)}
            >
                İptal
            </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    İşleniyor...
                  </span>
                ) : isEditingTeacher ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Devlet Desteği Silme Onay Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Öğretmeni Sil</DialogTitle>
            <DialogDescription>
              Bu öğretmeni silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              İptal
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={confirmDeleteTeacher}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Siliniyor...
                </span>
              ) : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Devlet Desteği Ekle/Düzenle Dialog */}
      <Dialog open={destekDialogOpen} onOpenChange={setDestekDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedDestek ? 'Devlet Desteği Düzenle' : 'Yeni Devlet Desteği Ekle'}</DialogTitle>
            <DialogDescription>
              {selectedDestek 
                ? 'Devlet desteği bilgilerini güncelleyin.' 
                : 'Yeni bir devlet desteği eklemek için formu doldurun.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitDestek} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="destek_turu" className="text-right">
                Destek Türü <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <select
                  id="destek_turu"
                  name="destek_turu"
                  value={destekFormData.destek_turu}
                  onChange={handleDestekInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="İŞKUR Desteği">İŞKUR Desteği</option>
                  <option value="KOSGEB Desteği">KOSGEB Desteği</option>
                  <option value="Bakanlık Desteği">Bakanlık Desteği</option>
                  <option value="Diğer">Diğer</option>
                </select>
          </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="miktar" className="text-right">
                Miktar <span className="text-red-500">*</span>
              </Label>
              <Input
                id="miktar"
                name="miktar"
                value={destekFormData.miktar}
                onChange={handleDestekInputChange}
                className="col-span-3"
                placeholder="Destek miktarı (TL)"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="durum" className="text-right">
                Durum <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <select
                  id="durum"
                  name="durum"
                  value={destekFormData.durum}
                  onChange={handleDestekInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="Beklemede">Beklemede</option>
                  <option value="Onaylandı">Onaylandı</option>
                  <option value="Reddedildi">Reddedildi</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tarih" className="text-right">
                Tarih <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tarih"
                name="tarih"
                type="date"
                value={destekFormData.tarih}
                onChange={handleDestekInputChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dosya" className="text-right">
                Dosya
              </Label>
              <div className="col-span-3">
                <Input
                  id="dosya"
                  name="dosya"
                  type="file"
                  onChange={handleFileChange}
                  className="col-span-3"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                {destekFormData.dosya_url && !selectedFile && (
                  <div className="text-sm flex items-center mt-2">
                    <FileText size={14} className="mr-1" /> 
                    Mevcut dosya: 
                    <Button 
                      type="button" 
                      variant="link" 
                      size="sm" 
                      onClick={() => handleDownloadFile(destekFormData.dosya_url || '', destekFormData.destek_turu)}
                      className="p-0 ml-1 h-auto"
                    >
                      İndir
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="aciklama" className="text-right mt-2">
                Açıklama
              </Label>
              <textarea
                id="aciklama"
                name="aciklama"
                value={destekFormData.aciklama || ''}
                onChange={handleDestekInputChange}
                className="col-span-3 p-2 border rounded-md min-h-[100px]"
                placeholder="Destek hakkında detaylı açıklama (isteğe bağlı)"
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDestekDialogOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isDestekLoading}>
                {isDestekLoading ? (
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    İşleniyor...
                  </span>
                ) : selectedDestek ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Devlet Desteği Silme Onay Dialog */}
      <Dialog open={isDestekDeleteDialogOpen} onOpenChange={setIsDestekDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Devlet Desteğini Sil</DialogTitle>
            <DialogDescription>
              Bu devlet desteği kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDestekDeleteDialogOpen(false)}
            >
              İptal
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={confirmDeleteDestek}
              disabled={isDestekLoading}
            >
              {isDestekLoading ? (
                <span className="flex items-center gap-1">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Siliniyor...
                </span>
              ) : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Gizli dosya input */}
      <input 
        type="file"
        ref={excelFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadDevletDestegi(file);
        }}
        accept=".xlsx,.xls"
        className="hidden"
        id="excel-file-input"
      />

      {/* İşletme Silme Onay Dialog'u */}
      <AlertDialog open={isBusinessDeleteDialogOpen} onOpenChange={setIsBusinessDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İşletmeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işletmeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingBusiness}>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteBusiness();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeletingBusiness}
            >
              {isDeletingBusiness ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Evet, Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
