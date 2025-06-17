import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getBusinesses,
  getGovernmentSupport,
  createDevletDestegi,
  updateDevletDestegi,
  deleteDevletDestegi,
  Teacher,
  Business,
  DevletDestegi,
} from '@/lib/supabase';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icons
import {
  Users,
  Building,
  DollarSign,
  BarChart3,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  LogOut,
  Menu,
  X,
  Home,
  Settings,
  FileText,
  Award,
  Bell,
  User,
  Calendar,
  TrendingUp,
  Shield,
  ChevronRight,
} from "lucide-react";

interface AdminStats {
  totalTeachers: number;
  totalBusinesses: number;
  totalSupport: number;
  activeAssignments: number;
}

const NewAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalTeachers: 0,
    totalBusinesses: 0,
    totalSupport: 0,
    activeAssignments: 0,
  });
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [governmentSupport, setGovernmentSupport] = useState<DevletDestegi[]>([]);
    // Form states
  const [searchTerm, setSearchTerm] = useState('');
  const [newTeacher, setNewTeacher] = useState({ name: '', password: '' });
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [teachersRes, businessesRes, supportRes] = await Promise.all([
        getTeachers(),
        getBusinesses(),
        getGovernmentSupport(),
      ]);

      if (teachersRes.data) setTeachers(teachersRes.data);
      if (businessesRes.data) setBusinesses(businessesRes.data);
      if (supportRes.data) setGovernmentSupport(supportRes.data);

      // Calculate stats
      setStats({
        totalTeachers: teachersRes.data?.length || 0,
        totalBusinesses: businessesRes.data?.length || 0,
        totalSupport: supportRes.data?.reduce((sum, item) => sum + (item.tutar || 0), 0) || 0,
        activeAssignments: businessesRes.data?.filter(b => b.atanan_ogretmenler).length || 0,
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  // Handle teacher operations
  const handleSaveTeacher = async () => {
    try {
      if (editingTeacher) {
        const { error } = await updateTeacher(editingTeacher.id, {
          name: newTeacher.name,
        });
        if (error) throw error;
        
        toast({
          title: "Başarılı",
          description: "Öğretmen bilgileri güncellendi.",
        });
      } else {
        const { error } = await createTeacher(newTeacher.name, newTeacher.password || 'defaultPassword123');
        if (error) throw error;
        
        toast({
          title: "Başarılı",
          description: "Yeni öğretmen eklendi.",
        });
      }
      
      setShowTeacherDialog(false);
      setEditingTeacher(null);
      setNewTeacher({ name: '', password: '' });
      loadData();
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu.",
        variant: "destructive",
      });
    }
  };
  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      const { error } = await deleteTeacher(teacherId);
      if (error) throw error;
      
      toast({
        title: "Başarılı",
        description: "Öğretmen silindi.",
      });
      loadData();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({
        title: "Hata",
        description: "Silme işlemi sırasında bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminData');
    navigate('/admin-login');
  };
  // Filter data based on search
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sidebar navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'teachers', label: 'Öğretmenler', icon: Users },
    { id: 'businesses', label: 'İşletmeler', icon: Building },
    { id: 'support', label: 'Devlet Desteği', icon: Award },
    { id: 'reports', label: 'Raporlar', icon: FileText },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-gray-900">Admin Panel</h1>
                  <p className="text-xs text-gray-500">Dekont Takip Sistemi</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start space-x-3 p-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    A
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm text-gray-900">Admin</p>
                    <p className="text-xs text-gray-500">admin@dekonttakip.com</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Ayarlar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeTab === 'dashboard' && 'Sistem durumu ve genel bakış'}
                {activeTab === 'teachers' && 'Öğretmen yönetimi ve atamaları'}
                {activeTab === 'businesses' && 'İşletme kayıtları ve bilgileri'}
                {activeTab === 'support' && 'Devlet desteği ödemeleri'}
                {activeTab === 'reports' && 'Sistem raporları ve analitik'}
                {activeTab === 'settings' && 'Sistem ayarları ve yapılandırma'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Bildirimler
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Ekle
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="p-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Toplam Öğretmen</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalTeachers}</p>
                      <p className="text-xs text-green-600 mt-1">+12% bu ay</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Aktif İşletme</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalBusinesses}</p>
                      <p className="text-xs text-green-600 mt-1">+8% bu ay</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Toplam Destek</p>
                      <p className="text-3xl font-bold text-gray-900">₺{stats.totalSupport.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-1">+23% bu ay</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Aktif Atama</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeAssignments}</p>
                      <p className="text-xs text-blue-600 mt-1">%{((stats.activeAssignments / stats.totalBusinesses) * 100).toFixed(1)} oranı</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span>Son Aktiviteler</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Yeni öğretmen eklendi</p>
                            <p className="text-xs text-gray-500">2 saat önce</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Hızlı İstatistikler</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bu ay eklenen öğretmen</span>
                        <Badge variant="secondary">12</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bekleyen ödemeler</span>
                        <Badge variant="destructive">3</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tamamlanan atamalar</span>
                        <Badge variant="default">{stats.activeAssignments}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Sistem durumu</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">Aktif</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Teachers Tab */}
          {activeTab === 'teachers' && (
            <div className="p-6 space-y-6">
              {/* Teachers Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Öğretmen ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Dialog open={showTeacherDialog} onOpenChange={setShowTeacherDialog}>                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingTeacher(null);
                      setNewTeacher({ name: '', password: '' });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Öğretmen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTeacher ? 'Öğretmen Düzenle' : 'Yeni Öğretmen Ekle'}
                      </DialogTitle>
                      <DialogDescription>
                        Öğretmen bilgilerini girin.
                      </DialogDescription>
                    </DialogHeader>                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input
                          id="name"
                          value={newTeacher.name}
                          onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                          placeholder="Öğretmen adı"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Şifre</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newTeacher.password}
                          onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                          placeholder="Şifre"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowTeacherDialog(false)}>
                        İptal
                      </Button>
                      <Button onClick={handleSaveTeacher}>
                        {editingTeacher ? 'Güncelle' : 'Ekle'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Teachers Table */}
              <Card>
                <Table>                  <TableHeader>
                    <TableRow>
                      <TableHead>Öğretmen</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Giriş Durumu</TableHead>
                      <TableHead>Atama Durumu</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{teacher.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{teacher.id}</TableCell>
                        <TableCell>
                          <Badge variant={teacher.is_first_login ? "destructive" : "default"}>
                            {teacher.is_first_login ? "İlk Giriş" : "Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Atanmış</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingTeacher(teacher);
                                  setNewTeacher({
                                    name: teacher.name,
                                    password: '',
                                  });
                                  setShowTeacherDialog(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteTeacher(teacher.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* Other tabs content would go here... */}
          {activeTab === 'businesses' && (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>İşletmeler</CardTitle>
                  <CardDescription>Kayıtlı işletmelerin listesi</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">İşletmeler bölümü yakında eklenecek...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Devlet Desteği</CardTitle>
                  <CardDescription>Destek ödemelerinin yönetimi</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Devlet desteği bölümü yakında eklenecek...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Raporlar</CardTitle>
                  <CardDescription>Sistem raporları ve analizler</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Raporlar bölümü yakında eklenecek...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ayarlar</CardTitle>
                  <CardDescription>Sistem ayarları ve yapılandırma</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Ayarlar bölümü yakında eklenecek...</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default NewAdminDashboard;
