import { brandingDefaults } from "../branding";
import { text } from "../i18n";

// The existing owner-supplied public details, shared by the website and NEW
// document drafts. A future CMS repository must validate a revision into this DTO.
// Issued documents must read their stored snapshot instead of these live values.
export const companySettings = {
  name: "AIA Home Solutions BD",
  country: text("Bangladesh", "বাংলাদেশ"),
  contact: {
    phone: "+8801601891663",
    email: "info@aiagroupbd.com",
    whatsapp: "+8801601891663",
    whatsappMessage: text(
      "Hello AIA Home Solutions BD, I would like to discuss a home or commercial project.",
      "AIA Home Solutions BD, আমার বাসা বা বাণিজ্যিক প্রকল্প নিয়ে আলোচনা করতে চাই।",
    ),
    address: text(
      "H#30, Sonargaon Janapath, Uttara, Dhaka 1230",
      "বাসা #৩০, সোনারগাঁও জনপথ, উত্তরা, ঢাকা ১২৩০",
    ),
  },
  socialLinks: {
    facebookUrl: null,
    instagramUrl: null,
    youtubeUrl: null,
    linkedinUrl: null,
  },
  social: [],
  logos: brandingDefaults,
};

export type CompanySnapshot = {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  documentFooter: string;
};

export function currentCompanySnapshot(
  locale: "en" | "bn" = "en",
): CompanySnapshot {
  return {
    name: companySettings.name,
    address: companySettings.contact.address[locale],
    phone: companySettings.contact.phone,
    email: companySettings.contact.email,
    logo: companySettings.logos.header.light.src,
    documentFooter: "",
  };
}
