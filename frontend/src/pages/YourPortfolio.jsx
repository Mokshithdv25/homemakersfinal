import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { StepRail, ProfileStrength, LivePreview } from "../components/SharedUI";
import { HmHeaderBrandLockup } from "../components/HmBrandLockup";
import { HM_HEADER_BAR_CLASS, HM_TAGLINE_PORTFOLIO } from "../lib/hmBrand";
import { ArrowLeft, ArrowRight, UploadCloud, X, Camera, Download, ShieldCheck } from "lucide-react";

export default function YourPortfolio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [portfolioId, setPortfolioId] = useState("");
  const [craftId, setCraftId] = useState("");
  const [form, setForm] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const pid = localStorage.getItem("hm_portfolio_id");
    if (!pid) {
      navigate("/craft");
      return;
    }
    setPortfolioId(pid);
    // Load from localStorage
    const saved = JSON.parse(localStorage.getItem("hm_portfolio") || "{}");
    setCraftId(saved.craft || localStorage.getItem("hm_craft") || "");
    setForm(saved);
    setLoading(false);
  }, [navigate]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Convert to base64 for simulation
    const readers = files.map(f => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(f);
      });
    });

    Promise.all(readers).then(results => {
      setForm(prev => {
        const newPhotos = [...(prev.photos || []), ...results];
        return { ...prev, photos: newPhotos.slice(0, 10) }; // Max 10
      });
    });
  };

  const removePhoto = (index) => {
    setForm(prev => {
      const newPhotos = [...prev.photos];
      newPhotos.splice(index, 1);
      return { ...prev, photos: newPhotos };
    });
  };

  const handleSave = (nextRoute) => {
    // Save photos to localStorage
    const saved = JSON.parse(localStorage.getItem("hm_portfolio") || "{}");
    const updated = { ...saved, photos: form.photos || [], step: 3, profile_strength: 75 };
    localStorage.setItem("hm_portfolio", JSON.stringify(updated));
    if (nextRoute) {
      navigate(nextRoute);
    } else {
      alert("Saved! You can come back later.");
    }
  };

  if (loading) return null;

  const photos = form?.photos || [];

  return (
    <div className="relative min-h-screen bg-[#FBF7F2] overflow-x-hidden">
      {/* Background accents matching the homepage */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(193,132,78,0.08),transparent_50%)]" aria-hidden />

      {/* Header */}
      <header className={HM_HEADER_BAR_CLASS} data-testid="hm-header">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/details")}
            className="flex items-center gap-2 text-sm font-semibold text-[#1C1917] hover:text-[#C85F2B] transition-colors border border-[#EFE3D2] px-3 py-2 rounded-lg bg-white shrink-0"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <HmHeaderBrandLockup tagline={HM_TAGLINE_PORTFOLIO} truncateTitle className="min-w-0 flex-1" />
        </div>

        <div className="hidden md:block">
          <StepRail currentStep={3} />
        </div>

        <ProfileStrength value={65} subtext="Almost there!" />
      </header>

      {/* Mobile step rail */}
      <div className="md:hidden px-6 mb-2 flex justify-center">
        <StepRail currentStep={3} />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 px-6 md:px-12 pb-32">
        {/* LEFT */}
        <section className="lg:pr-12 lg:border-r lg:border-[#EFE3D2] pt-8">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full bg-[#FBE5D4] text-[#B04F20]">
            Step 3 of 4
          </div>

          <h1 className="mt-6 font-serif-display text-4xl md:text-5xl leading-[1.05] text-[#1C1917] font-medium flex items-center gap-3">
            Showcase your <span className="italic font-semibold text-[#C85F2B]">work</span>
            <span className="text-[#E8A84A]">✨</span>
          </h1>

          <p className="mt-4 text-[15px] text-[#6A5E53] max-w-md leading-relaxed">
            Add photos of your projects, work in progress or finished work. Quality photos build trust and get more clients.
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-[#1C1917]">
                Upload Photos <span className="text-[#C85F2B]">*</span>
              </label>
            </div>
            <div className="text-[12px] text-[#7A6E62] mb-4">Add at least 3 high-quality photos (Max 10 photos)</div>

            <div className="border-2 border-dashed border-[#EFE3D2] rounded-2xl bg-[#FFFBF6] flex flex-col items-center justify-center py-10 transition-colors hover:border-[#C85F2B] hover:bg-[#FDF0D8]/30 group">
              <div className="w-14 h-14 bg-white border border-[#EFE3D2] rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
                <UploadCloud size={24} className="text-[#C85F2B]" />
              </div>
              <div className="font-semibold text-[#1C1917] mb-1">Drag & drop photos here</div>
              <div className="text-sm text-[#7A6E62] mb-4">or</div>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 border border-[#EFE3D2] bg-white text-[#1C1917] font-semibold px-4 py-2 rounded-lg hover:border-[#C85F2B] transition-colors">
                <UploadCloud size={16} className="text-[#C85F2B]"/> Browse Files
              </button>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/jpeg, image/png" onChange={handleFileUpload} />
              <div className="text-[11px] text-[#A89A8C] mt-4 uppercase tracking-wider font-semibold">JPG, PNG up to 10MB each</div>
            </div>
            
            {photos.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-semibold text-[#1C1917] mb-3">Your Uploaded Photos ({photos.length}/10)</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((p, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-[4/3] border border-[#EFE3D2]">
                      <img src={p} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)} className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#1C1917] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500 shadow-sm">
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 bg-white border border-[#EFE3D2] rounded-xl p-4 flex gap-4 items-start">
              <div className="w-10 h-10 bg-[#FBE5D4] rounded-full flex items-center justify-center shrink-0">
                <Camera size={18} className="text-[#C85F2B]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1C1917]">Tips for best results</div>
                <div className="text-[13px] text-[#7A6E62] mt-1 leading-relaxed">
                  Use clear, well-lit photos. Show before/after, finished projects, materials, or work in progress.
                </div>
              </div>
              <button className="text-[#C85F2B] text-sm font-semibold shrink-0">Learn more</button>
            </div>

            {error && (
              <div className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="mt-12 pt-6 border-t border-[#EFE3D2] flex flex-col sm:flex-row items-center gap-4 justify-between">
              <button
                onClick={() => handleSave()}
                className="flex items-center gap-2 text-sm font-semibold text-[#6A5E53] hover:text-[#1C1917] transition-colors px-4 py-2 rounded-lg hover:bg-[#F9F5F0]"
              >
                <Download size={16} /> Save & Exit
              </button>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[#7A6E62]">
                  <ShieldCheck size={14} /> Your data is saved locally and private
                </div>
                <button
                  onClick={() => handleSave("/live")}
                  disabled={submitting || photos.length < 3}
                  className="btn-continue w-full sm:w-auto"
                >
                  {submitting ? "Saving..." : "Continue to Go Live"}
                  <ArrowRight size={18} className="arrow" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <section className="lg:pl-12 lg:pt-8 pt-4">
          <LivePreview craftId={craftId} formValues={form} title="Live Preview" subtitle="See how clients will view your portfolio" showTestimonial={true} />
        </section>
      </div>
    </div>
  );
}
