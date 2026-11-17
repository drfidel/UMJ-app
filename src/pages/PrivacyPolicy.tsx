import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="bg-background min-h-screen py-12">
      <SEO title="Privacy Policy" description="Privacy policy for the Uganda Medical Journal platform." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-6 mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Legal & Data Governance
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
          <section className="bg-card border border-border rounded-lg p-6 sm:p-7">
            <h2 className="font-editorial text-xl font-bold text-foreground mb-3">1. Introduction</h2>
            <p>
              The Uganda Medical Association Journal ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our manuscript submission and reading services.
            </p>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 sm:p-7">
            <h2 className="font-editorial text-xl font-bold text-foreground mb-3">2. Information We Collect</h2>
            <p className="font-semibold text-foreground mb-2">Personal Information</p>
            <ul className="list-disc pl-5 space-y-1.5 mb-5">
              <li>Name, email address, institutional affiliation, and contact details.</li>
              <li>Academic credentials, specialties, and manuscript/peer-review records.</li>
              <li>Subscription billing details processed securely via payment partners.</li>
            </ul>
            <p className="font-semibold text-foreground mb-2">Automatically Collected Information</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Browser type, device metadata, and session diagnostics.</li>
              <li>Article views, citation exports, and platform usage logs.</li>
            </ul>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 sm:p-7">
            <h2 className="font-editorial text-xl font-bold text-foreground mb-3">3. How We Use Information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To administer user accounts, editorial workflows, and double-blind peer review.</li>
              <li>To publish accepted research with accurate author attribution and indexing metadata.</li>
              <li>To manage subscriptions, CME event registrations, and table of contents alerts.</li>
            </ul>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 sm:p-7">
            <h2 className="font-editorial text-xl font-bold text-foreground mb-3">4. Data Security & Your Rights</h2>
            <p className="mb-3">
              We implement technical and organizational safeguards to protect manuscript confidentiality and personal records. You may request access, correction, or deletion of your personal data at any time.
            </p>
            <p>
              To exercise your privacy rights, please reach our editorial office via the{' '}
              <Link to="/contact" className="text-primary font-medium hover:underline">
                Contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
