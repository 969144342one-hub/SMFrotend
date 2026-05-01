import React from "react";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-2xl p-6 md:p-10">

        {/* H1 */}
        <h1 className="text-2xl md:text-4xl font-bold mb-6 text-gray-800">
          Terms and Conditions – Satta Matka Aaj Tak
        </h1>

        <p className="text-gray-600 mb-6">
          Welcome to sattamatkaaajtak.com. By accessing and using this website, you agree to follow the Terms and Conditions mentioned below.
        </p>

        {/* Section */}
        <Section title="Use of Website">
          <ul className="list-disc pl-6 space-y-1">
            <li>Satta Matka results</li>
            <li>Kalyan Matka charts</li>
            <li>DPBoss Matka updates</li>
            <li>Matka guessing tips</li>
          </ul>
          <p className="mt-2">You agree not to misuse the website or use it for illegal activities.</p>
        </Section>

        <Section title="No Gambling Encouragement">
          <p>
            We do not promote or encourage gambling in any form. Users must follow their local laws. We are not responsible for any loss.
          </p>
        </Section>

        <Section title="Content Accuracy">
          <p>
            We try to provide accurate and updated information, but we do not guarantee 100% accuracy. Users should verify independently.
          </p>
        </Section>

        <Section title="Intellectual Property Rights">
          <ul className="list-disc pl-6 space-y-1">
            <li>Do not copy or republish content</li>
            <li>Do not sell or redistribute content</li>
            <li>Do not use without permission</li>
          </ul>
        </Section>

        <Section title="Third-Party Links">
          <p>
            We may include third-party links. We are not responsible for their content or privacy practices.
          </p>
        </Section>

        <Section title="Limitation of Liability">
          <ul className="list-disc pl-6 space-y-1">
            <li>No liability for financial loss</li>
            <li>No liability for damages</li>
            <li>No liability for errors in content</li>
          </ul>
        </Section>

        <Section title="User Responsibility">
          <ul className="list-disc pl-6 space-y-1">
            <li>You must be at least 18 years old</li>
            <li>You are responsible for your actions</li>
            <li>You must follow local laws</li>
          </ul>
        </Section>

        <Section title="Changes to Terms">
          <p>
            We may update these terms anytime without notice. Please review regularly.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            We reserve the right to block users who violate these terms.
          </p>
        </Section>

        <Section title="Governing Law">
          <p>
            These terms are governed by the laws of India.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            For any queries, visit: 
            <a href="https://sattamatkaaajtak.com/" className="text-blue-600 underline ml-1">
              sattamatkaaajtak.com
            </a>
          </p>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
        {title}
      </h2>
      <div className="text-gray-600 text-sm md:text-base">{children}</div>
    </div>
  );
}
