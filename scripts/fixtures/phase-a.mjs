// Local QA only. Never imported by routes, seed scripts, or production services.
export function quotationFixture(count, locale = 'en', extra = {}) {
  const bn = locale === 'bn';
  return {
    client: bn ? 'পরীক্ষার নমুনা প্রতিষ্ঠান · বাস্তব গ্রাহক নয়' : 'TEST FIXTURE · Not a real customer',
    attention: bn ? 'পর্যালোচনার জন্য' : 'Document review only',
    email: 'fixture@example.invalid', address: '',
    project: bn ? 'পরীক্ষার নথি · আলো ও স্থাপন পরিকল্পনা' : 'TEST ONLY · Lighting & installation document layout',
    date: '2026-11-08', validUntil: '2026-11-22',
    items: Array.from({ length: count }, (_, i) => ({ id: `fixture-${i}`, code: `TEST-${String(i + 1).padStart(3, '0')}`, description: bn ? `পরীক্ষার পণ্য ${i + 1} — আলো ও বৈদ্যুতিক সেবার পরিকল্পনা; স্থাপনের বিবরণ ও পরিমাণ যাচাই করুন।` : `Test line ${i + 1} · Architectural lighting and installation planning. Review the description, unit and quantity.`, unit: bn ? 'টি' : 'pcs', quantity: '2', unitPrice: '1234.56' })),
    discount: '100', taxPercent: '7.50', charges: '250',
    terms: bn ? 'এই নথি শুধু নকশা ও সফটওয়্যার পরীক্ষার জন্য। এটি অনুমোদিত কোটেশন নয়।' : 'This fixture is for document design and software testing only. It is not an approved quotation.',
    paymentTerms: bn ? 'পরীক্ষার নমুনা · কোনো অর্থ প্রদান করবেন না।' : 'TEST ONLY · No payment requested.',
    deliveryTerms: bn ? 'কোনো ডেলিভারি বা স্থাপন নির্ধারিত হয়নি।' : 'No delivery or installation has been scheduled.',
    notes: '', ...extra,
  };
}
export function letterFixture(locale = 'en') {
  return { recipient: locale === 'bn' ? 'পরীক্ষার প্রাপক' : 'TEST RECIPIENT', designation: '', organization: 'TEST ONLY · Not a real organization', address: '', subject: locale === 'bn' ? 'অফিশিয়াল লেটারহেডের পরীক্ষার খসড়া' : 'Letterhead design review', body: locale === 'bn' ? 'সম্মানিত মহোদয়,\n\nএটি বাংলা অক্ষর, যুক্তাক্ষর ও পৃষ্ঠার বিন্যাস যাচাই করার একটি পরীক্ষার নথি।\n\nএই নথিতে কোনো বাস্তব ব্যবসায়িক প্রস্তাব বা দাবি করা হয়নি।\n\nধন্যবাদান্তে,' : 'Dear recipient,\n\nThis document is a local fixture for reviewing company letterhead, typography, spacing, and print layout. It makes no business proposal or factual claim.\n\nThe letter editor supports recipient details, an editable subject and body, a date, and authorized sender information when supplied.\n\nYours faithfully,', date: '2026-11-08', sender: 'TEST SENDER · Not signed', senderDesignation: '' };
}
