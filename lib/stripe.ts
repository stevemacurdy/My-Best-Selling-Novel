import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
      timeout: 30_000,
      maxNetworkRetries: 2,
      typescript: true,
      appInfo: {
        name: 'mybestsellingnovel',
        version: '1.0.0',
        url: 'https://mybestsellingnovel.com',
      },
    });
  }
  return _stripe;
}
