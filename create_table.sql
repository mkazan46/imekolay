-- Devlet desteği tablosu oluşturma SQL kodu
CREATE TABLE IF NOT EXISTS devlet_destegi202503 (
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