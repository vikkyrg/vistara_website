import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, ShieldCheck, Truck, CreditCard, Headphones } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer style={{
      background: "#090a0f",
      color: "#f8fafc",
      padding: "60px 0 30px",
      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    }}>
      <div className="container" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "40px",
        marginBottom: "40px"
      }}>
        {/* Brand Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{
            background: "#ffffff",
            padding: "8px 16px",
            borderRadius: "12px",
            width: "fit-content",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)"
          }}>
            <Logo size={36} />
          </div>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6" }}>
            Experience the pinnacle of curated lifestyle shopping. Discover handpicked fashion, cutting-edge electronics, and stunning accessories.
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <a href="#" className="footer-social-link"><FaFacebook size={18} /></a>
            <a href="#" className="footer-social-link"><FaTwitter size={18} /></a>
            <a href="#" className="footer-social-link"><FaInstagram size={18} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ color: "white", fontSize: "16px", fontWeight: "700" }}>Quick Links</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
            <li><Link to="/" className="footer-nav-link">Home</Link></li>
            <li><Link to="/shop" className="footer-nav-link">Shop Catalog</Link></li>
            <li><Link to="/about" className="footer-nav-link">About Us</Link></li>
            <li><Link to="/contact" className="footer-nav-link">Contact Us</Link></li>
            <li><Link to="/dashboard" className="footer-nav-link">Order Tracking</Link></li>
          </ul>
        </div>

        {/* Customer Support */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ color: "white", fontSize: "16px", fontWeight: "700" }}>Contact Us</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "#94a3b8" }}>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <MapPin size={16} style={{ marginTop: "3px", flexShrink: 0, color: "var(--primary)" }} />
              <span>Ground Floor, Rajiv Gandhi Nagar, Karatgi, Karnataka - 583229</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Phone size={16} style={{ flexShrink: 0, color: "var(--primary)" }} />
              <span>+91 70195 12273</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={16} style={{ flexShrink: 0, color: "var(--primary)" }} />
              <span>support@vistaraa.in</span>
            </li>
          </ul>
        </div>

        {/* Our Guarantees */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h4 style={{ color: "white", fontSize: "16px", fontWeight: "700" }}>Our Guarantees</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "#94a3b8" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldCheck size={18} style={{ color: "var(--primary)" }} />
              <span>Premium Quality Assured</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Truck size={18} style={{ color: "var(--primary)" }} />
              <span>Fast & Reliable Delivery</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CreditCard size={18} style={{ color: "var(--primary)" }} />
              <span>100% Secure Checkout</span>
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Headphones size={18} style={{ color: "var(--primary)" }} />
              <span>24/7 Customer Support</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container" style={{
        paddingTop: "24px",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        fontSize: "12px",
        color: "#64748b"
      }}>
        <span>&copy; {new Date().getFullYear()} Vistaraa Retail Pvt. Ltd. All rights reserved.</span>
        <div style={{ display: "flex", gap: "16px" }}>
          <Link to="/privacy-policy" className="footer-bottom-link">Privacy Policy</Link>
          <Link to="/terms-of-service" className="footer-bottom-link">Terms of Service</Link>
        </div>
      </div>

      <style>{`
        .footer-nav-link {
          display: inline-block;
          color: #94a3b8;
          transition: all 0.2s ease;
        }
        .footer-nav-link:hover {
          color: white !important;
          transform: translateX(4px);
        }
        .footer-social-link {
          color: #94a3b8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
        }
        .footer-social-link:hover {
          color: white !important;
          background: var(--primary);
          transform: translateY(-3px);
          box-shadow: 0 4px 12px var(--primary-glow);
        }
        .footer-input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px var(--primary-glow);
        }
        .footer-btn:hover {
          background: var(--primary-hover) !important;
          transform: scale(1.05);
        }
        .footer-bottom-link {
          color: #64748b;
          transition: color 0.2s ease;
        }
        .footer-bottom-link:hover {
          color: white !important;
        }
      `}</style>
    </footer>
  );
}
