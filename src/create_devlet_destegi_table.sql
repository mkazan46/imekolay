-- Yeni devlet_destegi tablosu oluşturma
CREATE TABLE IF NOT EXISTS devlet_destegi (
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
  odeme_evraki_durumu VARCHAR DEFAULT 'Ödeme Evrağı Zamanında Teslim Edilmedi',
  yukleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eski veriler var ise yeni tabloya aktarmak için bu kodu kullanabilirsiniz
-- Bu kod tek bir eski tablodan veri aktarmak için örnek olarak verilmiştir
-- Buradaki devlet_destegi202503 kısmını aktarmak istediğiniz tablo adıyla değiştirin

/*
INSERT INTO devlet_destegi (
  sira_no, ogr_id, kimlik_no, ad_soyad, dal_adi, isletme_id, isletme_adi,
  baslama, ayrilis, toplam_sure, eksik_gun, gun, ucret, odeme_evraki_durumu, yukleme_tarihi
)
SELECT 
  sira_no, ogr_id, kimlik_no, ad_soyad, dal_adi, isletme_id, isletme_adi,
  baslama, ayrilis, toplam_sure, eksik_gun, gun, ucret, odeme_evraki_durumu, CURRENT_TIMESTAMP
FROM devlet_destegi202503;
*/

-- Tüm eski tabloları listelemek için:
-- SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'devlet_destegi%'; 