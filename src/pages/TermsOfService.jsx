import React, { useEffect } from "react";

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <div className="container" style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "900", marginBottom: "32px", textAlign: "center", color: "var(--text-main)" }}>Terms of Service</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "40px", textAlign: "center" }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px", lineHeight: "1.8", fontSize: "15px", color: "var(--text-main)" }}>
        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>1. Agreement to Terms</h2>
          <p>
            By accessing our website at Vistaraa.in, you agree to be bound by these terms of service, all applicable laws and regulations, 
            and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, 
            you are prohibited from using or accessing this site.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on Vistaraa's website for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li>Modify or copy the materials;</li>
            <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>Attempt to decompile or reverse engineer any software contained on Vistaraa's website;</li>
            <li>Remove any copyright or other proprietary notations from the materials; or</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. 
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>4. Products and Pricing</h2>
          <p>
            All products or services are subject to return or exchange only according to our Return Policy. 
            We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. 
            We cannot guarantee that your computer monitor's display of any color will be accurate.
            <br/><br/>
            Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>5. Third-Party Links</h2>
          <p>
            Certain content, products, and services available via our Service may include materials from third-parties. 
            Third-party links on this site may direct you to third-party websites that are not affiliated with us. 
            We are not responsible for examining or evaluating the content or accuracy and we do not warrant and will not have any liability 
            or responsibility for any third-party materials or websites.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>6. Disclaimer</h2>
          <p>
            The materials on Vistaraa's website are provided on an 'as is' basis. Vistaraa makes no warranties, expressed or implied, 
            and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, 
            fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "var(--primary)" }}>7. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </section>
      </div>
    </div>
    </div>
  );
}
