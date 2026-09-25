import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { ShoppingCart, Heart, Truck, Check, RefreshCcw, ArrowLeft, Star } from "lucide-react";
import { getPlaceholderImage } from "../utils/placeholder";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist, removeFromWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("desc");

  // Success state for add button
  const [added, setAdded] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const fetchReviews = async (productId) => {
    try {
      setLoadingReviews(true);
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", productId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const revs = [];
      querySnapshot.forEach((doc) => {
        revs.push({ id: doc.id, ...doc.data() });
      });
      setReviews(revs);
    } catch (error) {
      // If index is missing, it might fail. Fallback without order by.
      if (error.message && error.message.includes("index")) {
        console.warn("Missing index, fetching reviews without ordering.");
        try {
          const qFallback = query(collection(db, "reviews"), where("productId", "==", productId));
          const querySnapshot = await getDocs(qFallback);
          const revs = [];
          querySnapshot.forEach((doc) => revs.push({ id: doc.id, ...doc.data() }));
          // Sort manually
          revs.sort((a, b) => {
            const tA = a.createdAt ? a.createdAt.toMillis() : 0;
            const tB = b.createdAt ? b.createdAt.toMillis() : 0;
            return tB - tA;
          });
          setReviews(revs);
        } catch (fbErr) {
          console.error("Error fetching reviews (fallback):", fbErr);
        }
      } else {
        console.error("Error fetching reviews:", error);
      }
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          let categoryName = data.categoryName || "";
          let subcategoryName = data.subcategoryName || "";

          if (data.category && !categoryName) {
            try {
              const catSnap = await getDoc(doc(db, "categories", data.category));
              if (catSnap.exists()) {
                categoryName = catSnap.data().name || "";
              }
            } catch (err) {
              console.error("Error fetching category name:", err);
            }
          }

          if (data.subcategory && !subcategoryName) {
            try {
              const subSnap = await getDoc(doc(db, "subcategories", data.subcategory));
              if (subSnap.exists()) {
                subcategoryName = subSnap.data().name || "";
              }
            } catch (err) {
              console.error("Error fetching subcategory name:", err);
            }
          }

          setProduct({
            id: docSnap.id,
            ...data,
            categoryName,
            subcategoryName
          });

          // Track recently viewed product ID
          try {
            const viewed = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
            const filtered = viewed.filter(vId => vId !== docSnap.id);
            filtered.unshift(docSnap.id);
            localStorage.setItem("recently_viewed", JSON.stringify(filtered.slice(0, 8)));
          } catch (err) {
            console.error("Error saving recently viewed product ID:", err);
          }

          // Set primary image or first image as default
          if (data.images?.length > 0) {
            const primary = data.images.find(img => img.isPrimary);
            setSelectedImage(primary?.url || data.images[0]?.url);
          } else {
            setSelectedImage(getPlaceholderImage(600, 600, "No Image Available"));
          }

          // Set first variant as default if exists
          if (data.variants?.length > 0) {
            setSelectedVariant(data.variants[0]);
          }

          // Fetch reviews for the loaded product
          fetchReviews(docSnap.id);
        } else {
          console.error("No such product!");
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div style={{ paddingTop: "140px", paddingBottom: "100px", minHeight: "80vh" }} className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }} className="details-grid-loading">
          <div className="shimmer" style={{ height: "450px", borderRadius: "24px" }}></div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="shimmer" style={{ height: "40px", width: "70%", borderRadius: "8px" }}></div>
            <div className="shimmer" style={{ height: "24px", width: "40%", borderRadius: "8px" }}></div>
            <div className="shimmer" style={{ height: "80px", width: "90%", borderRadius: "8px" }}></div>
            <div className="shimmer" style={{ height: "50px", width: "50%", borderRadius: "8px" }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ paddingTop: "140px", paddingBottom: "100px", textAlign: "center", minHeight: "60vh" }}>
        <h2 style={{ marginBottom: "16px" }}>Product Not Found</h2>
        <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const maxAvailableStock = selectedVariant
    ? Number(selectedVariant.stock || 0)
    : Number(product.stock || 0);

  const isOutOfStock = maxAvailableStock <= 0;

  const baseOriginalPrice = Number(product.price || 0);
  const baseSalePrice = Number(product.salePrice || baseOriginalPrice);
  const originalPrice = selectedVariant ? Number(selectedVariant.price || baseOriginalPrice) : baseOriginalPrice;
  
  let currentPrice = baseSalePrice;
  if (selectedVariant) {
    if (selectedVariant.salePrice) {
      currentPrice = Number(selectedVariant.salePrice);
    } else if (baseOriginalPrice > 0 && baseOriginalPrice > baseSalePrice) {
      currentPrice = Math.round(originalPrice * (baseSalePrice / baseOriginalPrice));
    } else {
      currentPrice = originalPrice;
    }
  }

  const hasDiscount = originalPrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedVariant, quantity);
    
    // Remove from wishlist if present
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    const variantKey = selectedVariant ? selectedVariant.sku || selectedVariant.size : "default";

    const getProductImage = (p) => {
      if (!p?.images?.length) return getPlaceholderImage(400, 400, "Product");
      const primary = p.images.find(img => img.isPrimary);
      return primary?.url || p.images[0]?.url;
    };

    const buyNowItem = {
      id: product.id,
      name: product.name,
      price: originalPrice,
      salePrice: currentPrice,
      image: getProductImage(product),
      sku: selectedVariant ? selectedVariant.sku : (product.sku || product.id),
      variantKey,
      variantSize: selectedVariant ? selectedVariant.size : null,
      sellerId: product.sellerId || "default",
      quantity,
    };

    navigate("/checkout", { state: { buyNowItem } });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setReviewError("Please log in to submit a review.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setReviewError("Rating must be between 1 and 5.");
      return;
    }
    if (!comment.trim()) {
      setReviewError("Please provide a text review.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    try {
      const newReview = {
        productId: product.id,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email.split("@")[0] || "User",
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: serverTimestamp()
      };

      // 1. Add to reviews collection
      await addDoc(collection(db, "reviews"), newReview);

      // 2. Update averageRating and reviewCount in product document
      const currentCount = product.reviewCount || 0;
      const currentAvg = product.averageRating || 0;
      
      const newCount = currentCount + 1;
      const newAvg = ((currentAvg * currentCount) + Number(rating)) / newCount;

      const productRef = doc(db, "products", product.id);
      await updateDoc(productRef, {
        reviewCount: newCount,
        averageRating: newAvg
      });

      // Update local state
      setProduct(prev => ({
        ...prev,
        reviewCount: newCount,
        averageRating: newAvg
      }));

      setComment("");
      setRating(5);
      
      // Refresh reviews list
      fetchReviews(product.id);
    } catch (err) {
      console.error("Error submitting review:", err);
      setReviewError("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const descText = product?.description || "No description provided for this premium Vistaraa product. It offers excellent style, durability, and satisfies top quality parameters.";
  const showReadMore = descText.length > 300;
  const displayedDesc = showReadMore && !isDescExpanded
    ? descText.substring(0, 300) + "..."
    : descText;

  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <div className="container" style={{ maxWidth: "1280px", margin: "0 auto", paddingLeft: "20px", paddingRight: "20px" }}>
        {/* Back Link */}
        <Link to="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "28px" }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        {/* ================= AREA 1: TOP PRODUCT SECTION (TWO COLUMNS) ================= */}
        <div className="details-top-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "50px", alignItems: "start" }}>

          {/* LEFT COLUMN: Sticky Product Image Gallery */}
          <div className="details-gallery-sticky" style={{ position: "sticky", top: "110px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Main Product Image Container */}
            <div className="glass-card" style={{
              width: "100%",
              aspectRatio: "1 / 1",
              position: "relative",
              borderRadius: "24px",
              overflow: "hidden",
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.03)"
            }}>
              <img
                src={selectedImage}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  padding: "16px",
                  transition: "all 0.3s ease"
                }}
              />
            </div>

            {/* Thumbnails List */}
            {product.images?.length > 1 && (
              <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "6px", scrollbarWidth: "thin" }} className="gallery-thumbnails-row">
                {product.images.map((img, index) => {
                  const isSelected = selectedImage === img.url;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img.url)}
                      style={{
                        width: "80px",
                        height: "80px",
                        minWidth: "80px",
                        borderRadius: "14px",
                        overflow: "hidden",
                        background: "#ffffff",
                        border: isSelected ? "2.5px solid var(--primary)" : "1.5px solid var(--border-color)",
                        padding: "4px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isSelected ? "0 4px 12px rgba(99, 102, 241, 0.15)" : "none"
                      }}
                      className="thumbnail-btn"
                    >
                      <img src={img.url} alt={`Thumbnail ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Product Information & Purchase Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Title & Category */}
            <div>
              <span style={{
                fontSize: "12px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--primary)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "8px"
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }}></span>
                {product.categoryName || "General"}
              </span>
              <h1 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: "900", lineHeight: "1.25", marginBottom: "12px", color: "var(--text-main)" }}>
                {product.name}
              </h1>

              {/* Rating & Reviews summary */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "var(--text-muted)" }}>
                <div style={{ display: "flex", color: "#f59e0b" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.round(product.averageRating || 0) ? "#f59e0b" : "none"} color={i < Math.round(product.averageRating || 0) ? "#f59e0b" : "var(--text-muted)"} />
                  ))}
                </div>
                <span style={{ fontWeight: "700", color: "var(--text-main)", marginLeft: "4px" }}>
                  {Number(product.averageRating || 0).toFixed(1)}
                </span>
                <span>({product.reviewCount || 0} customer reviews)</span>
              </div>
            </div>

            {/* Pricing Box */}
            <div style={{ padding: "20px 24px", borderRadius: "20px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "0.05em" }}>CURRENT PRICE</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-main)" }}>₹{currentPrice.toLocaleString()}</span>
                  {hasDiscount && (
                    <span style={{ fontSize: "16px", color: "var(--text-muted)", textDecoration: "line-through" }}>₹{originalPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>

              {hasDiscount && (
                <span className="badge badge-sale" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: "800" }}>
                  SAVE {discountPercent}%
                </span>
              )}
            </div>

            {/* Key Highlights */}
            {Array.isArray(product.productHighlights) && product.productHighlights.length > 0 && (
              <div style={{ padding: "18px 22px", borderRadius: "20px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)", display: "block", marginBottom: "10px" }}>
                  Key Highlights
                </span>
                <ul style={{ display: "flex", flexDirection: "column", gap: "8px", margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {product.productHighlights.map((hl, idx) => (
                    <li key={idx} style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "10px", lineHeight: "1.4" }}>
                      <span style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "14px" }}>✓</span> {hl}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variants Selector */}
            {product.variants?.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: "800", textTransform: "uppercase", color: "var(--text-muted)" }}>Select Variant / Size</span>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {product.variants.map((v, i) => {
                    const isActive = selectedVariant?.sku === v.sku;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(v)}
                        className={`variant-select-btn ${isActive ? "active" : "inactive"}`}
                      >
                        {v.size} {Number(v.stock) <= 5 && <span style={{ color: "var(--error)", fontSize: "10px" }}>({v.stock} left)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Purchase Controls Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Quantity Selector & Wishlist */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--border-color)",
                  borderRadius: "16px",
                  padding: "4px",
                  background: "var(--bg-card)"
                }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    style={{ width: "40px", height: "40px", border: "none", background: "none", cursor: "pointer", fontSize: "18px", fontWeight: "700" }}
                  >
                    -
                  </button>
                  <span style={{ width: "32px", textAlign: "center", fontWeight: "700" }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(maxAvailableStock, q + 1))}
                    disabled={quantity >= maxAvailableStock}
                    style={{ 
                      width: "40px", 
                      height: "40px", 
                      border: "none", 
                      background: "none", 
                      cursor: quantity >= maxAvailableStock ? "not-allowed" : "pointer", 
                      fontSize: "18px", 
                      fontWeight: "700",
                      opacity: quantity >= maxAvailableStock ? 0.3 : 1 
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "50px",
                    height: "50px",
                    borderRadius: "16px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                    color: isInWishlist(product.id) ? "var(--error)" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    flexShrink: 0
                  }}
                  className="details-wishlist-btn"
                  title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={20} fill={isInWishlist(product.id) ? "var(--error)" : "none"} />
                </button>
              </div>

              {/* Add to Cart & Buy Now Buttons */}
              <div style={{ display: "flex", gap: "16px" }}>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`add-to-cart-btn ${added ? "added-state" : ""}`}
                >
                  {isOutOfStock ? (
                    "Sold Out"
                  ) : added ? (
                    <>
                      <Check size={18} /> Added!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} /> Add to Cart
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="btn btn-primary buy-now-btn"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Shipping Serviceability Badge */}
            <div style={{ padding: "16px 20px", border: "1px solid var(--border-color)", borderRadius: "18px", background: "var(--primary-glow)" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--primary)" }}>
                <Truck size={18} />
                <span style={{ fontSize: "13px", fontWeight: "700" }}>Shiprocket Courier Serviceability</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", lineHeight: "1.4" }}>
                Add this item to cart and proceed to checkout to check real-time courier shipping charges to your pincode.
              </p>
            </div>
          </div>

        </div>

        {/* ================= AREA 2: BELOW PRODUCT SECTION (FULL-WIDTH LAYOUT) ================= */}
        <div className="details-fullwidth-section" style={{ marginTop: "60px", paddingTop: "40px", borderTop: "1px solid var(--border-color)", width: "100%" }}>
          
          {/* Full-Width Navigation Tabs */}
          <div style={{ display: "flex", borderBottom: "2px solid var(--border-color)", gap: "32px", marginBottom: "32px" }}>
            <button
              onClick={() => setActiveTab("desc")}
              style={{
                paddingBottom: "16px",
                border: "none",
                background: "none",
                borderBottom: activeTab === "desc" ? "3px solid var(--primary)" : "3px solid transparent",
                marginBottom: "-2px",
                color: activeTab === "desc" ? "var(--primary)" : "var(--text-muted)",
                fontWeight: "800",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              style={{
                paddingBottom: "16px",
                border: "none",
                background: "none",
                borderBottom: activeTab === "specs" ? "3px solid var(--primary)" : "3px solid transparent",
                marginBottom: "-2px",
                color: activeTab === "specs" ? "var(--primary)" : "var(--text-muted)",
                fontWeight: "800",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              style={{
                paddingBottom: "16px",
                border: "none",
                background: "none",
                borderBottom: activeTab === "reviews" ? "3px solid var(--primary)" : "3px solid transparent",
                marginBottom: "-2px",
                color: activeTab === "reviews" ? "var(--primary)" : "var(--text-muted)",
                fontWeight: "800",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Reviews ({product.reviewCount || 0})
            </button>
          </div>

          {/* Tab Content Area (Full-Width) */}
          <div style={{ width: "100%" }}>
            {activeTab === "desc" ? (
              <div style={{ width: "100%", background: "var(--bg-card)", padding: "28px 32px", borderRadius: "20px", border: "1px solid var(--border-color)" }}>
                <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: "1.8", whiteSpace: "pre-line" }}>
                  {displayedDesc}
                </p>
                {showReadMore && (
                  <button
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontWeight: "700",
                      fontSize: "15px",
                      cursor: "pointer",
                      padding: "8px 0",
                      marginTop: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                    className="read-more-btn"
                  >
                    {isDescExpanded ? "Read Less ↑" : "Read More ↓"}
                  </button>
                )}
              </div>
            ) : activeTab === "specs" ? (
              (() => {
                const validSpecs = [];
                if (product.categoryName) validSpecs.push({ name: "Category", value: product.categoryName });
                if (product.subcategoryName) validSpecs.push({ name: "Subcategory", value: product.subcategoryName });
                if (product.brand) validSpecs.push({ name: "Brand", value: product.brand });
                if (product.hsn) validSpecs.push({ name: "HSN Code", value: product.hsn });

                if (Array.isArray(product.specifications)) {
                  product.specifications.forEach(s => {
                    if (s && s.name && String(s.name).trim() && s.value && String(s.value).trim()) {
                      validSpecs.push({ name: String(s.name).trim(), value: String(s.value).trim() });
                    }
                  });
                } else if (typeof product.specifications === "object" && product.specifications !== null) {
                  Object.entries(product.specifications).forEach(([k, v]) => {
                    if (k && String(k).trim() && v && String(v).trim()) {
                      validSpecs.push({ name: String(k).trim(), value: String(v).trim() });
                    }
                  });
                }

                if (validSpecs.length === 0) {
                  return (
                    <div style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px", background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
                      No specifications available for this product.
                    </div>
                  );
                }

                const displayedSpecs = isSpecsExpanded ? validSpecs : validSpecs.slice(0, 5);

                return (
                  <div style={{ width: "100%" }}>
                    <div
                      className="specs-table-wrapper"
                      style={{
                        maxWidth: "880px",
                        width: "100%",
                        margin: "0 auto",
                        border: "1px solid var(--border-color)",
                        borderRadius: "16px",
                        overflow: "hidden",
                        background: "var(--bg-card)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                      }}
                    >
                      {/* Table Header */}
                      <div style={{ display: "grid", gridTemplateColumns: "45% 55%", background: "var(--primary-glow)", borderBottom: "1px solid var(--border-color)" }}>
                        <div style={{ padding: "12px 20px", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", borderRight: "1px solid var(--border-color)" }}>
                          Specification
                        </div>
                        <div style={{ padding: "12px 20px", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                          Value
                        </div>
                      </div>

                      {/* Table Rows */}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {displayedSpecs.map((spec, idx) => (
                          <div
                            key={idx}
                            className="compact-spec-row"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "45% 55%",
                              borderBottom: idx === displayedSpecs.length - 1 ? "none" : "1px solid var(--border-color)",
                              background: idx % 2 === 1 ? "rgba(0, 0, 0, 0.015)" : "transparent"
                            }}
                          >
                            <div style={{ padding: "12px 20px", fontWeight: "600", fontSize: "14px", color: "var(--text-main)", borderRight: "1px solid var(--border-color)", display: "flex", alignItems: "center" }}>
                              {spec.name}
                            </div>
                            <div style={{ padding: "12px 20px", fontWeight: "400", fontSize: "14px", color: "var(--text-main)", display: "flex", alignItems: "center", wordBreak: "break-word" }}>
                              {spec.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Show More / Show Less Toggle Button */}
                    {validSpecs.length > 5 && (
                      <div style={{ textAlign: "center", paddingTop: "20px" }}>
                        <button
                          onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--primary)",
                            fontWeight: "700",
                            fontSize: "14px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                          className="show-more-specs-btn"
                        >
                          {isSpecsExpanded ? "Show Less ↑" : "Show More ↓"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              /* Reviews Tab (Full-Width) */
              <div style={{ display: "flex", flexDirection: "column", gap: "32px", width: "100%" }}>
                {/* Reviews List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", margin: 0 }}>Customer Reviews</h3>
                  {loadingReviews ? (
                    <div className="shimmer" style={{ height: "120px", borderRadius: "16px" }}></div>
                  ) : reviews.length === 0 ? (
                    <div style={{ padding: "32px", borderRadius: "20px", background: "var(--bg-card)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                      <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: 0 }}>No reviews yet for this product. Be the first to write a review!</p>
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} style={{ padding: "20px 24px", borderRadius: "18px", border: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontWeight: "800", fontSize: "15px" }}>{rev.userName || "Customer"}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {rev.createdAt ? new Date(rev.createdAt.toMillis ? rev.createdAt.toMillis() : rev.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <div style={{ display: "flex", color: "#f59e0b", marginBottom: "10px" }}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={15} fill={i < rev.rating ? "#f59e0b" : "none"} color={i < rev.rating ? "#f59e0b" : "var(--text-muted)"} />
                          ))}
                        </div>
                        <p style={{ fontSize: "14px", color: "var(--text-main)", lineHeight: "1.6", margin: 0 }}>{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Submit Review Form */}
                {auth.currentUser ? (
                  <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "28px 32px", borderRadius: "20px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: "800", margin: 0 }}>Write a Customer Review</h4>
                    {reviewError && <p style={{ color: "var(--error)", fontSize: "13px", margin: 0 }}>{reviewError}</p>}
                    
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Your Rating</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            <Star size={26} fill={star <= rating ? "#f59e0b" : "none"} color={star <= rating ? "#f59e0b" : "var(--text-muted)"} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Your Review</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this product..."
                        rows={4}
                        className="form-input"
                        style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border-color)", resize: "none" }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn btn-primary"
                      style={{ alignSelf: "flex-start", padding: "12px 28px", fontSize: "14px", fontWeight: "700" }}
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                ) : (
                  <div style={{ padding: "24px", borderRadius: "18px", background: "var(--bg-card)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "14px" }}>Log in to submit a review.</p>
                    <Link to="/auth" className="btn btn-secondary" style={{ padding: "8px 24px", fontSize: "13px" }}>Login</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Custom Styles for Responsive Grid & Sticky Behavior */}
      <style>{`
        @media (max-width: 991px) {
          .details-top-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .details-gallery-sticky {
            position: relative !important;
            top: 0 !important;
          }
          .spec-row {
            grid-template-columns: 40% 60% !important;
            padding: 14px 20px !important;
          }
        }
        .spec-row:nth-child(even) {
          background: rgba(0, 0, 0, 0.015);
        }
        .thumbnail-btn:hover {
          border-color: var(--primary) !important;
          transform: translateY(-2px);
        }
        .details-wishlist-btn:hover {
          transform: translateY(-2px);
          border-color: var(--card-border-hover);
          color: var(--error) !important;
          box-shadow: var(--shadow-sm);
        }
        .details-wishlist-btn:active {
          transform: translateY(0);
        }
        .variant-select-btn {
          padding: 10px 20px;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .variant-select-btn.active {
          border: 2px solid var(--primary);
          background: var(--primary-glow);
          color: var(--primary);
        }
        .variant-select-btn.inactive {
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-main);
        }
        .variant-select-btn.inactive:hover {
          background: var(--border-color);
          border-color: var(--text-muted);
          transform: translateY(-1px);
        }
        .add-to-cart-btn {
          flex: 1;
          padding: 16px;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          background: var(--bg-card);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .add-to-cart-btn:hover:not(:disabled) {
          background: var(--border-color);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
        .add-to-cart-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .add-to-cart-btn:disabled {
          background: var(--border-color);
          color: var(--text-muted);
          border-color: transparent;
          cursor: not-allowed;
        }
        .add-to-cart-btn.added-state {
          background: var(--success);
          color: white;
          border-color: transparent;
        }
        .buy-now-btn {
          flex: 1;
          padding: 16px;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .buy-now-btn:disabled {
          background: var(--border-color) !important;
          color: var(--text-muted) !important;
          cursor: not-allowed;
          box-shadow: none !important;
        }
        .read-more-btn {
          transition: opacity 0.2s ease;
        }
        .read-more-btn:hover {
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}
