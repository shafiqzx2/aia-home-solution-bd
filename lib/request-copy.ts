import { text, type Locale } from "./i18n";

const copy = {
  others: text("Others / custom requirement", "অন্যান্য / বিশেষ চাহিদা"),
  customDescription: text(
    "Describe your custom requirement",
    "আপনার বিশেষ চাহিদার বিবরণ",
  ),
  printPdf: text("Print / Save as PDF", "প্রিন্ট / PDF সংরক্ষণ"),
  pdfNote: text(
    "Choose Save as PDF in your browser’s print dialog to download an A4 quotation request document. This is a draft request, not a priced quotation or a confirmed appointment.",
    "A4 কোটেশন অনুরোধের নথি ডাউনলোড করতে ব্রাউজারের প্রিন্ট ডায়ালগে Save as PDF বেছে নিন। এটি খসড়া অনুরোধ; মূল্যসহ চূড়ান্ত কোটেশন বা নিশ্চিত সাক্ষাৎ নয়।",
  ),
  submitToAia: text(
    "Submit to AIA — unavailable",
    "AIA-কে জমা দিন — চালু হয়নি",
  ),
  documentTitle: text(
    "Quotation & Consultation Request",
    "কোটেশন ও পরামর্শের অনুরোধ",
  ),
  generated: text("Document generated", "নথি তৈরির সময়"),
  draft: text(
    "DRAFT REQUEST · NOT SUBMITTED",
    "খসড়া অনুরোধ · জমা দেওয়া হয়নি",
  ),
  consultation: text("Request a Consultation", "পরামর্শের অনুরোধ"),
  cart: text("Consultation cart", "পরামর্শের কার্ট"),
  add: text("Add to Cart", "কার্টে যোগ করুন"),
  added: text(
    "Added to your consultation cart.",
    "পরামর্শের কার্টে যোগ হয়েছে।",
  ),
  quantity: text("Quantity", "পরিমাণ"),
  remove: text("Remove", "সরান"),
  clear: text("Clear cart", "কার্ট খালি করুন"),
  empty: text(
    "Your consultation cart is empty.",
    "আপনার পরামর্শের কার্ট খালি।",
  ),
  cartNote: text(
    "Collect products to discuss together. This is a consultation list; availability and scope need review.",
    "একসঙ্গে আলোচনার জন্য পণ্য বেছে রাখুন। এটি পরামর্শের তালিকা; প্রাপ্যতা ও কাজের পরিধি পর্যালোচনা করতে হবে।",
  ),
  browse: text("Continue browsing", "আরও দেখুন"),
  proceed: text("Prepare request", "অনুরোধ প্রস্তুত করুন"),
  book: text("Book Service", "সেবার অনুরোধ"),
  next: text("Continue", "পরবর্তী ধাপ"),
  back: text("Back", "পেছনে"),
  selections: text("Your selections", "আপনার নির্বাচন"),
  preferences: text("Contact & visit", "যোগাযোগ ও সাক্ষাৎ"),
  schedule: text("Preferred schedule", "পছন্দের সময়সূচি"),
  details: text("Your details", "আপনার তথ্য"),
  review: text("Review request", "অনুরোধ পর্যালোচনা"),
  optionalProducts: text("Optional products", "ঐচ্ছিক পণ্য"),
  optionalServices: text("Optional services", "ঐচ্ছিক সেবা"),
  noItems: text(
    "No products or services selected. You can continue with a general consultation.",
    "কোনো পণ্য বা সেবা বাছাই করা হয়নি। সাধারণ পরামর্শের জন্য এগিয়ে যেতে পারেন।",
  ),
  purpose: text("Request purpose", "অনুরোধের উদ্দেশ্য"),
  mode: text("Contact or visit preference", "যোগাযোগ বা সাক্ষাতের ধরন"),
  date: text("Preferred date", "পছন্দের তারিখ"),
  time: text("Preferred time window", "পছন্দের সময়সীমা"),
  alternative: text(
    "Alternative availability (optional)",
    "বিকল্প সময় (ঐচ্ছিক)",
  ),
  scheduleNote: text(
    "All times are in Asia/Dhaka (UTC+06:00). This is a preference, not a confirmed appointment. AIA must confirm availability directly.",
    "সব সময় Asia/Dhaka (UTC+০৬:০০) অনুযায়ী। এটি পছন্দের সময়, নিশ্চিত সাক্ষাৎ নয়। AIA সরাসরি সময় নিশ্চিত করবে।",
  ),
  noSchedule: text(
    "No appointment requested. We will use your contact details to discuss your inquiry.",
    "কোনো সাক্ষাৎ চাওয়া হয়নি। আপনার দেওয়া যোগাযোগের তথ্য দিয়ে জিজ্ঞাসা নিয়ে আলোচনা করা যাবে।",
  ),
  name: text("Full name", "পূর্ণ নাম"),
  phone: text("Phone number", "ফোন নম্বর"),
  email: text("Email (optional)", "ইমেইল (ঐচ্ছিক)"),
  address: text("Site address", "সাইটের ঠিকানা"),
  notes: text(
    "Project description / instructions (optional)",
    "প্রকল্পের বিবরণ / নির্দেশনা (ঐচ্ছিক)",
  ),
  localOnly: text(
    "Prepare and download your request here, then contact AIA directly. Online submission is not available yet. Nothing is sent or booked by this form. Your unsent details stay in this tab’s memory and may return when you use Back. Reload this tab to start a fresh draft. Customer details are not saved in browser storage.",
    "এখানে অনুরোধ প্রস্তুত ও ডাউনলোড করে AIA-এর সঙ্গে সরাসরি যোগাযোগ করুন। অনলাইনে জমা দেওয়া এখনো চালু হয়নি। এই ফর্ম থেকে কিছু পাঠানো বা বুক করা হয় না। না-পাঠানো তথ্য এই ট্যাবের মেমরিতে থাকে এবং Back ব্যবহার করলে আবার দেখা যেতে পারে। নতুন খসড়া শুরু করতে ট্যাবটি রিলোড করুন। গ্রাহকের তথ্য ব্রাউজার স্টোরেজে সংরক্ষণ করা হয় না।",
  ),
  download: text("Download request brief", "অনুরোধের বিবরণ ডাউনলোড"),
  downloaded: text(
    "Brief prepared locally. It has not been sent to AIA and no appointment has been created.",
    "বিবরণ আপনার ডিভাইসে প্রস্তুত হয়েছে। AIA-কে পাঠানো হয়নি এবং কোনো সাক্ষাৎ তৈরি হয়নি।",
  ),
  submitUnavailable: text(
    "Online submission unavailable",
    "অনলাইনে জমা দেওয়া চালু হয়নি",
  ),
  validation: text(
    "Please complete the highlighted required fields with valid details.",
    "প্রয়োজনীয় ঘরগুলো সঠিক তথ্য দিয়ে পূরণ করুন।",
  ),
  edit: text("Edit", "সংশোধন"),
  notProvided: text("Not provided", "দেওয়া হয়নি"),
  office: text("Office", "অফিস"),
  socials: text("Connect with AIA", "AIA-এর সঙ্গে যোগাযোগ"),
  privacy: text("Privacy & request information", "গোপনীয়তা ও অনুরোধের তথ্য"),
  why: text("Why choose AIA", "কেন AIA বেছে নেবেন"),
  how: text("From an idea to a clear brief.", "ভাবনা থেকে সুস্পষ্ট পরিকল্পনা।"),
  homeDigital: text("Home & Digital", "Home & Digital"),
  relatedProducts: text("Related products", "সম্পর্কিত পণ্য"),
  collections: text("Collections", "সংগ্রহ"),
  allCollections: text("All collections", "সব সংগ্রহ"),
  featured: text("Featured", "বিশেষ নির্বাচন"),
  newArrivals: text("New Arrivals", "নতুন সংযোজন"),
  newDesigns: text("New Designs", "নতুন নকশা"),
  storageNote: text(
    "Cart storage is unavailable in this browser. Your selections will last for this visit only.",
    "এই ব্রাউজারে কার্ট সংরক্ষণ করা যাচ্ছে না। এই সেশন পর্যন্ত আপনার নির্বাচন থাকবে।",
  ),
};
export const requestCopy = (locale: Locale) =>
  Object.fromEntries(
    Object.entries(copy).map(([key, value]) => [key, value[locale]]),
  ) as Record<keyof typeof copy, string>;
export const requestPurposes = {
  other: text("Other / custom request", "অন্যান্য / বিশেষ অনুরোধ"),
  consultation: text("General consultation", "সাধারণ পরামর্শ"),
  inquiry: text("General inquiry", "সাধারণ জিজ্ঞাসা"),
  quotation: text("Product quotation", "পণ্যের কোটেশন"),
  service: text("Service booking", "সেবার অনুরোধ"),
  installation: text("Installation / digital setup", "স্থাপন / ডিজিটাল সেটআপ"),
  project: text("Project discussion", "প্রকল্প নিয়ে আলোচনা"),
  office: text("Office appointment", "অফিসে সাক্ষাৎ"),
  assessment: text("Onsite assessment", "সাইট পরিদর্শন"),
};
export const contactModes = {
  phone: text("Phone consultation", "ফোনে পরামর্শ"),
  online: text("Online meeting", "অনলাইন সাক্ষাৎ"),
  office: text("Visit AIA’s office", "AIA-এর অফিসে আসব"),
  onsite: text("AIA visits my site", "AIA আমার সাইটে আসবে"),
  contact: text(
    "General contact — no appointment",
    "সাধারণ যোগাযোগ — সাক্ষাৎ নয়",
  ),
};
export const timeWindows = {
  morning: text("Morning · 09:00–12:00", "সকাল · ০৯:০০–১২:০০"),
  afternoon: text("Afternoon · 12:00–17:00", "দুপুর · ১২:০০–১৭:০০"),
  evening: text("Evening · 17:00–20:00", "সন্ধ্যা · ১৭:০০–২০:০০"),
  flexible: text("Flexible — please contact me", "সুবিধামতো — যোগাযোগ করুন"),
};
