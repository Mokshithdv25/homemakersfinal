import React from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya & Suresh Sharma",
    city: "Bangalore",
    avatar: "PS",
    avatarColor: "bg-amber-600",
    rating: 5,
    text: "We were overwhelmed with our first home build. HomeMakers' AI estimates saved us from overpaying on materials by ₹3L. The 3D renders helped our entire family agree on the design in just one weekend.",
    project: "3BHK Independent House, Whitefield",
  },
  {
    name: "Ar. Meera Krishnan",
    city: "Kochi",
    avatar: "MK",
    avatarColor: "bg-emerald-600",
    rating: 5,
    text: "My clients now come prepared with mood boards and clear visions. Design consensus that used to take months now happens in days. The platform has genuinely accelerated my practice.",
    project: "Architect, 12 years experience",
  },
  {
    name: "Rajesh & Anita Reddy",
    city: "Hyderabad",
    avatar: "RR",
    avatarColor: "bg-blue-600",
    rating: 5,
    text: "Being 200km away from our construction site, the photo updates and milestone tracking gave us complete peace of mind. We could see every bag of cement, every wall going up.",
    project: "G+2 Residential, Kompally",
  },
];

export default function LandingTestimonials() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <span className="section-kicker">
            <Quote className="h-3.5 w-3.5" />
            Trusted by Homeowners & Architects
          </span>
          <h2 className="mt-4 mb-4 font-display text-4xl font-bold text-foreground md:text-5xl">Stories from the Community</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="surface-panel flex flex-col p-6 transition-all duration-300 group hover:-translate-y-0.5"
            >
              <Quote className="w-8 h-8 text-copper/20 mb-4" />

              <p className="text-foreground font-body text-sm leading-relaxed flex-1 mb-6">&ldquo;{t.text}&rdquo;</p>

              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${t.avatarColor} flex items-center justify-center text-white text-sm font-bold`}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="font-body text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="font-body text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {t.city} · {t.project}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
