import React from "react";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-2xl p-6 md:p-10">

        {/* H1 */}
        <h1 className="text-2xl md:text-4xl font-bold mb-4 text-gray-800">
          📞 Contact Us – Satta Matka AajTak
        </h1>

        <p className="text-gray-600 mb-6">
          Welcome to <strong>Satta Matka AajTak</strong>, we’re always happy to hear from you. Whether you want to share feedback, ask questions, or just connect with us, our team is always ready to assist you.
        </p>

        {/* Contact Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-green-700 mb-2">📢 Get in Touch</h2>
          <p className="text-gray-700">
            📱 Call / WhatsApp: 
            <a href="tel:9203516304" className="text-green-700 font-bold ml-1">
              9203516304
            </a>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Feel free to contact us anytime for quick support and updates.
          </p>
        </div>

        {/* Reasons */}
        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">
          💬 You can contact us for:
        </h2>

        <div className="space-y-4 text-gray-600">
          <div>
            <h3 className="font-semibold">Website Feedback</h3>
            <p>If you have suggestions about our website design, layout, or performance.</p>
          </div>

          <div>
            <h3 className="font-semibold">Content Queries</h3>
            <p>Questions related to Satta Matka results, charts, or information.</p>
          </div>

          <div>
            <h3 className="font-semibold">Corrections or Updates</h3>
            <p>Inform us about incorrect or outdated information.</p>
          </div>

          <div>
            <h3 className="font-semibold">Design Suggestions</h3>
            <p>Share ideas to improve website look and usability.</p>
          </div>

          <div>
            <h3 className="font-semibold">Improvement Suggestions</h3>
            <p>Your ideas help us improve our platform.</p>
          </div>

          <div>
            <h3 className="font-semibold">Technical Issues</h3>
            <p>Report bugs or issues for quick fixing.</p>
          </div>
        </div>

        {/* Quick Contact CTA */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 text-center">
          <p className="text-lg font-semibold text-blue-700">
            🔥 Get Instant Updates Now
          </p>
          <a
            href="tel:9203516304"
            className="inline-block mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            📞 Call Now: 9203516304
          </a>
        </div>

        {/* Disclaimer */}
        <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-3 text-red-600">
          ⚠️ Important Note
        </h2>

        <p className="text-gray-600 text-sm">
          This website is created for informational purposes only. We do not promote any illegal activity. Please follow your local laws and regulations.
        </p>

        <p className="text-gray-500 text-sm mt-6 text-center">
          Thank you for being a part of Satta Matka AajTak and helping us grow! 🙏
        </p>

      </div>
    </div>
  );
}
