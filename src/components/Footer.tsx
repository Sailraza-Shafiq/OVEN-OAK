import React, { useState } from 'react';
import { ArrowRight, MapPin, Phone, Mail, Clock, Check } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#3B241C] text-white pt-14 sm:pt-20 pb-10 sm:pb-12 border-t border-white/10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Newsletter / Bake Dispatch Banner */}
        <div className="border-b border-white/15 pb-10 sm:pb-16 mb-10 sm:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-white/60 font-mono">
                The Morning Dispatch
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                Receive the dawn bake schedule &amp; seasonal grain releases.
              </h3>
              <p className="text-sm text-white/75 max-w-lg">
                Sent every Friday dawn. Special holiday bake preorder access, experimental grain varieties, and hearth stories.
              </p>
            </div>

            <div className="lg:col-span-5">
              {subscribed ? (
                <div className="p-4 bg-white/10 border border-white/20 text-white flex items-center gap-3">
                  <Check className="w-5 h-5 text-white" />
                  <span className="text-sm font-medium">You are on the Friday Dawn list. Welcome to OVEN &amp; OAK.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    required
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/25 text-white placeholder-white/50 text-xs focus:outline-none focus:border-white transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white text-[#3B241C] text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main 4-Column Footer Navigation & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & Ethos */}
          <div className="space-y-4">
            <h4 className="text-2xl font-serif font-bold tracking-widest text-white">
              OVEN &amp; OAK
            </h4>
            <p className="text-sm text-white/75 font-sans leading-relaxed">
              Artisanal stone-hearth bakery dedicated to slow wild fermentation, single-origin heritage flours, and traditional European viennoiserie.
            </p>
            <div className="text-xs text-white/60 font-mono">
              EST. 2018 · OAKRIDGE DISTRICT
            </div>
          </div>

          {/* Bakery Hearth & Hours */}
          <div className="space-y-4">
            <h5 className="text-xs uppercase font-mono tracking-widest text-white/60">
              Hearth Hours
            </h5>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Tuesday – Friday</p>
                  <p className="text-xs text-white/70">07:00 AM – 03:00 PM (or sell-out)</p>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <Clock className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Saturday &amp; Sunday</p>
                  <p className="text-xs text-white/70">07:30 AM – 03:30 PM (or sell-out)</p>
                </div>
              </div>

              <div className="pt-2 text-xs text-white/60 font-serif italic">
                Closed Mondays for sourdough culture feeding &amp; hearth cleaning.
              </div>
            </div>
          </div>

          {/* Physical Address & Contact */}
          <div className="space-y-4">
            <h5 className="text-xs uppercase font-mono tracking-widest text-white/60">
              The Bakery Counter
            </h5>
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">42 Oak Hearth Lane</p>
                  <p className="text-xs text-white/70">Oakridge Artisan Quarter</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white/60 shrink-0" />
                <a href="tel:5552486836" className="text-xs text-white/80 hover:text-white transition-colors">
                  (555) 248-OVEN (6836)
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white/60 shrink-0" />
                <a href="mailto:hello@ovenandoak.com" className="text-xs text-white/80 hover:text-white transition-colors">
                  hello@ovenandoak.com
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Links & Socials */}
          <div className="space-y-4">
            <h5 className="text-xs uppercase font-mono tracking-widest text-white/60">
              Explore &amp; Follow
            </h5>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <a href="#featured-products" className="hover:text-white transition-colors text-xs uppercase tracking-wider">
                  Today's Hearth Pulls
                </a>
              </li>
              <li>
                <a href="#categories" className="hover:text-white transition-colors text-xs uppercase tracking-wider">
                  Baking Traditions
                </a>
              </li>
              <li>
                <a href="#best-sellers" className="hover:text-white transition-colors text-xs uppercase tracking-wider">
                  Permanent Icons
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors text-xs uppercase tracking-wider">
                  Baker's Heritage
                </a>
              </li>
            </ul>

            <div className="pt-4 border-t border-white/10 flex items-center gap-4 text-xs font-mono tracking-wider text-white/70">
              <a href="#" className="hover:text-white transition-colors">INSTAGRAM</a>
              <span aria-hidden="true" className="opacity-40">·</span>
              <a href="#" className="hover:text-white transition-colors">SUBSTACK</a>
              <span aria-hidden="true" className="opacity-40">·</span>
              <a href="#" className="hover:text-white transition-colors">PINTEREST</a>
            </div>
          </div>

        </div>

        {/* Quiet Bottom Copyright Bar */}
        <div className="pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <div>
            &copy; {new Date().getFullYear()} OVEN &amp; OAK BAKERY INC. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Sourdough Care Guide</span>
            <span className="hover:text-white transition-colors cursor-pointer">Allergen Transparency</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
