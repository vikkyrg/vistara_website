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
      <div className="container">
        {/* Back Link */}
        <Link to="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "32px" }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        {/* Product Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }} className="details-layout-grid">

          {/* Left: Images Gallery */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="glass-card" style={{
              width: "100%",
              paddingBottom: "100%",
              position: "relative",
              borderRadius: "24px",
              overflow: "hidden",
              background: "#f8fafc"
            }}>
              <img
                src={selectedImage}
                alt={product.name}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "all 0.3s ease"
                }}
              />
            </div>

            {/* Thumbnails list */}
            {product.images?.length > 1 && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img.url)}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: selectedImage === img.url ? "2px solid var(--primary)" : "2px solid var(--border-color)",
                      padding: 0,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <img src={img.url} alt={`Thumbnail ${index}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <span style={{
                fontSize: "12px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "8px"
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }}></span>
                {product.categoryName || "General"}
              </span>
              <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "900", lineHeight: "1.2", marginBottom: "12px" }}>
                {product.name}
              </h1>

              {/* Reviews UI */}
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

            {/* Pricing Section */}
            <div style={{ padding: "20px", borderRadius: "18px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>CURRENT PRICE</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
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

            {/* Purchase Control Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Row 1: Quantity and Wishlist */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                {/* Quantity selectors */}
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

                {/* Wishlist toggle button */}
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

              {/* Row 2: Add to Cart and Buy Now Buttons */}
              <div style={{ display: "flex", gap: "16px" }}>
                {/* Add to Cart button */}
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

                {/* Buy Now button */}
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="btn btn-primary buy-now-btn"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Shipping Info Card */}
            <div style={{ padding: "16px", border: "1px solid var(--border-color)", borderRadius: "18px", background: "var(--primary-glow)" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--primary)" }}>
                <Truck size={18} />
                <span style={{ fontSize: "13px", fontWeight: "700" }}>Shiprocket Courier Serviceability</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", lineHeight: "1.4" }}>
                Add this item to cart and proceed to checkout to check real-time courier shipping charges to your pincode.
              </p>
            </div>

            {/* Description Tab selectors */}
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "24px", marginBottom: "16px" }}>
                <button
                  onClick={() => setActiveTab("desc")}
                  style={{
                    paddingBottom: "12px",
                    border: "none",
                    background: "none",
                    borderBottom: activeTab === "desc" ? "2px solid var(--primary)" : "none",
                    color: activeTab === "desc" ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab("specs")}
                  style={{
                    paddingBottom: "12px",
                    border: "none",
                    background: "none",
                    borderBottom: activeTab === "specs" ? "2px solid var(--primary)" : "none",
                    color: activeTab === "specs" ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Specifications
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  style={{
                    paddingBottom: "12px",
                    border: "none",
                    background: "none",
                    borderBottom: activeTab === "reviews" ? "2px solid var(--primary)" : "none",
                    color: activeTab === "reviews" ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Reviews ({product.reviewCount || 0})
                </button>
              </div>

              {activeTab === "desc" ? (
                <div>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.7", whiteSpace: "pre-line" }}>
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
                        fontSize: "14px",
                        cursor: "pointer",
                        padding: "4px 0",
                        marginTop: "8px",
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
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                    <span style={{ fontWeight: "700" }}>HSN Code</span>
                    <span>{product.hsn || "N/A"}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                    <span style={{ fontWeight: "700" }}>Category</span>
                    <span>{product.categoryName || "General"}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                    <span style={{ fontWeight: "700" }}>Subcategory</span>
                    <span>{product.subcategoryName || "N/A"}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Reviews List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "800" }}>Customer Reviews</h3>
                    {loadingReviews ? (
                      <div className="shimmer" style={{ height: "100px", borderRadius: "12px" }}></div>
                    ) : reviews.length === 0 ? (
                      <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>No reviews yet. Be the first to review this product!</p>
                    ) : (
                      reviews.map((rev) => (
                        <div key={rev.id} style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontWeight: "700", fontSize: "14px" }}>{rev.userName || "Customer"}</span>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                              {rev.createdAt ? new Date(rev.createdAt.toMillis ? rev.createdAt.toMillis() : rev.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                          <div style={{ display: "flex", color: "#f59e0b", marginBottom: "8px" }}>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < rev.rating ? "#f59e0b" : "none"} color={i < rev.rating ? "#f59e0b" : "var(--text-muted)"} />
                            ))}
                          </div>
                          <p style={{ fontSize: "14px", color: "var(--text-main)", lineHeight: "1.5" }}>{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Submit Review Form */}
                  {auth.currentUser ? (
                    <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "20px", borderRadius: "16px", background: "var(--primary-glow)", border: "1px solid var(--border-color)" }}>
                      <h4 style={{ fontSize: "15px", fontWeight: "700" }}>Write a Review</h4>
                      {reviewError && <p style={{ color: "var(--error)", fontSize: "13px" }}>{reviewError}</p>}
                      <div style={{ display: "flex", gap: "8px" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            <Star size={24} fill={star <= rating ? "#f59e0b" : "none"} color={star <= rating ? "#f59e0b" : "var(--text-muted)"} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us what you think..."
                        rows={3}
                        className="form-input"
                        style={{ resize: "none" }}
                      />
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="btn btn-primary"
                        style={{ alignSelf: "flex-start", padding: "8px 24px", fontSize: "14px" }}
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  ) : (
                    <div style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", textAlign: "center" }}>
                      <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "12px" }}>Log in to submit a review.</p>
                      <Link to="/auth" className="btn btn-secondary" style={{ padding: "8px 20px", fontSize: "13px" }}>Login</Link>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .details-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
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
          font-weight: 600;
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
