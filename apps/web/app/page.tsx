import Link from "next/link";
import { Button } from "@/components/ui";
import { HeroSearch } from "@/components/HeroSearch";

/* ───── Static data ───── */

const stats = [
  { value: "3,400+", label: "Verified Providers" },
  { value: "50,000+", label: "Jobs Completed" },
  { value: "4.8★", label: "Average Rating" },
  { value: "2 Cities", label: "Lagos & Abuja" },
];

const categories = [
  {
    name: "Plumber",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.049.58.025 1.193-.14 1.743" />
      </svg>
    ),
  },
  {
    name: "Electrician",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    name: "Tailor",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.696.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" />
      </svg>
    ),
  },
  {
    name: "Carpenter",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    name: "Mechanic",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: "Cleaner",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
];

const howItWorks = [
  {
    title: "Search & filter",
    description:
      "Browse by trade, location, rating and verified status. Enter your need, or a local place-name to start searching.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    title: "Read reviews & book",
    description:
      "Check community-written reviews, detailed portfolios and rates to hand-pick the best pro for the job.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    title: "Pay safely via escrow",
    description:
      "Deposit into the Flutterwave-powered escrow. Funds released only after you confirm the job is complete.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

const topProviders = [
  {
    name: "Emeka Okeke",
    trade: "Plumbing",
    location: "Lagos, Surulere",
    rating: 4.9,
    reviews: 87,
    bio: "Commercial plumber with 10 years of experience. All pipe fittings, commercial and residential. Committed and meticulous.",
    priceRange: "₦8,000 – ₦55,000",
    isVerified: true,
    avatar: "EO",
  },
  {
    name: "Salamot Okonjo",
    trade: "Tailoring",
    location: "Abuja, Wuse",
    rating: 4.8,
    reviews: 62,
    bio: "Ankara fashion designer, measurements & fittings. Nice fit, and balance's what's fit. The best.",
    priceRange: "₦5,000 – ₦60,000",
    isVerified: true,
    avatar: "SO",
  },
  {
    name: "Bimtus Adepnju",
    trade: "Carpentry",
    location: "Lagos, Victoria Island",
    rating: 4.7,
    reviews: 45,
    bio: "All furniture, door work, and carpentry related. I'm fluent, dedicated, designer-y, smooth-y, fluent-y: Fluent Carpentry.",
    priceRange: "₦10,000 – ₦120,000",
    isVerified: false,
    avatar: "BA",
  },
];

const testimonials = [
  {
    rating: 5,
    text: "I needed a certified plumber at 11 p.m. on a Friday. The entire process from search to payment was so smooth — no, cash, no wahala.",
    name: "Chukwubueze O.",
    location: "Lagos",
    avatar: "CO",
  },
  {
    rating: 5,
    text: "My tailoring business grew 4x after joining SabiPro. The vetting badge brought 30 new customers last month.",
    name: "Salamat O.",
    location: "Abuja",
    avatar: "SO",
  },
  {
    rating: 5,
    text: "I used to dread finding a reliable welder in Ikeja. Now I search, I find, I check the badge, read reviews, and done. Aburo!",
    name: "Bisi Fatona",
    location: "Lagos",
    avatar: "BF",
  },
];

const whySabiPro = [
  {
    title: "Admin-issued vetting badges",
    description:
      "Identity and credential badges are only assigned after manual review, not by self-assessment. See a green star? It's verified.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
  {
    title: "Real community reviews",
    description:
      "Only consumers who've confirmed bookings can leave reviews. Ratings and reviews stay honest and trustworthy — no self-promotion or gaming.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: "Escrow payment protection",
    description:
      "Your money sits in escrow until you confirm the job is complete. Charges are refundable within 7 days of job completion.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
];

/* ───── Star rating helper ───── */
function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < count ? "text-secondary-base" : "text-neutral-500/30"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

/* ───── Page ───── */
export default function Home() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="bg-primary-base text-neutral-0 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-16 pb-24 md:pt-20 md:pb-32">
          {/* Pill banner */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 bg-primary-base/40 text-neutral-0 text-caption font-medium px-4 py-2 rounded-pill backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-secondary-base animate-pulse" />
              Interviewing tradespeople is stressful
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[36px] md:text-[48px] lg:text-[56px] font-medium leading-[1.1] mb-5 max-w-2xl">
            Find a skilled pro.
            <br />
            <span className="text-secondary-base">Trust verified.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-body md:text-[18px] text-neutral-0/80 mb-10 max-w-xl leading-relaxed">
            SabiPro connects you with vetted plumbers, electricians, tailors and more —
            right in your neighbourhood. No guesswork. No risk.
          </p>

          {/* Search bar */}
          <HeroSearch />
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-neutral-900 -mt-1">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-[24px] md:text-[28px] font-medium text-secondary-base leading-tight">
                  {stat.value}
                </p>
                <p className="text-caption text-neutral-0/90 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BROWSE BY SERVICE ─── */}
      <section className="py-16 md:py-20 bg-surface-bg">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-heading text-neutral-900 mb-2">Browse by service</h2>
          <p className="text-small text-neutral-500 mb-10">
            Find the right professional for any job around the home or business.
          </p>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/search?tradeCategory=${cat.name}`}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-16 h-16 rounded-full bg-primary-tint text-primary-base flex items-center justify-center group-hover:bg-primary-base group-hover:text-neutral-0 transition-all duration-200">
                  {cat.icon}
                </div>
                <span className="text-small text-neutral-700 group-hover:text-primary-base transition-colors font-medium">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW SABIPRO WORKS ─── */}
      <section id="how-it-works" className="py-16 md:py-20 bg-neutral-0">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-heading text-neutral-900 mb-2">How SabiPro works</h2>
          <p className="text-small text-neutral-500 mb-12">
            Getting trusted help has never been simpler. Here is what to expect.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary-base/10 text-secondary-base flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-subhead text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-small text-neutral-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TOP RATED PROVIDERS ─── */}
      <section id="top-providers" className="py-16 md:py-20 bg-surface-bg">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-heading text-neutral-900 mb-2">Top rated providers</h2>
              <p className="text-small text-neutral-500">
                Community-verified. Highly reviewed. Ready to work.
              </p>
            </div>
            <Link
              href="/login"
              className="hidden md:inline-flex items-center gap-1 text-small font-medium text-secondary-base hover:text-secondary-hover transition-colors"
            >
              See all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topProviders.map((provider) => (
              <div
                key={provider.name}
                className="bg-neutral-0 border border-surface-border rounded-card p-5 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-tint text-primary-deep flex items-center justify-center text-body font-medium shrink-0">
                    {provider.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-body font-medium text-neutral-900 truncate">
                        {provider.name}
                      </h3>
                      {provider.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-base bg-primary-tint px-2 py-0.5 rounded-pill shrink-0">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Stars count={Math.round(provider.rating)} />
                      <span className="text-caption text-neutral-700 font-medium">{provider.rating}</span>
                      <span className="text-caption text-neutral-500">({provider.reviews})</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-small text-neutral-500 mb-4 line-clamp-3 leading-relaxed">
                  {provider.bio}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                  <span className="text-caption font-medium text-neutral-900">{provider.priceRange}</span>
                  <span className="inline-flex items-center text-caption font-medium text-secondary-deep bg-secondary-tint px-2.5 py-1 rounded-pill">
                    {provider.trade}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile "See all" */}
          <div className="mt-6 md:hidden text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-small font-medium text-secondary-base hover:text-secondary-hover transition-colors"
            >
              See all providers
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── WHY SABIPRO ─── */}
      <section className="py-16 md:py-20 bg-primary-base text-neutral-0">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-heading mb-2">Why SabiPro?</h2>
          <p className="text-small text-neutral-0/70 mb-12">
            Built to give Nigerians a reliable hire, and a fair work life.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whySabiPro.map((item, i) => (
              <div key={i} className="bg-neutral-0/5 border border-neutral-0/10 rounded-card p-6 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-secondary-base/20 text-secondary-base flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-subhead mb-2">{item.title}</h3>
                <p className="text-small text-neutral-0/70 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-16 md:py-20 bg-surface-bg">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-heading text-neutral-900 mb-2">What people are saying</h2>
          <p className="text-small text-neutral-500 mb-12">
            Hear from real users across Lagos and Abuja.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-neutral-0 border border-surface-border rounded-card p-6 hover:shadow-md transition-shadow"
              >
                <Stars count={t.rating} />
                <p className="text-small text-neutral-700 mt-4 mb-6 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-tint text-primary-deep flex items-center justify-center text-caption font-medium">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-small font-medium text-neutral-900">{t.name}</p>
                    <p className="text-caption text-neutral-500">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROVIDER CTA ─── */}
      <section className="py-12 md:py-16 bg-surface-bg">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-primary-base rounded-card p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-heading text-neutral-0 mb-2">Are you a skilled tradesperson?</h2>
              <p className="text-small text-neutral-0/70">
                Join 3,400+ providers earning more with a verified SabiPro profile.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/register">
                <Button className="!bg-secondary-base hover:!bg-secondary-hover !text-neutral-900 !rounded-pill !px-6">
                  Join as Provider
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="!text-neutral-0 border border-neutral-0/30 hover:!bg-neutral-0/10 !rounded-pill !px-6">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
