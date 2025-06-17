# Değişiklik Kaydı

## [1.0.0] - 2024-06-04

### Değiştirildi
- Devlet desteği veri yükleme sistemi değiştirildi. Artık her ay için yeni tablo oluşturulmuyor.
- Tüm veriler tek bir "devlet_destegi" tablosunda saklanıyor.
- Excel yüklemesi sırasında eski veriler silinip yeni veriler ekleniyor.
- Veri yükleme tarihi (yukleme_tarihi) alanı eklenerek hangi ay için veri yüklendiği takip edilebiliyor.
- Yıl ve ay bazlı filtreleme özellikleri güncellendi.

### Kaldırıldı
- Aylık tablo oluşturma fonksiyonu artık gerekli olmadığı için kaldırıldı.
- Daha önceden oluşturulmuş aylar için dinamik tablo adı üretme fonksiyonları güncellendi.

### Teknik Bilgiler
- Eski aylık tablolara göre kodlanmış servisler güncellendi.
- Yeni veri yapısına göre veri yükleme ve çekme işlemleri düzenlendi.
- Excel dosyasından veri okuma mantığı korundu, sadece hedef tablo değiştirildi.

### Veri Aktarımı
- Eski tablo verilerini "devlet_destegi" tablosuna aktarmak için SQL komutu eklendi (src/create_devlet_destegi_table.sql). 