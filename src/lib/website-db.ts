import mongoose from "mongoose";

// Cache connections to avoid reconnecting on every request
const connectionCache: Record<string, mongoose.Connection> = {};

interface SiteConfig {
  uri: string;
  dbName: string;
  collectionName: string;
  cloudinaryFolder: string;
  displayName: string;
  imageFields: { key: string; label: string; category: string }[];
  textFields: { key: string; label: string; placeholder: string }[];
}

export const SITE_CONFIGS: Record<string, SiteConfig> = {
  disklinigi: {
    uri: process.env.DISKLINIGI_MONGODB_URI || "",
    dbName: "resimler",
    collectionName: "resimler",
    cloudinaryFolder: "disklinig",
    displayName: "Diş Kliniği",
    textFields: [
      { key: "isletmeAdi", label: "İşletme Adı", placeholder: "Örn: DentaClinic" },
      { key: "adres", label: "Adres", placeholder: "Örn: Hacıhalil mah. Atatürk cd. 53/A, 41400 Gebze/Kocaeli" },
      { key: "telefon", label: "Telefon", placeholder: "Örn: 0262 255 57 58" },
      { key: "eposta", label: "E-posta", placeholder: "Örn: info@dentaclinic.com" },
    ],
    imageFields: [
      // Logo & Favicon
      { key: "favicon", label: "Logo / Favicon", category: "Logo & Favicon" },
      // İşletme Fotoğrafları
      { key: "klinikfoto1", label: "Klinik Fotoğrafı", category: "İşletme Fotoğrafları" },
      { key: "klinikbeklemeodasi", label: "Klinik Bekleme Odası", category: "İşletme Fotoğrafları" },
      { key: "dentistvemusterisimutlu", label: "Dentist ve Müşteri", category: "İşletme Fotoğrafları" },
      // Hizmet Görselleri
      { key: "implantdistedavi", label: "İmplant Diş Tedavisi", category: "Hizmet Görselleri" },
      { key: "zirkonyumkaplama", label: "Zirkonyum Kaplama", category: "Hizmet Görselleri" },
      { key: "ortodonti", label: "Ortodonti", category: "Hizmet Görselleri" },
      { key: "kanaltedavisi", label: "Kanal Tedavisi", category: "Hizmet Görselleri" },
      { key: "disetitedavisi", label: "Diş Eti Tedavisi", category: "Hizmet Görselleri" },
      { key: "disbeyazlatma", label: "Diş Beyazlatma", category: "Hizmet Görselleri" },
      { key: "pedodonti", label: "Pedodonti (Çocuk Diş)", category: "Hizmet Görselleri" },
      { key: "protezler", label: "Protezler", category: "Hizmet Görselleri" },
      { key: "geneldisbakimi", label: "Genel Diş Bakımı", category: "Hizmet Görselleri" },
      { key: "agizdisvecenecerrahisi", label: "Ağız Diş ve Çene Cerrahisi", category: "Hizmet Görselleri" },
      { key: "estetikdishekimligi", label: "Estetik Diş Hekimliği", category: "Hizmet Görselleri" },
      { key: "agizkokusu", label: "Ağız Kokusu Tedavisi", category: "Hizmet Görselleri" },
    ],
  },
  guzelliksalonu: {
    uri: process.env.GUZELLIKSALONU_MONGODB_URI || "",
    dbName: "resimler",
    collectionName: "resimler",
    cloudinaryFolder: "guzelliksalonu",
    displayName: "Güzellik Salonu",
    textFields: [
      { key: "isletmeAdi", label: "İşletme Adı", placeholder: "Örn: Güzellik Salonu" },
      { key: "adres", label: "Adres", placeholder: "Örn: İstanbul, Türkiye" },
      { key: "telefon", label: "Telefon", placeholder: "Örn: (0212) 123 45 67" },
      { key: "eposta", label: "E-posta", placeholder: "Örn: info@guzelliksalonu.com" },
    ],
    imageFields: [
      // Logo & Favicon
      { key: "favicon", label: "Logo / Favicon", category: "Logo & Favicon" },
      // İşletme Fotoğrafları
      { key: "isletmefoto1", label: "İşletme Fotoğrafı 1", category: "İşletme Fotoğrafları" },
      { key: "isletmefoto2", label: "İşletme Fotoğrafı 2", category: "İşletme Fotoğrafları" },
      { key: "isletmefoto3", label: "İşletme Fotoğrafı 3", category: "İşletme Fotoğrafları" },
      // Hizmet Görselleri
      { key: "lazerepilasyon", label: "Lazer Epilasyon", category: "Hizmet Görselleri" },
      { key: "rasping", label: "Rasping", category: "Hizmet Görselleri" },
      { key: "g5masaji", label: "G5 Masajı", category: "Hizmet Görselleri" },
      { key: "striort", label: "Striort Çatlak Tedavisi", category: "Hizmet Görselleri" },
      { key: "ciltbakimi", label: "Cilt Bakımı", category: "Hizmet Görselleri" },
      { key: "hydrafacial", label: "Hydrafacial", category: "Hizmet Görselleri" },
      { key: "dermapen", label: "Dermapen", category: "Hizmet Görselleri" },
      { key: "plazmapen", label: "Plazmapen", category: "Hizmet Görselleri" },
      { key: "sacvitamini", label: "Saç Vitamini Mezoterapi", category: "Hizmet Görselleri" },
      { key: "kasvitamini", label: "Kaş Vitamini", category: "Hizmet Görselleri" },
      { key: "ipekkirpik", label: "İpek Kirpik", category: "Hizmet Görselleri" },
      { key: "proteztirnak", label: "Protez Tırnak", category: "Hizmet Görselleri" },
      { key: "ciltlifting", label: "Cilt Lifting", category: "Hizmet Görselleri" },
      { key: "manikur", label: "Manikür", category: "Hizmet Görselleri" },
      { key: "pedikur", label: "Pedikür", category: "Hizmet Görselleri" },
      { key: "dudakrenklendirme", label: "Dudak Renklendirme", category: "Hizmet Görselleri" },
      { key: "microblading", label: "Microblading", category: "Hizmet Görselleri" },
      { key: "kalicieyeliner", label: "Kalıcı Eyeliner", category: "Hizmet Görselleri" },
      { key: "altinoran", label: "Altınoran Kaş Alımı", category: "Hizmet Görselleri" },
      { key: "gelinbasi", label: "Gelin Başı", category: "Hizmet Görselleri" },
      { key: "promakyaj", label: "Profesyonel Makyaj", category: "Hizmet Görselleri" },
      { key: "sacislemleri", label: "Saç İşlemleri", category: "Hizmet Görselleri" },
    ],
  },
};

// Hidden fields that should not be shown in the UI
export const HIDDEN_FIELDS = ["_description", "description", "isActive", "_id", "__v", "createdAt", "updatedAt", "isletmeAdi", "adres", "telefon", "eposta"];

export async function getWebsiteDbConnection(siteKey: string): Promise<mongoose.Connection> {
  const config = SITE_CONFIGS[siteKey];
  if (!config) {
    throw new Error(`Unknown site: ${siteKey}`);
  }

  // Return cached connection if exists
  if (connectionCache[siteKey] && connectionCache[siteKey].readyState === 1) {
    return connectionCache[siteKey];
  }

  const conn = mongoose.createConnection(config.uri, {
    dbName: config.dbName,
    bufferCommands: false,
  });

  await conn.asPromise();
  connectionCache[siteKey] = conn;
  return conn;
}
