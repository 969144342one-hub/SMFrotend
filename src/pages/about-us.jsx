import React from "react";

export default function AboutUs() {
  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-6 sm:p-10">
        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
          About Us – Satta Matka Aaj Tak
        </h1>

        <p className="text-gray-600 mb-6">
          Welcome to <strong>SattaMatkaAajTak.com</strong> – your trusted source for Mumbai Satta Matka updates.
          We provide the latest results, live updates, and detailed charts for popular Matka markets.
        </p>

        {/* Mission */}
        <h2 className="text-xl font-semibold mb-2">🎯 Our Mission</h2>
        <p className="text-gray-600 mb-4">
          Our mission is to deliver real-time Satta Matka results, charts, and insights in a clean and
          user-friendly format.
        </p>

        <ul className="list-disc ml-6 text-gray-600 mb-6 space-y-1">
          <li>Kalyan Matka chart live</li>
          <li>DPBoss Matka result updates</li>
          <li>Morning Bazaar result timings</li>
          <li>Rajdhani Night Matka free tips</li>
          <li>Golden & Nagpur Matka charts</li>
        </ul>

        {/* What We Provide */}
        <h2 className="text-xl font-semibold mb-2">📊 What We Provide</h2>
        <ul className="list-disc ml-6 text-gray-600 mb-6 space-y-1">
          <li>Daily Satta Matka result updates</li>
          <li>Accurate Matka charts & Jodi charts</li>
          <li>Guides on how to read Matka charts</li>
          <li>Informational Matka guessing tips</li>
          <li>Coverage of all major Matka markets</li>
        </ul>

        {/* Why Choose Us */}
        <h2 className="text-xl font-semibold mb-2">📈 Why Choose Us</h2>
        <ul className="list-disc ml-6 text-gray-600 mb-6 space-y-1">
          <li>Fast and reliable updates</li>
          <li>Mobile-friendly design</li>
          <li>Easy-to-understand charts</li>
          <li>Regular updates</li>
          <li>Beginner-friendly guides</li>
        </ul>

        {/* Learn */}
        <h2 className="text-xl font-semibold mb-2">📚 Learn & Understand Matka</h2>
        <ul className="list-disc ml-6 text-gray-600 mb-6 space-y-1">
          <li>What is Satta Matka</li>
          <li>How Matka Jodi charts work</li>
          <li>Basics of 220 Patti</li>
          <li>Understanding result patterns</li>
        </ul>

        {/* Disclaimer */}
        <h2 className="text-xl font-semibold mb-2">⚠️ Disclaimer</h2>
        <p className="text-gray-600">
          Satta Matka Aaj Tak is an informational website only. We do not promote or encourage gambling.
          Users should follow their local laws. This content is for informational purposes only.
        </p>
      </div>
    </div>
  );
}
