# PayTR Provider - Detaylı Kullanım Kılavuzu

PayTR, Türkiye'nin önde gelen ödeme altyapı sağlayıcılarından biridir. Bu doküman, Nitrokit Core içinde PayTR entegrasyonunu kullanmanız için gereken tüm bilgileri içerir.

## İçindekiler

- [Özellikler](#özellikler)
- [Kurulum ve Yapılandırma](#kurulum-ve-yapılandırma)
- [Temel Kullanım](#temel-kullanım)
- [Sepet (Basket) Yönetimi](#sepet-basket-yönetimi)
- [Callback (IPN) İşlemleri](#callback-ipn-i̇şlemleri)
- [İade İşlemleri](#i̇ade-i̇şlemleri)
- [İşlem Sorgulama](#i̇şlem-sorgulama)
- [Test Ortamı](#test-ortamı)
- [Güvenlik](#güvenlik)
- [Hata Yönetimi](#hata-yönetimi)
- [İleri Seviye Kullanım](#i̇leri-seviye-kullanım)

## Özellikler

✅ **3D Secure Desteği**: Güvenli ödeme işlemleri  
✅ **Taksit Seçenekleri**: Taksitli/taksitsiz ödeme  
✅ **Sepet Validasyonu**: Otomatik ürün sepeti doğrulama  
✅ **HMAC Güvenlik**: SHA-256 tabanlı callback doğrulama  
✅ **İade Desteği**: Tam ve kısmi iade işlemleri  
✅ **Test Modu**: Sandbox ortamı ile güvenli test  
✅ **TypeScript**: Tam tip desteği  
✅ **Çoklu Para Birimi**: TRY, USD, EUR destegi

## Kurulum ve Yapılandırma

### 1. Paket Kurulumu

```bash
pnpm add @nitrokit/core
# veya
npm install @nitrokit/core
# veya
yarn add @nitrokit/core
```

### 2. Ortam Değişkenlerini Ayarlama

`.env` dosyanızı oluşturun ve PayTR bilgilerinizi ekleyin:

```env
# PayTR API Credentials (Zorunlu)
PAYTR_MERCHANT_ID=123456
PAYTR_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
PAYTR_SALT=xxxxxxxxxxxxxxxxxxxxxxxx

# Opsiyonel Ayarlar
PAYTR_API_BASE=https://www.paytr.com
PAYTR_TEST=1  # Test modu: 1 veya true
```

> **Not:** Bu bilgileri PayTR hesabınızdan alabilirsiniz. Üye işyeri paneli > Entegrasyon Ayarları bölümünden erişebilirsiniz.

### 3. PayTR Hesabınızda Yapılması Gerekenler

1. PayTR'de bir merchant hesabı oluşturun
2. **Entegrasyon Ayarları** bölümünden:
    - Merchant ID
    - Merchant Key
    - Merchant Salt

    bilgilerini alın

3. **Callback URL** (IPN) ayarlayın: `https://yourdomain.com/api/payment/callback`
4. **Success/Fail URL** formatlarını tanımlayın

## Temel Kullanım

### Basit Ödeme Oluşturma

```typescript
import { PaymentService, PayTRProvider } from '@nitrokit/core';

// Provider'ı başlat (otomatik olarak .env'den okur)
const paytrProvider = new PayTRProvider();

// Payment service'i oluştur
const paymentService = new PaymentService(paytrProvider);

// Ödeme talebi oluştur
const result = await paymentService.createPayment({
    orderId: 'ORDER-12345', // Benzersiz sipariş ID'si
    amount: 10000, // 100.00 TRY (kuruş cinsinden)
    email: 'musteri@example.com', // Müşteri email
    successUrl: 'https://siteniz.com/odeme/basarili',
    failUrl: 'https://siteniz.com/odeme/basarisiz'
});

// Sonucu kontrol et ve yönlendir
if (result.success) {
    console.log('Ödeme token:', result.token);
    console.log('Ödeme URL:', result.paymentUrl);

    // Kullanıcıyı PayTR ödeme sayfasına yönlendir
    window.location.href = result.paymentUrl!;
} else {
    console.error('Hata:', result.reason);
    console.error('Hata kodu:', result.errorCode);
}
```

### Detaylı Ödeme Oluşturma

```typescript
const result = await paymentService.createPayment({
    // Zorunlu Alanlar
    orderId: 'ORDER-12345',
    amount: 25000, // 250.00 TRY
    email: 'musteri@example.com',
    successUrl: 'https://siteniz.com/odeme/basarili',
    failUrl: 'https://siteniz.com/odeme/basarisiz',

    // Opsiyonel Alanlar
    userName: 'Ahmet Yılmaz',
    userPhone: '5551234567',
    userAddress: 'Atatürk Cad. No:1 İstanbul',
    userIp: '192.168.1.1',
    currency: 'TRY', // TRY, USD, EUR
    installment: 3, // Max taksit sayısı (0 = taksitsiz)

    // Sepet bilgileri
    basket: [
        { name: 'Premium Üyelik', price: 20000, quantity: 1 },
        { name: 'Ekstra Özellik', price: 5000, quantity: 1 }
    ]
});
```

## Sepet (Basket) Yönetimi

Sepet bilgileri, ödeme sayfasında müşteriye gösterilir ve fraud takibi için önemlidir.

### Sepet Formatı

```typescript
interface PaymentBasketItem {
    name: string; // Ürün adı (max 100 karakter)
    price: number; // Birim fiyat (kuruş cinsinden)
    quantity: number; // Adet (minimum 1)
}
```

### Örnek: E-ticaret Sepeti

```typescript
const basket = [
    {
        name: 'iPhone 15 Pro Max 256GB',
        price: 5499900, // 54,999.00 TRY
        quantity: 1
    },
    {
        name: 'AirPods Pro 2. Nesil',
        price: 1099900, // 10,999.00 TRY
        quantity: 1
    },
    {
        name: 'USB-C Kablo',
        price: 9900, // 99.00 TRY
        quantity: 2
    }
];

const result = await paymentService.createPayment({
    orderId: 'ORDER-789',
    amount: 66098100, // Toplam: 54999 + 10999 + (99 x 2) = 66,098.00 TRY
    email: 'musteri@example.com',
    successUrl: 'https://siteniz.com/success',
    failUrl: 'https://siteniz.com/fail',
    basket: basket
});
```

### Sepet Validasyonu

PayTR provider otomatik olarak şunları kontrol eder:

- ✅ `name` boş olamaz ve string olmalı
- ✅ `price` pozitif sayı olmalı
- ✅ `quantity` en az 1 olmalı
- ✅ Ürün adı 100 karakterle sınırlanır
- ✅ Fiyatlar otomatik olarak TRY formatına (`"100.00"`) dönüştürülür
- ✅ Sepet boşsa otomatik olarak placeholder ürün eklenir

### PayTR'ye Gönderilen Format

```typescript
// Sizin sepetiniz:
[
    { name: 'Ürün 1', price: 10000, quantity: 1 },
    { name: 'Ürün 2', price: 5000, quantity: 2 }
];

// PayTR'ye gönderilen format:
base64(
    JSON.stringify([
        ['Ürün 1', '100.00', 1],
        ['Ürün 2', '50.00', 2]
    ])
);
```

## Callback (IPN) İşlemleri

Callback (Instant Payment Notification), ödeme sonucunu sunucunuzda doğrulamanız için PayTR'nin gönderdiği bildirimdir.

### Next.js API Route Örneği

```typescript
// app/api/payment/callback/route.ts
import { PaymentService, PayTRProvider } from '@nitrokit/core';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Payment service'i oluştur
        const paymentService = new PaymentService(new PayTRProvider());

        // Callback'i doğrula
        const isValid = paymentService.verifyCallback({
            orderId: body.merchant_oid,
            status: body.status,
            amount: body.total_amount,
            hash: body.hash
        });

        if (!isValid) {
            console.error('Geçersiz callback hash!');
            return NextResponse.json({ error: 'Invalid hash' }, { status: 400 });
        }

        // Ödeme durumunu kontrol et
        if (body.status === 'success') {
            // Ödeme başarılı - siparişi tamamla
            await completeOrder(body.merchant_oid, {
                paymentId: body.payment_id,
                amount: body.total_amount,
                cardType: body.card_type,
                installment: body.installment
            });

            console.log(`✅ Ödeme başarılı: ${body.merchant_oid}`);
            return NextResponse.json({ status: 'OK' });
        } else {
            // Ödeme başarısız
            await failOrder(body.merchant_oid, body.failed_reason_msg);

            console.log(`❌ Ödeme başarısız: ${body.merchant_oid}`);
            return NextResponse.json({ status: 'FAIL' });
        }
    } catch (error) {
        console.error('Callback hatası:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

async function completeOrder(orderId: string, paymentData: any) {
    // Veritabanınızda siparişi tamamlayın
    // await db.orders.update({ id: orderId }, { status: 'paid', paymentData });
}

async function failOrder(orderId: string, reason: string) {
    // Veritabanınızda siparişi başarısız olarak işaretleyin
    // await db.orders.update({ id: orderId }, { status: 'failed', failReason: reason });
}
```

### Express.js Örneği

```typescript
import express from 'express';
import { PaymentService, PayTRProvider } from '@nitrokit/core';

const app = express();
app.use(express.json());

app.post('/api/payment/callback', async (req, res) => {
    const paymentService = new PaymentService(new PayTRProvider());

    const isValid = paymentService.verifyCallback({
        orderId: req.body.merchant_oid,
        status: req.body.status,
        amount: req.body.total_amount,
        hash: req.body.hash
    });

    if (!isValid) {
        return res.status(400).send('FAIL');
    }

    if (req.body.status === 'success') {
        // Ödeme başarılı
        await completeOrder(req.body.merchant_oid);
        res.send('OK');
    } else {
        // Ödeme başarısız
        res.send('FAIL');
    }
});
```

### Callback Payload Yapısı

PayTR'den gelen callback şu bilgileri içerir:

```typescript
{
  merchant_oid: "ORDER-12345",      // Sipariş ID
  status: "success",                 // success veya failed
  total_amount: "100.00",            // Ödenen tutar (TRY)
  hash: "xyz...",                    // HMAC hash (doğrulama için)
  payment_id: "123456789",           // PayTR işlem ID
  card_type: "visa",                 // Kart tipi
  installment: "0",                  // Taksit sayısı
  failed_reason_code: "0",           // Hata kodu (varsa)
  failed_reason_msg: "",             // Hata mesajı (varsa)
  test_mode: "0",                    // Test modu
  payment_type: "card"               // Ödeme tipi
}
```

### Callback Güvenliği

Callback doğrulama formülü:

```typescript
hash = base64(
    hmac_sha256(merchant_id + merchant_oid + status + total_amount + merchant_salt, merchant_key)
);
```

> **Önemli:** Hash doğrulaması yapmadan ödemeyi onaylamayın!

## İade İşlemleri

### Tam İade

```typescript
const refundResult = await paymentService.refund({
    orderId: 'ORDER-12345'
});

console.log('İade durumu:', refundResult);
```

### Kısmi İade

```typescript
// 250.00 TRY'lik ödemeden 50.00 TRY iade
const refundResult = await paymentService.refund({
    orderId: 'ORDER-12345',
    amount: 5000 // 50.00 TRY (kuruş cinsinden)
});

if (refundResult.status === 'success') {
    console.log('İade başarılı');
} else {
    console.error('İade hatası:', refundResult.reason);
}
```

### İade Kuralları

- ⚠️ İade, ödeme alındıktan sonra yapılabilir
- ⚠️ Kısmi iade birden fazla kez yapılabilir (toplam tutarı aşmadan)
- ⚠️ Bazı banka kartlarında iade süresi 7-14 gün sürebilir
- ⚠️ PayTR hesabınızda yeterli bakiye olmalı

## İşlem Sorgulama

Bir ödemenin durumunu sorgulayın:

```typescript
const transaction = await paymentService.queryTransaction('ORDER-12345');

console.log('İşlem durumu:', transaction);
```

### Örnek Sonuç

```json
{
    "status": "success",
    "merchant_oid": "ORDER-12345",
    "payment_id": "123456789",
    "payment_status": "success",
    "total_amount": "100.00",
    "card_type": "visa",
    "installment": "0",
    "payment_date": "2025-11-19 14:30:00"
}
```

## Test Ortamı

### Test Modunu Aktifleştirme

**Yöntem 1: Ortam değişkeni**

```env
PAYTR_TEST=1
```

**Yöntem 2: Constructor**

```typescript
const provider = new PayTRProvider({
    merchantId: 'test_merchant',
    merchantKey: 'test_key',
    merchantSalt: 'test_salt',
    testMode: true
});
```

### Test Kartları

PayTR test ortamında kullanabileceğiniz kartlar:

| Kart Tipi  | Kart Numarası       | Son Kullanma | CVV  | 3D Sonuç |
| ---------- | ------------------- | ------------ | ---- | -------- |
| Visa       | 4508 0345 0803 4509 | 12/26        | 000  | Başarılı |
| Mastercard | 5406 6750 9800 3020 | 12/26        | 000  | Başarılı |
| Amex       | 3750 001002 00006   | 12/26        | 0000 | Başarılı |

> **Not:** Test modunda gerçek para transferi yapılmaz.

### Test ile Production Farklılıkları

- Test modunda işlemler gerçek hesaplarınızda görünmez
- Test callback'leri `test_mode: "1"` parametresi ile gelir
- Test işlemleri PayTR raporlarında ayrı listelenir

## Güvenlik

### Ortam Değişkenlerini Koruma

```typescript
// ❌ YANLIŞ: Client-side'da credentials kullanmayın
const provider = new PayTRProvider({
    merchantId: 'hardcoded_id', // Tehlikeli!
    merchantKey: 'hardcoded_key' // Asla yapmayın!
});

// ✅ DOĞRU: Server-side'da env kullanın
const provider = new PayTRProvider(); // .env'den otomatik okur
```

### .gitignore Kontrol

```.gitignore
# Environment variables
.env
.env.local
.env.production
```

### HTTPS Zorunluluğu

Production ortamında mutlaka HTTPS kullanın:

```typescript
// ✅ DOĞRU
successUrl: 'https://siteniz.com/success';
failUrl: 'https://siteniz.com/fail';

// ❌ YANLIŞ (production'da)
successUrl: 'http://siteniz.com/success';
```

### Callback IP Kontrolü (Opsiyonel)

PayTR callback'lerini sadece PayTR IP'lerinden kabul edin:

```typescript
const PAYTR_IPS = [
    '185.80.111.0/24'
    // PayTR'den güncel IP listesini alın
];

app.post('/api/payment/callback', (req, res) => {
    const clientIp = req.ip;

    if (!isPayTRIP(clientIp)) {
        return res.status(403).send('Forbidden');
    }

    // Callback işlemi...
});
```

## Hata Yönetimi

### Validasyon Hataları

```typescript
try {
    const result = await paymentService.createPayment({
        orderId: '', // Geçersiz
        amount: -100, // Geçersiz
        email: 'not-email', // Geçersiz
        successUrl: 'invalid',
        failUrl: 'invalid'
    });
} catch (error) {
    if (error instanceof Error) {
        console.error('Validasyon hatası:', error.message);
        // Çıktı: "Order ID is required and must be a string"
    }
}
```

### API Hataları

```typescript
const result = await paymentService.createPayment(params);

if (!result.success) {
    console.error('API Hatası:', result.reason);
    console.error('Hata Kodu:', result.errorCode);
    console.error('Ham cevap:', result.raw);

    // Kullanıcıya göster
    alert(`Ödeme oluşturulamadı: ${result.reason}`);
}
```

### Yaygın Hatalar ve Çözümleri

| Hata                      | Sebep                    | Çözüm                            |
| ------------------------- | ------------------------ | -------------------------------- |
| `Invalid hash`            | Yanlış merchant key/salt | Credentials'ı kontrol edin       |
| `Invalid email format`    | Geçersiz email           | Email formatını düzeltin         |
| `Amount must be positive` | Negatif tutar            | Pozitif değer gönderin           |
| `Insufficient balance`    | Yetersiz bakiye          | PayTR hesabınıza bakiye yükleyin |

## İleri Seviye Kullanım

### Manuel Konfigürasyon

```typescript
const provider = new PayTRProvider({
    merchantId: process.env.CUSTOM_MERCHANT_ID,
    merchantKey: process.env.CUSTOM_KEY,
    merchantSalt: process.env.CUSTOM_SALT,
    apiBase: 'https://custom.paytr.endpoint',
    testMode: process.env.NODE_ENV !== 'production'
});
```

### Provider Değiştirme

```typescript
const paymentService = new PaymentService(new PayTRProvider());

// Dinamik provider değiştirme
if (userPreference === 'iyzico') {
    paymentService.setProvider(new IyzicoProvider());
}

console.log(paymentService.getProviderName()); // "PayTR" veya "Iyzico"
```

### TypeScript Tipleri

```typescript
import type {
    PaymentProvider,
    CreatePaymentRequest,
    CreatePaymentResponse,
    PaymentCallback,
    RefundRequest,
    PaymentBasketItem
} from '@nitrokit/core';

function handlePayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const service = new PaymentService(new PayTRProvider());
    return service.createPayment(request);
}
```

### Custom Logger Entegrasyonu

```typescript
class CustomPayTRProvider extends PayTRProvider {
    async createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse> {
        console.log('[PayTR] Creating payment:', params.orderId);

        const result = await super.createPayment(params);

        if (result.success) {
            console.log('[PayTR] Payment created:', result.token);
        } else {
            console.error('[PayTR] Payment failed:', result.reason);
        }

        return result;
    }
}
```

## Sık Sorulan Sorular (SSS)

### Taksit nasıl aktifleştirilir?

```typescript
const result = await paymentService.createPayment({
    // ...diğer alanlar
    installment: 6 // Max 6 taksit
});
```

### Para birimi nasıl değiştirilir?

```typescript
const result = await paymentService.createPayment({
    // ...diğer alanlar
    currency: 'USD' // veya 'EUR'
});
```

### Test modunda gerçek kart kullanılabilir mi?

Hayır, test modunda sadece test kartları çalışır. Gerçek kartlar production modunda kullanılmalıdır.

### Callback gelmezse ne yapmalıyım?

1. PayTR panelinde Callback URL'ini kontrol edin
2. Sunucunuzun PayTR IP'lerinden erişilebilir olduğundan emin olun
3. Firewall kurallarını kontrol edin
4. Log dosyalarınızı inceleyin

### Ödeme başarılı ama callback gelmiyor?

Callback hatası durumunda, `queryTransaction` metodu ile ödeme durumunu sorgulayabilirsiniz:

```typescript
const transaction = await paymentService.queryTransaction('ORDER-12345');
```

## Destek ve İletişim

- **PayTR Dokümantasyon**: https://www.paytr.com/
- **PayTR Destek**: destek@paytr.com
- **Nitrokit Issues**: https://github.com/nitrokit/nitrokit-core/issues

## Changelog

### v1.0.0 (2025-11-19)

- ✅ İlk stabil sürüm
- ✅ Sepet validasyonu
- ✅ HMAC callback doğrulama
- ✅ İade ve sorgulama desteği
- ✅ Test modu
- ✅ TypeScript tipleri

## Lisans

MIT License - Detaylar için [LICENSE](../../../../LICENSE) dosyasına bakın.

---

**Not:** Bu doküman PayTR API v2 üzerine yazılmıştır. PayTR API'sinde değişiklik olduğunda bu dokümantasyon güncellenecektir.
