import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Ticket,
  Headphones,
  Video,
  Users,
  GraduationCap,
  Star,
  FileText,
  PlusCircle,
  Award,
  ChevronDown,
} from "lucide-react";
import LandingNav from "../layout/landingNav";

const USE_CASES = [
  {
    icon: Ticket,
    role: "organizer",
    title: "Event Tickets & Access",
    description: "Verifiable event passes, claimed straight to your wallet — no separate ticketing platform.",
  },
  {
    icon: Headphones,
    role: "subscriber",
    title: "Podcast Subscriptions",
    description: "Prove you're a paying subscriber without revealing who you are.",
  },
  {
    icon: Video,
    role: "organizer",
    title: "Live Streams & Social Content",
    description: "Gate a stream, a private Discord, or a closed feed behind one reusable token.",
  },
  {
    icon: Users,
    role: "subscriber",
    title: "Private Meetings & Calls",
    description: "Entry to members-only calls, tied to your wallet — not a link anyone could forward.",
  },
  {
    icon: GraduationCap,
    role: "organizer",
    title: "Diplomas & Certificates",
    description: "On-chain, verifiable credentials — without publishing your name or record.",
  },
  {
    icon: Star,
    role: "subscriber",
    title: "Celebrity & Athlete Subscriptions",
    description: "Provable fan-club membership, without exposing every fan's identity.",
  },
  {
    icon: FileText,
    role: "organizer",
    title: "Document Delivery",
    description: "An early path for proofs tied to real documents — possession, not contents.",
  },
];

const REVEAL_VIEWPORT = { once: true, amount: 0.4 };

// Scroll-linked, not a one-time reveal: each row tracks its own scroll progress across the span
// from "just entering the viewport from below" (0) to "just leaving above" (1), and derives
// icon/text x-offset + opacity directly from that value — peaking (centered, fully opaque) only
// while the row sits near the vertical middle of the screen, and receding back out toward
// whichever margin each side already leans on as it scrolls away from center in either
// direction. A per-row component (not inline in the .map) because useScroll/useTransform need
// their own ref + hook instance per row, which a loop body can't provide.
const UseCaseRow = ({ icon: Icon, role, title, description, iconLeft }) => {
  const rowRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"],
  });

  // Both position and opacity now hold flat through a small dwell zone around center
  // (0.42–0.58) instead of hitting their target at the single instant progress=0.5 and
  // immediately reversing — the row arrives a little before dead-center and doesn't start
  // leaving until a little after, so it actually sits still in "reading position" for a beat
  // instead of just passing through it.
  const iconX = useTransform(
    scrollYProgress,
    [0, 0.42, 0.58, 1],
    iconLeft ? [-520, 0, 0, -520] : [520, 0, 0, 520]
  );
  const textX = useTransform(
    scrollYProgress,
    [0, 0.42, 0.58, 1],
    iconLeft ? [520, 0, 0, 520] : [-520, 0, 0, -520]
  );
  // Flat 0 while genuinely far (0 to 0.3, and 0.7 to 1) instead of a straight-line ramp across
  // the whole [0, 1] span — a linear ramp meant the row was already partly visible (e.g. ~20%
  // opacity) well before it was anywhere near center, which read as "still visible while far
  // away". Ramps fully in/out across the same 0.3–0.42 / 0.58–0.7 windows the position above
  // uses, so fade and slide finish together, then holds at full opacity through the same
  // 0.42–0.58 dwell zone.
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.42, 0.58, 0.7, 1], [0, 0, 1, 1, 0, 0]);

  return (
    <div
      ref={rowRef}
      className={`row align-items-start justify-content-center usecase-row role-${role}`}
    >
      <motion.div
        className="col-md-4 usecase-icon-col"
        style={{ order: iconLeft ? 1 : 2, x: iconX, opacity }}
      >
        <div className="usecase-icon-wrap role-hero-icon">
          <Icon size={48} />
        </div>
      </motion.div>
      <motion.div
        className="col-md-4 usecase-text-col"
        style={{ order: iconLeft ? 2 : 1, x: textX, opacity }}
      >
        <div className="usecase-text-inner" style={{ textAlign: iconLeft ? "left" : "right" }}>
          <h3 className="usecase-title">{title}</h3>
          <p className="text-muted usecase-desc">{description}</p>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="landing-page">
      <LandingNav />

      {/* Reuses Layout's own wrapper classes (content-body clears the fixed nav, container
          centers/constrains width) directly rather than rendering <Layout>, since Layout
          unconditionally also renders the app's <Header/> with no way to opt out. */}
      <div className="content-body">
      <div className="container">
      <div className="index-hero-section">
        <motion.div
          className="index-hero"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="role-eyebrow index-hero-eyebrow">Privacy-preserving proof, on Midnight</span>
          <h1 className="role-hero-title index-hero-title">
            One token. Endless ways to prove it.
          </h1>
          <p className="text-muted role-hero-desc index-hero-desc">
            AdaSouls issues privacy-preserving POAPs on the Midnight network — a single Compact
            contract that can represent far more than event badges, while your wallet identity is
            derived locally and shared with an organizer only when you choose to.
          </p>
          <Link to="/app" className="btn btn-dual-cta">
            Get Started
          </Link>
        </motion.div>

        <motion.div
          className="index-scroll-hint"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={28} />
        </motion.div>
      </div>

      <motion.div
        className="index-section-header index-section-header-compact"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={REVEAL_VIEWPORT}
        transition={{ duration: 0.4 }}
      >
        <h4 className="mb-1">Choose your role</h4>
        <p className="text-muted small mb-0">
          Every account can be either — pick what fits what you're doing right now.
        </p>
      </motion.div>

      <motion.div
        className="row index-role-row"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={REVEAL_VIEWPORT}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="col-md-6 mb-3 role-organizer">
          <div className="index-role-plain">
            <PlusCircle size={88} className="index-role-plain-icon" />
            <div>
              <h5 className="mb-1">Organizer</h5>
              <p className="text-muted small text-center index-role-card-desc">
                Create events, issue POAPs, and manage attendance.
              </p>
            </div>
            <Link to="/organizer" className="btn btn-role-cta">
              Learn more
            </Link>
          </div>
        </div>
        <div className="col-md-6 mb-3 role-subscriber">
          <div className="index-role-plain">
            <Award size={88} className="index-role-plain-icon" />
            <div>
              <h5 className="mb-1">Subscriber</h5>
              <p className="text-muted small text-center index-role-card-desc">
                Discover events, claim POAPs, and build your collection.
              </p>
            </div>
            <Link to="/subscriber" className="btn btn-role-cta">
              Learn more
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="index-section-header"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={REVEAL_VIEWPORT}
        transition={{ duration: 0.4 }}
      >
        <h4 className="mb-1">What you can build with AdaSouls</h4>
        <p className="text-muted small mb-0">
          The same underlying token can stand in for a lot more than a conference badge.
        </p>
      </motion.div>

      <div className="index-usecase-list">
        {USE_CASES.map((useCase, i) => (
          <UseCaseRow key={useCase.title} {...useCase} iconLeft={i % 2 === 0} />
        ))}
      </div>

      <footer className="index-footer">
        <p className="text-muted small mb-0">© 2026 AdaSouls — built on Midnight.</p>
      </footer>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
