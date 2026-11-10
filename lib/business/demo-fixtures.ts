// FICTIONAL DEMO DATA ONLY. Imported exclusively by the development-only workspace
// and tests. Never used by the public catalog, production reports, or a DB seed.
import { amount, calculateQuote, decimal } from "./finance.ts";
import type { QuotationDraft } from "./documents.ts";
import type { DemoSale, SalesDraft } from "./sales.ts";

export type DemoProduct = {
  id: string;
  sku: string;
  name: string;
  nameBn: string;
  category: string;
  price: string;
  stock: number;
  reorder: number;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  unit: string;
  specifications: string;
  image: string;
  demo: true;
};
export const demoToday = "2026-11-08";
export function daysBefore(days: number) {
  return new Date(Date.UTC(2026, 10, 8 - days)).toISOString().slice(0, 10);
}
export const demoCategories = [
  "Architectural lighting",
  "Smart locks",
  "Switches & controls",
  "CCTV & security",
  "Home automation",
];
export function createDemoDataset() {
  const specs = [
    [
      "Linear Pendant 1200",
      "লিনিয়ার পেন্ডেন্ট",
      "Architectural lighting",
      "6500",
      24,
      8,
    ],
    [
      "Halo Pendant 600",
      "হ্যালো পেন্ডেন্ট",
      "Architectural lighting",
      "12500",
      6,
      8,
    ],
    [
      "Warm Downlight 12W",
      "ওয়ার্ম ডাউনলাইট",
      "Architectural lighting",
      "850",
      120,
      20,
    ],
    ["Smart Lock S1", "স্মার্ট লক", "Smart locks", "18500", 7, 5],
    ["Access Lock Pro", "অ্যাক্সেস লক", "Smart locks", "24000", 3, 5],
    [
      "Glass Touch Switch",
      "গ্লাস টাচ সুইচ",
      "Switches & controls",
      "2200",
      45,
      10,
    ],
    [
      "Universal Socket",
      "ইউনিভার্সাল সকেট",
      "Switches & controls",
      "650",
      64,
      15,
    ],
    ["CCTV Dome 4MP", "সিসিটিভি ডোম", "CCTV & security", "4800", 18, 8],
    [
      "CCTV Recorder 8CH",
      "সিসিটিভি রেকর্ডার",
      "CCTV & security",
      "14500",
      4,
      5,
    ],
    ["Motion Sensor Mini", "মোশন সেন্সর", "Home automation", "1800", 32, 10],
    ["Smart Home Hub", "স্মার্ট হোম হাব", "Home automation", "9500", 8, 6],
    [
      "Outdoor Wall Light",
      "আউটডোর ওয়াল লাইট",
      "Architectural lighting",
      "3200",
      0,
      5,
    ],
  ] as const;
  const products: DemoProduct[] = specs.map((p, i) => ({
    id: `DEMO-P-${i + 1}`,
    sku: `DEMO-${String(i + 1).padStart(3, "0")}`,
    name: p[0],
    nameBn: p[1],
    category: p[2],
    price: p[3],
    stock: p[4],
    reorder: p[5],
    status: i === 11 ? "DRAFT" : "PUBLISHED",
    unit: "pcs",
    specifications:
      "Fictional demonstration specification. Verify actual product details before publication.",
    image: "",
    demo: true,
  }));
  const names = [
    "Arefin Rahman",
    "Nusrat Jahan",
    "Tanvir Hasan",
    "Sadia Karim",
    "Mahin Chowdhury",
    "Farzana Haque",
    "Rafiq Ahmed",
    "Samiha Islam",
  ];
  const places = [
    "Uttara, Dhaka",
    "Dhanmondi, Dhaka",
    "Mirpur, Dhaka",
    "Bashundhara, Dhaka",
    "Gulshan, Dhaka",
    "Banani, Dhaka",
    "Chattogram",
    "Gazipur",
  ];
  const customers = names.map((name, i) => ({
    id: `DEMO-C-${i + 1}`,
    name: `${name} · Demo`,
    organization:
      [
        "Neel Alo Interiors",
        "Meghna Living Studio",
        "Shapla Workspace",
        "Borno Design House",
      ][i % 4] + " (fictional)",
    email: `customer${i + 1}.demo@example.com`,
    phone: `DEMO-PHONE-${i + 1}`,
    area: places[i],
    demo: true as const,
  }));
  const sales: DemoSale[] = Array.from({ length: 72 }, (_, i) => {
    const customer = customers[i % customers.length],
      product = products[(i * 7 + Math.floor(i / 4)) % products.length];
    const items = [
      {
        id: `DEMO-SL-${i}`,
        code: product.sku,
        description: product.name,
        unit: product.unit,
        quantity: String((i % 4) + 1),
        unitPrice: product.price,
      },
    ];
    const financials = {
      items,
      discount: "0",
      taxPercent: "0",
      charges: i % 3 === 0 ? "300" : "0",
    };
    const total = calculateQuote(financials).total,
      date = daysBefore(i < 4 ? i % 2 : Math.floor(i * 0.95));
    const paid =
      i % 5 === 0
        ? "0"
        : i % 3 === 0
          ? decimal(amount(total) / BigInt(2))
          : total;
    return {
      id: `DEMO-SALE-${String(i + 1).padStart(3, "0")}`,
      customerId: customer.id,
      customer: customer.name,
      date,
      ...financials,
      status: i === 69 ? "VOIDED" : "COMMITTED",
      payments:
        paid === "0"
          ? []
          : [
              {
                id: `DEMO-PAY-${i + 1}`,
                amount: paid,
                method:
                  i % 3 === 0
                    ? "BANK_TRANSFER"
                    : i % 3 === 1
                      ? "CASH"
                      : "MOBILE_FINANCE",
                state: "POSTED",
                date,
                reference: `DEMO-PAYMENT-${i + 1}`,
                demo: true,
              },
            ],
      demo: true,
    };
  });
  const quotations = customers.slice(0, 6).map((client, i) => {
    const product = products[i];
    const draft: QuotationDraft = {
      client: client.name,
      attention: "",
      email: client.email,
      address: `${client.area} · Demo area only`,
      project: `${client.organization} · Demo fit-out`,
      date: demoToday,
      validUntil: "2026-11-22",
      items: [
        {
          id: `DEMO-QL-${i}`,
          code: product.sku,
          description: product.name,
          unit: "pcs",
          quantity: String(i + 2),
          unitPrice: product.price,
        },
      ],
      discount: "0",
      taxPercent: "0",
      charges: "500",
      terms: "Demonstration terms only. Final scope subject to client review.",
      paymentTerms: "Payment schedule to be agreed.",
      deliveryTerms: "Schedule to be agreed after site review.",
      notes: "",
    };
    return {
      id: `DEMO-QUO-2026-${String(i + 1).padStart(3, "0")}`,
      status: (i === 5 ? "DRAFT" : i % 2 === 0 ? "ISSUED" : "APPROVED") as
        | "DRAFT"
        | "APPROVED"
        | "ISSUED",
      demo: true as const,
      draft,
    };
  });
  const requests = Array.from({ length: 18 }, (_, i) => ({
    id: `DEMO-REQ-${100 + i}`,
    customer: customers[i % 8].name,
    type: [
      "Product quotation",
      "Service booking",
      "Site visit",
      "Consultation",
    ][i % 4],
    status: ["Pending Review", "In Review", "Scheduled", "Completed"][i % 4],
    date: daysBefore(i % 12),
    area: places[i % 8],
    assignee: [
      "Nabila Sultana · Demo",
      "Imran Hossain · Demo",
      "Mehedi Hasan · Demo",
    ][i % 3],
    latitude: null,
    longitude: null,
    demo: true as const,
  }));
  const services = [
    "Lighting installation",
    "Smart lock installation",
    "CCTV site assessment",
    "Home automation consultation",
  ].map((name, i) => ({
    id: `DEMO-SVC-${i}`,
    name,
    category: i < 2 ? "Installation" : "Consultation",
    status: "Published",
    demo: true,
  }));
  const commercialDocuments = sales
    .slice(0, 16)
    .filter((s) => s.status === "COMMITTED")
    .map((sale, i) => ({
      id: `DEMO-${i % 2 === 0 ? "MEM" : "INV"}-2026-${String(i + 1).padStart(3, "0")}`,
      saleId: sale.id,
      kind: i % 2 === 0 ? ("MEMO" as const) : ("INVOICE" as const),
      status: "ISSUED" as const,
      demo: true as const,
    }));
  return {
    products,
    customers,
    sales,
    quotations,
    requests,
    services,
    commercialDocuments,
  };
}
export type DemoDataset = ReturnType<typeof createDemoDataset>;
export function demoSaleDraft(
  sale: DemoSale,
  kind: SalesDraft["kind"] = "MEMO",
): SalesDraft {
  return {
    client: sale.customer,
    attention: "",
    email: "demo.customer@example.com",
    address: "Dhaka · Demo service area",
    project: "",
    date: sale.date,
    validUntil: "",
    items: structuredClone(sale.items),
    discount: sale.discount,
    taxPercent: sale.taxPercent,
    charges: sale.charges,
    terms: "",
    paymentTerms: "Demonstration payment allocation only.",
    deliveryTerms: "",
    notes: "",
    kind,
    sourceQuotation: null,
    payments: structuredClone(sale.payments),
    issuer: "Demo Accounts Team",
    demo: true,
  };
}
