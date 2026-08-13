import { User } from '../../types';
import { isDesktopEnv } from '../../utils/desktop';
import { DIRECTUS_URL, directusFetch } from './client';

export class AuthService {
  private user: User | null = null;

  constructor() {
    this.rehydrateUserSession();
  }

  private rehydrateUserSession() {
    if (typeof localStorage === 'undefined') return;
    const savedUser = localStorage.getItem('tankhor_user') || localStorage.getItem('sizegrid_user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (e) {
        this.user = null;
      }
    }
  }

  checkSubscriptionStatus(user: User | null = this.user): { isPro: boolean; tier: 'free' | 'pro' | 'enterprise'; expiresAt: string | null; isExpired: boolean } {
    if (!user) {
      const isProStored = localStorage.getItem('tankhor_pro_subscription') === 'true';
      const expiresAtStored = localStorage.getItem('tankhor_pro_expires') || null;
      const isExp = expiresAtStored ? new Date(expiresAtStored).getTime() <= Date.now() : false;
      return {
        isPro: isProStored && !isExp,
        tier: (isProStored && !isExp) ? 'pro' : 'free',
        expiresAt: expiresAtStored,
        isExpired: isExp
      };
    }

    const hasPro = Boolean(user.has_pro_subscription);
    const tier = user.subscription_tier || 'free';
    const expiresAt = user.subscription_expires_at || null;

    let isExpired = false;
    if (expiresAt) {
      const expTime = new Date(expiresAt).getTime();
      if (!isNaN(expTime) && expTime <= Date.now()) {
        isExpired = true;
      }
    }

    const isPro = (hasPro || tier === 'pro' || tier === 'enterprise') && !isExpired;

    return {
      isPro,
      tier: isPro ? (tier === 'enterprise' ? 'enterprise' : 'pro') : 'free',
      expiresAt,
      isExpired
    };
  }

  getSubscriptionInfo(): { isPro: boolean; expiresAt: string | null; tier: 'free' | 'pro' | 'enterprise' } {
    const status = this.checkSubscriptionStatus(this.user);
    return {
      isPro: status.isPro,
      expiresAt: status.expiresAt,
      tier: status.tier
    };
  }

  activateProSubscription(days: number = 365): { success: boolean; user: User | null } {
    const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('tankhor_pro_subscription', 'true');
    localStorage.setItem('tankhor_pro_expires', expiry);
    if (this.user) {
      this.user.has_pro_subscription = true;
      this.user.subscription_tier = 'pro';
      this.user.subscription_expires_at = expiry;
      localStorage.setItem('tankhor_user', JSON.stringify(this.user));
    }
    return { success: true, user: this.user };
  }

  cancelProSubscription(): void {
    localStorage.removeItem('tankhor_pro_subscription');
    localStorage.removeItem('tankhor_pro_expires');
    if (this.user) {
      this.user.has_pro_subscription = false;
      this.user.subscription_tier = 'free';
      this.user.subscription_expires_at = undefined;
      localStorage.setItem('tankhor_user', JSON.stringify(this.user));
    }
  }

  async login(email: string, password: string): Promise<User> {
    const isDesktop = isDesktopEnv();

    try {
      const response = await directusFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.errors?.[0]?.message || 'شناسه کاربری یا رمز عبور نامعتبر است');
      }

      const data = await response.json();
      const token = data?.data?.access_token;

      // Fetch user profile info from Directus
      const userProfileRes = await directusFetch('/users/me', {
        token
      });

      if (!userProfileRes.ok) {
        throw new Error('خطا در دریافت اطلاعات پروفایل از سرور دایرکتوس');
      }

      const profileData = await userProfileRes.json();
      const profile = profileData?.data;

      const hasProSub = Boolean(profile.has_pro_subscription);
      const subTier = (profile.subscription_tier as 'free' | 'pro' | 'enterprise') || 'free';
      const subExpiresAt = profile.subscription_expires_at || null;

      let isExpired = false;
      if (subExpiresAt) {
        const expTime = new Date(subExpiresAt).getTime();
        if (!isNaN(expTime) && expTime <= Date.now()) {
          isExpired = true;
        }
      }

      const isProActive = (hasProSub || subTier === 'pro' || subTier === 'enterprise') && !isExpired;

      const loggedUser: User = {
        id: profile.id,
        email: profile.email,
        shop_name: profile.description || `${profile.first_name || 'My'} Store`,
        shop_slug: profile.last_name?.toLowerCase() || `shop-${profile.id.substring(0, 5)}`,
        token: token,
        has_pro_subscription: email === 'demo@tankhor.com' ? true : isProActive,
        subscription_tier: email === 'demo@tankhor.com' ? 'pro' : (isProActive ? subTier : 'free'),
        subscription_expires_at: subExpiresAt || undefined
      };

      if (!isDesktop && !loggedUser.has_pro_subscription) {
        throw new Error(
          'دسترسی به پنل تحت وب تن‌خور نیازمند اشتراک ویژه (Pro) فعال در دایرکتوس است. ' +
          'شما می‌توانید از اپلیکیشن ۱۰۰٪ رایگان دسکتاپ استفاده کنید یا اشتراک وب خود را فعال سازید.'
        );
      }

      this.user = loggedUser;
      localStorage.setItem('tankhor_user', JSON.stringify(loggedUser));
      return loggedUser;
    } catch (err: any) {
      console.warn("Directus login network error, checking offline session fallback:", err);

      if (!isDesktop) {
        if (err?.message && err.message.includes('اشتراک ویژه')) {
          throw err;
        }
        if (err?.message === 'شناسه کاربری یا رمز عبور نامعتبر است') {
          throw err;
        }
        throw new Error("برای استفاده از نسخه وب، اتصال به اینترنت و اشتراک فعال ابری الزامی است.");
      }

      const savedUserStr = localStorage.getItem('tankhor_user') || localStorage.getItem('sizegrid_user');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser && savedUser.id && savedUser.id !== 'offline-merchant-local') {
            this.user = savedUser;
            return savedUser;
          }
        } catch (e) {}
      }

      if (err?.message === 'شناسه کاربری یا رمز عبور نامعتبر است') {
        throw err;
      }

      if (isDesktop) {
        const desktopUser: User = {
          id: `usr_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`,
          email: email,
          shop_name: email.split('@')[0] || 'فروشگاه من',
          shop_slug: (email.split('@')[0] || 'my-store').toLowerCase().replace(/[^a-z0-9-_]/g, ''),
          has_pro_subscription: false,
          subscription_tier: 'free'
        };
        this.user = desktopUser;
        localStorage.setItem('tankhor_user', JSON.stringify(desktopUser));
        return desktopUser;
      }

      throw err;
    }
  }

  async register(email: string, password: string, shopName: string, shopSlug: string): Promise<User> {
    const cleanSlug = shopSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');

    try {
      const response = await directusFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          first_name: shopName,
          last_name: cleanSlug,
          description: shopName,
          role: "5e13d3bc-e293-4720-90b5-d7a02871d34a"
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.errors?.[0]?.message || 'ثبت‌نام با خطا مواجه شد. ممکن است ایمیل قبلاً ثبت شده باشد.');
      }

      return this.login(email, password);
    } catch (err: any) {
      console.warn("Registration network error, completing desktop local registration:", err);

      if (err?.message && !err.message.includes('fetch') && err?.name !== 'TypeError' && err?.name !== 'DOMException') {
        throw err;
      }

      if (isDesktopEnv()) {
        const registeredUser: User = {
          id: `usr_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`,
          email: email,
          shop_name: shopName || 'فروشگاه من',
          shop_slug: cleanSlug || 'my-store',
          has_pro_subscription: false,
          subscription_tier: 'free'
        };
        this.user = registeredUser;
        localStorage.setItem('tankhor_user', JSON.stringify(registeredUser));
        return registeredUser;
      }

      throw err;
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem('tankhor_user');
    localStorage.removeItem('sizegrid_user');
  }

  getCurrentUser(): User | null {
    if (!this.user && typeof window !== 'undefined') {
      const savedUserStr = localStorage.getItem('tankhor_user') || localStorage.getItem('sizegrid_user');
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && parsed.id && parsed.id !== 'offline-merchant-local') {
            this.user = parsed;
          } else {
            localStorage.removeItem('tankhor_user');
            this.user = null;
          }
        } catch (e) {
          this.user = null;
        }
      }
    }

    return this.user;
  }

  async updateSettings(shopName: string, shopSlug: string): Promise<User> {
    if (!this.user) throw new Error("No authenticated user session.");
    const cleanSlug = shopSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');

    if (this.user.token) {
      const response = await directusFetch(`/users/${this.user.id}`, {
        method: 'PATCH',
        token: this.user.token,
        body: JSON.stringify({
          first_name: shopName,
          last_name: cleanSlug,
          description: shopName
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update remote user profile");
      }
    }

    this.user.shop_name = shopName;
    this.user.shop_slug = cleanSlug;
    localStorage.setItem('tankhor_user', JSON.stringify(this.user));
    return this.user;
  }
}
