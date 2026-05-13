import React from "react";
import { Link, useNavigate } from "react-router-dom";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/Privacy.css";

const sections = [
  {
    id: 1,
    title: "Introduction",
    content: [
      `This Privacy Policy outlines how the CRIMSON AI-Powered Crime Reporting System (hereinafter referred to as "CRIMSON") collects, uses, and protects your personal information. CRIMSON is committed to protecting your privacy and ensuring compliance with the Sri Lanka Data Protection Act and GDPR standards. By using CRIMSON, you consent to the practices described in this policy.`,
    ],
  },
  {
    id: 2,
    title: "Information We Collect",
    content: [
      "CRIMSON may collect the following types of information:",
      "Personal Information: Name, contact details, and other identifying information provided during registration or reporting.",
      "Report Details: Information related to crime reports, including descriptions, locations, and involved parties.",
      "Technical Data: IP addresses, device information, and usage patterns collected automatically.",
    ],
  },
  {
    id: 3,
    title: "How We Use Your Information",
    content: [
      "The information collected by CRIMSON is used for the following purposes:",
      "Processing and managing crime reports.",
      "Improving the functionality and user experience of CRIMSON.",
      "Communicating with users regarding their reports or system updates.",
      "Ensuring compliance with legal and regulatory requirements.",
    ],
  },
  {
    id: 4,
    title: "Information Sharing and Disclosure",
    content: [
      "CRIMSON may share your information with:",
      "Law enforcement agencies and relevant authorities for crime investigation and prevention.",
      "Service providers who assist in system operations and maintenance.",
      "Other parties as required by law or legal processes.",
    ],
  },
  {
    id: 5,
    title: "Data Retention",
    content: [
      "CRIMSON retains your information for as long as necessary to fulfil the purposes outlined in this policy, comply with legal obligations, and resolve disputes. Specific retention periods may vary depending on the type of information and legal requirements.",
    ],
  },
  {
    id: 6,
    title: "Your Rights",
    content: [
      "Under the Sri Lanka Data Protection Act and GDPR, you have the right to:",
      "Access your personal information held by CRIMSON.",
      "Request correction of inaccurate or incomplete information.",
      "Request deletion of your information under certain circumstances.",
      "Object to the processing of your information.",
      "Withdraw consent where processing is based on consent.",
    ],
  },
  {
    id: 7,
    title: "Security",
    content: [
      "CRIMSON employs robust security measures to protect your information from unauthorised access, use, or disclosure. These measures include encryption, access controls, and regular security assessments.",
    ],
  },
  {
    id: 8,
    title: "International Data Transfers",
    content: [
      "If your information is transferred to countries outside of Sri Lanka, CRIMSON ensures that adequate safeguards are in place to protect your data in accordance with this policy and applicable laws.",
    ],
  },
  {
    id: 9,
    title: "Changes to This Privacy Policy",
    content: [
      "CRIMSON may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the updated policy on our website and, where appropriate, through other communication channels.",
    ],
  },
  {
    id: 10,
    title: "Contact Us",
    content: [
      "If you have any questions or concerns about this Privacy Policy or the handling of your information, please contact us at: privacy@crimson.gov.lk",
    ],
  },
  {
    id: 11,
    title: "Governing Law",
    content: [
      "This Privacy Policy is governed by and construed in accordance with the laws of Sri Lanka. Any disputes arising under or in connection with this policy shall be subject to the exclusive jurisdiction of the courts of Sri Lanka.",
    ],
  },
  {
    id: 12,
    title: "Acceptance",
    content: [
      "By using CRIMSON, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with any part of this policy, please do not use CRIMSON.",
    ],
  },
];

export default function Privacy() {
  return (
    <div className="privacy-page">
      {/* Navbar */}
      <CitizenNavbar />

      {/* Main */}
      <main className="privacy-main">
        <h1 className="privacy-title">Privacy Policy</h1>

        <div className="privacy-card">
          {sections.map((sec) => (
            <article key={sec.id} className="policy-section">
              <h2 className="policy-heading">
                {sec.id}. {sec.title}
              </h2>
              {sec.content.map((para, i) => (
                <p key={i} className="policy-para">{para}</p>
              ))}
            </article>
          ))}
        </div>
      </main>

      <CitizenFooter />
    </div>
  );
}