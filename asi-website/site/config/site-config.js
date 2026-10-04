window.ASI_CONFIG = {
  companyName: "American Standard Construction & Inspection",
  shortName: "ASI",
  legalOperator: "American Standard Construction & Safety Consulting LLC",
  domain: "https://www.asccinspection.net",

  // FINAL FACT PASS — replace only when verified.
  phoneDisplay: "334-733-9576",
  phoneHref: "tel:+13347339576",
  email: "[BUSINESS EMAIL]",

  serviceArea: "Florida",
  credentialSummary: "[VERIFIED CREDENTIAL SUMMARY]",
  credentials: [
    { label: "Building Official / Code Administrator", value: "[VERIFY TITLE / LICENSE]" },
    { label: "Building Inspection", value: "[VERIFY TITLE / LICENSE]" },
    { label: "Plan Review", value: "[VERIFY TITLE / LICENSE]" },
    { label: "Fire Safety", value: "[VERIFY TITLE / LICENSE]" }
  ],

  // Owner-confirmed team experience; project count is an owner-reported career estimate.
  proofPoints: [
    { value: "20+", label: "Years of Team Experience", detail: "Across construction, code, and life safety." },
    { value: "About 1,000", label: "Projects Supported", detail: "Across our team’s careers." },
    { value: "MULTI", label: "Disciplinary Expertise", detail: "Construction, code, inspection, fire/life safety." },
    { value: "CODE FOCUSED", label: "Technical Depth", detail: "Deep code expertise across project conditions." },
    { value: "CLIENT FIRST", label: "Service Standard", detail: "Direct. Responsive. Practical." }
  ],

  // Explicit sandbox default. Production remains gated pending backend and fact review.
  quoteMode: "sandbox",
  factsVerified: false,
  // No destination has been approved or implemented.
  quoteEndpoint: "",

  // Optional analytics IDs. Leave blank to disable.
  analytics: {
    googleAnalyticsId: "",
    plausibleDomain: ""
  }
};
