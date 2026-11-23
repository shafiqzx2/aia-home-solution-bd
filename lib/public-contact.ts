import { text, type Locale } from "./i18n";
import { company } from "./public-content";
import { whatsappUrl } from "./whatsapp";

export const officeAddress = "2nd Floor, House 27, Road 10, Nikunja-2, Khilkhet, Dhaka-1229, Bangladesh";
export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officeAddress)}`;
export const publicContactCopy = {
  announcement: text("We're upgrading your digital experience. Online bookings and quotation requests are temporarily unavailable. Please contact us by email or WhatsApp.", "আমাদের ওয়েবসাইটের উন্নয়ন কার্যক্রম চলছে। অনলাইন বুকিং ও কোটেশন অনুরোধ সাময়িকভাবে বন্ধ রয়েছে। প্রয়োজনে ইমেইল বা হোয়াটসঅ্যাপে যোগাযোগ করুন।"),
  quotation: text("Online quotation requests are temporarily unavailable while we prepare our enhanced website. For product inquiries and quotations, please contact info@aiagroupbd.com.", "আমাদের ওয়েবসাইটের উন্নয়ন চলাকালে অনলাইনে কোটেশন অনুরোধ সাময়িকভাবে বন্ধ রয়েছে। পণ্যের তথ্য ও কোটেশনের জন্য info@aiagroupbd.com-এ যোগাযোগ করুন।"),
  booking: text("Our online booking system is being upgraded. Please contact our team directly for service assistance. Online booking will return with our enhanced website.", "আমাদের অনলাইন বুকিং ব্যবস্থা উন্নত করা হচ্ছে। সেবার সহায়তার জন্য সরাসরি আমাদের দলের সঙ্গে যোগাযোগ করুন। উন্নত ওয়েবসাইটের সঙ্গে অনলাইন বুকিং আবার চালু হবে।"),
  projects: text("Our updated project showcase and interactive 3D previews are coming soon.", "আমাদের আপডেটেড প্রজেক্ট গ্যালারি ও ইন্টারঅ্যাকটিভ 3D প্রিভিউ শিগগিরই আসছে।"),
  email: text("Email AIA", "ইমেইল করুন"),
  whatsapp: text("WhatsApp", "হোয়াটসঅ্যাপ"),
  call: text("Call our team", "ফোন করুন"),
  contact: text("Contact our team", "আমাদের সঙ্গে যোগাযোগ করুন"),
  copy: text("Copy inquiry", "জিজ্ঞাসা কপি করুন"),
  copied: text("Copied. Paste this into your email or WhatsApp message.", "কপি হয়েছে। ইমেইল বা হোয়াটসঅ্যাপ বার্তায় পেস্ট করুন।"),
  copyFailed: text("Please select and copy the inquiry text below.", "নিচের জিজ্ঞাসার লেখা নির্বাচন করে কপি করুন।"),
  notSent: text("Opening email or WhatsApp does not send your inquiry. Review and send it in your chosen app.", "ইমেইল বা হোয়াটসঅ্যাপ খুললে জিজ্ঞাসা পাঠানো হয় না। আপনার নির্বাচিত অ্যাপে দেখে পাঠান।"),
};
export function inquiryEmail(body = "", subject = "Product and service inquiry") {
  const params = new URLSearchParams({ subject, ...(body ? { body } : {}) });
  return `mailto:${company.contact.email}?${params.toString().replaceAll("+", "%20")}`;
}
export function inquiryWhatsApp(message: string) {
  return whatsappUrl(company.contact.whatsapp, message);
}
export function contactText(locale: Locale, key: keyof typeof publicContactCopy) {
  return publicContactCopy[key][locale];
}
