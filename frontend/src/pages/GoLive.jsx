import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StepRail, ProfileStrength, LivePreview } from "../components/SharedUI";
import { Copy, Eye, LayoutGrid, CheckCircle2, Link2, QrCode, ShieldCheck } from "lucide-react";
import { HmHeaderBrandLockup } from "../components/HmBrandLockup";
import { HM_HEADER_BAR_CLASS, HM_TAGLINE_PORTFOLIO } from "../lib/hmBrand";
import {
  getPortfolioBase,
  getPortfolioMedia,
  migrateLegacyPortfolioMedia,
  setPortfolioBase,
} from "../lib/portfolioStorage";
import { publishPortfolio } from "../lib/api";

/** One-shot local demo so `/live?demo=1` opens the “you’re live” + Preview as client without the wizard. */
function seedGoLiveDemoIfNeeded() {
  const id = "hm_livedemo1";
  const base = {
    id,
    craft: "architect",
    full_name: "Neha Verma",
    business_name: "Verma & Associates",
    city: "Bengaluru, Karnataka",
    address: "Indiranagar",
    years_experience: "8",
    phone: "+91 80 4123 8899",
    email: "neha@vermaarch.in",
    license_number: "",
    short_bio: "Residential, interiors, and sanction drawings — with a practical eye for Bangalore sites.",
    specialties: ["Residential", "Vastu-aware layouts", "Sustainable materials"],
    photos: [],
    cover_photo: "",
    profile_photo: "",
  };
  if (!localStorage.getItem("hm_portfolio_id")) {
    localStorage.setItem("hm_portfolio_id", id);
  }
  if (!localStorage.getItem("hm_craft")) {
    localStorage.setItem("hm_craft", "architect");
  }
  const prev = getPortfolioBase();
  if (!String(prev.full_name || "").trim()) {
    setPortfolioBase({ ...base, ...prev, ...base });
  }
}

export default function GoLive() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [slug, setSlug] = useState("");
  const [craft, setCraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (searchParams.get("demo") === "1") {
      seedGoLiveDemoIfNeeded();
      navigate("/live", { replace: true });
      return;
    }

    const pid = localStorage.getItem("hm_portfolio_id");
    if (!pid) {
      navigate("/craft");
      return;
    }

    migrateLegacyPortfolioMedia(pid);
    const saved = getPortfolioBase();
    if (!saved.full_name) {
      alert("Please fill in your details first.");
      navigate("/details");
      return;
    }

    const media = getPortfolioMedia(pid);
    const localFallback = () => {
      const base = saved.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const generatedSlug = `${base}-${pid.slice(-4)}`;
      const published = { ...saved, ...media, slug: generatedSlug, published: true, step: 4, profile_strength: 100 };
      setPortfolioBase({ ...saved, slug: generatedSlug, published: true, step: 4, profile_strength: 100 });
      setForm(published);
      setSlug(generatedSlug);
      setCraft(saved.craft || "");
      setLoading(false);
    };

    (async () => {
      try {
        const published = await publishPortfolio(pid);
        setPortfolioBase({
          ...saved,
          slug: published.slug,
          published: true,
          step: 4,
          profile_strength: 100,
        });
        setForm({ ...published, ...media });
        setSlug(published.slug || "");
        setCraft(published.craft || saved.craft || "");
        setLoading(false);
      } catch (err) {
        console.error("Publish via backend failed, using local fallback:", err);
        localFallback();
      }
    })();
  }, [navigate, searchParams]);

  const handleCopy = () => {
    const link = `homemaker.in/${craft}/${slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  const firstName = form?.full_name?.split(" ")[0] || "User";
  const linkText = `homemaker.in/${craft}/${slug}`;

  return (
    <div className="relative min-h-screen bg-[#FBF7F2] overflow-x-hidden">
      {/* Background accents matching the homepage */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(193,132,78,0.08),transparent_50%)]" aria-hidden />

      <header className={HM_HEADER_BAR_CLASS} data-testid="hm-header">
        <HmHeaderBrandLockup tagline={HM_TAGLINE_PORTFOLIO} />

        <div className="hidden md:block">
          <StepRail currentStep={4} />
        </div>

        <ProfileStrength value={100} subtext="Amazing! You're all set 🎉" />
      </header>

      {/* Mobile step rail */}
      <div className="md:hidden px-6 mb-2 flex justify-center">
        <StepRail currentStep={4} />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 px-6 md:px-12 pb-32">
        {/* LEFT */}
        <section className="lg:pr-12 lg:border-r lg:border-[#EFE3D2] pt-8">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full bg-[#FBE5D4] text-[#B04F20]">
            Step 4 of 4
          </div>

          <h1 className="mt-6 font-serif-display text-4xl md:text-5xl leading-[1.05] text-[#1C1917] font-medium">
            <span className="text-3xl inline-block -ml-2 mr-1">🎉</span> You're all set, <span className="italic font-semibold text-[#C85F2B]">{firstName}!</span>
          </h1>

          <p className="mt-4 text-[15px] text-[#6A5E53] max-w-md leading-relaxed">
            Your portfolio is live and ready to impress.<br/>
            Share your link and start getting discovered.
          </p>

          <div className="mt-8 bg-white border border-[#EFE3D2] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-[#1C1917]">Your Live Portfolio Link</span>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> It's live!</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#F9F5F0] border border-[#EFE3D2] rounded-xl px-4 py-3 font-medium text-[#1C1917] truncate select-all">
                <span className="text-[#C85F2B]">homemaker.in/{craft}/</span>{slug}
              </div>
              <button 
                onClick={handleCopy}
                className="bg-[#C85F2B] text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-[#B04F20] transition-colors shrink-0"
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[#7A6E62]">
              <ShieldCheck size={14} /> This is your unique link. Share it anywhere!
            </div>
          </div>

          <div className="mt-8">
            <div className="text-sm font-semibold text-[#1C1917] mb-1">Share your portfolio</div>
            <div className="text-[12px] text-[#7A6E62] mb-4">More shares = more clients 🚀</div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button className="flex flex-col items-center justify-center gap-2 w-20 h-20 bg-white border border-[#EFE3D2] rounded-2xl hover:border-green-500 hover:bg-green-50 transition-colors shrink-0">
                 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg></div>
                 <span className="text-[11px] font-semibold text-[#1C1917]">WhatsApp</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 w-20 h-20 bg-white border border-[#EFE3D2] rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-colors shrink-0">
                 <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>
                 <span className="text-[11px] font-semibold text-[#1C1917]">Facebook</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 w-20 h-20 bg-white border border-[#EFE3D2] rounded-2xl hover:border-pink-500 hover:bg-pink-50 transition-colors shrink-0">
                 <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-xl flex items-center justify-center text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></div>
                 <span className="text-[11px] font-semibold text-[#1C1917]">Instagram</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 w-20 h-20 bg-white border border-[#EFE3D2] rounded-2xl hover:border-[#C85F2B] hover:bg-[#FBE5D4] transition-colors shrink-0">
                 <div className="w-8 h-8 bg-[#EFE3D2] rounded-full flex items-center justify-center text-[#1C1917]"><Link2 size={16} /></div>
                 <span className="text-[11px] font-semibold text-[#1C1917]">Share Link</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 w-20 h-20 bg-white border border-[#EFE3D2] rounded-2xl hover:border-[#C85F2B] hover:bg-[#FBE5D4] transition-colors shrink-0">
                 <div className="w-8 h-8 bg-[#EFE3D2] rounded-full flex items-center justify-center text-[#1C1917]"><QrCode size={16} /></div>
                 <span className="text-[11px] font-semibold text-[#1C1917]">QR Code</span>
              </button>
            </div>
            
            <div className="mt-3 bg-[#FFFBF6] border border-[#EFE3D2] rounded-xl px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#B04F20]">
                <span className="text-lg">⭐</span> Profiles that are shared get <strong>5x</strong> more inquiries!
              </div>
              <div className="text-[11px] font-semibold text-[#C85F2B]">Let's get you more clients 🚀</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-sm font-semibold text-[#1C1917] mb-4">What's next?</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#EFE3D2] rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 bg-[#FBE5D4] rounded-full flex items-center justify-center mx-auto mb-3 text-[#C85F2B]">✏️</div>
                <div className="text-[13px] font-semibold text-[#1C1917] mb-1">Keep your profile fresh</div>
                <div className="text-[11px] text-[#7A6E62] leading-relaxed">Update projects and photos regularly to stay ahead.</div>
              </div>
              <div className="bg-white border border-[#EFE3D2] rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 bg-[#FBE5D4] rounded-full flex items-center justify-center mx-auto mb-3 text-[#C85F2B]">📈</div>
                <div className="text-[13px] font-semibold text-[#1C1917] mb-1">Get more inquiries</div>
                <div className="text-[11px] text-[#7A6E62] leading-relaxed">Share your link in groups, with past clients & on social media.</div>
              </div>
              <div className="bg-white border border-[#EFE3D2] rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 bg-[#FBE5D4] rounded-full flex items-center justify-center mx-auto mb-3 text-[#C85F2B]">🌟</div>
                <div className="text-[13px] font-semibold text-[#1C1917] mb-1">Build your reputation</div>
                <div className="text-[11px] text-[#7A6E62] leading-relaxed">Happy clients bring more clients. Keep delivering great work!</div>
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-[#EFE3D2] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#7A6E62]">
              <ShieldCheck size={14} /> Your data is saved locally and private
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <button
                onClick={() => {
                  // Use slug from state, fallback to saved localStorage slug
                  const saved = JSON.parse(localStorage.getItem("hm_portfolio") || "{}");
                  const targetSlug = slug || saved.slug || "preview";
                  window.open(`/profile/${targetSlug}`, "_blank");
                }}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-[#EFE3D2] text-[#1C1917] font-semibold px-6 py-3 rounded-xl hover:bg-[#F9F5F0] transition-colors"
              >
                <Eye size={18} /> Preview as Client
              </button>
              <button
                onClick={() => navigate("/pro/dashboard")}
                className="w-full md:w-auto btn-continue"
              >
                Go to My Dashboard
                <LayoutGrid size={18} className="ml-1" />
              </button>
            </div>
          </div>

        </section>

        {/* RIGHT */}
        <section className="lg:pl-12 lg:pt-8 pt-4 pb-20 lg:pb-0">
          <LivePreview craftId={craft} formValues={form} title="Live Preview" subtitle="This is how clients will see your portfolio" showTestimonial={true} />
          
          <div className="mt-6 bg-[#F0FDF4] border border-green-200 rounded-2xl p-5 flex items-start gap-4 mx-auto max-w-[440px]">
            <div className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center shrink-0 text-white">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="font-semibold text-[#1C1917]">Congratulations! You're officially live.</div>
              <div className="text-sm text-[#7A6E62] mt-1 leading-relaxed">
                Clients can now discover you and send inquiries.<br/>
                Check your dashboard anytime to manage your profile.
              </div>
            </div>
            <div className="text-4xl absolute bottom-4 right-4 opacity-50 grayscale select-none">🎉</div>
          </div>
        </section>
      </div>


    </div>
  );
}
