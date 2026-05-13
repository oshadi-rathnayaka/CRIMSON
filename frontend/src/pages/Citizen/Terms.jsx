import React from "react";
import { Link, useNavigate } from "react-router-dom";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import CitizenFooter from "../../components/Citizen/CitizenFooter";
import "../../styles/Citizen/Terms.css";

const sections = [
  {
    id: 1,
    title: "Definitions",
    content: [
      `In these Terms and Conditions, the following terms shall have the meanings set forth below:`,
      `"Service" refers to the CRIMSON AI-Powered Crime Reporting System, including all related software, applications, and services provided by the Ministry of Public Safety.`,
      `"User" refers to any individual or entity that accesses or uses the Service.`,
      `"Content" refers to any information, data, text, graphics, or other materials submitted, posted, or displayed by Users on the Service.`,
    ],
  },
  {
    id: 2,
    title: "Acceptance of Terms",
    content: [
      `By accessing or using the Service, you agree to be bound by these Terms and Conditions. If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and the Ministry of Public Safety.`,
    ],
  },
  {
    id: 3,
    title: "Description of Service",
    content: [
      `The CRIMSON AI-Powered Crime Reporting System is designed to facilitate the reporting of criminal activities and incidents to the Ministry of Public Safety. The Service utilises artificial intelligence to analyse and categorise reports, providing insights and assisting in law enforcement efforts.`,
    ],
  },
  {
    id: 4,
    title: "User Accounts",
    content: [
      `To use certain features of the Service, Users may be required to create an account. Users are responsible for maintaining the confidentiality of their account information and are liable for all activities that occur under their account. Users agree to provide accurate and complete information when creating an account and to update their information as necessary.`,
    ],
  },
  {
    id: 5,
    title: "Prohibited Conduct",
    content: [
      "Users are prohibited from engaging in the following activities:",
      "Submitting false or misleading reports (5)",
      "Harassing, threatening, or defaming others (4)",
      "Violating any applicable laws or regulations (5)",
      "Interfering with the operation of the Service (4)",
      "Attempting to gain unauthorised access to the Service or other User accounts (6)",
      "Using the Service to infringe upon the intellectual property rights of others (6)",
      "Using the Service for any commercial purposes without prior written consent (5)",
    ],
  },
  {
    id: 6,
    title: "Intellectual Property",
    content: [
      `The Service and its original content, features, and functionality are owned by the Ministry of Public Safety and are protected by intellectual property laws. Users may not reproduce, distribute, modify, or create derivative works of the Service without prior written consent from the Ministry.`,
    ],
  },
  {
    id: 7,
    title: "User Content",
    content: [
      `Users retain ownership of any Content they submit to the Service. By submitting Content, Users grant the Ministry of Public Safety a non-exclusive, royalty-free, worldwide licence to use, reproduce, modify, and distribute the Content for the purposes of operating and improving the Service.`,
    ],
  },
  {
    id: 8,
    title: "Privacy",
    content: [
      `The Ministry of Public Safety is committed to protecting user privacy. The collection and use of user information are governed by the CRIMSON Privacy Policy, which is incorporated into these Terms and Conditions by reference. Users are encouraged to review the Privacy Policy to understand how their information is handled.`,
    ],
  },
  {
    id: 9,
    title: "Security",
    content: [
      `The Ministry of Public Safety employs reasonable security measures to protect User information. However, Users acknowledge that no method of transmission over the internet or electronic storage is completely secure, and the Ministry cannot guarantee absolute security.`,
    ],
  },
  {
    id: 10,
    title: "Modifications to Service",
    content: [
      `The Ministry shall have the right to modify or discontinue the Service at any time, with or without notice. The Ministry shall not be liable to Users or any third party for any modification, suspension, or discontinuation of the Service.`,
    ],
  },
  {
    id: 11,
    title: "Termination",
    content: [
      `The Ministry of Public Safety may terminate or suspend User access to the Service at any time, with or without cause, including for violations of these Terms and Conditions. Upon termination, User accounts will be deactivated, and access to the Service will be removed.`,
    ],
  },
  {
    id: 12,
    title: "Disclaimers",
    content: [
      `The Service is provided on an "as-is" and "as available" basis. The Ministry of Public Safety makes no warranties, express or implied, regarding the Service, including but not limited to its accuracy, reliability, or availability. The Ministry disclaims all warranties of merchantability, fitness for a particular purpose, and non-infringement.`,
    ],
  },
  {
    id: 13,
    title: "Limitation of Liability",
    content: [
      `In no event shall the Ministry of Public Safety be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service, even if advised of the possibility of such damages. The Ministry's total liability to Users for any claims arising out of or related to the Service shall not exceed the amount paid by the User, if any, for access to the Service.`,
    ],
  },
  {
    id: 14,
    title: "Indemnification",
    content: [
      `Users agree to indemnify and hold harmless the Ministry of Public Safety, its officers, employees, and agents from any claims, liabilities, damages, and expenses, including reasonable attorneys' fees, arising out of or related to their use of the Service or any violation of these Terms and Conditions.`,
    ],
  },
  {
    id: 15,
    title: "Governing Law",
    content: [
      `These Terms and Conditions shall be governed by and construed in accordance with the laws of Sri Lanka. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts of Sri Lanka.`,
    ],
  },
];

export default function Terms() {
  return (
    <div className="terms-page">
      {/* Navbar */}
      <CitizenNavbar />

      {/* Main */}
      <main className="terms-main">
        <h1 className="terms-title">Terms and Conditions</h1>

        <div className="terms-card">
          {sections.map((sec) => (
            <article key={sec.id} className="policy-section">
              <h2 className="policy-heading">
                {sec.id}. {sec.title}
              </h2>
              {sec.content.map((para, i) => (
                <p key={i} className={`policy-para${i > 0 && sec.content.length > 1 ? " indented" : ""}`}>
                  {para}
                </p>
              ))}
            </article>
          ))}
        </div>
      </main>

      <CitizenFooter />
    </div>
  );
}