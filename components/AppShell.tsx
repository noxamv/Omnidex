'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { 
  Menu, Search, Bell, X, LogIn, LogOut, Mail, 
  CheckCircle2, Download, ChevronDown, 
  Bookmark, SlidersHorizontal, Settings2, RefreshCw, 
  Upload, FileDown
} from 'lucide-react';

export const AVATAR_CHARACTERS = [
  { id: 'sjw', name: 'Sung Jin-woo', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&q=80' },
  { id: 'kdj', name: 'Kim Dokja', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&q=80' },
  { id: 'yjh', name: 'Yoo Joonghyuk', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&q=80' },
  { id: 'lloyd', name: 'Lloyd Frontera', url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&q=80' },
  { id: 'arthur', name: 'Arthur Leywin', url: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=150&q=80' },
  { id: 'klein', name: 'Klein Moretti', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=150&q=80' },
  { id: 'frieren', name: 'Frieren', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150&q=80' },
  { id: 'gojo', name: 'Satoru Gojo', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&q=80' },
  { id: 'luffy', name: 'Monkey D. Luffy', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&q=80' },
  { id: 'zoro', name: 'Roronoa Zoro', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&q=80' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [trendingAccordion, setTrendingAccordion] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_CHARACTERS[0].url);
  const [displayName, setDisplayName] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('[PWA] SW register skipped:', err));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 60 && currentScrollY > lastScrollY) {
        setShowHeader(false);
        setMenuOpen(false);
        setUserMenuOpen(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('omnidex_user_avatar');
    if (savedAvatar) setSelectedAvatar(savedAvatar);

    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        setDisplayName(activeUser.email?.split('@')[0] || 'Member');
        checkNotifications(activeUser.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        setDisplayName(activeUser.email?.split('@')[0] || 'Member');
        checkNotifications(activeUser.id);
      } else {
        setUnreadNotifications(0);
      }
    });

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const checkNotifications = async (userId: string) => {
    try {
      const { count } = await supabase
        .from('user_tracker')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_following', true);

      if (count && count > 0) setUnreadNotifications(1);
    } catch (err) {}
  };

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const delayDebounce = setTimeout(async () => {
      const { data } = await supabase
        .from('media_catalog')
        .select('id, title_primary, cover_url, media_type, format, score')
        .ilike('title_primary', `%${searchQuery.trim()}%`)
        .limit(6);

      setSearchResults(data || []);
      setSearchLoading(false);
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    setAuthLoading(false);
    if (!error) {
      setMagicLinkSent(true);
    } else {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
  };

  const handleSelectAvatar = (url: string) => {
    setSelectedAvatar(url);
    localStorage.setItem('omnidex_user_avatar', url);
  };

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPwaBanner(false);
    setDeferredPrompt(null);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-800/8
