# Phase A.1 sales extension

Review only. Extends the [Phase A diagram](phase-a-schema-erd.md), not the active database. The [combined proposal](../prisma/proposals/phase-a1.prisma) and [incremental SQL](../prisma/proposals/phase-a1-extension.sql) are generated offline. Commercial documents reuse existing version, approval, immutable snapshot, private file and portal grant records.

```mermaid
erDiagram
  Sale {
    String id PK
  }
  Customer |o--o{ Sale : "customer"
  QuotationVersion |o--o{ Sale : "sourceQuotationVersion"
  SaleItem {
    String id PK
  }
  Sale ||--o{ SaleItem : "sale"
  Product |o--o{ SaleItem : "product"
  CommercialDocument {
    String id PK
  }
  Sale ||--o{ CommercialDocument : "sale"
  DocumentVersion ||--o{ CommercialDocument : "documentVersion"
  PaymentRecord |o--o{ CommercialDocument : "payment"
  DeliveryRecord |o--o{ CommercialDocument : "delivery"
  PaymentMethod {
    String id PK
  }
  PaymentRecord {
    String id PK
  }
  PaymentMethod ||--o{ PaymentRecord : "method"
  PaymentAllocation {
    String id PK
  }
  PaymentRecord ||--o{ PaymentAllocation : "payment"
  Sale ||--o{ PaymentAllocation : "sale"
  RefundRecord {
    String id PK
  }
  PaymentRecord ||--o{ RefundRecord : "payment"
  DeliveryRecord {
    String id PK
  }
  Sale ||--o{ DeliveryRecord : "sale"
  DeliveryItem {
    String id PK
  }
  DeliveryRecord ||--o{ DeliveryItem : "delivery"
  SaleItem ||--o{ DeliveryItem : "saleItem"
  StockMovement {
    String id PK
  }
  Product ||--o{ StockMovement : "product"
  DeliveryItem |o--o{ StockMovement : "deliveryItem"
```
