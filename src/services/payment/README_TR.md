# Payment Service

Nitrokit Core'un modüler ödeme servisi. Farklı ödeme sağlayıcılarını (PayTR, Iyzico, vb.) tek bir arayüz üzerinden kullanmanızı sağlar.

## Özellikler

- ✅ **Çoklu provider desteği**: PayTR, gelecekte Iyzico ve diğerleri
- ✅ **Type-safe**: Tam TypeScript desteği
- ✅ **Sepet validasyonu**: Otomatik ürün sepeti doğrulama ve formatlama
- ✅ **Callback doğrulama**: HMAC tabanlı güvenli callback (IPN) doğrulama
- ✅ **İade ve sorgulama**: Ödeme iadesi ve işlem sorgulama desteği
- ✅ **Test modu**: Sandbox/test ortamı desteği
- ✅ **Kapsamlı testler**: %100 test coverage

## Kurulum

```bash
pnpm add @nitrokit/core
# veya
npm install @nitrokit/core
# veya
yarn add @nitrokit/core
```

## Desteklenen Ödeme Sağlayıcıları

| Provider   | Durum     | Dokümantasyon                      |
| ---------- | --------- | ---------------------------------- |
| **PayTR**  | ✅ Aktif  | [PayTR.md](./providers/PayTR.md)   |
| **Stripe** | ✅ Aktif  | [Stripe.md](./providers/Stripe.md) |
| **Iyzico** | 🚧 Planlı | Coming soon                        |

## Hızlı Başlangıç

### 1. Ortam Değişkenlerini Ayarlama

`.env` dosyanızı oluşturun:

```env
# PayTR için
PAYTR_MERCHANT_ID=your_merchant_id
PAYTR_KEY=your_merchant_key
PAYTR_SALT=your_merchant_salt
PAYTR_TEST=1  # Test modu
```

### 2. Basit Kullanım

```typescript
import { PaymentService, PayTRProvider } from '@nitrokit/core';

// Provider ve service oluştur
const paymentService = new PaymentService(new PayTRProvider());

// Ödeme oluştur
const result = await paymentService.createPayment({
    orderId: 'ORDER-12345',
    amount: 10000, // 100.00 TRY (kuruş cinsinden)
    email: 'musteri@example.com',
    successUrl: 'https://siteniz.com/success',
    failUrl: 'https://siteniz.com/fail',
    basket: [{ name: 'Ürün 1', price: 10000, quantity: 1 }]
});

if (result.success) {
    // Kullanıcıyı ödeme sayfasına yönlendir
    window.location.href = result.paymentUrl!;
}
```

### 3. Callback Doğrulama

```typescript
// Next.js API Route örneği
app.post('/api/payment/callback', (req, res) => {
    const paymentService = new PaymentService(new PayTRProvider());

    const isValid = paymentService.verifyCallback({
        orderId: req.body.merchant_oid,
        status: req.body.status,
        amount: req.body.total_amount,
        hash: req.body.hash
    });

    if (isValid && req.body.status === 'success') {
        // Ödeme başarılı - siparişi tamamla
        res.send('OK');
    } else {
        res.status(400).send('FAIL');
    }
});
```

## API Referansı

### PaymentService

Ana servis sınıfı. Tüm ödeme işlemlerini yönetir.

```typescript
class PaymentService {
    constructor(provider: PaymentProvider);

    // Ödeme oluştur
    async createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse>;

    // Callback doğrula
    verifyCallback(payload: PaymentCallback): boolean;

    // İade yap
    async refund(params: RefundRequest): Promise<any>;

    // İşlem sorgula
    async queryTransaction(orderId: string): Promise<any>;

    // Provider değiştir
    setProvider(provider: PaymentProvider): void;

    // Provider adı
    getProviderName(): string;
}
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
```

## Detaylı Dokümantasyon

Her provider için detaylı kullanım kılavuzları:

- **[PayTR Dokümantasyonu](./providers/PayTR.md)** - Kurulum, kullanım, callback handling, test kartları ve daha fazlası
- **Iyzico** - Yakında
- **Stripe** - Yakında

## Mimari

```
PaymentService (Ana Servis)
    │
    ├── PaymentProvider (Interface)
    │   ├── PayTRProvider
    │   ├── IyzicoProvider (planlı)
    │   └── StripeProvider (planlı)
    │
    └── Types (Ortak tipler)
        ├── CreatePaymentRequest
        ├── CreatePaymentResponse
        ├── PaymentCallback
        └── RefundRequest
```

## Örnekler

### Provider Değiştirme

```typescript
const service = new PaymentService(new PayTRProvider());

// Mevcut provider
console.log(service.getProviderName()); // "PayTR"

// Provider değiştir (gelecekte)
// service.setProvider(new IyzicoProvider());
```

### İade İşlemi

```typescript
// Tam iade
await paymentService.refund({ orderId: 'ORDER-123' });

// Kısmi iade
await paymentService.refund({
    orderId: 'ORDER-123',
    amount: 5000 // 50.00 TRY
});
```

### İşlem Sorgulama

```typescript
const transaction = await paymentService.queryTransaction('ORDER-123');
console.log(transaction);
```

## Güvenlik

- ⚠️ API credentials'ları **asla** client-side'a göndermeyin
- ⚠️ Callback doğrulamasını mutlaka yapın (HMAC hash kontrolü)
- ⚠️ Ortam değişkenlerini `.env` dosyasında tutun
- ⚠️ Production'da HTTPS kullanın
- ⚠️ `.env` dosyasını `.gitignore`'a ekleyin

## Test Modu

Test modunda:

- Gerçek para transferi yapılmaz
- Test kartları kullanılır
- Sandbox ortamı aktif olur

```typescript
const provider = new PayTRProvider({ testMode: true });
```

veya

```env
PAYTR_TEST=1
```

## Contributing

Yeni provider eklemek için `PaymentProvider` interface'ini implement edin:

```typescript
export class YourProvider implements PaymentProvider {
    readonly name = 'YourProvider';

    async createPayment(params: CreatePaymentRequest): Promise<CreatePaymentResponse> {
        // Implementation
    }

    verifyCallback(payload: PaymentCallback): boolean {
        // Implementation
    }

    async refund(params: RefundRequest): Promise<any> {
        // Implementation
    }

    async queryTransaction(orderId: string): Promise<any> {
        // Implementation
    }
}
```

## Destek

- **GitHub Issues**: [nitrokit/nitrokit-core/issues](https://github.com/nitrokit/nitrokit-core/issues)
- **Dokümantasyon**: Bu klasördeki provider-specific dokümanlara bakın

## Lisans

MIT License - Detaylar için [LICENSE](../../../LICENSE) dosyasına bakın.
