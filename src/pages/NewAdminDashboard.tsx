import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  FileText, 
  Award, 
  BarChart3,
  Settings,
  LogOut,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  ChevronRight,
  Calendar,
  TrendingUp,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  MoreVertical,
  Home,
  Bell,
  Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

const NewAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock data - gerçek verilerle değiştirilecek
  const stats = {
    totalTeachers: 42,
    activeBusinesses: 128,
    completedDocuments: 256,
    pendingSupports: 18,
    monthlyGrowth: 12.5
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Admin Paneli
                </h1>
                <p className="text-sm text-gray-500">Dekont Takip Sistemi</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Arama yapın..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 w-80 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  <span className="w-1 h-1 bg-white rounded-full"></span>
                </span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 p-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-medium">
                        A
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block font-medium">Admin</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
                  <DropdownMenuSeparator />
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Modern Tab Navigation */}
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5 bg-white p-1 shadow-sm border">
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:block">Genel Bakış</span>
            </TabsTrigger>
            <TabsTrigger 
              value="teachers"
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:block">Öğretmenler</span>
            </TabsTrigger>
            <TabsTrigger 
              value="businesses"
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:block">İşletmeler</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:block">Evraklar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:block">Raporlar</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Hoş Geldiniz! 👋</h2>
                <p className="text-blue-100 text-lg mb-6">
                  Sistem durumunuz ve güncel istatistikleriniz
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +{stats.monthlyGrowth}% bu ay
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date().toLocaleDateString('tr-TR')}
                  </Badge>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="absolute top-20 -right-8 w-16 h-16 bg-white/5 rounded-full"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Toplam Öğretmen
                  </CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalTeachers}</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +5 bu ay
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Aktif İşletme
                  </CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.activeBusinesses}</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12 bu ay
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Tamamlanan Evrak
                  </CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.completedDocuments}</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +28 bu hafta
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Bekleyen Destek
                  </CardTitle>
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.pendingSupports}</div>
                  <p className="text-xs text-orange-600 flex items-center mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    İnceleme gerekli
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activities */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Son Aktiviteler</span>
                  </CardTitle>
                  <CardDescription>
                    Sistemdeki en son gerçekleştirilen işlemler
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { action: "Yeni öğretmen eklendi", user: "Ahmet Yılmaz", time: "5 dk önce", type: "user" },
                    { action: "İşletme güncellendi", user: "Mehmet A.Ş.", time: "12 dk önce", type: "business" },
                    { action: "Evrak teslim edildi", user: "Ayşe Kaya", time: "1 saat önce", type: "document" },
                    { action: "Destek onaylandı", user: "Fatma Ltd.", time: "2 saat önce", type: "support" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'business' ? 'bg-green-100 text-green-600' :
                        activity.type === 'document' ? 'bg-purple-100 text-purple-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {activity.type === 'user' ? <UserCheck className="w-4 h-4" /> :
                         activity.type === 'business' ? <Building2 className="w-4 h-4" /> :
                         activity.type === 'document' ? <FileText className="w-4 h-4" /> :
                         <Award className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Hızlı İşlemler</CardTitle>
                  <CardDescription>
                    Sık kullanılan işlemleri hızlıca gerçekleştirin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
                    onClick={() => setActiveTab("teachers")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Öğretmen Ekle
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-green-200 hover:bg-green-50"
                    onClick={() => setActiveTab("businesses")}
                  >
                    <Building2 className="mr-2 h-4 w-4 text-green-600" />
                    İşletme Yönet
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-purple-200 hover:bg-purple-50"
                    onClick={() => setActiveTab("documents")}
                  >
                    <Upload className="mr-2 h-4 w-4 text-purple-600" />
                    Evrak Yükle
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-orange-200 hover:bg-orange-50"
                    onClick={() => setActiveTab("reports")}
                  >
                    <Download className="mr-2 h-4 w-4 text-orange-600" />
                    Rapor İndir
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Öğretmen Yönetimi</h2>
                <p className="text-gray-600">Öğretmenleri ekleyin, düzenleyin ve yönetin</p>
              </div>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Öğretmen
              </Button>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Öğretmen Listesi</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Öğretmen ara..."
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Öğretmen verisi yükleniyor...</h3>
                  <p className="text-gray-500">Bu sekme henüz aktif değil. Mevcut AdminDashboard işlevselliği kullanılacak.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs with similar structure */}
          <TabsContent value="businesses" className="space-y-6">
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">İşletme Yönetimi</h3>
              <p className="text-gray-500">Bu sekme henüz aktif değil. Mevcut AdminDashboard işlevselliği kullanılacak.</p>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Evrak Yönetimi</h3>
              <p className="text-gray-500">Bu sekme henüz aktif değil. Mevcut AdminDashboard işlevselliği kullanılacak.</p>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Raporlar</h3>
              <p className="text-gray-500">Bu sekme henüz aktif değil. Mevcut AdminDashboard işlevselliği kullanılacak.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default NewAdminDashboard;
