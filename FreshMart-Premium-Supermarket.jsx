import { useState, useEffect, useRef } from "react";

import { DEFAULT_PRODUCTS, CATEGORIES } from "./store-data.js";

const COLORS = {
  primary: "#1a7a3c",
  primaryDark: "#145f2e",
  primaryLight: "#e8f5ed",
  accent: "#ff6b35",
  accentLight: "#fff3ee",
  gold: "#f5a623",
  bg: "#f9fafb",
  card: "#ffffff",
  text: "#1a1a2e",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
};

const buildProfile = (data = {}) => ({
  name: data.name || "",
  email: data.email || "",
  phone: data.phone || "",
  address: data.address || "",
  city: data.city || "Chennai",
  pincode: data.pincode || "",
});

const apiRequest = async (path, options = {}) => {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
};

const TESTIMONIALS = [
  { name:"Priya Sharma", location:"Chennai", avatar:"PS", text:"FreshMart has completely transformed my grocery shopping. The produce is always fresh and delivery is always on time. Absolutely love the organic section!", rating:5 },
  { name:"Rajesh Kumar", location:"Bangalore", avatar:"RK", text:"Amazing quality products at competitive prices. The app is super easy to use and the customer service is outstanding. Highly recommend to everyone!", rating:5 },
  { name:"Anitha Nair", location:"Hyderabad", avatar:"AN", text:"Best online supermarket I've used. The special deals section saves me money every week. The dairy products are especially fresh and delicious.", rating:4 },
];

const FONT = "'Sora', 'Nunito', sans-serif";
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";
const CUSTOM_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="12" cy="12" r="8" fill="#1a7a3c"/><circle cx="12" cy="12" r="3" fill="#ffffff"/><path d="M18 18 L26 26" stroke="#ff6b35" stroke-width="3" stroke-linecap="round"/></svg>`)}") 12 12, auto`;
const CUSTOM_CURSOR_ACTIVE = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><circle cx="14" cy="14" r="9" fill="#ff6b35"/><circle cx="14" cy="14" r="3.5" fill="#ffffff"/><path d="M20 20 L30 30" stroke="#1a7a3c" stroke-width="3.5" stroke-linecap="round"/></svg>`)}") 14 14, pointer`;

const formatPaymentLabel = (payment) => {
  if (payment === "razorpay") return "Paid Online";
  if (payment === "cod") return "Cash on Delivery";
  return String(payment || "").toUpperCase();
};

const isImageAsset = (value = "") => {
  const image = String(value || "").trim();
  return image.startsWith("data:image/") || image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/");
};

function ProductVisual({ image, name, size = 72, radius = 18, background = COLORS.primaryLight, fontSize = Math.max(24, Math.round(size * 0.45)) }) {
  if (isImageAsset(image)) {
    return (
      <img
        src={image}
        alt={name || "Product"}
        style={{
          width:size,
          height:size,
          objectFit:"cover",
          borderRadius:radius,
          display:"block",
          background:"#fff",
        }}
      />
    );
  }

  return (
    <div style={{
      width:size,
      height:size,
      background,
      borderRadius:radius,
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      fontSize,
      flexShrink:0,
    }}>
      {image || "🛒"}
    </div>
  );
}

function useIsMobile(breakpoint = 768) {
  const getMatches = () => (typeof window !== "undefined" ? window.innerWidth <= breakpoint : false);
  const [isMobile, setIsMobile] = useState(getMatches);

  useEffect(() => {
    const handleResize = () => setIsMobile(getMatches());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const existingScript = document.querySelector('script[data-razorpay-checkout="true"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Razorpay), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });

function StarRating({ rating, size = 14 }) {
  return (
    <div style={{ display:"flex", gap:2, alignItems:"center" }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.floor(rating) ? COLORS.gold : (s - 0.5 <= rating ? COLORS.gold : "#e5e7eb")} style={{ opacity: s - 0.5 <= rating ? 1 : 0.4 }}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      <span style={{ fontSize:12, color:COLORS.textMuted, marginLeft:4, fontFamily:FONT }}>{rating}</span>
    </div>
  );
}

function Badge({ children, color = COLORS.accent, bg }) {
  return (
    <span style={{
      background: bg || color + "22",
      color,
      fontSize:11,
      fontWeight:700,
      padding:"3px 8px",
      borderRadius:20,
      fontFamily:FONT,
      letterSpacing:"0.3px",
      display:"inline-block",
    }}>{children}</span>
  );
}

function ProductCard({ product, onAddToCart, onToggleWishlist, wishlist, onView }) {
  const [hover, setHover] = useState(false);
  const inWishlist = wishlist.includes(product.id);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onView(product)}
      style={{
        background: COLORS.card,
        borderRadius:20,
        border: `1.5px solid ${hover ? COLORS.primary+"40" : COLORS.border}`,
        overflow:"hidden",
        cursor:"pointer",
        transition:"all 0.28s cubic-bezier(0.4,0,0.2,1)",
        transform: hover ? "translateY(-6px) scale(1.01)" : "none",
        boxShadow: hover ? "0 20px 60px rgba(26,122,60,0.15)" : "0 2px 12px rgba(0,0,0,0.04)",
        position:"relative",
      }}
    >
      {product.discount > 0 && (
        <div style={{ position:"absolute", top:12, left:12, zIndex:2 }}>
          <Badge color="#fff" bg={COLORS.accent}>-{product.discount}%</Badge>
        </div>
      )}
      {product.isNew && (
        <div style={{ position:"absolute", top:12, right:44, zIndex:2 }}>
          <Badge color="#fff" bg={COLORS.primary}>NEW</Badge>
        </div>
      )}
      <button
        onClick={e => { e.stopPropagation(); onToggleWishlist(product.id); }}
        style={{
          position:"absolute", top:10, right:10, zIndex:2,
          background: inWishlist ? "#fff0f3" : "rgba(255,255,255,0.9)",
          border:`1px solid ${inWishlist ? "#ff4d6d44" : "#e5e7eb"}`,
          borderRadius:"50%", width:34, height:34, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.2s", fontSize:16,
        }}
      >
        {inWishlist ? "❤️" : "🤍"}
      </button>
      <div style={{
        background:`linear-gradient(135deg, ${product.category === "Fruits" ? "#fff5f5" : product.category === "Vegetables" ? "#f0fff4" : product.category === "Dairy" ? "#f0f8ff" : product.category === "Rice" ? "#fffbf0" : product.category === "Snacks" ? "#fff8f0" : "#fdf4ff"}, #f9fafb)`,
        height:160, display:"flex", alignItems:"center", justifyContent:"center",
        transition:"transform 0.3s",
        transform: hover ? "scale(1.12)" : "scale(1)",
      }}>
        <ProductVisual image={product.image} name={product.name} size={112} radius={24} background="transparent" fontSize={72} />
      </div>
      <div style={{ padding:"14px 16px 16px" }}>
        <p style={{ fontSize:11, color:COLORS.textMuted, fontFamily:FONT, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.8px" }}>{product.category}</p>
        <h3 style={{ margin:"0 0 8px", fontSize:14, fontWeight:700, fontFamily:FONT, color:COLORS.text, lineHeight:1.3 }}>{product.name}</h3>
        <p style={{ margin:"0 0 8px", fontSize:12, color:COLORS.textMuted, fontFamily:FONT }}>{product.unit}</p>
        <StarRating rating={product.rating} />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12 }}>
          <div>
            <span style={{ fontSize:18, fontWeight:800, color:COLORS.primary, fontFamily:FONT }}>₹{product.price}</span>
            {product.originalPrice > product.price && (
              <span style={{ fontSize:13, color:COLORS.textMuted, textDecoration:"line-through", marginLeft:6, fontFamily:FONT }}>₹{product.originalPrice}</span>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onAddToCart(product); }}
            style={{
              background: hover ? COLORS.primary : COLORS.primaryLight,
              color: hover ? "#fff" : COLORS.primary,
              border:"none", borderRadius:12, padding:"8px 14px",
              fontSize:12, fontWeight:700, cursor:"pointer",
              transition:"all 0.2s", fontFamily:FONT,
              display:"flex", alignItems:"center", gap:4,
            }}
          >
            + Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function Navbar({ page, setPage, cartCount, wishlistCount, darkMode, setDarkMode, searchQuery, setSearchQuery, isLoggedIn, currentUser, adminUser, onOpenAdmin, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label:"Home", key:"home" },
    { label:"Products", key:"products" },
    { label:"Contact", key:"contact" },
  ];

  const handleNavigate = (nextPage) => {
    setMenuOpen(false);
    setPage(nextPage);
  };

  const handleSearchSubmit = () => {
    setMenuOpen(false);
    setPage("products");
  };

  return (
    <nav style={{
      position:"sticky", top:0, zIndex:1000,
      background: darkMode ? "rgba(15,20,30,0.97)" : "rgba(255,255,255,0.97)",
      backdropFilter:"blur(20px)",
      borderBottom: `1px solid ${darkMode ? "#ffffff15" : COLORS.border}`,
      boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.08)" : "none",
      transition:"all 0.3s",
      fontFamily:FONT,
    }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:isMobile ? "12px 16px" : "0 24px", minHeight:68, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:isMobile ? "wrap" : "nowrap", gap:isMobile ? 12 : 0 }}>
        <div onClick={() => setPage("home")} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
          <div style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, borderRadius:12, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🛒</div>
          <div>
            <span style={{ fontSize:20, fontWeight:900, color: darkMode ? "#fff" : COLORS.primary, letterSpacing:"-0.5px" }}>Fresh</span>
            <span style={{ fontSize:20, fontWeight:900, color:COLORS.accent }}>Mart</span>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, flex:isMobile ? "1 1 100%" : 1, maxWidth:isMobile ? "100%" : 360, margin:isMobile ? "0" : "0 32px", order:isMobile ? 3 : 0, width:isMobile ? "100%" : "auto" }}>
          <div style={{ position:"relative", flex:1 }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearchSubmit()}
              placeholder="Search products..."
              style={{
                width:"100%", padding:"9px 16px",
                border:`1.5px solid ${COLORS.border}`, borderRadius:24,
                fontSize:13, fontFamily:FONT, outline:"none",
                background: darkMode ? "#1e2535" : "#f9fafb",
                color: darkMode ? "#fff" : COLORS.text,
                boxSizing:"border-box",
              }}
            />
          </div>
          <button
            onClick={handleSearchSubmit}
            style={{
              background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              color:"#fff",
              border:"none",
              borderRadius:24,
              padding:"9px 14px",
              fontSize:13,
              fontWeight:800,
              fontFamily:FONT,
              whiteSpace:"nowrap",
              display:"flex",
              alignItems:"center",
              gap:8,
            }}
          >
            <span style={{ fontSize:15, lineHeight:1 }}>🔍</span>
            <span>Search</span>
          </button>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, position:"relative", flexWrap:isMobile ? "wrap" : "nowrap", justifyContent:isMobile ? "flex-end" : "flex-start", width:isMobile ? "100%" : "auto" }}>
          {navLinks.map(l => (
            <button key={l.key} onClick={() => handleNavigate(l.key)}
              style={{
                border:"none", cursor:"pointer", padding:"8px 14px",
                fontSize:13, fontWeight:600, fontFamily:FONT,
                color: page === l.key ? COLORS.primary : (darkMode ? "#e0e0e0" : COLORS.textMuted),
                borderRadius:10,
                background: page === l.key ? COLORS.primaryLight : "transparent",
                transition:"all 0.2s",
                display:isMobile ? "none" : "inline-flex",
              }}
            >{l.label}</button>
          ))}
          <button onClick={() => setDarkMode(!darkMode)}
            style={{ background:"none", border:`1px solid ${COLORS.border}`, borderRadius:10, width:38, height:38, cursor:"pointer", fontSize:17, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={() => handleNavigate("wishlist")} style={{ background:"none", border:`1px solid ${COLORS.border}`, borderRadius:10, width:38, height:38, cursor:"pointer", fontSize:17, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
            ❤️
            {wishlistCount > 0 && <span style={{ position:"absolute", top:-4, right:-4, background:COLORS.danger, color:"#fff", borderRadius:"50%", width:17, height:17, fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}>{wishlistCount}</span>}
          </button>
          <button onClick={() => handleNavigate("cart")}
            style={{
              background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              border:"none", borderRadius:12, padding:"8px 18px", cursor:"pointer",
              color:"#fff", fontWeight:700, fontFamily:FONT, fontSize:13,
              display:"flex", alignItems:"center", gap:8, position:"relative",
              boxShadow:"0 4px 14px rgba(26,122,60,0.3)",
            }}>
            🛒 Cart
            {cartCount > 0 && <span style={{ background:COLORS.accent, borderRadius:20, padding:"1px 7px", fontSize:11, fontWeight:800 }}>{cartCount}</span>}
          </button>
          <button
            onClick={onOpenAdmin}
            style={{
              background: adminUser ? "#ecfdf3" : "none",
              border:`1px solid ${adminUser ? "#86efac" : COLORS.border}`, borderRadius:12,
              padding:"8px 14px", cursor:"pointer", fontSize:13, fontWeight:700,
              fontFamily:FONT, color: adminUser ? "#166534" : (darkMode ? "#fff" : COLORS.text),
            }}
          >
            {adminUser ? "Owner Access" : "Admin Access"}
          </button>
          {isLoggedIn ? (
            <div style={{ position:"relative" }}>
              <button
                onClick={() => setMenuOpen(open => !open)}
                style={{
                  background: menuOpen ? COLORS.primaryLight : "transparent",
                  border:`1px solid ${COLORS.border}`, borderRadius:14, padding:"8px 12px",
                  cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:FONT,
                  color: menuOpen ? COLORS.primary : (darkMode ? "#fff" : COLORS.text),
                  display:"flex", alignItems:"center", gap:8, maxWidth:140,
                }}
              >
                <span style={{
                  width:28, height:28, borderRadius:10,
                  background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                  color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, fontWeight:800, flexShrink:0,
                }}>
                  {(currentUser?.name || "U").trim().slice(0, 1).toUpperCase()}
                </span>
                <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {currentUser?.name?.split(" ")[0] || "Account"}
                </span>
                <span style={{ fontSize:10 }}>{menuOpen ? "▲" : "▼"}</span>
              </button>
              {menuOpen && (
                <div style={{
                  position:"absolute", top:"calc(100% + 10px)", right:0, width:220,
                  background: darkMode ? "#1a2035" : "#ffffff",
                  border:`1px solid ${darkMode ? "#ffffff15" : COLORS.border}`,
                  borderRadius:18, padding:10, boxShadow:"0 20px 50px rgba(0,0,0,0.12)",
                }}>
                  <div style={{ padding:"10px 12px 12px", borderBottom:`1px solid ${darkMode ? "#ffffff15" : COLORS.border}`, marginBottom:8 }}>
                    <div style={{ fontSize:14, fontWeight:800, color: darkMode ? "#fff" : COLORS.text }}>
                      {currentUser?.name || "FreshMart User"}
                    </div>
                    <div style={{ fontSize:12, color:COLORS.textMuted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis" }}>
                      {currentUser?.email || ""}
                    </div>
                  </div>
                  {[
                    ["👤", "Profile", "profile"],
                    ["📦", "Orders", "orders"],
                  ].map(([icon, label, key]) => (
                    <button
                      key={key}
                      onClick={() => handleNavigate(key)}
                      style={{
                        width:"100%", background: page === key ? COLORS.primaryLight : "transparent",
                        border:"none", borderRadius:12, padding:"11px 12px", cursor:"pointer",
                        fontSize:13, fontWeight:700, fontFamily:FONT,
                        color: page === key ? COLORS.primary : (darkMode ? "#fff" : COLORS.text),
                        display:"flex", alignItems:"center", gap:10, textAlign:"left",
                      }}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => { setMenuOpen(false); onLogout(); }}
                    style={{
                      width:"100%", background:"#fff1f2", border:"none", borderRadius:12,
                      padding:"11px 12px", cursor:"pointer", fontSize:13, fontWeight:700,
                      fontFamily:FONT, color:"#be123c", display:"flex", alignItems:"center",
                      gap:10, textAlign:"left", marginTop:8,
                    }}
                  >
                    <span>↩</span>
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNavigate("login")}
              style={{
                background:"none", border:`1px solid ${COLORS.border}`, borderRadius:12,
                padding:"8px 14px", cursor:"pointer", fontSize:13, fontWeight:700,
                fontFamily:FONT, color: darkMode ? "#fff" : COLORS.text,
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function HomePage({ setPage, onAddToCart, onToggleWishlist, wishlist, darkMode, setSelectedProduct, products }) {
  const [heroIndex, setHeroIndex] = useState(0);
  const isMobile = useIsMobile();
  const [footerMessage, setFooterMessage] = useState("");
  const heroSlides = [
    { title:"Fresh Organics, Delivered Fast", subtitle:"Farm to table in under 2 hours", cta:"Shop Now", bg:"linear-gradient(135deg, #e8f5ed 0%, #c8e6c9 50%, #a5d6a7 100%)", emoji:"🥗", badge:"UP TO 30% OFF" },
    { title:"Premium Dairy & Farm Products", subtitle:"Pure, natural, and ethically sourced", cta:"Explore Dairy", bg:"linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)", emoji:"🥛", badge:"NEW ARRIVALS" },
    { title:"Exotic Fruits Collection", subtitle:"Seasonal picks from the finest farms", cta:"Browse Fruits", bg:"linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%)", emoji:"🍇", badge:"SEASONAL SPECIAL" },
  ];

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i+1)%3), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!footerMessage) return undefined;
    const timer = window.setTimeout(() => setFooterMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [footerMessage]);

  const handleFooterLink = (pageKey, fallbackMessage) => {
    if (pageKey) {
      setPage(pageKey);
      return;
    }
    setFooterMessage(fallbackMessage || "This section is coming soon.");
  };

  const featuredProducts = products.filter(p => p.featured);

  return (
    <div style={{ fontFamily:FONT }}>
      {/* Hero Banner */}
      <div style={{
        background: heroSlides[heroIndex].bg,
        borderRadius:"0 0 40px 40px",
        padding:isMobile ? "48px 20px" : "80px 48px",
        maxWidth:"100%",
        overflow:"hidden",
        position:"relative",
        transition:"background 0.8s ease",
      }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexDirection:isMobile ? "column" : "row", textAlign:isMobile ? "center" : "left", gap:isMobile ? 28 : 0 }}>
          <div style={{ flex:1 }}>
            <Badge color={COLORS.accent} bg={COLORS.accentLight} style={{ marginBottom:16 }}>{heroSlides[heroIndex].badge}</Badge>
            <h1 style={{
              fontSize:"clamp(32px, 4vw, 56px)", fontWeight:900, color:COLORS.text,
              margin:"16px 0 16px", lineHeight:1.1, letterSpacing:"-1px",
            }}>
              {heroSlides[heroIndex].title}
            </h1>
            <p style={{ fontSize:18, color:COLORS.textMuted, margin:"0 0 32px" }}>{heroSlides[heroIndex].subtitle}</p>
            <div style={{ display:"flex", gap:16, flexDirection:isMobile ? "column" : "row" }}>
              <button onClick={() => setPage("products")} style={{
                background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                color:"#fff", border:"none", borderRadius:16, padding:"16px 36px",
                fontSize:16, fontWeight:800, cursor:"pointer",
                boxShadow:`0 8px 24px ${COLORS.primary}44`,
                transition:"transform 0.2s",
              }}>{heroSlides[heroIndex].cta} →</button>
              <button onClick={() => setPage("products")} style={{
                background:"rgba(255,255,255,0.8)", color:COLORS.text,
                border:`2px solid ${COLORS.border}`, borderRadius:16, padding:"16px 28px",
                fontSize:16, fontWeight:700, cursor:"pointer",
                backdropFilter:"blur(10px)",
              }}>View Deals</button>
            </div>
            <div style={{ display:"flex", gap:32, marginTop:40, justifyContent:isMobile ? "center" : "flex-start", flexWrap:"wrap" }}>
              {[["5000+","Products"],["2hr","Delivery"],["4.9★","Rating"]].map(([v,l]) => (
                <div key={l}>
                  <div style={{ fontSize:24, fontWeight:900, color:COLORS.primary }}>{v}</div>
                  <div style={{ fontSize:13, color:COLORS.textMuted }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize:isMobile ? 112 : 160, lineHeight:1, transition:"all 0.5s" }}>
            {heroSlides[heroIndex].emoji}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:32 }}>
          {[0,1,2].map(i => (
            <div key={i} onClick={() => setHeroIndex(i)} style={{
              width: i === heroIndex ? 28 : 10, height:10,
              borderRadius:20, cursor:"pointer",
              background: i === heroIndex ? COLORS.primary : COLORS.primary+"44",
              transition:"all 0.3s",
            }}/>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>
        {/* Categories */}
        <div style={{ margin:"60px 0 40px" }}>
          <h2 style={{ fontSize:32, fontWeight:900, color:COLORS.text, margin:"0 0 8px", letterSpacing:"-0.5px" }}>Shop by Category</h2>
          <p style={{ color:COLORS.textMuted, margin:"0 0 32px", fontSize:16 }}>Find exactly what you need</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:16 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.name} onClick={() => setPage("products")} style={{
                background: cat.bg, borderRadius:20, padding:"28px 20px",
                textAlign:"center", cursor:"pointer",
                border:"2px solid transparent",
                transition:"all 0.25s",
                boxShadow:"0 2px 12px rgba(0,0,0,0.04)",
              }}
                onMouseEnter={e => { e.currentTarget.style.border=`2px solid ${cat.color}44`; e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 12px 30px ${cat.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.border="2px solid transparent"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.04)"; }}
              >
                <div style={{ fontSize:44, marginBottom:10 }}>{cat.icon}</div>
                <div style={{ fontWeight:700, fontSize:15, color:COLORS.text }}>{cat.name}</div>
                <div style={{ fontSize:12, color:COLORS.textMuted, marginTop:4 }}>{cat.count} items</div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div style={{ margin:"60px 0" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
            <div>
              <h2 style={{ fontSize:32, fontWeight:900, color:COLORS.text, margin:"0 0 6px", letterSpacing:"-0.5px" }}>Featured Products</h2>
              <p style={{ color:COLORS.textMuted, margin:0, fontSize:16 }}>Hand-picked favourites for you</p>
            </div>
            <button onClick={() => setPage("products")} style={{ background:COLORS.primaryLight, color:COLORS.primary, border:"none", borderRadius:12, padding:"10px 24px", fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:FONT }}>See All →</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(230px, 1fr))", gap:20 }}>
            {featuredProducts.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} wishlist={wishlist} onView={setSelectedProduct} />
            ))}
          </div>
        </div>

        {/* Special Deals Banner */}
        <div style={{
          background:`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
          borderRadius:32, padding:"48px", color:"#fff", marginBottom:60,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          overflow:"hidden", position:"relative",
        }}>
          <div style={{ position:"absolute", right:100, top:-40, fontSize:180, opacity:0.07 }}>🛒</div>
          <div>
            <Badge color={COLORS.gold} bg={COLORS.gold+"33"}>LIMITED TIME OFFER</Badge>
            <h2 style={{ fontSize:36, fontWeight:900, margin:"12px 0", letterSpacing:"-0.5px" }}>Get 25% Off Your First Order!</h2>
            <p style={{ opacity:0.85, fontSize:17, margin:"0 0 24px" }}>Use code <strong>FRESHSTART25</strong> at checkout</p>
            <button onClick={() => setPage("products")} style={{
              background:COLORS.accent, color:"#fff", border:"none", borderRadius:14,
              padding:"14px 32px", fontSize:16, fontWeight:800, cursor:"pointer",
              boxShadow:"0 8px 24px rgba(255,107,53,0.4)",
            }}>Claim Offer Now →</button>
          </div>
          <div style={{ fontSize:100, opacity:0.9 }}>🎁</div>
        </div>

        {/* Testimonials */}
        <div style={{ margin:"0 0 60px" }}>
          <h2 style={{ fontSize:32, fontWeight:900, color:COLORS.text, margin:"0 0 8px", letterSpacing:"-0.5px", textAlign:"center" }}>What Our Customers Say</h2>
          <p style={{ color:COLORS.textMuted, textAlign:"center", margin:"0 0 40px", fontSize:16 }}>Real reviews from real customers</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:24 }}>
            {TESTIMONIALS.map((t,i) => (
              <div key={i} style={{
                background:COLORS.card, borderRadius:24, padding:28,
                border:`1px solid ${COLORS.border}`,
                boxShadow:"0 4px 24px rgba(0,0,0,0.06)",
              }}>
                <div style={{ display:"flex", gap:4, marginBottom:16 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color:s<=t.rating?COLORS.gold:"#e5e7eb", fontSize:18 }}>★</span>)}
                </div>
                <p style={{ color:COLORS.text, lineHeight:1.7, fontStyle:"italic", margin:"0 0 20px", fontSize:15 }}>"{t.text}"</p>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{
                    width:44, height:44, borderRadius:"50%",
                    background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontWeight:800, fontSize:14,
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:COLORS.text }}>{t.name}</div>
                    <div style={{ fontSize:12, color:COLORS.textMuted }}>{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div style={{
          background:`linear-gradient(135deg, #fff8f0, ${COLORS.accentLight})`,
          borderRadius:32, padding:"48px", textAlign:"center",
          border:`2px dashed ${COLORS.accent}44`, marginBottom:60,
        }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📧</div>
          <h2 style={{ fontSize:30, fontWeight:900, color:COLORS.text, margin:"0 0 8px" }}>Stay Fresh with Our Newsletter</h2>
          <p style={{ color:COLORS.textMuted, margin:"0 0 28px", fontSize:16 }}>Get weekly deals, recipes, and new arrivals in your inbox</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", maxWidth:480, margin:"0 auto" }}>
            <input placeholder="Enter your email address..." style={{
              flex:1, padding:"14px 20px", borderRadius:14, border:`1.5px solid ${COLORS.border}`,
              fontSize:14, fontFamily:FONT, outline:"none",
            }}/>
            <button style={{
              background:`linear-gradient(135deg, ${COLORS.accent}, #e55a2b)`,
              color:"#fff", border:"none", borderRadius:14, padding:"14px 24px",
              fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:FONT,
              whiteSpace:"nowrap", boxShadow:"0 6px 20px rgba(255,107,53,0.35)",
            }}>Subscribe →</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: darkMode ? "#0f141e" : "#1a1a2e", color:"#e0e0e0", padding:"48px 24px 24px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          {footerMessage && (
            <div style={{ marginBottom:20, background:"rgba(219,234,254,0.14)", border:"1px solid rgba(191,219,254,0.35)", color:"#bfdbfe", borderRadius:14, padding:"12px 14px", fontSize:14, fontWeight:700 }}>
              {footerMessage}
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:40, marginBottom:40 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🛒</div>
                <span style={{ fontSize:22, fontWeight:900 }}><span style={{ color:COLORS.primary }}>Fresh</span><span style={{ color:COLORS.accent }}>Mart</span></span>
              </div>
              <p style={{ color:"#9ca3af", lineHeight:1.7, fontSize:14 }}>Chennai's premium supermarket. Fresh produce, fast delivery, exceptional quality.</p>
              <div style={{ display:"flex", gap:12, marginTop:16 }}>
                {["📘","🐦","📸","▶️"].map((ic,i) => (
                  <div key={i} style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16 }}>{ic}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontWeight:800, marginBottom:16, fontSize:16 }}>Quick Links</h4>
              {[
                { label:"Home", page:"home" },
                { label:"Products", page:"products" },
                { label:"Contact", page:"contact" },
                { label:"Wishlist", page:"wishlist" },
                { label:"Cart", page:"cart" },
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleFooterLink(link.page)}
                  style={{ background:"none", border:"none", padding:"6px 0", color:"#9ca3af", marginBottom:6, cursor:"pointer", fontSize:14, fontFamily:FONT, textAlign:"left", display:"block" }}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div>
              <h4 style={{ fontWeight:800, marginBottom:16, fontSize:16 }}>Categories</h4>
              {CATEGORIES.map(c => (
                <button
                  key={c.name}
                  onClick={() => setPage("products")}
                  style={{ background:"none", border:"none", padding:"6px 0", color:"#9ca3af", marginBottom:6, cursor:"pointer", fontSize:14, fontFamily:FONT, textAlign:"left", display:"block" }}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
            <div>
              <h4 style={{ fontWeight:800, marginBottom:16, fontSize:16 }}>Contact Us</h4>
              <div style={{ color:"#9ca3af", fontSize:14, lineHeight:2 }}>
                <div>📍 E.B. Avenue, Sirukaverripakkam, Kanchipuram</div>
                <div>📞 +91 9363879477</div>
                <div>✉️ hello@freshmart.in</div>
                <div>🕐 Mon–Sun: 7am – 10pm</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, color:"#6b7280", flexWrap:"wrap", gap:12 }}>
            <span>© 2026 FreshMart. All rights reserved.</span>
            <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
              {["Secure Payments", "Fast Delivery", "Fresh Guarantee"].map((label) => (
                <span key={label} style={{ color:"#6b7280" }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductsPage({ onAddToCart, onToggleWishlist, wishlist, initialSearch, setSelectedProduct, products }) {
  const [search, setSearch] = useState(initialSearch || "");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [priceRange, setPriceRange] = useState([0, 500]);

  useEffect(() => { setSearch(initialSearch || ""); }, [initialSearch]);

  let filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    return matchSearch && matchCat && matchPrice;
  });

  if (sort === "price-asc") filtered = [...filtered].sort((a,b) => a.price - b.price);
  else if (sort === "price-desc") filtered = [...filtered].sort((a,b) => b.price - a.price);
  else if (sort === "rating") filtered = [...filtered].sort((a,b) => b.rating - a.rating);
  else if (sort === "discount") filtered = [...filtered].sort((a,b) => b.discount - a.discount);

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px", fontFamily:FONT }}>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:36, fontWeight:900, color:COLORS.text, margin:"0 0 6px", letterSpacing:"-0.5px" }}>All Products</h1>
        <p style={{ color:COLORS.textMuted, margin:0 }}>{filtered.length} products found</p>
      </div>
      <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>
        {/* Sidebar */}
        <div style={{ width:240, flexShrink:0 }}>
          <div style={{ background:COLORS.card, borderRadius:20, padding:24, border:`1px solid ${COLORS.border}`, marginBottom:16 }}>
            <h3 style={{ margin:"0 0 16px", fontWeight:800, color:COLORS.text }}>Categories</h3>
            {["All", ...CATEGORIES.map(c => c.name)].map(cat => (
              <div key={cat} onClick={() => setCategory(cat)} style={{
                padding:"10px 14px", borderRadius:12, cursor:"pointer", marginBottom:4,
                background: category === cat ? COLORS.primaryLight : "transparent",
                color: category === cat ? COLORS.primary : COLORS.textMuted,
                fontWeight: category === cat ? 700 : 400, fontSize:14,
                transition:"all 0.2s",
              }}>
                {cat === "All" ? "🏪" : CATEGORIES.find(c=>c.name===cat)?.icon} {cat}
                <span style={{ float:"right", fontSize:12 }}>{cat === "All" ? products.length : products.filter(p=>p.category===cat).length}</span>
              </div>
            ))}
          </div>
          <div style={{ background:COLORS.card, borderRadius:20, padding:24, border:`1px solid ${COLORS.border}` }}>
            <h3 style={{ margin:"0 0 16px", fontWeight:800, color:COLORS.text }}>Price Range</h3>
            <div style={{ fontSize:13, color:COLORS.textMuted, marginBottom:8 }}>Up to ₹{priceRange[1]}</div>
            <input type="range" min={0} max={500} value={priceRange[1]} onChange={e => setPriceRange([0, Number(e.target.value)])}
              style={{ width:"100%", accentColor:COLORS.primary }} />
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:COLORS.textMuted, marginTop:4 }}>
              <span>₹0</span><span>₹500</span>
            </div>
          </div>
        </div>
        {/* Main */}
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
            <div style={{ position:"relative", flex:1, minWidth:200 }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                style={{ width:"100%", padding:"12px 16px 12px 38px", borderRadius:14, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}/>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding:"12px 16px", borderRadius:14, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", background:COLORS.card, cursor:"pointer" }}>
              <option value="default">Default Sorting</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Best Rating</option>
              <option value="discount">Best Discount</option>
            </select>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:COLORS.textMuted }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🔍</div>
              <p style={{ fontSize:18, fontWeight:600 }}>No products found</p>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(210px, 1fr))", gap:18 }}>
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} wishlist={wishlist} onView={setSelectedProduct} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductDetailPage({ product, onAddToCart, onToggleWishlist, wishlist, setSelectedProduct, products }) {
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const isMobile = useIsMobile();
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px", fontFamily:FONT }}>
      <button onClick={() => setSelectedProduct(null)} style={{ background:COLORS.primaryLight, color:COLORS.primary, border:"none", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontWeight:600, marginBottom:24, fontFamily:FONT }}>
        ← Back to Products
      </button>
      <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "1fr 1fr", gap:isMobile ? 24 : 48, marginBottom:48 }}>
        {/* Image */}
        <div style={{
          background:`linear-gradient(135deg, ${COLORS.primaryLight}, #f0fff4)`,
          borderRadius:28, display:"flex", alignItems:"center", justifyContent:"center",
          height:isMobile ? 300 : 420, position:"relative",
          border:`2px solid ${COLORS.border}`,
          cursor:"zoom-in",
        }}>
          <ProductVisual image={product.image} name={product.name} size={isMobile ? 220 : 320} radius={28} background="transparent" fontSize={isMobile ? 120 : 180} />
          {product.discount > 0 && (
            <div style={{ position:"absolute", top:20, left:20 }}>
              <Badge color="#fff" bg={COLORS.accent}>-{product.discount}% OFF</Badge>
            </div>
          )}
        </div>
        {/* Details */}
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <Badge color={COLORS.primary} bg={COLORS.primaryLight}>{product.category}</Badge>
            {product.isNew && <Badge color="#fff" bg={COLORS.success}>NEW</Badge>}
          </div>
          <h1 style={{ fontSize:32, fontWeight:900, color:COLORS.text, margin:"0 0 12px", letterSpacing:"-0.5px" }}>{product.name}</h1>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <StarRating rating={product.rating} size={18} />
            <span style={{ color:COLORS.textMuted, fontSize:14 }}>({product.reviews} reviews)</span>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:16, marginBottom:24 }}>
            <span style={{ fontSize:40, fontWeight:900, color:COLORS.primary }}>₹{product.price}</span>
            {product.originalPrice > product.price && (
              <span style={{ fontSize:22, color:COLORS.textMuted, textDecoration:"line-through" }}>₹{product.originalPrice}</span>
            )}
            {product.discount > 0 && (
              <span style={{ fontSize:14, color:COLORS.success, fontWeight:700 }}>You save ₹{product.originalPrice - product.price}</span>
            )}
          </div>
          <div style={{ background:COLORS.bg, borderRadius:16, padding:20, marginBottom:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ color:COLORS.textMuted, fontSize:14 }}>Unit</span>
              <span style={{ fontWeight:700, fontSize:14 }}>{product.unit}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ color:COLORS.textMuted, fontSize:14 }}>Availability</span>
              <span style={{ fontWeight:700, fontSize:14, color: product.stock > 10 ? COLORS.success : COLORS.warning }}>
                {product.stock > 10 ? `✓ In Stock (${product.stock} left)` : `⚠ Only ${product.stock} left!`}
              </span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:COLORS.textMuted, fontSize:14 }}>Delivery</span>
              <span style={{ fontWeight:700, fontSize:14, color:COLORS.primary }}>🚚 Within 2 hours</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:isMobile ? "stretch" : "center", gap:16, marginBottom:24, flexDirection:isMobile ? "column" : "row" }}>
            <span style={{ fontWeight:700, fontSize:14, color:COLORS.text }}>Quantity:</span>
            <div style={{ display:"flex", alignItems:"center", gap:0, border:`1.5px solid ${COLORS.border}`, borderRadius:14, overflow:"hidden" }}>
              <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ background:COLORS.bg, border:"none", width:44, height:44, cursor:"pointer", fontSize:20, fontWeight:700, fontFamily:FONT }}>−</button>
              <span style={{ width:44, textAlign:"center", fontWeight:800, fontSize:16, fontFamily:FONT }}>{qty}</span>
              <button onClick={() => setQty(q => q+1)} style={{ background:COLORS.bg, border:"none", width:44, height:44, cursor:"pointer", fontSize:20, fontWeight:700, fontFamily:FONT }}>+</button>
            </div>
            <span style={{ fontSize:13, color:COLORS.textMuted }}>Total: <strong style={{ color:COLORS.primary }}>₹{product.price * qty}</strong></span>
          </div>
          <div style={{ display:"flex", gap:12, flexDirection:isMobile ? "column" : "row" }}>
            <button onClick={() => { for(let i=0;i<qty;i++) onAddToCart(product); }}
              style={{
                flex:1, background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                color:"#fff", border:"none", borderRadius:16, padding:"16px",
                fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:FONT,
                boxShadow:`0 8px 24px ${COLORS.primary}44`,
              }}>
              🛒 Add to Cart
            </button>
            <button onClick={() => onToggleWishlist(product.id)} style={{
              width:54, height:54, border:`1.5px solid ${wishlist.includes(product.id) ? "#ff4d6d" : COLORS.border}`,
              borderRadius:16, background: wishlist.includes(product.id) ? "#fff0f3" : COLORS.card,
              cursor:"pointer", fontSize:22, display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {wishlist.includes(product.id) ? "❤️" : "🤍"}
            </button>
          </div>
          <div style={{ display:"flex", gap:16, marginTop:20, flexWrap:"wrap" }}>
            {["🔒 Secure Payment","🔄 Easy Returns","⭐ Premium Quality"].map(t => (
              <span key={t} style={{ fontSize:12, color:COLORS.textMuted }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom:48 }}>
        <div style={{ display:"flex", gap:0, borderBottom:`2px solid ${COLORS.border}`, marginBottom:24, overflowX:"auto" }}>
          {["description","reviews","shipping"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background:"none", border:"none", padding:"14px 24px", cursor:"pointer",
              fontWeight:700, fontSize:15, fontFamily:FONT,
              color: activeTab === tab ? COLORS.primary : COLORS.textMuted,
              borderBottom: activeTab === tab ? `3px solid ${COLORS.primary}` : "3px solid transparent",
              marginBottom:-2, textTransform:"capitalize",
              transition:"all 0.2s",
            }}>{tab}</button>
          ))}
        </div>
        {activeTab === "description" && (
          <div style={{ color:COLORS.text, lineHeight:1.8, fontSize:16 }}>
            <p>Premium quality {product.name.toLowerCase()} sourced directly from the finest farms. Our {product.category.toLowerCase()} products are carefully selected for freshness, taste, and nutritional value.</p>
            <p>Each {product.unit} package is hygienically packed and delivered fresh to your doorstep within hours of ordering. Perfect for daily cooking and healthy snacking.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:16, marginTop:24 }}>
              {[["🌿","100% Natural","No artificial additives"],["🌡️","Cold Chain","Temperature controlled"],["🏆","Quality Certified","FSSAI approved"],["♻️","Eco Packaged","Sustainable packaging"]].map(([ic,title,sub]) => (
                <div key={title} style={{ background:COLORS.bg, borderRadius:16, padding:16 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{ic}</div>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{title}</div>
                  <div style={{ fontSize:13, color:COLORS.textMuted }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "reviews" && (
          <div>
            {TESTIMONIALS.map((t,i) => (
              <div key={i} style={{ borderBottom:`1px solid ${COLORS.border}`, paddingBottom:20, marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{t.name}</div>
                    <div style={{ display:"flex", gap:2 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color:s<=t.rating?COLORS.gold:"#e5e7eb",fontSize:14 }}>★</span>)}</div>
                  </div>
                </div>
                <p style={{ color:COLORS.text, lineHeight:1.7, margin:0 }}>{t.text}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === "shipping" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:16 }}>
            {[["🚀","Express Delivery","Order before 6PM for same-day delivery within 2 hours"],["📦","Standard Delivery","Next day delivery available for all pin codes"],["🔄","Free Returns","Easy 7-day return policy for damaged items"],["💳","Secure Payment","SSL encrypted payment processing"]].map(([ic,t,d]) => (
              <div key={t} style={{ background:COLORS.bg, borderRadius:16, padding:20 }}>
                <div style={{ fontSize:32, marginBottom:10 }}>{ic}</div>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{t}</div>
                <div style={{ fontSize:13, color:COLORS.textMuted, lineHeight:1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related */}
      <div>
        <h2 style={{ fontSize:28, fontWeight:900, color:COLORS.text, margin:"0 0 24px", letterSpacing:"-0.5px" }}>Related Products</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(210px, 1fr))", gap:18 }}>
          {related.map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} wishlist={wishlist} onView={setSelectedProduct} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CartPage({ cart, setCart, setPage }) {
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const isMobile = useIsMobile();
  const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.25) : 0;
  const delivery = subtotal > 500 ? 0 : 49;
  const total = subtotal - discount + delivery;

  const updateQty = (id, delta) => setCart(c => c.map(i => i.id===id ? {...i, qty:Math.max(1,i.qty+delta)} : i));
  const remove = id => setCart(c => c.filter(i => i.id!==id));

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px", fontFamily:FONT }}>
      <h1 style={{ fontSize:36, fontWeight:900, color:COLORS.text, margin:"0 0 32px", letterSpacing:"-0.5px" }}>Your Cart 🛒</h1>
      {cart.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 0" }}>
          <div style={{ fontSize:100, marginBottom:24 }}>🛒</div>
          <h2 style={{ fontSize:28, fontWeight:900, color:COLORS.text, margin:"0 0 12px" }}>Your cart is empty</h2>
          <p style={{ color:COLORS.textMuted, marginBottom:28, fontSize:16 }}>Add some delicious products to get started!</p>
          <button onClick={() => setPage("products")} style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:16, padding:"16px 36px", fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:FONT }}>
            Browse Products →
          </button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "1fr 360px", gap:32, alignItems:"start" }}>
          <div>
            {cart.map(item => (
              <div key={item.id} style={{
                background:COLORS.card, borderRadius:20, padding:20, marginBottom:12,
                border:`1px solid ${COLORS.border}`, display:"flex", alignItems:isMobile ? "flex-start" : "center", gap:16,
                flexDirection:isMobile ? "column" : "row",
                transition:"all 0.2s",
              }}>
                <ProductVisual image={item.image} name={item.name} size={72} radius={14} background={COLORS.primaryLight} fontSize={40} />
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, color:COLORS.textMuted, margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.8px" }}>{item.category}</p>
                  <h3 style={{ margin:"0 0 4px", fontSize:16, fontWeight:700, color:COLORS.text }}>{item.name}</h3>
                  <p style={{ margin:0, fontSize:13, color:COLORS.textMuted }}>{item.unit} · ₹{item.price} each</p>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:0, border:`1.5px solid ${COLORS.border}`, borderRadius:12, overflow:"hidden" }}>
                  <button onClick={() => updateQty(item.id,-1)} style={{ background:COLORS.bg, border:"none", width:38, height:38, cursor:"pointer", fontSize:18, fontWeight:700 }}>−</button>
                  <span style={{ width:38, textAlign:"center", fontWeight:800, fontFamily:FONT }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id,1)} style={{ background:COLORS.bg, border:"none", width:38, height:38, cursor:"pointer", fontSize:18, fontWeight:700 }}>+</button>
                </div>
                <div style={{ minWidth:isMobile ? 0 : 70, textAlign:isMobile ? "left" : "right", width:isMobile ? "100%" : "auto" }}>
                  <div style={{ fontWeight:800, fontSize:17, color:COLORS.primary }}>₹{item.price * item.qty}</div>
                </div>
                <button onClick={() => remove(item.id)} style={{ background:"#fff0f0", border:"none", borderRadius:10, width:34, height:34, cursor:"pointer", color:COLORS.danger, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", alignSelf:isMobile ? "flex-end" : "center" }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ background:COLORS.card, borderRadius:24, padding:28, border:`1px solid ${COLORS.border}`, position:isMobile ? "static" : "sticky", top:90 }}>
            <h3 style={{ margin:"0 0 20px", fontSize:20, fontWeight:800, color:COLORS.text }}>Order Summary</h3>
            <div style={{ marginBottom:20 }}>
              <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code (FRESHSTART25)"
                style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:13, fontFamily:FONT, outline:"none", boxSizing:"border-box", marginBottom:8 }}/>
              <button onClick={() => { if(coupon==="FRESHSTART25") setCouponApplied(true); }}
                style={{ width:"100%", background:couponApplied ? COLORS.success : COLORS.primaryLight, color:couponApplied?"#fff":COLORS.primary, border:"none", borderRadius:12, padding:"10px", fontWeight:700, cursor:"pointer", fontFamily:FONT, fontSize:13 }}>
                {couponApplied ? "✓ Coupon Applied!" : "Apply Coupon"}
              </button>
            </div>
            {[["Subtotal", `₹${subtotal}`], ["Discount", couponApplied ? `-₹${discount}` : "–"], ["Delivery", delivery === 0 ? "FREE" : `₹${delivery}`]].map(([l,v]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ color:COLORS.textMuted, fontSize:15 }}>{l}</span>
                <span style={{ fontWeight:600, fontSize:15, color: l==="Discount" && couponApplied ? COLORS.success : COLORS.text }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop:`2px solid ${COLORS.border}`, paddingTop:16, marginTop:8, display:"flex", justifyContent:"space-between", marginBottom:24 }}>
              <span style={{ fontWeight:800, fontSize:18 }}>Total</span>
              <span style={{ fontWeight:900, fontSize:22, color:COLORS.primary }}>₹{total}</span>
            </div>
            {delivery === 0 && <p style={{ fontSize:12, color:COLORS.success, textAlign:"center", margin:"-16px 0 16px", fontWeight:600 }}>🎉 Free delivery on orders above ₹500!</p>}
            <button onClick={() => setPage("checkout")}
              style={{
                width:"100%", background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                color:"#fff", border:"none", borderRadius:16, padding:"16px",
                fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:FONT,
                boxShadow:`0 8px 24px ${COLORS.primary}44`,
              }}>
              Proceed to Checkout →
            </button>
            <button onClick={() => setPage("products")} style={{ width:"100%", background:"none", border:`1.5px solid ${COLORS.border}`, borderRadius:16, padding:"12px", marginTop:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:FONT, color:COLORS.textMuted }}>
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutPage({ cart, setCart, setPage, userProfile, onSaveProfile, onPlaceOrder }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    ...buildProfile(userProfile),
    delivery:"standard",
    payment:"cod",
  });
  const [confirmed, setConfirmed] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const isMobile = useIsMobile();
  const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const shippingFee = form.delivery === "express" ? 99 : subtotal > 500 ? 0 : 49;
  const total = subtotal + shippingFee;

  useEffect(() => {
    setForm(current => ({
      ...current,
      ...buildProfile(userProfile),
    }));
  }, [userProfile]);

  useEffect(() => {
    setPaymentError("");
  }, [form.payment, form.delivery, subtotal, cart.length]);

  const finalizeOrder = (order) => {
    setPlacedOrder(order || null);
    setConfirmed(true);
    setCart([]);
  };

  const placeCashOnDeliveryOrder = async () => {
    setPlacingOrder(true);
    setPaymentError("");
    try {
      await onSaveProfile?.(buildProfile(form));
      const order = await onPlaceOrder?.({
        items: cart,
        subtotal,
        shippingFee,
        total,
        payment: "cod",
        delivery: form.delivery,
        deliveryProfile: buildProfile(form),
      });
      finalizeOrder(order);
    } catch (requestError) {
      setPaymentError(requestError.message || "Unable to place the order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const placeRazorpayOrder = async () => {
    setRazorpayLoading(true);
    setPaymentError("");

    try {
      if (!RAZORPAY_KEY_ID) {
        throw new Error("Add VITE_RAZORPAY_KEY_ID to your frontend environment to accept online payments.");
      }

      await onSaveProfile?.(buildProfile(form));
      await loadRazorpayScript();

      const paymentOrder = await apiRequest("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({
          items: cart,
          delivery: form.delivery,
        }),
      });

      await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: paymentOrder.keyId || RAZORPAY_KEY_ID,
          amount: Math.round(total * 100),
          currency: paymentOrder.currency || "INR",
          name: "FreshMart",
          description: "Fresh grocery order",
          order_id: paymentOrder.orderId,
          prefill: {
            name: form.name || "",
            email: form.email || "",
            contact: form.phone || "",
          },
          notes: {
            address: `${form.address || ""}, ${form.city || ""} - ${form.pincode || ""}`.trim(),
          },
          theme: {
            color: COLORS.primary,
          },
          handler: async (response) => {
            try {
              const order = await onPlaceOrder?.({
                items: cart,
                subtotal,
                shippingFee,
                total,
                payment: "razorpay",
                paymentOrderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                paymentSignature: response.razorpay_signature,
                delivery: form.delivery,
                deliveryProfile: buildProfile(form),
              });
              finalizeOrder(order);
              resolve();
            } catch (requestError) {
              reject(requestError);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled.")),
          },
        });

        razorpay.on("payment.failed", (response) => {
          reject(new Error(response.error?.description || "Payment failed. Please try again."));
        });

        razorpay.open();
      });
    } catch (requestError) {
      setPaymentError(requestError.message || "Unable to start Razorpay checkout.");
    } finally {
      setRazorpayLoading(false);
    }
  };

  if (confirmed) return (
    <div style={{ maxWidth:600, margin:"60px auto", padding:"0 24px", textAlign:"center", fontFamily:FONT }}>
      <div style={{ background:COLORS.card, borderRadius:32, padding:"60px 48px", border:`2px solid ${COLORS.primary}44`, boxShadow:`0 20px 60px ${COLORS.primary}15` }}>
        <div style={{ fontSize:80, marginBottom:20 }}>🎉</div>
        <h1 style={{ fontSize:32, fontWeight:900, color:COLORS.primary, margin:"0 0 12px" }}>Order Confirmed!</h1>
        <p style={{ color:COLORS.textMuted, fontSize:17, margin:"0 0 24px", lineHeight:1.6 }}>Thank you for shopping with FreshMart! Your fresh groceries are being packed and will arrive soon.</p>
        <div style={{ background:COLORS.primaryLight, borderRadius:16, padding:20, marginBottom:24 }}>
          <div style={{ fontSize:24, fontWeight:900, color:COLORS.primary, marginBottom:4 }}>{placedOrder?.id || "Order saved"}</div>
          <div style={{ color:COLORS.textMuted, fontSize:14 }}>Track your order using this ID</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "1fr 1fr", gap:12, marginBottom:28 }}>
          {[["💳","Payment", placedOrder?.payment === "razorpay" ? "Paid Online" : "Pay On Delivery"],["📦","Packing","In Progress"],["🚚","Delivery", placedOrder?.delivery === "express" ? "~2 Hours" : "Next Day"],["⭐","Enjoy","Fresh Goods"]].map(([ic,t,s]) => (
            <div key={t} style={{ background:COLORS.bg, borderRadius:14, padding:16 }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{ic}</div>
              <div style={{ fontWeight:700, fontSize:14 }}>{t}</div>
              <div style={{ fontSize:12, color:COLORS.textMuted }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
          <button onClick={() => setPage("orders")} style={{ background:COLORS.primaryLight, color:COLORS.primary, border:"none", borderRadius:16, padding:"16px 28px", fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:FONT }}>
            View Order History
          </button>
          <button onClick={() => setPage("home")} style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:16, padding:"16px 36px", fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:FONT }}>
            Continue Shopping →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 24px", fontFamily:FONT }}>
      <h1 style={{ fontSize:36, fontWeight:900, color:COLORS.text, margin:"0 0 32px", letterSpacing:"-0.5px" }}>Checkout</h1>
      <div style={{ display:"flex", gap:8, marginBottom:32 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{
              width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
              background: step >= s ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` : COLORS.border,
              color: step >= s ? "#fff" : COLORS.textMuted, fontWeight:800, fontSize:15,
            }}>{s}</div>
            <span style={{ fontSize:14, fontWeight:600, color: step >= s ? COLORS.primary : COLORS.textMuted }}>
              {["Delivery Info","Payment","Confirm"][s-1]}
            </span>
            {s < 3 && <div style={{ width:40, height:2, background: step > s ? COLORS.primary : COLORS.border, borderRadius:2 }}/>}
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "1fr 340px", gap:32, alignItems:"start" }}>
        <div>
          {step === 1 && (
            <div style={{ background:COLORS.card, borderRadius:24, padding:28, border:`1px solid ${COLORS.border}` }}>
              <h2 style={{ margin:"0 0 24px", fontSize:22, fontWeight:800 }}>Delivery Information</h2>
              <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "1fr 1fr", gap:16, marginBottom:16 }}>
                {[["Full Name","name","text"],["Phone","phone","tel"],["Email","email","email"],["Pincode","pincode","text"]].map(([l,k,t]) => (
                  <div key={k}>
                    <label style={{ fontSize:13, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:6 }}>{l}</label>
                    <input type={t} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} placeholder={l}
                      style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}/>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:13, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Full Address</label>
                <textarea value={form.address} onChange={e => setForm({...form,address:e.target.value})} placeholder="Street, Area, Landmark..."
                  style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", resize:"vertical", minHeight:80, boxSizing:"border-box" }}/>
              </div>
              <h3 style={{ margin:"20px 0 14px", fontWeight:800 }}>Delivery Option</h3>
              <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "1fr 1fr", gap:12 }}>
                {[["standard","Standard Delivery","Next day · FREE above ₹500","🚚"],["express","Express Delivery","Within 2 hours · ₹99","⚡"]].map(([v,t,s,ic]) => (
                  <div key={v} onClick={() => setForm({...form,delivery:v})} style={{
                    border:`2px solid ${form.delivery===v ? COLORS.primary : COLORS.border}`,
                    borderRadius:14, padding:16, cursor:"pointer",
                    background: form.delivery===v ? COLORS.primaryLight : COLORS.card,
                    transition:"all 0.2s",
                  }}>
                    <div style={{ fontSize:24, marginBottom:6 }}>{ic}</div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{t}</div>
                    <div style={{ fontSize:12, color:COLORS.textMuted }}>{s}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(2)} style={{ width:"100%", background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:16, padding:"16px", marginTop:24, fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:FONT }}>
                Continue to Payment →
              </button>
            </div>
          )}
          {step === 2 && (
            <div style={{ background:COLORS.card, borderRadius:24, padding:28, border:`1px solid ${COLORS.border}` }}>
              <h2 style={{ margin:"0 0 24px", fontSize:22, fontWeight:800 }}>Payment Method</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[["cod","💵","Cash on Delivery","Pay when your order arrives"],["razorpay","💳","Pay Online with Razorpay","UPI, cards, netbanking, wallets, and more"]].map(([v,ic,t,s]) => (
                  <div key={v} onClick={() => setForm({...form,payment:v})} style={{
                    border:`2px solid ${form.payment===v ? COLORS.primary : COLORS.border}`,
                    borderRadius:16, padding:20, cursor:"pointer", display:"flex", alignItems:"center", gap:16,
                    background: form.payment===v ? COLORS.primaryLight : COLORS.card,
                    transition:"all 0.2s",
                  }}>
                    <div style={{ fontSize:32 }}>{ic}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:16 }}>{t}</div>
                      <div style={{ fontSize:13, color:COLORS.textMuted }}>{s}</div>
                    </div>
                    <div style={{ marginLeft:"auto", width:22, height:22, borderRadius:"50%", border:`2px solid ${form.payment===v ? COLORS.primary : COLORS.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {form.payment===v && <div style={{ width:12, height:12, borderRadius:"50%", background:COLORS.primary }}/>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:12, marginTop:24 }}>
                <button onClick={() => setStep(1)} style={{ flex:1, background:COLORS.bg, border:`1.5px solid ${COLORS.border}`, borderRadius:16, padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex:2, background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:16, padding:"14px", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:FONT }}>Review Order →</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <>
              {paymentError && <div style={{ background:"#fff1f2", border:"1px solid #fecdd3", color:"#be123c", borderRadius:14, padding:"12px 14px", marginBottom:16, fontSize:14 }}>{paymentError}</div>}
              {form.payment === "razorpay" ? (
                <div style={{ background:COLORS.card, borderRadius:24, padding:28, border:`1px solid ${COLORS.border}` }}>
                  <h2 style={{ margin:"0 0 20px", fontSize:22, fontWeight:800 }}>Review Your Order</h2>
                  <div style={{ background:COLORS.bg, borderRadius:16, padding:20, marginBottom:20 }}>
                    <h3 style={{ margin:"0 0 12px", fontWeight:700, fontSize:16 }}>Delivery To</h3>
                    <p style={{ margin:0, color:COLORS.textMuted, lineHeight:1.8 }}>
                      {form.name || "Customer"} · {form.phone}<br/>
                      {form.address || "Address"}, {form.city} - {form.pincode}
                    </p>
                  </div>
                  <div style={{ background:"#f8fafc", border:`1px solid ${COLORS.border}`, borderRadius:18, padding:20, marginBottom:20 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:COLORS.text, marginBottom:8 }}>Secure Razorpay Checkout</div>
                    <div style={{ fontSize:14, color:COLORS.textMuted, lineHeight:1.7 }}>
                      Pay with UPI, cards, netbanking, or wallets in Razorpay's hosted checkout.
                    </div>
                  </div>
                  {cart.map(i => (
                    <div key={i.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${COLORS.border}` }}>
                      <span style={{ fontSize:15 }}>{i.image} {i.name} × {i.qty}</span>
                      <span style={{ fontWeight:700 }}>₹{i.price * i.qty}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", gap:12, marginTop:24 }}>
                    <button onClick={() => setStep(2)} disabled={razorpayLoading} style={{ flex:1, background:COLORS.bg, border:`1.5px solid ${COLORS.border}`, borderRadius:16, padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FONT, opacity: razorpayLoading ? 0.7 : 1 }}>← Back</button>
                    <button onClick={placeRazorpayOrder} disabled={razorpayLoading} style={{ flex:2, background:`linear-gradient(135deg, ${COLORS.accent}, #e55a2b)`, color:"#fff", border:"none", borderRadius:16, padding:"14px", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:FONT, boxShadow:`0 8px 24px ${COLORS.accent}44`, opacity: razorpayLoading ? 0.7 : 1 }}>
                      {razorpayLoading ? "Opening Razorpay..." : `Pay with Razorpay — ₹${total}`}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background:COLORS.card, borderRadius:24, padding:28, border:`1px solid ${COLORS.border}` }}>
                  <h2 style={{ margin:"0 0 20px", fontSize:22, fontWeight:800 }}>Review Your Order</h2>
                  <div style={{ background:COLORS.bg, borderRadius:16, padding:20, marginBottom:20 }}>
                    <h3 style={{ margin:"0 0 12px", fontWeight:700, fontSize:16 }}>Delivery To</h3>
                    <p style={{ margin:0, color:COLORS.textMuted, lineHeight:1.8 }}>
                      {form.name || "Customer"} · {form.phone}<br/>
                      {form.address || "Address"}, {form.city} - {form.pincode}
                    </p>
                  </div>
                  {cart.map(i => (
                    <div key={i.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${COLORS.border}` }}>
                      <span style={{ fontSize:15 }}>{i.image} {i.name} × {i.qty}</span>
                      <span style={{ fontWeight:700 }}>₹{i.price * i.qty}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", gap:12, marginTop:24 }}>
                    <button onClick={() => setStep(2)} disabled={placingOrder} style={{ flex:1, background:COLORS.bg, border:`1.5px solid ${COLORS.border}`, borderRadius:16, padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FONT, opacity: placingOrder ? 0.7 : 1 }}>← Back</button>
                    <button onClick={placeCashOnDeliveryOrder} disabled={placingOrder} style={{ flex:2, background:`linear-gradient(135deg, ${COLORS.accent}, #e55a2b)`, color:"#fff", border:"none", borderRadius:16, padding:"14px", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:FONT, boxShadow:`0 8px 24px ${COLORS.accent}44`, opacity: placingOrder ? 0.7 : 1 }}>
                      {placingOrder ? "Placing Order..." : `🎉 Place Order — ₹${total}`}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {/* Order Summary Side */}
          <div style={{ background:COLORS.card, borderRadius:20, padding:20, border:`1px solid ${COLORS.border}`, position:isMobile ? "static" : "sticky", top:90 }}>
          <h3 style={{ margin:"0 0 16px", fontWeight:800, fontSize:16 }}>Order Summary</h3>
          {cart.map(i => (
            <div key={i.id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:10 }}>
              <span style={{ color:COLORS.textMuted }}>{i.image} {i.name} × {i.qty}</span>
              <span style={{ fontWeight:600 }}>₹{i.price*i.qty}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:10 }}>
            <span style={{ color:COLORS.textMuted }}>{form.delivery === "express" ? "Express delivery" : "Shipping"}</span>
            <span style={{ fontWeight:600 }}>{shippingFee === 0 ? "FREE" : `₹${shippingFee}`}</span>
          </div>
          <div style={{ borderTop:`1px solid ${COLORS.border}`, paddingTop:12, marginTop:8, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontWeight:800, fontSize:17 }}>Total</span>
            <span style={{ fontWeight:900, fontSize:20, color:COLORS.primary }}>₹{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPage({ setPage, onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!form.email.trim() || !form.password) { setError("Please fill all required fields"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (mode === "signup" && !form.name.trim()) { setError("Please enter your full name"); return; }
    if (mode === "signup" && form.password !== form.confirm) { setError("Passwords do not match"); return; }

    setSubmitting(true);
    try {
      const payload = mode === "signup"
        ? { name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password }
        : { email: form.email.trim().toLowerCase(), password: form.password };
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const data = await apiRequest(endpoint, { method: "POST", body: JSON.stringify(payload) });
      setSuccess(mode === "signup" ? "Account created. Your profile is ready to save." : "Signed in successfully.");
      onAuthSuccess(data.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight:"80vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:FONT }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, borderRadius:20, width:64, height:64, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 16px" }}>🛒</div>
          <h1 style={{ fontSize:30, fontWeight:900, color:COLORS.text, margin:"0 0 6px" }}>{mode === "login" ? "Welcome Back!" : "Create Account"}</h1>
          <p style={{ color:COLORS.textMuted, margin:0 }}>{mode === "login" ? "Sign in to your FreshMart account" : "Join FreshMart today"}</p>
        </div>
        <div style={{ background:COLORS.card, borderRadius:28, padding:36, border:`1px solid ${COLORS.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.08)" }}>
          <div style={{ display:"flex", marginBottom:28, background:COLORS.bg, borderRadius:14, padding:4 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex:1, border:"none", borderRadius:10, padding:"10px",
                  background: mode===m ? COLORS.card : "transparent",
                  fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:FONT,
                  color: mode===m ? COLORS.primary : COLORS.textMuted,
                  boxShadow: mode===m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  transition:"all 0.2s",
                }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          {error && <div style={{ background:"#fff0f0", border:"1px solid #ffcccc", borderRadius:10, padding:"10px 14px", fontSize:13, color:COLORS.danger, marginBottom:16 }}>⚠️ {error}</div>}
          {success && <div style={{ background:"#edfdf5", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#15803d", marginBottom:16 }}>✓ {success}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode === "signup" && (
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Full Name</label>
                <input placeholder="Your full name" value={form.name} onChange={e => setForm({...form,name:e.target.value})}
                  style={{ width:"100%", padding:"13px 16px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}/>
              </div>
            )}
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Email Address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})}
                style={{ width:"100%", padding:"13px 16px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Password</label>
              <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({...form,password:e.target.value})}
                style={{ width:"100%", padding:"13px 16px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}/>
            </div>
            {mode === "signup" && (
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Confirm Password</label>
                <input type="password" placeholder="Repeat your password" value={form.confirm} onChange={e => setForm({...form,confirm:e.target.value})}
                  style={{ width:"100%", padding:"13px 16px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}/>
              </div>
            )}
            <button onClick={handleSubmit} style={{
              background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              color:"#fff", border:"none", borderRadius:14, padding:"15px",
              fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:FONT, marginTop:4,
              boxShadow:`0 8px 24px ${COLORS.primary}44`,
            }}>
              {submitting ? "Please wait..." : (mode === "login" ? "Sign In →" : "Create Account →")}
            </button>
          </div>
          <div style={{ textAlign:"center", marginTop:20, fontSize:14, color:COLORS.textMuted }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setMode(mode==="login"?"signup":"login")} style={{ color:COLORS.primary, fontWeight:700, cursor:"pointer" }}>
              {mode === "login" ? "Sign up free" : "Sign in"}
            </span>
          </div>
        </div>
        <div style={{ textAlign:"center", marginTop:16 }}>
          <button onClick={() => { setPage("admin"); }} style={{ background:"none", border:"none", color:COLORS.textMuted, fontSize:13, cursor:"pointer", fontFamily:FONT, textDecoration:"underline" }}>Admin Login →</button>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ currentUser, userProfile, onSaveProfile, setPage }) {
  const [form, setForm] = useState(buildProfile(userProfile || currentUser?.profile || currentUser));
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("success");
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setForm(buildProfile(userProfile || currentUser?.profile || currentUser));
  }, [currentUser, userProfile]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setStatusTone("error");
      setStatus("Please add your name and email before saving.");
      return;
    }

    setSaving(true);
    setStatus("");
    try {
      await onSaveProfile({
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      });
      setStatusTone("success");
      setStatus("Profile saved successfully.");
    } catch (saveError) {
      setStatusTone("error");
      setStatus(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"36px 24px 56px", fontFamily:FONT }}>
      <div style={{
        background:"linear-gradient(135deg, #edfdf3 0%, #fff8ef 100%)",
        border:`1px solid ${COLORS.border}`, borderRadius:28, padding:"32px",
        display:"grid", gridTemplateColumns:isMobile ? "1fr" : "minmax(240px, 320px) 1fr", gap:24, alignItems:"stretch",
      }}>
        <div style={{ background:"rgba(255,255,255,0.72)", borderRadius:24, padding:24, border:`1px solid ${COLORS.border}` }}>
          <div style={{
            width:72, height:72, borderRadius:22, marginBottom:18,
            background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, fontWeight:900,
          }}>
            {(form.name || currentUser?.name || "U").trim().slice(0, 1).toUpperCase()}
          </div>
          <h1 style={{ margin:"0 0 8px", fontSize:32, fontWeight:900, color:COLORS.text }}>Your Profile</h1>
          <p style={{ margin:"0 0 22px", color:COLORS.textMuted, lineHeight:1.7 }}>
            Save your account details once and FreshMart will keep checkout faster next time.
          </p>
          <div style={{ display:"grid", gap:12 }}>
            {[["Signed in as", currentUser?.email || form.email || "Guest"],["Default city", form.city || "Chennai"],["Profile status", form.address ? "Ready for checkout" : "Needs address"]].map(([label, value]) => (
              <div key={label} style={{ background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${COLORS.border}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:COLORS.textMuted, marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:15, fontWeight:700, color:COLORS.text }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:COLORS.card, borderRadius:24, padding:28, border:`1px solid ${COLORS.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:isMobile ? "flex-start" : "center", gap:16, marginBottom:24, flexDirection:isMobile ? "column" : "row" }}>
            <div>
              <h2 style={{ margin:"0 0 6px", fontSize:24, fontWeight:900, color:COLORS.text }}>Saved Details</h2>
              <p style={{ margin:0, color:COLORS.textMuted }}>These details are saved through your local FreshMart auth server.</p>
            </div>
            <button
              onClick={() => setPage("products")}
              style={{ background:"none", border:`1px solid ${COLORS.border}`, borderRadius:14, padding:"12px 16px", cursor:"pointer", fontFamily:FONT, fontWeight:700, color:COLORS.text }}
            >
              Continue Shopping
            </button>
          </div>
          {status && (
            <div style={{
              background: statusTone === "success" ? "#edfdf5" : "#fff1f2",
              border: `1px solid ${statusTone === "success" ? "#bbf7d0" : "#fecdd3"}`,
              borderRadius:12, padding:"12px 14px",
              color: statusTone === "success" ? "#15803d" : "#be123c",
              fontSize:14, marginBottom:18,
            }}>
              {status}
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
            {[["Full Name","name","text"],["Email Address","email","email"],["Phone Number","phone","tel"],["City","city","text"],["Pincode","pincode","text"]].map(([label,key,type]) => (
              <div key={key} style={{ gridColumn: !isMobile && key === "email" ? "span 2" : "span 1" }}>
                <label style={{ fontSize:13, fontWeight:700, color:COLORS.textMuted, display:"block", marginBottom:6 }}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width:"100%", padding:"13px 14px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop:16 }}>
            <label style={{ fontSize:13, fontWeight:700, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Address</label>
            <textarea
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Street, area, landmark"
              style={{ width:"100%", minHeight:110, padding:"13px 14px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", resize:"vertical", boxSizing:"border-box" }}
            />
          </div>
          <div style={{ display:"flex", gap:12, marginTop:22, flexDirection:isMobile ? "column" : "row" }}>
            <button
              onClick={handleSave}
              style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:16, padding:"15px 20px", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:FONT, boxShadow:`0 8px 24px ${COLORS.primary}33` }}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
            <button
              onClick={() => setPage("checkout")}
              style={{ background:COLORS.primaryLight, color:COLORS.primary, border:"none", borderRadius:16, padding:"15px 20px", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:FONT }}
            >
              Go To Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersPage({ orders, loadingOrders, setPage }) {
  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"36px 24px 56px", fontFamily:FONT }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"end", gap:16, marginBottom:28, flexWrap:"wrap" }}>
        <div>
          <h1 style={{ margin:"0 0 8px", fontSize:34, fontWeight:900, color:COLORS.text }}>Order History</h1>
          <p style={{ margin:0, color:COLORS.textMuted }}>
            {loadingOrders ? "Loading your past orders..." : `${orders.length} order${orders.length === 1 ? "" : "s"} saved to your account`}
          </p>
        </div>
        <button
          onClick={() => setPage("products")}
          style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:14, padding:"12px 18px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:FONT }}
        >
          Shop Again
        </button>
      </div>

      {loadingOrders ? (
        <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:24, padding:"40px 28px", color:COLORS.textMuted }}>
          Fetching your orders...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:28, padding:"48px 32px", textAlign:"center" }}>
          <div style={{ fontSize:54, marginBottom:14 }}>🧾</div>
          <h2 style={{ margin:"0 0 8px", fontSize:26, fontWeight:900, color:COLORS.text }}>No orders yet</h2>
          <p style={{ margin:"0 0 22px", color:COLORS.textMuted, lineHeight:1.7 }}>
            Once you complete checkout, your purchases will appear here with delivery details and totals.
          </p>
          <button
            onClick={() => setPage("products")}
            style={{ background:COLORS.primaryLight, color:COLORS.primary, border:"none", borderRadius:14, padding:"12px 18px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:FONT }}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={{ display:"grid", gap:18 }}>
          {orders.map(order => (
            <div key={order.id + order.createdAt} style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:24, padding:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:22, fontWeight:900, color:COLORS.primary, marginBottom:4 }}>{order.id}</div>
                  <div style={{ color:COLORS.textMuted, fontSize:14 }}>
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ background:"#dcfce7", color:"#166534", borderRadius:20, padding:"6px 12px", fontSize:12, fontWeight:800 }}>
                    {order.status}
                  </span>
                  <span style={{ background:COLORS.accentLight, color:COLORS.accent, borderRadius:20, padding:"6px 12px", fontSize:12, fontWeight:800 }}>
                    ₹{order.total}
                  </span>
                </div>
              </div>

              <div>
                <h3 style={{ margin:"0 0 12px", fontSize:16, fontWeight:800, color:COLORS.text }}>Items</h3>
                <div style={{ display:"grid", gap:10 }}>
                  {order.items.map(item => (
                    <div key={`${order.id}-${item.id}`} style={{ display:"flex", justifyContent:"space-between", gap:12, padding:"10px 0", borderBottom:`1px solid ${COLORS.border}` }}>
                      <div style={{ color:COLORS.text }}>
                        <span style={{ marginRight:8 }}>{item.image}</span>
                        {item.name} x {item.qty}
                      </div>
                      <div style={{ fontWeight:700, color:COLORS.text }}>₹{item.price * item.qty}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop:18, background:COLORS.bg, borderRadius:20, padding:18 }}>
                <h3 style={{ margin:"0 0 14px", fontSize:16, fontWeight:800, color:COLORS.text }}>Delivery & Payment</h3>
                <div style={{ color:COLORS.textMuted, lineHeight:1.7, fontSize:14 }}>
                  <div style={{ color:COLORS.text, fontWeight:700 }}>{order.deliveryProfile.name}</div>
                  <div>{order.deliveryProfile.phone}</div>
                  <div>{order.deliveryProfile.address}</div>
                  <div>{order.deliveryProfile.city} - {order.deliveryProfile.pincode}</div>
                  <div style={{ marginTop:10 }}>
                    {order.delivery === "express" ? "Express Delivery" : "Standard Delivery"} · {formatPaymentLabel(order.payment)}
                  </div>
                </div>
                <div style={{ display:"grid", gap:8, marginTop:16, paddingTop:14, borderTop:`1px solid ${COLORS.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", color:COLORS.text }}>
                    <span>Subtotal</span>
                    <strong>₹{order.subtotal}</strong>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", color:COLORS.text }}>
                    <span>Shipping</span>
                    <strong>₹{order.shippingFee}</strong>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", color:COLORS.primary, fontWeight:900, fontSize:16 }}>
                    <span>Total</span>
                    <span>₹{order.total}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistPage({ wishlist, onToggleWishlist, onAddToCart, setSelectedProduct, products }) {
  const wishProducts = products.filter(p => wishlist.includes(p.id));
  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px", fontFamily:FONT }}>
      <h1 style={{ fontSize:36, fontWeight:900, color:COLORS.text, margin:"0 0 8px", letterSpacing:"-0.5px" }}>Your Wishlist ❤️</h1>
      <p style={{ color:COLORS.textMuted, margin:"0 0 32px" }}>{wishProducts.length} saved items</p>
      {wishProducts.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 0" }}>
          <div style={{ fontSize:80, marginBottom:16 }}>🤍</div>
          <h2 style={{ fontSize:24, fontWeight:800, color:COLORS.text, margin:"0 0 12px" }}>Your wishlist is empty</h2>
          <p style={{ color:COLORS.textMuted }}>Save your favourite items here!</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(230px, 1fr))", gap:20 }}>
          {wishProducts.map(p => <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} wishlist={wishlist} onView={setSelectedProduct} />)}
        </div>
      )}
    </div>
  );
}

function ContactPage({ currentUser }) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.profile?.phone || "",
    message: "",
  });
  const mapQuery = encodeURIComponent("E.B. Avenue, Sirukaverripakkam, Kanchipuram");
  const isMobile = useIsMobile();

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: current.name || currentUser?.name || "",
      email: current.email || currentUser?.email || "",
      phone: current.phone || currentUser?.profile?.phone || "",
    }));
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in name, email, and message.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await apiRequest("/api/contact-messages", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          message: form.message.trim(),
        }),
      });
      setSent(true);
      setForm((current) => ({ ...current, message: "" }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px", fontFamily:FONT }}>
      <h1 style={{ fontSize:36, fontWeight:900, color:COLORS.text, margin:"0 0 8px", letterSpacing:"-0.5px" }}>Contact Us</h1>
      <p style={{ color:COLORS.textMuted, margin:"0 0 40px", fontSize:16 }}>We'd love to hear from you</p>
      <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap:40, alignItems:"start" }}>
        <div>
          <div style={{ background:COLORS.card, borderRadius:24, padding:32, border:`1px solid ${COLORS.border}`, marginBottom:24 }}>
            {sent ? (
              <div style={{ textAlign:"center", padding:"40px 0" }}>
                <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
                <h2 style={{ fontSize:24, fontWeight:900, color:COLORS.primary, margin:"0 0 10px" }}>Message Sent!</h2>
                <p style={{ color:COLORS.textMuted }}>The owner dashboard has received your message.</p>
              </div>
            ) : (
              <>
                <h2 style={{ margin:"0 0 24px", fontSize:22, fontWeight:800 }}>Send us a Message</h2>
                {error && <div style={{ background:"#fff1f2", color:"#be123c", border:"1px solid #fecdd3", borderRadius:12, padding:"12px 14px", marginBottom:16, fontSize:13 }}>{error}</div>}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {[["Name","name","text","Your full name"],["Email","email","email","your@email.com"],["Phone","phone","tel","+91 99999 99999"]].map(([label, key, type, placeholder]) => (
                    <div key={key}>
                      <label style={{ fontSize:13, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:6 }}>{label}</label>
                      <input
                        type={type}
                        value={form[key]}
                        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                        placeholder={placeholder}
                        style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:6 }}>Message</label>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={(event) => setForm({ ...form, message: event.target.value })}
                      placeholder="How can we help you?"
                      style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none", resize:"vertical", boxSizing:"border-box" }}
                    />
                  </div>
                  <button onClick={handleSubmit} style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:14, padding:"14px", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:FONT, boxShadow:`0 8px 24px ${COLORS.primary}44` }}>
                    {submitting ? "Sending..." : "Send Message →"}
                  </button>
                </div>
              </>
            )}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12 }}>
            {[["📍","Visit Us","E.B. Avenue, Sirukaverripakkam, Kanchipuram"],["📞","Call Us","+91 9363879477"],["✉️","Email Us","hello@freshmart.in"],["🕐","Hours","Mon–Sun: 7am – 10pm"]].map(([ic,t,d]) => (
              <div key={t} style={{ background:COLORS.card, borderRadius:16, padding:18, border:`1px solid ${COLORS.border}` }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{ic}</div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{t}</div>
                <div style={{ fontSize:12, color:COLORS.textMuted, lineHeight:1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ background:COLORS.card, borderRadius:24, overflow:"hidden", minHeight:500, border:`1px solid ${COLORS.border}`, boxShadow:"0 12px 36px rgba(0,0,0,0.06)" }}>
            <div style={{ padding:"20px 20px 16px", borderBottom:`1px solid ${COLORS.border}` }}>
              <div style={{ fontWeight:800, fontSize:20, color:COLORS.primary, marginBottom:6 }}>FreshMart Location</div>
              <div style={{ fontSize:14, color:COLORS.textMuted, lineHeight:1.6 }}>
                E.B. Avenue, Sirukaverripakkam
                <br />
                Kanchipuram, Tamil Nadu
              </div>
            </div>
            <div style={{ position:"relative", width:"100%", minHeight:340, height:"calc(100% - 105px)" }}>
              <iframe
                title="FreshMart location map"
                src={`https://www.google.com/maps?q=${mapQuery}&z=15&output=embed`}
                style={{ border:0, width:"100%", height:"100%", minHeight:340, display:"block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noreferrer"
              style={{ display:"block", margin:20, background:COLORS.primary, color:"#fff", borderRadius:12, padding:"12px 18px", fontWeight:700, fontSize:14, textAlign:"center", textDecoration:"none" }}
            >
              Get Directions →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ adminUser, adminData, setPage, onAdminLogout, onSaveProduct, onDeleteProduct, onUpdateOrderStatus, onUpdateMessageStatus }) {
  const [adminPage, setAdminPage] = useState("dashboard");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name:"", category:"Fruits", price:"", originalPrice:"", unit:"", stock:"", discount:0, image:"🍎", isNew:false, featured:false });
  const [actionMessage, setActionMessage] = useState("");
  const [actionTone, setActionTone] = useState("success");
  const [busy, setBusy] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const productFormRef = useRef(null);
  const productPhotoInputRef = useRef(null);
  const isMobile = useIsMobile(900);
  const products = adminData.products || [];
  const orders = adminData.orders || [];
  const messages = adminData.messages || [];
  const sales = adminData.sales || { totalRevenue: 0, deliveredRevenue: 0, totalOrders: 0, averageOrderValue: 0, recentOrders: [] };
  const lowStockProducts = products.filter((product) => Number(product.stock) < 20);
  const newMessagesCount = messages.filter((message) => message.status === "New").length;
  const uniqueCustomers = new Set(orders.map((order) => order.customerEmail || order.userId)).size;

  const navItems = [
    { key:"dashboard", icon:"📊", label:"Dashboard" },
    { key:"products", icon:"📦", label:"Products" },
    { key:"orders", icon:"🛒", label:"Orders" },
    { key:"messages", icon:"✉️", label:"Messages" },
    { key:"reports", icon:"💹", label:"Sales Report" },
  ];

  const resetProductForm = () => {
    setEditProduct(null);
    setProductForm({ name:"", category:"Fruits", price:"", originalPrice:"", unit:"", stock:"", discount:0, image:"🍎", isNew:false, featured:false });
    setIsDraggingPhoto(false);
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setProductForm({
      ...product,
      price: String(product.price ?? ""),
      originalPrice: String(product.originalPrice ?? ""),
      stock: String(product.stock ?? ""),
      discount: String(product.discount ?? 0),
    });
    setShowProductForm(true);
  };

  useEffect(() => {
    if (adminPage === "products" && showProductForm && productFormRef.current) {
      productFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [adminPage, showProductForm, editProduct]);

  useEffect(() => {
    if (!showProductForm) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !busy) {
        setShowProductForm(false);
        resetProductForm();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showProductForm, busy]);

  const applyProductImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setActionTone("error");
      setActionMessage("Please upload a valid image file.");
      return;
    }

    const maxSizeBytes = 4 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setActionTone("error");
      setActionMessage("Please choose an image smaller than 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProductForm((current) => ({ ...current, image: String(reader.result || "") }));
      setActionTone("success");
      setActionMessage("Product photo added.");
    };
    reader.onerror = () => {
      setActionTone("error");
      setActionMessage("Unable to read that image file.");
    };
    reader.readAsDataURL(file);
  };

  const saveProduct = async () => {
    if (!String(productForm.name || "").trim()) {
      setActionTone("error");
      setActionMessage("Product name is required.");
      return;
    }

    setBusy(true);
    setActionMessage("");
    try {
      await onSaveProduct({
        ...productForm,
        price: Number(productForm.price || 0),
        originalPrice: Number(productForm.originalPrice || productForm.price || 0),
        stock: Number(productForm.stock || 0),
        discount: Number(productForm.discount || 0),
        reviews: Number(productForm.reviews || 0),
        rating: Number(productForm.rating || 4.5),
      }, editProduct?.id);
      setActionTone("success");
      setActionMessage(editProduct ? "Product updated successfully." : "Product added successfully.");
      setShowProductForm(false);
      resetProductForm();
    } catch (error) {
      setActionTone("error");
      setActionMessage(error.message || "Unable to save the product.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:isMobile ? "column" : "row", minHeight:"100vh", fontFamily:FONT, background:COLORS.bg }}>
      <div style={{ width:isMobile ? "100%" : 240, background:"#1a1a2e", color:"#fff", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, borderRadius:10, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🛒</div>
            <div>
              <div style={{ fontWeight:900, fontSize:16 }}><span style={{ color:COLORS.primary }}>Fresh</span><span style={{ color:COLORS.accent }}>Mart</span></div>
              <div style={{ fontSize:11, color:"#6b7280" }}>Owner Console</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"12px 0", display:isMobile ? "flex" : "block", overflowX:isMobile ? "auto" : "visible" }}>
          {navItems.map((item) => (
            <div key={item.key} onClick={() => setAdminPage(item.key)} style={{
              padding:"12px 20px", cursor:"pointer", display:"flex", alignItems:"center", gap:12,
              background: adminPage === item.key ? `${COLORS.primary}22` : "transparent",
              borderLeft: !isMobile && adminPage === item.key ? `3px solid ${COLORS.primary}` : "3px solid transparent",
              borderBottom: isMobile && adminPage === item.key ? `3px solid ${COLORS.primary}` : "3px solid transparent",
              color: adminPage === item.key ? COLORS.primary : "#9ca3af",
              fontWeight: adminPage === item.key ? 700 : 400, fontSize:14, whiteSpace:"nowrap",
            }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>{item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding:20, borderTop:"1px solid rgba(255,255,255,0.08)", display:"grid", gap:10 }}>
          <button onClick={onAdminLogout} style={{ width:"100%", background:"rgba(239,68,68,0.15)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:FONT }}>
            Log Out Owner
          </button>
          <button onClick={() => setPage("home")} style={{ width:"100%", background:"rgba(255,255,255,0.06)", color:"#fff", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"10px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:FONT }}>
            Back To Store
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflow:"auto" }}>
        <div style={{ padding:isMobile ? "20px 16px 28px" : "24px 32px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, gap:16, flexWrap:"wrap" }}>
            <div>
              <h1 style={{ margin:0, fontSize:26, fontWeight:900, color:COLORS.text, letterSpacing:"-0.5px" }}>
                {navItems.find((item) => item.key === adminPage)?.icon} {navItems.find((item) => item.key === adminPage)?.label}
              </h1>
              <div style={{ color:COLORS.textMuted, fontSize:14, marginTop:6 }}>{adminUser?.name} · {adminUser?.email}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              {lowStockProducts.length > 0 && <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:10, padding:"8px 14px", fontSize:13, color:"#ea580c", fontWeight:600 }}>{lowStockProducts.length} low stock</div>}
              {newMessagesCount > 0 && <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"8px 14px", fontSize:13, color:"#1d4ed8", fontWeight:600 }}>{newMessagesCount} new messages</div>}
            </div>
          </div>
          {actionMessage && (
            <div style={{
              marginBottom:20,
              background: actionTone === "success" ? "#edfdf5" : "#fff1f2",
              border: `1px solid ${actionTone === "success" ? "#bbf7d0" : "#fecdd3"}`,
              color: actionTone === "success" ? "#15803d" : "#be123c",
              borderRadius:14,
              padding:"12px 14px",
              fontSize:14,
              fontWeight:600,
            }}>
              {actionMessage}
            </div>
          )}

          {adminPage === "dashboard" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap:16, marginBottom:28 }}>
                {[
                  { label:"Total Products", value:products.length, icon:"📦", color:COLORS.primary, bg:COLORS.primaryLight },
                  { label:"Total Orders", value:sales.totalOrders, icon:"🛒", color:"#7c3aed", bg:"#f3e8ff" },
                  { label:"Customers", value:uniqueCustomers, icon:"👥", color:"#0891b2", bg:"#e0f2fe" },
                  { label:"Revenue", value:`₹${sales.totalRevenue.toLocaleString()}`, icon:"💰", color:COLORS.accent, bg:COLORS.accentLight },
                ].map((metric) => (
                  <div key={metric.label} style={{ background:COLORS.card, borderRadius:20, padding:22, border:`1px solid ${COLORS.border}` }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:metric.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:14 }}>{metric.icon}</div>
                    <div style={{ fontSize:26, fontWeight:900, color:metric.color, marginBottom:4 }}>{metric.value}</div>
                    <div style={{ fontSize:13, color:COLORS.textMuted }}>{metric.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "1.2fr 1fr 1fr", gap:20 }}>
                <div style={{ background:COLORS.card, borderRadius:20, padding:24, border:`1px solid ${COLORS.border}` }}>
                  <h3 style={{ margin:"0 0 20px", fontWeight:800, fontSize:18 }}>Recent Orders</h3>
                  {(sales.recentOrders || []).length === 0 ? <p style={{ color:COLORS.textMuted, fontSize:14 }}>No orders yet.</p> : sales.recentOrders.map((order) => (
                    <div key={order.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:`1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{order.id}</div>
                        <div style={{ fontSize:12, color:COLORS.textMuted }}>{order.customerName}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:700, fontSize:14, color:COLORS.primary }}>₹{order.total}</div>
                        <div style={{ fontSize:12, color:COLORS.textMuted }}>{order.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:COLORS.card, borderRadius:20, padding:24, border:`1px solid ${COLORS.border}` }}>
                  <h3 style={{ margin:"0 0 20px", fontWeight:800, fontSize:18 }}>Messages</h3>
                  {messages.slice(0, 4).map((message) => (
                    <div key={message.id} style={{ padding:"12px 0", borderBottom:`1px solid ${COLORS.border}` }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{message.name}</div>
                      <div style={{ fontSize:12, color:COLORS.textMuted, margin:"4px 0" }}>{message.email}</div>
                      <div style={{ fontSize:13, color:COLORS.text }}>{message.message.slice(0, 70)}{message.message.length > 70 ? "..." : ""}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:COLORS.card, borderRadius:20, padding:24, border:`1px solid ${COLORS.border}` }}>
                  <h3 style={{ margin:"0 0 20px", fontWeight:800, fontSize:18 }}>Low Stock Alert</h3>
                  {lowStockProducts.length === 0 ? <p style={{ color:COLORS.textMuted, fontSize:14 }}>All products are well stocked.</p> : lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{product.name}</div>
                        <div style={{ fontSize:12, color:COLORS.textMuted }}>{product.category}</div>
                      </div>
                      <div style={{ fontWeight:800, color:product.stock < 10 ? COLORS.danger : COLORS.warning }}>{product.stock}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminPage === "products" && (
            <div>
              <div style={{
                background:"linear-gradient(135deg, #f7fbf8 0%, #fff8f1 100%)",
                border:`1px solid ${COLORS.border}`,
                borderRadius:24,
                padding:"22px 24px",
                marginBottom:20,
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                gap:16,
                flexWrap:"wrap",
              }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:800, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Catalog Manager</div>
                  <div style={{ fontSize:28, fontWeight:900, color:COLORS.text }}>{products.length} products</div>
                  <div style={{ color:COLORS.textMuted, fontSize:14, marginTop:6 }}>
                    Edit any existing product or add a new one from here.
                  </div>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={() => { resetProductForm(); setShowProductForm(true); }} style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:14, padding:"12px 22px", fontWeight:800, cursor:"pointer", fontFamily:FONT, fontSize:14 }}>
                    + Add Product
                  </button>
                  {editProduct && (
                    <button onClick={() => setShowProductForm(true)} style={{ background:COLORS.primaryLight, color:COLORS.primary, border:"none", borderRadius:14, padding:"12px 18px", fontWeight:800, cursor:"pointer", fontFamily:FONT, fontSize:14 }}>
                      Editing: {editProduct.name}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ background:COLORS.card, borderRadius:24, border:`1px solid ${COLORS.border}`, overflow:"hidden", boxShadow:"0 16px 36px rgba(15,23,42,0.05)" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                  <thead>
                    <tr style={{ background:COLORS.bg, borderBottom:`1px solid ${COLORS.border}` }}>
                      {["Product","Category","Price","Stock","Featured","Actions"].map((heading) => (
                        <th key={heading} style={{ padding:"14px 16px", textAlign:"left", fontWeight:700, color:COLORS.textMuted, fontSize:12, textTransform:"uppercase", letterSpacing:"0.5px" }}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} style={{ borderBottom:`1px solid ${COLORS.border}` }}>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <ProductVisual image={product.image} name={product.name} size={38} radius={10} background={COLORS.primaryLight} fontSize={22} />
                            <div>
                              <div style={{ fontWeight:600, fontSize:14 }}>{product.name}</div>
                              <div style={{ fontSize:12, color:COLORS.textMuted }}>{product.unit}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"12px 16px" }}><Badge color={COLORS.primary} bg={COLORS.primaryLight}>{product.category}</Badge></td>
                        <td style={{ padding:"12px 16px", fontWeight:700 }}>₹{product.price}</td>
                        <td style={{ padding:"12px 16px", fontWeight:700, color:product.stock < 10 ? COLORS.danger : product.stock < 20 ? COLORS.warning : COLORS.success }}>{product.stock}</td>
                        <td style={{ padding:"12px 16px" }}>{product.featured ? "Yes" : "No"}</td>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ display:"flex", gap:8 }}>
                            <button onClick={() => openEdit(product)} style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:FONT, boxShadow:`0 8px 18px ${COLORS.primary}22` }}>Edit Product</button>
                            <button onClick={async () => {
                              setBusy(true);
                              setActionMessage("");
                              try {
                                await onDeleteProduct(product.id);
                                setActionTone("success");
                                setActionMessage("Product deleted successfully.");
                              } catch (error) {
                                setActionTone("error");
                                setActionMessage(error.message || "Unable to delete the product.");
                              } finally {
                                setBusy(false);
                              }
                            }} style={{ background:"#fee2e2", color:COLORS.danger, border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showProductForm && (
                <div
                  onClick={() => {
                    if (!busy) {
                      setShowProductForm(false);
                      resetProductForm();
                    }
                  }}
                  style={{
                    position:"fixed",
                    inset:0,
                    background:"rgba(15, 23, 42, 0.45)",
                    backdropFilter:"blur(10px)",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"center",
                    padding:24,
                    zIndex:1000,
                  }}
                >
                  <div
                    ref={productFormRef}
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      width:"min(980px, 100%)",
                      maxHeight:"90vh",
                      overflow:"auto",
                      background:COLORS.card,
                      borderRadius:28,
                      padding:30,
                      border:editProduct ? `2px solid ${COLORS.accent}55` : `2px solid ${COLORS.primary}44`,
                      boxShadow:editProduct ? "0 28px 70px rgba(255,107,53,0.18)" : "0 28px 70px rgba(26,122,60,0.16)",
                    }}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", gap:16, marginBottom:22, flexWrap:"wrap" }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:800, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8 }}>
                          Product Editor
                        </div>
                        <h3 style={{ margin:"0 0 8px", fontWeight:900, fontSize:24, color:COLORS.text }}>{editProduct ? "Edit Product" : "Add New Product"}</h3>
                        <div style={{ color:COLORS.textMuted, fontSize:14, maxWidth:560 }}>
                          {editProduct ? `You are editing ${editProduct.name}. Update the details below and save when you're ready.` : "Fill in the product details below to add a new item to the catalog."}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                        {editProduct && (
                          <div style={{ padding:"8px 12px", borderRadius:999, background:COLORS.accentLight, color:COLORS.accent, fontSize:12, fontWeight:800 }}>
                            Editing existing product
                          </div>
                        )}
                        <button
                          onClick={() => { if (!busy) { setShowProductForm(false); resetProductForm(); } }}
                          style={{ background:"transparent", border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"10px 14px", fontWeight:700, cursor:"pointer", fontFamily:FONT, color:COLORS.textMuted }}
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap:14 }}>
                      {[["Product Name","name","text"],["Price","price","number"],["Original Price","originalPrice","number"],["Unit","unit","text"],["Stock","stock","number"],["Discount %","discount","number"]].map(([label, key, type]) => (
                        <div key={key}>
                          <label style={{ fontSize:12, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:5 }}>{label}</label>
                          <input type={type} value={productForm[key]} onChange={(event) => setProductForm({ ...productForm, [key]: event.target.value })} style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${COLORS.border}`, fontSize:13, fontFamily:FONT, outline:"none", boxSizing:"border-box" }} />
                        </div>
                      ))}
                      <div>
                        <label style={{ fontSize:12, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:5 }}>Category</label>
                        <select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category:event.target.value })} style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${COLORS.border}`, fontSize:13, fontFamily:FONT, outline:"none" }}>
                          {CATEGORIES.map((category) => <option key={category.name}>{category.name}</option>)}
                        </select>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:24 }}>
                        <input id="featured-product" type="checkbox" checked={Boolean(productForm.featured)} onChange={(event) => setProductForm({ ...productForm, featured:event.target.checked })} />
                        <label htmlFor="featured-product" style={{ fontSize:13, color:COLORS.text }}>Featured</label>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:24 }}>
                        <input id="new-product" type="checkbox" checked={Boolean(productForm.isNew)} onChange={(event) => setProductForm({ ...productForm, isNew:event.target.checked })} />
                        <label htmlFor="new-product" style={{ fontSize:13, color:COLORS.text }}>Mark as New</label>
                      </div>
                    </div>
                    <div style={{ marginTop:18 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:COLORS.textMuted, marginBottom:8 }}>Product Photo</div>
                      <input
                        ref={productPhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(event) => applyProductImageFile(event.target.files?.[0])}
                        style={{ display:"none" }}
                      />
                      <div
                        onDragEnter={(event) => { event.preventDefault(); setIsDraggingPhoto(true); }}
                        onDragOver={(event) => { event.preventDefault(); setIsDraggingPhoto(true); }}
                        onDragLeave={(event) => {
                          event.preventDefault();
                          if (event.currentTarget === event.target) {
                            setIsDraggingPhoto(false);
                          }
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          setIsDraggingPhoto(false);
                          applyProductImageFile(event.dataTransfer.files?.[0]);
                        }}
                        onClick={() => productPhotoInputRef.current?.click()}
                        style={{
                          border:`2px dashed ${isDraggingPhoto ? COLORS.primary : COLORS.border}`,
                          background:isDraggingPhoto ? COLORS.primaryLight : "#fbfcfd",
                          borderRadius:22,
                          padding:"18px 20px",
                          cursor:"pointer",
                          display:"grid",
                          gridTemplateColumns:isMobile ? "1fr" : "120px 1fr",
                          gap:18,
                          alignItems:"center",
                        }}
                      >
                        <div style={{ display:"flex", justifyContent:"center" }}>
                          <ProductVisual image={productForm.image} name={productForm.name} size={110} radius={20} background={COLORS.primaryLight} fontSize={56} />
                        </div>
                        <div>
                          <div style={{ fontSize:16, fontWeight:800, color:COLORS.text, marginBottom:6 }}>
                            Drag and drop a photo here
                          </div>
                          <div style={{ fontSize:13, color:COLORS.textMuted, lineHeight:1.7, marginBottom:12 }}>
                            You can also click to browse. JPG, PNG, WEBP and other image formats under 4MB are supported.
                          </div>
                          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); productPhotoInputRef.current?.click(); }}
                              style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:12, padding:"10px 14px", fontWeight:700, cursor:"pointer", fontFamily:FONT, fontSize:13 }}
                            >
                              Upload Photo
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setProductForm((current) => ({ ...current, image:"🍎" }));
                              }}
                              style={{ background:COLORS.bg, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"10px 14px", fontWeight:700, cursor:"pointer", fontFamily:FONT, fontSize:13, color:COLORS.textMuted }}
                            >
                              Use Emoji Instead
                            </button>
                            {isImageAsset(productForm.image) && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setProductForm((current) => ({ ...current, image:"🍎" }));
                                }}
                                style={{ background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:12, padding:"10px 14px", fontWeight:700, cursor:"pointer", fontFamily:FONT, fontSize:13, color:"#be123c" }}
                              >
                                Remove Photo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop:16 }}>
                      <label style={{ fontSize:12, fontWeight:600, color:COLORS.textMuted, display:"block", marginBottom:5 }}>Emoji Fallback</label>
                      <input
                        type="text"
                        value={isImageAsset(productForm.image) ? "" : productForm.image}
                        placeholder="🍎"
                        onChange={(event) => setProductForm({ ...productForm, image:event.target.value || "🍎" })}
                        style={{ width:"100%", maxWidth:180, padding:"10px 12px", borderRadius:10, border:`1.5px solid ${COLORS.border}`, fontSize:13, fontFamily:FONT, outline:"none", boxSizing:"border-box" }}
                      />
                    </div>
                    <div style={{ display:"flex", gap:12, marginTop:24 }}>
                      <button onClick={saveProduct} style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:12, padding:"11px 24px", fontWeight:700, cursor:"pointer", fontFamily:FONT }}>
                        {busy ? "Saving..." : (editProduct ? "Save Changes" : "Add Product")}
                      </button>
                      <button onClick={() => { setShowProductForm(false); resetProductForm(); }} style={{ background:COLORS.bg, border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"11px 24px", fontWeight:700, cursor:"pointer", fontFamily:FONT, color:COLORS.textMuted }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {adminPage === "orders" && (
            <div>
              <div style={{
                background:"linear-gradient(135deg, #f7fbf8 0%, #fff7f2 100%)",
                border:`1px solid ${COLORS.border}`,
                borderRadius:24,
                padding:"22px 24px",
                marginBottom:20,
                display:"grid",
                gridTemplateColumns:isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
                gap:16,
              }}>
                {[
                  { label:"Total Orders", value:orders.length, color:COLORS.primary, bg:COLORS.primaryLight },
                  { label:"Paid Online", value:orders.filter((order) => order.payment === "razorpay").length, color:"#0f766e", bg:"#ccfbf1" },
                  { label:"Cash On Delivery", value:orders.filter((order) => order.payment === "cod").length, color:COLORS.accent, bg:COLORS.accentLight },
                ].map((metric) => (
                  <div key={metric.label} style={{ background:"#fff", border:`1px solid ${COLORS.border}`, borderRadius:18, padding:"18px 20px" }}>
                    <div style={{ display:"inline-flex", padding:"6px 10px", borderRadius:999, background:metric.bg, color:metric.color, fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>
                      {metric.label}
                    </div>
                    <div style={{ fontSize:30, fontWeight:900, color:metric.color, lineHeight:1 }}>{metric.value}</div>
                  </div>
                ))}
              </div>

              {orders.length === 0 ? (
                <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:24, padding:"40px 32px", textAlign:"center" }}>
                  <div style={{ fontSize:54, marginBottom:14 }}>📦</div>
                  <div style={{ fontSize:24, fontWeight:900, color:COLORS.text, marginBottom:8 }}>No orders yet</div>
                  <div style={{ color:COLORS.textMuted, fontSize:14 }}>Once customers place orders, they will appear here with full item and delivery details.</div>
                </div>
              ) : (
                <div style={{ display:"grid", gap:18 }}>
                  {orders.map((order) => {
                    const statusTheme = order.status === "Delivered"
                      ? { bg:"#dcfce7", color:"#166534" }
                      : order.status === "Processing"
                        ? { bg:"#fef3c7", color:"#92400e" }
                        : { bg:"#fee2e2", color:"#b91c1c" };

                    return (
                      <div key={order.id} style={{
                        background:COLORS.card,
                        border:`1px solid ${COLORS.border}`,
                        borderRadius:24,
                        overflow:"hidden",
                        boxShadow:"0 16px 40px rgba(15,23,42,0.06)",
                      }}>
                        <div style={{
                          padding:"20px 22px",
                          background:"linear-gradient(135deg, rgba(26,122,60,0.08), rgba(255,107,53,0.08))",
                          borderBottom:`1px solid ${COLORS.border}`,
                          display:"flex",
                          justifyContent:"space-between",
                          alignItems:"start",
                          gap:16,
                          flexWrap:"wrap",
                        }}>
                          <div>
                            <div style={{ fontSize:12, fontWeight:800, letterSpacing:"0.6px", color:COLORS.textMuted, textTransform:"uppercase", marginBottom:8 }}>Order ID</div>
                            <div style={{ fontSize:24, fontWeight:900, color:COLORS.primary, marginBottom:6 }}>{order.id}</div>
                            <div style={{ color:COLORS.textMuted, fontSize:13 }}>
                              {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" })}
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                            <span style={{ padding:"7px 12px", borderRadius:999, background:statusTheme.bg, color:statusTheme.color, fontSize:12, fontWeight:800 }}>
                              {order.status}
                            </span>
                            <span style={{ padding:"7px 12px", borderRadius:999, background:COLORS.primaryLight, color:COLORS.primary, fontSize:12, fontWeight:800 }}>
                              {formatPaymentLabel(order.payment)}
                            </span>
                            <span style={{ padding:"7px 12px", borderRadius:999, background:COLORS.accentLight, color:COLORS.accent, fontSize:12, fontWeight:800 }}>
                              ₹{order.total}
                            </span>
                          </div>
                        </div>

                        <div style={{ padding:22, display:"grid", gridTemplateColumns:isMobile ? "1fr" : "320px 1fr 180px", gap:20, alignItems:"start" }}>
                          <div style={{ background:"#fbfcfd", border:`1px solid ${COLORS.border}`, borderRadius:18, padding:18 }}>
                            <div style={{ fontSize:12, fontWeight:800, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Customer</div>
                            <div style={{ fontSize:18, fontWeight:800, color:COLORS.text, marginBottom:6 }}>{order.customerName}</div>
                            <div style={{ fontSize:13, color:COLORS.textMuted, marginBottom:4 }}>{order.customerEmail || order.deliveryProfile?.email || "No email provided"}</div>
                            <div style={{ fontSize:13, color:COLORS.textMuted, marginBottom:12 }}>{order.deliveryProfile?.phone || "No phone provided"}</div>
                            <div style={{ fontSize:13, lineHeight:1.7, color:COLORS.text }}>
                              {order.deliveryProfile?.address || "No address provided"}
                              <br />
                              {(order.deliveryProfile?.city || "City")} - {order.deliveryProfile?.pincode || "Pincode"}
                            </div>
                            <div style={{ marginTop:14, fontSize:12, color:COLORS.textMuted }}>
                              {order.delivery === "express" ? "Express delivery" : "Standard delivery"}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize:12, fontWeight:800, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Items Ordered</div>
                            <div style={{ display:"grid", gap:10 }}>
                              {order.items.map((item) => (
                                <div key={`${order.id}-${item.id}`} style={{ background:COLORS.bg, border:`1px solid ${COLORS.border}`, borderRadius:18, padding:"14px 16px", display:"flex", justifyContent:"space-between", gap:14, alignItems:"center" }}>
                                  <div>
                                    <div style={{ fontSize:15, fontWeight:800, color:COLORS.text }}>{item.image} {item.name}</div>
                                    <div style={{ fontSize:12, color:COLORS.textMuted, marginTop:4 }}>
                                      Qty {item.qty}{item.unit ? ` · ${item.unit}` : ""}
                                    </div>
                                  </div>
                                  <div style={{ textAlign:"right" }}>
                                    <div style={{ fontSize:14, fontWeight:800, color:COLORS.primary }}>₹{Number(item.price || 0) * Number(item.qty || 0)}</div>
                                    <div style={{ fontSize:12, color:COLORS.textMuted }}>₹{item.price} each</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ background:"#fffaf5", border:`1px solid ${COLORS.border}`, borderRadius:18, padding:18 }}>
                            <div style={{ fontSize:12, fontWeight:800, color:COLORS.textMuted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Actions</div>
                            <div style={{ display:"grid", gap:12 }}>
                              <div>
                                <div style={{ fontSize:12, color:COLORS.textMuted, marginBottom:6 }}>Update Status</div>
                                <select value={order.status} onChange={async (event) => {
                                  setActionMessage("");
                                  try {
                                    await onUpdateOrderStatus(order.id, event.target.value);
                                    setActionTone("success");
                                    setActionMessage(`Order ${order.id} updated.`);
                                  } catch (error) {
                                    setActionTone("error");
                                    setActionMessage(error.message || "Unable to update the order.");
                                  }
                                }} style={{ width:"100%", padding:"10px 12px", borderRadius:12, border:`1px solid ${COLORS.border}`, fontSize:13, fontFamily:FONT, outline:"none", cursor:"pointer", background:"#fff" }}>
                                  {["Confirmed", "Pending", "Processing", "Delivered"].map((status) => <option key={status}>{status}</option>)}
                                </select>
                              </div>
                              <div style={{ background:"#fff", border:`1px solid ${COLORS.border}`, borderRadius:14, padding:"12px 14px" }}>
                                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:COLORS.textMuted, marginBottom:8 }}>
                                  <span>Subtotal</span>
                                  <strong style={{ color:COLORS.text }}>₹{order.subtotal}</strong>
                                </div>
                                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:COLORS.textMuted, marginBottom:8 }}>
                                  <span>Shipping</span>
                                  <strong style={{ color:COLORS.text }}>₹{order.shippingFee}</strong>
                                </div>
                                <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:900, color:COLORS.primary, paddingTop:8, borderTop:`1px solid ${COLORS.border}` }}>
                                  <span>Total</span>
                                  <span>₹{order.total}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {adminPage === "messages" && (
            <div style={{ display:"grid", gap:16 }}>
              {messages.map((message) => (
                <div key={message.id} style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:20, padding:22 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:20, fontWeight:800, color:COLORS.text }}>{message.name}</div>
                      <div style={{ color:COLORS.textMuted, fontSize:13 }}>{message.email} {message.phone ? `· ${message.phone}` : ""}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:12, fontWeight:700, padding:"6px 12px", borderRadius:20, background:message.status === "Resolved" ? "#dcfce7" : "#dbeafe", color:message.status === "Resolved" ? "#166534" : "#1d4ed8" }}>{message.status}</span>
                      <select value={message.status} onChange={async (event) => {
                        setActionMessage("");
                        try {
                          await onUpdateMessageStatus(message.id, event.target.value);
                          setActionTone("success");
                          setActionMessage(`Message from ${message.name} updated.`);
                        } catch (error) {
                          setActionTone("error");
                          setActionMessage(error.message || "Unable to update the message.");
                        }
                      }} style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${COLORS.border}`, fontSize:12, fontFamily:FONT, outline:"none", cursor:"pointer" }}>
                        {["New", "In Progress", "Resolved"].map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ fontSize:14, color:COLORS.text, lineHeight:1.7 }}>{message.message}</div>
                  <div style={{ marginTop:12, fontSize:12, color:COLORS.textMuted }}>{new Date(message.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                </div>
              ))}
              {messages.length === 0 && <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:20, padding:28, color:COLORS.textMuted }}>No customer messages yet.</div>}
            </div>
          )}

          {adminPage === "reports" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:20 }}>
              {[
                ["Gross Revenue", `₹${sales.totalRevenue.toLocaleString()}`],
                ["Delivered Revenue", `₹${sales.deliveredRevenue.toLocaleString()}`],
                ["Average Order Value", `₹${sales.averageOrderValue.toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:20, padding:24 }}>
                  <div style={{ fontSize:13, color:COLORS.textMuted, marginBottom:8 }}>{label}</div>
                  <div style={{ fontSize:28, fontWeight:900, color:COLORS.primary }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminLoginPage({ onAdminLogin }) {
  const [form, setForm] = useState({ email:"owner@freshmart.in", password:"Owner@123" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const login = async () => {
    setError("");
    setSubmitting(true);
    try {
      await onAdminLogin(form);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight:"80vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:FONT }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ background:COLORS.card, borderRadius:28, padding:40, border:`2px solid ${COLORS.primary}33`, boxShadow:`0 20px 60px ${COLORS.primary}15` }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
            <h2 style={{ fontSize:26, fontWeight:900, color:COLORS.text, margin:"0 0 6px" }}>Owner Login</h2>
            <p style={{ color:COLORS.textMuted, margin:0, fontSize:14 }}>Separate access for product, order, message, and sales control</p>
          </div>
          {error && <div style={{ background:"#fff0f0", border:"1px solid #ffcccc", borderRadius:10, padding:"10px 14px", fontSize:13, color:COLORS.danger, marginBottom:16 }}>{error}</div>}
          <div style={{ fontSize:12, color:COLORS.textMuted, background:COLORS.bg, borderRadius:10, padding:12, marginBottom:20 }}>
            Default owner login: owner@freshmart.in / Owner@123
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <input type="email" placeholder="Owner email" value={form.email} onChange={(event) => setForm({ ...form, email:event.target.value })} style={{ padding:"13px 16px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none" }} />
            <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password:event.target.value })} onKeyDown={(event) => event.key === "Enter" && login()} style={{ padding:"13px 16px", borderRadius:12, border:`1.5px solid ${COLORS.border}`, fontSize:14, fontFamily:FONT, outline:"none" }} />
            <button onClick={login} style={{ background:`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`, color:"#fff", border:"none", borderRadius:14, padding:"14px", fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:FONT }}>
              {submitting ? "Checking..." : "Access Owner Dashboard →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [page, setPage] = useState("home");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(buildProfile());
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [adminData, setAdminData] = useState({ products: [], orders: [], messages: [], sales: { totalRevenue: 0, deliveredRevenue: 0, totalOrders: 0, averageOrderValue: 0, recentOrders: [] } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrapApp = async () => {
      const [catalogResult, userResult, adminResult] = await Promise.allSettled([
        apiRequest("/api/catalog"),
        apiRequest("/api/auth/me"),
        apiRequest("/api/admin/auth/me"),
      ]);

      if (!active) return;

      if (catalogResult.status === "fulfilled") {
        setProducts(catalogResult.value.products || DEFAULT_PRODUCTS);
      }

      if (userResult.status === "fulfilled") {
        setCurrentUser(userResult.value.user);
        setUserProfile(buildProfile(userResult.value.user.profile || userResult.value.user));
        setIsLoggedIn(true);
      } else {
        setCurrentUser(null);
        setUserProfile(buildProfile());
        setIsLoggedIn(false);
      }

      if (adminResult.status === "fulfilled") {
        setAdminUser(adminResult.value.admin);
      } else {
        setAdminUser(null);
      }

      setLoading(false);
    };

    bootstrapApp();
    return () => {
      active = false;
    };
  }, []);

  const loadCatalog = async () => {
    const data = await apiRequest("/api/catalog");
    setProducts(data.products || DEFAULT_PRODUCTS);
    return data.products || DEFAULT_PRODUCTS;
  };

  const addToCart = (product) => {
    setCart(c => {
      const ex = c.find(i => i.id === product.id);
      if (ex) return c.map(i => i.id===product.id ? {...i,qty:i.qty+1} : i);
      return [...c, {...product, qty:1}];
    });
  };

  const toggleWishlist = (id) => {
    setWishlist(w => w.includes(id) ? w.filter(i=>i!==id) : [...w, id]);
  };

  const handleSetSelectedProduct = (product) => {
    setSelectedProduct(product);
    if (product) setPage("product-detail");
  };

  const loadOrders = async () => {
    if (!isLoggedIn) {
      setOrders([]);
      return;
    }

    setLoadingOrders(true);
    try {
      const data = await apiRequest("/api/orders");
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [isLoggedIn]);

  const loadAdminDashboard = async () => {
    if (!adminUser) {
      setAdminData({ products: [], orders: [], messages: [], sales: { totalRevenue: 0, deliveredRevenue: 0, totalOrders: 0, averageOrderValue: 0, recentOrders: [] } });
      return;
    }

    const data = await apiRequest("/api/admin/dashboard");
    setAdminData(data);
    setProducts(data.products || []);
  };

  useEffect(() => {
    if (adminUser) {
      loadAdminDashboard().catch(() => {
        setAdminUser(null);
      });
    }
  }, [adminUser]);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setUserProfile(buildProfile(user.profile || user));
    setIsLoggedIn(true);
    setPage("profile");
  };

  const handleSaveProfile = async (profile) => {
    if (!currentUser) {
      throw new Error("Please sign in first.");
    }

    const nextProfile = buildProfile(profile);
    const data = await apiRequest("/api/profile", {
      method: "PUT",
      body: JSON.stringify(nextProfile),
    });
    setCurrentUser(data.user);
    setUserProfile(buildProfile(data.user.profile || data.user));
  };

  const handlePlaceOrder = async (orderPayload) => {
    const data = await apiRequest("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderPayload),
    });
    await loadOrders();
    if (adminUser) {
      await loadAdminDashboard();
    }
    return data.order;
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {
      // Logout should still clear local UI state even if the request fails.
    }
    setCurrentUser(null);
    setUserProfile(buildProfile());
    setOrders([]);
    setIsLoggedIn(false);
    setPage("home");
  };

  const handleAdminLogin = async ({ email, password }) => {
    const data = await apiRequest("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    setAdminUser(data.admin);
    setPage("admin");
  };

  const handleAdminLogout = async () => {
    try {
      await apiRequest("/api/admin/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {
      // Keep UI logout reliable even if the request fails.
    }
    setAdminUser(null);
    setPage("home");
  };

  const handleAdminSaveProduct = async (productPayload, productId) => {
    const endpoint = productId ? `/api/admin/products/${encodeURIComponent(productId)}` : "/api/admin/products";
    const method = productId ? "PUT" : "POST";
    await apiRequest(endpoint, { method, body: JSON.stringify(productPayload) });
    await loadAdminDashboard();
    await loadCatalog();
  };

  const handleAdminDeleteProduct = async (productId) => {
    await apiRequest(`/api/admin/products/${encodeURIComponent(productId)}`, { method: "DELETE", body: JSON.stringify({}) });
    await loadAdminDashboard();
    await loadCatalog();
  };

  const handleAdminUpdateOrderStatus = async (orderId, status) => {
    await apiRequest(`/api/admin/orders/${encodeURIComponent(orderId)}`, { method: "PUT", body: JSON.stringify({ status }) });
    await loadAdminDashboard();
    if (isLoggedIn) {
      await loadOrders();
    }
  };

  const handleAdminUpdateMessageStatus = async (messageId, status) => {
    await apiRequest(`/api/admin/messages/${encodeURIComponent(messageId)}`, { method: "PUT", body: JSON.stringify({ status }) });
    await loadAdminDashboard();
  };

  if (loading) return (
    <div style={{
      position:"fixed", inset:0, background:"linear-gradient(135deg, #e8f5ed, #f0fff4)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:FONT, zIndex:9999,
    }}>
      <div style={{ position:"relative", marginBottom:24 }}>
        <div style={{
          width:80, height:80, borderRadius:"50%",
          border:`4px solid ${COLORS.primary}22`,
          borderTop:`4px solid ${COLORS.primary}`,
          animation:"spin 0.8s linear infinite",
        }}/>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>🛒</div>
      </div>
      <div style={{ fontSize:26, fontWeight:900 }}>
        <span style={{ color:COLORS.primary }}>Fresh</span><span style={{ color:COLORS.accent }}>Mart</span>
      </div>
      <div style={{ color:COLORS.textMuted, marginTop:6, fontSize:14 }}>Loading your store...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const dmStyle = darkMode ? {
    "--dm-bg": "#0f141e",
    "--dm-card": "#1a2035",
    "--dm-text": "#f0f0f0",
    "--dm-border": "#ffffff15",
    filter: "none",
  } : {};

  if (page === "admin" && adminUser) return <AdminDashboard adminUser={adminUser} adminData={adminData} setPage={setPage} onAdminLogout={handleAdminLogout} onSaveProduct={handleAdminSaveProduct} onDeleteProduct={handleAdminDeleteProduct} onUpdateOrderStatus={handleAdminUpdateOrderStatus} onUpdateMessageStatus={handleAdminUpdateMessageStatus} />;
  if (page === "admin" && !adminUser) return (
    <div style={{ background: darkMode ? "#0f141e" : COLORS.bg, minHeight:"100vh" }}>
      <Navbar page={page} setPage={setPage} cartCount={cart.reduce((s,i)=>s+i.qty,0)} wishlistCount={wishlist.length} darkMode={darkMode} setDarkMode={setDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isLoggedIn={isLoggedIn} currentUser={currentUser} adminUser={adminUser} onOpenAdmin={() => setPage("admin")} onLogout={handleLogout} />
      <AdminLoginPage onAdminLogin={handleAdminLogin} />
    </div>
  );

  return (
    <div style={{ background: darkMode ? "#0f141e" : COLORS.bg, minHeight:"100vh", transition:"background 0.3s", ...dmStyle }}>
      {!isMobile && (
        <style>{`
          html, body, button, a, input, textarea, select, [role="button"] {
            cursor: ${CUSTOM_CURSOR};
          }

          button, a, input[type="submit"], input[type="button"], select, summary, [role="button"] {
            cursor: ${CUSTOM_CURSOR_ACTIVE};
          }
        `}</style>
      )}
      <style>{`
        button {
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease, opacity 180ms ease;
          will-change: transform;
        }

        button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
          filter: saturate(1.03);
        }

        button:not(:disabled):active {
          transform: translateY(0) scale(0.985);
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
        }

        button:disabled {
          cursor: not-allowed;
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <Navbar
        page={page} setPage={p => { setSelectedProduct(null); setPage(p); }}
        cartCount={cart.reduce((s,i)=>s+i.qty,0)}
        wishlistCount={wishlist.length}
        darkMode={darkMode} setDarkMode={setDarkMode}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        isLoggedIn={isLoggedIn} currentUser={currentUser} adminUser={adminUser} onOpenAdmin={() => setPage("admin")} onLogout={handleLogout}
      />
      {page === "home" && <HomePage setPage={setPage} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlist={wishlist} darkMode={darkMode} setSelectedProduct={handleSetSelectedProduct} products={products} />}
      {page === "products" && <ProductsPage onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlist={wishlist} initialSearch={searchQuery} setSelectedProduct={handleSetSelectedProduct} products={products} />}
      {page === "product-detail" && selectedProduct && <ProductDetailPage product={selectedProduct} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlist={wishlist} setSelectedProduct={handleSetSelectedProduct} products={products} />}
      {page === "cart" && <CartPage cart={cart} setCart={setCart} setPage={setPage} />}
      {page === "checkout" && <CheckoutPage cart={cart} setCart={setCart} setPage={setPage} userProfile={userProfile} onSaveProfile={handleSaveProfile} onPlaceOrder={handlePlaceOrder} />}
      {page === "login" && <AuthPage setPage={setPage} onAuthSuccess={handleAuthSuccess} />}
      {page === "profile" && isLoggedIn && <ProfilePage currentUser={currentUser} userProfile={userProfile} onSaveProfile={handleSaveProfile} setPage={setPage} />}
      {page === "profile" && !isLoggedIn && <AuthPage setPage={setPage} onAuthSuccess={handleAuthSuccess} />}
      {page === "orders" && isLoggedIn && <OrdersPage orders={orders} loadingOrders={loadingOrders} setPage={setPage} />}
      {page === "orders" && !isLoggedIn && <AuthPage setPage={setPage} onAuthSuccess={handleAuthSuccess} />}
      {page === "wishlist" && <WishlistPage wishlist={wishlist} onToggleWishlist={toggleWishlist} onAddToCart={addToCart} setSelectedProduct={handleSetSelectedProduct} products={products} />}
      {page === "contact" && <ContactPage currentUser={currentUser} />}
    </div>
  );
}
