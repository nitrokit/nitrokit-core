# Stripe Provider - Detaylı Kullanım Kılavuzu

Stripe, dünya çapında en popüler ödeme altyapı sağlayıcılarından biridir. Bu doküman, Nitrokit Core içinde Stripe entegrasyonunu kullanmanız için gereken tüm bilgileri içerir.

## İçindekiler

- [Özellikler](#özellikler)
- [Kurulum ve Yapılandırma](#kurulum-ve-yapılandırma)
- [Temel Kullanım](#temel-kullanım)
- [Checkout Session Yönetimi](#checkout-session-yönetimi)
- [Webhook İşlemleri](#webhook-i̇şlemleri)
- [İade İşlemleri](#i̇ade-i̇şlemleri)
- [İşlem Sorgulama](#i̇şlem-sorgulama)
- [Test Ortamı](#test-ortamı)
- [Güvenlik](#güvenlik)
- [Hata Yönetimi](#hata-yönetimi)
- [İleri Seviye Kullanım](#i̇leri-seviye-kullanım)

## Özellikler

✅ **Hosted Checkout**: Stripe'ın hazır ödeme sayfası  
✅ **Çoklu Para Birimi**: 135+ para birimi desteği  
✅ **Webhook Doğrulama**: Güvenli event verification  
✅ **İade Desteği**: Tam ve kısmi iade işlemleri  
✅ **Test Modu**: Sandbox ortamı ile güvenli test  
✅ **TypeScript**: Tam tip desteği  
✅ **SCA Ready**: Strong Customer Authentication (PSD2)  
✅ **Global Ödeme Yöntemleri**: Kart, Apple Pay, Google Pay, SEPA ve daha fazlası

## Kurulum ve Yapılandırma

### 1. Stripe Hesabı Oluşturma

1. [stripe.com](https://stripe.com) adresinden ücretsiz hesap açın
2. Dashboard'a giriş yapın
3. API keys bölümünden test ve production anahtarlarınızı alın

### 2. Ortam Değişkenlerini Ayarlama

`.env` dosyanızı oluşturun ve Stripe bilgilerinizi ekleyin:

```env
# Stripe API Credentials (Zorunlu)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhook Secret (Önemli!)
STRIPE_WEBHOOK_SECRET=whsec_...

# Opsiyonel Ayarlar
STRIPE_API_VERSION=2024-11-20.acacia
STRIPE_TEST=1  # Test modu: 1 veya true
```

> **Not:**
>
> - Test anahtarları `sk_test_` ve `pk_test_` ile başlar
> - Production anahtarları `sk_live_` ve `pk_live_` ile başlar
> - Webhook secret'ı Stripe Dashboard > Developers > Webhooks'tan alabilirsiniz

### 3. Stripe Dashboard'da Webhook Ayarlama

1. Stripe Dashboard > **Developers** > **Webhooks**
2. **Add endpoint** butonuna tıklayın
3. Endpoint URL: `https://yourdomain.com/api/payment/webhook`
4. Dinlenecek events:
    - `checkout.session.completed`
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `charge.refunded`
5. Webhook signing secret'ı kopyalayıp `.env` dosyanıza ekleyin

## Temel Kullanım

### Basit Ödeme Oluşturma

```typescript
import { PaymentService, StripeProvider } from '@nitrokit/core/services/payment';

// Provider'ı başlat (otomatik olarak .env'den okur)
const stripeProvider = new StripeProvider();

// Payment service'i oluştur
const paymentService = new PaymentService(stripeProvider);

// Ödeme talebi oluştur
const result = await paymentService.createPayment({
    orderId: 'ORDER-12345', // Benzersiz sipariş ID'si
    amount: 10000, // $100.00 (cents cinsinden)
    email: 'customer@example.com', // Müşteri email
    successUrl: 'https://yoursite.com/payment/success',
    failUrl: 'https://yoursite.com/payment/cancel'
});

// Sonucu kontrol et ve yönlendir
if (result.success) {
    console.log('Checkout Session ID:', result.token);
    console.log('Payment URL:', result.paymentUrl);

    // Kullanıcıyı Stripe Checkout sayfasına yönlendir
    window.location.href = result.paymentUrl!;
} else {
    console.error('Error:', result.reason);
    console.error('Error code:', result.errorCode);
}
```

### Detaylı Ödeme Oluşturma

```typescript
const result = await paymentService.createPayment({
    // Zorunlu Alanlar
    orderId: 'ORDER-12345',
    amount: 29900, // $299.00
    email: 'customer@example.com',
    successUrl: 'https://yoursite.com/success?session_id={CHECKOUT_SESSION_ID}',
    failUrl: 'https://yoursite.com/cancel',

    // Opsiyonel Alanlar
    userName: 'John Doe',
    userPhone: '+1234567890',
    currency: 'USD', // USD, EUR, GBP, TRY, vb.

    // Sepet bilgileri (ürün listesi)
    basket: [
        { name: 'Premium Subscription', price: 20000, quantity: 1 },
        { name: 'Extra Features', price: 9900, quantity: 1 }
    ]
});
```

## Checkout Session Yönetimi

### Sepet Formatı

```typescript
interface PaymentBasketItem {
    name: string; // Ürün adı
    price: number; // Birim fiyat (cents/kuruş cinsinden)
    quantity: number; // Adet
}
```

### Örnek: E-ticaret Sepeti

```typescript
const basket = [
    {
        name: 'MacBook Pro 14"',
        price: 199900, // $1,999.00
        quantity: 1
    },
    {
        name: 'USB-C Cable',
        price: 1900, // $19.00
        quantity: 2
    }
];

const result = await paymentService.createPayment({
    orderId: 'ORDER-789',
    amount: 203700, // Toplam: $1999 + ($19 x 2) = $2,037.00
    email: 'customer@example.com',
    successUrl: 'https://yoursite.com/success',
    failUrl: 'https://yoursite.com/cancel',
    currency: 'USD',
    basket: basket
});
```

### Para Birimleri

Stripe 135+ para birimini destekler. En yaygın olanlar:

| Para Birimi   | Kod | Örnek Miktar                  |
| ------------- | --- | ----------------------------- |
| US Dollar     | USD | 10000 = $100.00               |
| Euro          | EUR | 10000 = €100.00               |
| British Pound | GBP | 10000 = £100.00               |
| Turkish Lira  | TRY | 10000 = ₺100.00               |
| Japanese Yen  | JPY | 10000 = ¥10,000 (no decimals) |

> **Not:** Japon Yeni (JPY) ve benzeri para birimleri ondalık kullanmaz.

## Webhook İşlemleri

Webhook'lar, Stripe'dan gelen gerçek zamanlı bildirimlerdir. Ödeme durumunu güvenli bir şekilde doğrulamak için kullanılmalıdır.

### Next.js API Route Örneği

```typescript
// app/api/payment/webhook/route.ts
import { PaymentService, StripeProvider } from '@nitrokit/core/services/payment';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        // Webhook'u doğrula (production'da Stripe SDK kullanın)
        // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

        const payload = JSON.parse(body);
        const paymentService = new PaymentService(new StripeProvider());

        // Event type'a göre işlem yap
        switch (payload.type) {
            case 'checkout.session.completed': {
                const session = payload.data.object;

                // Ödeme başarılı - siparişi tamamla
                await completeOrder(session.client_reference_id, {
                    sessionId: session.id,
                    paymentIntentId: session.payment_intent,
                    amountTotal: session.amount_total,
                    currency: session.currency,
                    customerEmail: session.customer_details.email
                });

                console.log(`✅ Payment successful: ${session.client_reference_id}`);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = payload.data.object;

                // Ödeme başarısız
                await failOrder(
                    paymentIntent.metadata.order_id,
                    paymentIntent.last_payment_error?.message
                );

                console.log(`❌ Payment failed: ${paymentIntent.metadata.order_id}`);
                break;
            }

            case 'charge.refunded': {
                const charge = payload.data.object;

                // İade işlendi
                await handleRefund(charge.metadata.order_id, charge.amount_refunded);

                console.log(`💰 Refund processed: ${charge.metadata.order_id}`);
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
    }
}

async function completeOrder(orderId: string, paymentData: any) {
    // Veritabanınızda siparişi tamamlayın
}

async function failOrder(orderId: string, reason: string) {
    // Siparişi başarısız olarak işaretleyin
}

async function handleRefund(orderId: string, amount: number) {
    // İade işlemini kaydedin
}
```

### Express.js Örneği

```typescript
import express from 'express';
import { PaymentService, StripeProvider } from '@nitrokit/core/services/payment';

const app = express();

// Webhook için RAW body gerekli (JSON middleware kullanmayın!)
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];

    try {
        // Stripe SDK ile doğrulama yapın
        // const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

        const payload = JSON.parse(req.body.toString());

        if (payload.type === 'checkout.session.completed') {
            const session = payload.data.object;
            await completeOrder(session.client_reference_id);
        }

        res.json({ received: true });
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});
```

### Webhook Event Tipleri

| Event                                      | Açıklama                                   |
| ------------------------------------------ | ------------------------------------------ |
| `checkout.session.completed`               | Checkout başarıyla tamamlandı              |
| `checkout.session.async_payment_succeeded` | Async ödeme başarılı (banka transferi vb.) |
| `payment_intent.succeeded`                 | Payment Intent başarılı                    |
| `payment_intent.payment_failed`            | Ödeme başarısız                            |
| `charge.refunded`                          | İade işlendi                               |
| `charge.dispute.created`                   | Chargeback oluşturuldu                     |

## İade İşlemleri

### Tam İade

```typescript
const refundResult = await paymentService.refund({
    orderId: 'pi_1234567890' // Payment Intent ID
});

console.log('Refund status:', refundResult);
```

### Kısmi İade

```typescript
// $299.00'lık ödemeden $50.00 iade
const refundResult = await paymentService.refund({
    orderId: 'pi_1234567890',
    amount: 5000 // $50.00 (cents cinsinden)
});

if (refundResult.status === 'succeeded') {
    console.log('Refund successful');
} else {
    console.error('Refund failed:', refundResult);
}
```

### İade Kuralları

- ⚠️ İade, başarılı ödemeden sonra yapılabilir
- ⚠️ Kısmi iade birden fazla kez yapılabilir (toplam tutarı aşmadan)
- ⚠️ İade süresi banka/karta göre 5-10 iş günü sürebilir
- ⚠️ Stripe ücreti iade edilmez (dispute durumları hariç)

## İşlem Sorgulama

Bir ödemenin durumunu sorgulayın:

```typescript
// Payment Intent ID ile sorgula
const transaction = await paymentService.queryTransaction('pi_1234567890');

// veya Checkout Session ID ile
const session = await paymentService.queryTransaction('cs_test_1234567890');

console.log('Transaction status:', transaction);
```

### Örnek Payment Intent Sonucu

```json
{
    "id": "pi_1234567890",
    "object": "payment_intent",
    "amount": 10000,
    "currency": "usd",
    "status": "succeeded",
    "created": 1700000000,
    "payment_method": "pm_1234567890"
}
```

### Örnek Checkout Session Sonucu

```json
{
    "id": "cs_test_1234567890",
    "object": "checkout.session",
    "payment_status": "paid",
    "amount_total": 10000,
    "currency": "usd",
    "customer_email": "customer@example.com",
    "payment_intent": "pi_1234567890"
}
```

## Test Ortamı

### Test Modunu Aktifleştirme

**Yöntem 1: Ortam değişkeni**

```env
STRIPE_TEST=1
STRIPE_SECRET_KEY=sk_test_...
```

**Yöntem 2: Constructor**

```typescript
const provider = new StripeProvider({
    secretKey: 'sk_test_...',
    publishableKey: 'pk_test_...',
    webhookSecret: 'whsec_test_...',
    testMode: true
});
```

### Test Kartları

Stripe test ortamında kullanabileceğiniz kartlar:

| Senaryo                    | Kart Numarası       | Sonuç              |
| -------------------------- | ------------------- | ------------------ |
| Başarılı ödeme             | 4242 4242 4242 4242 | Başarılı           |
| Başarılı ödeme (3D Secure) | 4000 0027 6000 3184 | 3D Secure gerektir |
| Yetersiz bakiye            | 4000 0000 0000 9995 | Declined           |
| Kart reddedildi            | 4000 0000 0000 0002 | Generic decline    |
| CVV hatası                 | 4000 0000 0000 0127 | CVV check fails    |
| Son kullanma tarihi hatası | 4000 0000 0000 0069 | Expired card       |

**Diğer bilgiler:**

- Son kullanma tarihi: Gelecekteki herhangi bir tarih (örn: 12/26)
- CVV: Herhangi 3 haneli sayı (örn: 123)
- ZIP: Herhangi 5 haneli sayı (örn: 12345)

### Test ile Production Farklılıkları

- Test modunda gerçek para transferi yapılmaz
- Test kartları sadece test modunda çalışır
- Test webhook'ları Stripe CLI ile simüle edilebilir
- Test API anahtarları `sk_test_` ile başlar

## Güvenlik

### API Anahtarlarını Koruma

```typescript
// ❌ YANLIŞ: Client-side'da secret key kullanmayın
const provider = new StripeProvider({
    secretKey: 'sk_live_hardcoded' // Tehlikeli!
});

// ✅ DOĞRU: Server-side'da env kullanın
const provider = new StripeProvider(); // .env'den otomatik okur
```

### Publishable Key Kullanımı

Client-side'da sadece publishable key kullanın:

```typescript
// Client-side (React örneği)
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
```

### Webhook Signature Doğrulama

Production'da mutlaka webhook signature doğrulaması yapın:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const event = stripe.webhooks.constructEvent(
    requestBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
);
```

### HTTPS Zorunluluğu

Production ortamında mutlaka HTTPS kullanın:

```typescript
// ✅ DOĞRU
successUrl: 'https://yoursite.com/success';

// ❌ YANLIŞ (production'da)
successUrl: 'http://yoursite.com/success';
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
        console.error('Validation error:', error.message);
    }
}
```

### API Hataları

```typescript
const result = await paymentService.createPayment(params);

if (!result.success) {
    console.error('API Error:', result.reason);
    console.error('Error Code:', result.errorCode);
    console.error('Raw response:', result.raw);

    // Kullanıcıya göster
    if (result.errorCode === 'invalid_api_key') {
        alert('Configuration error. Please contact support.');
    } else {
        alert(`Payment failed: ${result.reason}`);
    }
}
```

### Yaygın Hatalar ve Çözümleri

| Hata                                    | Sebep                 | Çözüm                         |
| --------------------------------------- | --------------------- | ----------------------------- |
| `invalid_api_key`                       | Yanlış API key        | API key'i kontrol edin        |
| `Invalid email format`                  | Geçersiz email        | Email formatını düzeltin      |
| `Amount must be positive`               | Negatif tutar         | Pozitif değer gönderin        |
| `payment_method_not_available`          | Ödeme yöntemi kapalı  | Dashboard'dan aktifleştirin   |
| `webhook signature verification failed` | Yanlış webhook secret | Webhook secret'ı kontrol edin |

## İleri Seviye Kullanım

### Manuel Konfigürasyon

```typescript
const provider = new StripeProvider({
    secretKey: process.env.CUSTOM_STRIPE_KEY,
    publishableKey: process.env.CUSTOM_STRIPE_PK,
    webhookSecret: process.env.CUSTOM_WEBHOOK_SECRET,
    apiVersion: '2024-11-20.acacia',
    testMode: process.env.NODE_ENV !== 'production'
});
```

### Publishable Key Alma

Client-side için publishable key'e ihtiyaç duyduğunuzda:

```typescript
const provider = new StripeProvider();
const publishableKey = provider.getPublishableKey();

// Client'a gönder
res.json({ publishableKey });
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
} from '@nitrokit/core/services/payment';

async function handlePayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const service = new PaymentService(new StripeProvider());
    return service.createPayment(request);
}
```

### Stripe Elements Entegrasyonu

Daha özelleştirilmiş ödeme formu için Stripe Elements kullanın:

```typescript
// Client-side
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...');

function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

## Sık Sorulan Sorular (SSS)

### Checkout Session'ın süresi ne kadar?

24 saat. Bu süre sonunda kullanılmamış session'lar expire olur.

### Başka ödeme yöntemleri nasıl aktifleştirilir?

Stripe Dashboard > Settings > Payment methods bölümünden aktifleştirebilirsiniz:

- Apple Pay / Google Pay
- SEPA Direct Debit
- Bank transfers
- Buy now, pay later (Klarna, Afterpay)

### Subscription (abonelik) ödemeleri destekleniyor mu?

Bu provider tek seferlik ödemeler için tasarlanmıştır. Subscription için Stripe'ın Billing API'sini kullanın.

### Webhook gelmezse ne yapmalıyım?

1. Stripe Dashboard > Developers > Webhooks'tan endpoint'inizi kontrol edin
2. Webhook events'i test edin (Send test webhook butonu)
3. Sunucunuzun erişilebilir olduğundan emin olun
4. Firewall kurallarını kontrol edin
5. Stripe CLI ile local test yapın: `stripe listen --forward-to localhost:3000/api/webhook`

### Multi-currency ödemeleri nasıl yapılır?

`currency` parametresini değiştirin:

```typescript
createPayment({
    // ...
    currency: 'EUR' // veya 'GBP', 'TRY', vb.
});
```

## Stripe CLI Kullanımı

Local development için Stripe CLI çok faydalıdır:

```bash
# Kurulum
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Webhook'ları dinle
stripe listen --forward-to localhost:3000/api/payment/webhook

# Test event gönder
stripe trigger checkout.session.completed
```

## Destek ve İletişim

- **Stripe Dokümantasyon**: https://stripe.com/docs
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Destek**: https://support.stripe.com
- **Nitrokit Issues**: https://github.com/nitrokit/nitrokit-core/issues

## Changelog

### v1.0.0 (2025-11-19)

- ✅ İlk stabil sürüm
- ✅ Checkout Session desteği
- ✅ Webhook verification
- ✅ İade ve sorgulama desteği
- ✅ Multi-currency support
- ✅ Test modu
- ✅ TypeScript tipleri

## Lisans

MIT License - Detaylar için [LICENSE](../../../../LICENSE) dosyasına bakın.

---

**Not:** Bu doküman Stripe API 2024-11-20 versiyonu üzerine yazılmıştır. Stripe API'sinde değişiklik olduğunda bu dokümantasyon güncellenecektir.
