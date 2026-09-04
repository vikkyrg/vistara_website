import React, { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <div className="container" style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "900", marginBottom: "32px", textAlign: "center", color: "var(--text-main)" }}>Privacy Policy</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "40px", textAlign: "center" }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px", lineHeight: "1.8", fontSize: "15px", color: "var(--text-main)" }}>
        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>1. Introduction</h2>
          <p>
            Welcome to Vistaraa ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) 
            and tell you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>2. The Data We Collect About You</h2>
          <p>
            Personal data, or personal information, means any information about an individual from which that person can be identified. 
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          </p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier, and title.</li>
            <li><strong>Contact Data:</strong> includes billing address, delivery address, email address and telephone numbers.</li>
            <li><strong>Financial Data:</strong> includes payment card details (processed securely via our payment gateways).</li>
            <li><strong>Transaction Data:</strong> includes details about payments to and from you and other details of products and services you have purchased from us.</li>
            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, and other technology on the devices you use to access this website.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>3. How We Use Your Personal Data</h2>
          <p>
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., fulfilling your order).</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>4. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, 
            altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know. 
            They will only process your personal data on our instructions and they are subject to a duty of confidentiality.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>5. Data Retention</h2>
          <p>
            We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, 
            including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>6. Your Legal Rights</h2>
          <p>
            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
          </p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Request access to your personal data.</li>
            <li>Request correction of your personal data.</li>
            <li>Request erasure of your personal data.</li>
            <li>Object to processing of your personal data.</li>
            <li>Request restriction of processing your personal data.</li>
            <li>Request transfer of your personal data.</li>
            <li>Right to withdraw consent.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>7. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
            <br /><br />
            <strong>Email:</strong> support@vistaraa.in<br />
            <strong>Address:</strong> Ground Floor, Rajiv Gandhi Nagar, Karatgi, Karnataka - 583229<br />
            <strong>Phone:</strong> +91 70195 12273
          </p>
        </section>
      </div>
    </div>
    </div>
  );
}
