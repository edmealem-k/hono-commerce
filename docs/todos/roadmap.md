# Platform Functional Requirements & Feature Roadmap

This document serves as the master functional requirements specification for the `hono-commerce` multi-tenant e-commerce platform. It outlines all end-to-end capabilities required across the Public Storefront, Merchant Dashboard, Customer Portal, and Superadmin Governance tiers.

---

## 1. Multi-Tenant Architecture & Store Management

### 1.1 Store Onboarding & Tenant Provisioning

- [ ] **Subdomain Provisioning**: Automatically generate isolated store subdomains (e.g. `brandname.domain.com`) on signup.
- [ ] **Custom Domain Mapping**: Allow merchants to connect custom root domains or subdomains (e.g. `shop.brandname.com`) with automated SSL verification.
- [ ] **Store Identity & Branding**:
  - [ ] Custom store logo, favicon, brand typography, and accent colors.
  - [ ] Customizable hero banners, promotional announcement bars, and footer links.
- [ ] **Regional & Currency Localization**:
  - [ ] Multi-currency display and transactions (USD, EUR, GBP, CAD, AUD, JPY).
  - [ ] Timezone, weight unit (kg/lbs), and dimension unit (cm/in) settings.
- [ ] **Store Status Control**: Ability to toggle store state between `Live`, `Maintenance Mode` (password protected), and `Suspended`.

### 1.2 Team Management & Role-Based Access Control (RBAC)

- [ ] **Streamlined Role Taxonomy**:
  - [ ] **Platform Roles (Superadmin)**: `admin` (full platform governance) and `staff` (operations, support, and moderation).
  - [ ] **Merchant Roles (Tenant)**: `owner` (store creator, financial/payout control, settings) and `member` (store staff, catalog/order handling).
- [ ] **Session-Cached Permissions**:
  - [ ] Resolve user permissions once upon authentication/login and attach them directly to the session object (`session.user.permissions`).
  - [ ] Eliminate per-request/per-render database lookups for permission checks across frontend and backend.
- [ ] **Forward-Compatible Authorization Helper (`hasPermission`)**:
  - [ ] Create a shared `hasPermission(authContext, permission)` helper in `@hono-commerce/auth` with full signature support.
  - [ ] Phase 1: Provide permissive positive access for authenticated users with valid role, ensuring all call sites (routes, actions) adhere to the standard authorization API contract.
  - [ ] Phase 2: Incrementally enhance with fine-grained permission string evaluation without changing callers.
- [ ] **Frontend `<PermissionGate>` Wrapper Component**:
  - [ ] Declarative component accepting `children`, `permission`, and optional `fallback` (defaulting to `null`).
  - [ ] Conditionally renders sensitive controls (e.g. refund buttons, payout settings, staff invite forms) based on active session permissions.
- [ ] **Staff Invitations & Activity Log**:
  - [ ] Invite team members via email with role assignments (`owner` / `member` for merchants; `admin` / `staff` for platform).
  - [ ] Immutable audit log recording logins, pricing edits, refunds, and permission changes.

---

## 2. Product Catalog & Merchandising

### 2.1 Product Types & Core Catalog

- [ ] **Physical Products**: Weight, dimensions, shipping requirements, and inventory tracking.
- [ ] **Digital Products**: Secure digital asset delivery via short-lived signed S3 download links upon purchase.
- [ ] **Product Status Lifecycle**: `Draft` $\to$ `Published` $\to$ `Archived` $\to$ `Deleted`.
- [ ] **Rich Content Editor**: WYSIWYG / Markdown description editor with HTML sanitization and embedded media.

### 2.2 Variant Matrix & Options

- [ ] **Multi-Dimensional Variants**: Generate combinations across multiple attributes (e.g., Size $\times$ Color $\times$ Material).
- [ ] **Variant-Level Customization**:
  - [ ] Unique SKU (Stock Keeping Unit) and barcode (UPC/EAN/ISBN) per variant.
  - [ ] Individual pricing, compare-at pricing, and cost price per variant.
  - [ ] Variant-specific image assignment (swapping displayed image when variant is selected).
  - [ ] Individual inventory counts per variant.

### 2.3 Media & Asset Management

- [ ] **Drag-and-Drop S3 Uploader**: Direct client-to-S3 presigned upload with automatic format optimization.
- [ ] **Image Gallery & Reordering**: Reorder image display priority; assign primary cover photo and hover photo.
- [ ] **Product Videos**: Inline video preview support for product demonstrations.
- [ ] **SEO Meta Attributes**: Custom alt text, SEO meta titles, descriptions, and OpenGraph social share previews.

### 2.4 Categories, Collections & Tags

- [ ] **Hierarchical Categories**: Infinite nested parent-child categories (e.g., Apparel $\to$ Men $\to$ Outerwear).
- [ ] **Manual & Automated Collections**:
  - [ ] Manual collections (curated product lists).
  - [ ] Automated collections based on rules (e.g., "Price $< \$50$", "Tag $=$ summer", "Stock $> 0$").
- [ ] **Faceted Filtering Attributes**: Custom filter specifications (e.g., Brand, Fit, Material, Occasion).

### 2.5 Pricing & Merchandising Strategies

- [ ] **Compare-At (Strikethrough) Pricing**: Display original vs. discounted prices with automatic % discount badges.
- [ ] **Cost of Goods Sold (COGS)**: Track unit cost prices for accurate gross profit margin analytics.
- [ ] **Tiered / Volume Discounts**: "Buy 2 get 10% off", "Buy 5+ get 20% off" automated bulk pricing.

---

## 3. Inventory Control & Real-Time Locking

### 3.1 Stock Tracking & Alerts

- [ ] **Real-Time Stock Counter**: Precise variant inventory decrementing upon order confirmation.
- [ ] **Low-Stock Warning Threshold**: Configurable low-stock triggers sending in-app & email alerts to store managers.
- [ ] **Out-of-Stock Behaviors**:
  - [ ] Block purchase when inventory reaches 0.
  - [ ] Allow backorders with clear "Backordered — Ships in X days" messaging.
- [ ] **Stock History Ledger**: Track stock adjustments with reason codes (e.g., "Restock", "Damaged", "Manual Correction").

### 3.2 Concurrency & Inventory Reservation

- [ ] **15-Minute Checkout Inventory Locks**: Temporarily reserve items when a shopper begins checkout to prevent overselling high-demand products.
- [ ] **Automated Lock Expiry**: Release reserved inventory automatically if the shopper abandons checkout after 15 minutes.
- [ ] **Race Condition Protection**: Distributed locking on inventory decrement during concurrent flash-sale checkouts.

---

## 4. Shopping Experience & Search

### 4.1 Discovery & Navigation

- [ ] **Instant Search with Autocomplete**: Real-time search bar with product thumbnail, price, and category suggestions.
- [ ] **Advanced Faceted Filters**:
  - [ ] Filter by price range slider, category, availability, rating, color swatch, and size.
  - [ ] Sort by: Featured, Best Selling, Price (Low to High / High to Low), Customer Rating, Newest Arrivals.
- [ ] **Product Breadcrumbs**: Dynamic hierarchical navigation paths.
- [ ] **Responsive Visual Layouts**: Grid view, list view, and density toggles.

### 4.2 Product Detail Page (PDP)

- [ ] **Interactive Media Viewer**: Zoomable image gallery, thumbnail carousel, and video player.
- [ ] **Dynamic Stock Availability Badge**: "In Stock", "Only 3 left in stock", "Backordered", or "Out of Stock".
- [ ] **Variant Selector**: Interactive pill buttons, dropdowns, and visual color swatches.
- [ ] **Sticky Add-to-Cart Bar**: Persistent bottom/top bar appearing on mobile/desktop as users scroll past the main buy button.
- [ ] **Related & Cross-Sell Products**: "Frequently Bought Together" and "You Might Also Like" carousels.

### 4.3 Shopping Cart

- [ ] **Slideout Cart Drawer & Full Cart Page**: View cart summary with subtotal, estimated shipping, and item counters.
- [ ] **Quantity Modifiers**: Real-time item quantity increment/decrement with instant total calculation without full page reload.
- [ ] **Cross-Device Cart Persistence**: Saved carts for authenticated customers syncing across mobile and desktop.
- [ ] **Guest Cart Merging**: Automatically merge guest cart items into customer cart upon signing in.
- [ ] **Save for Later / Wishlist**: Move items from cart to wishlist without deleting them.

---

## 5. Discounts, Promotions & Marketing

### 5.1 Coupon & Promo Code Engine

- [ ] **Discount Types**:
  - [ ] Percentage discount (e.g. 20% off).
  - [ ] Fixed amount discount (e.g. $15 off).
  - [ ] Free shipping discount.
  - [ ] "Buy X, Get Y Free" (BOGO) rules.
- [ ] **Usage Restrictions & Conditions**:
  - [ ] Minimum cart order value requirement (e.g., "$100 minimum spend").
  - [ ] Specific category or product exclusions.
  - [ ] Total usage limits (e.g., "First 100 customers only").
  - [ ] Per-customer usage limits (e.g., "1 per customer").
  - [ ] Start date and expiration date scheduling.

### 5.2 Automated Marketing & Recovery

- [ ] **Abandoned Cart Recovery Drips**:
  - [ ] Automatically detect abandoned checkout sessions.
  - [ ] Send personalized recovery emails with 1-click cart restoration link at 2-hour and 24-hour intervals.
- [ ] **Customer Welcome Series**: Automated onboarding email with promotional first-purchase discount code.
- [ ] **Customer Re-engagement**: Automated emails for customers inactive for 60+ days.

---

## 6. Checkout & Payment Processing

### 6.1 Seamless Checkout Flows

- [ ] **Frictionless Multi-Step & Single-Page Checkout**: Clean, distracted-free layout optimized for low cart abandonment.
- [ ] **Guest Checkout**: Allow shoppers to purchase without creating an account (with optional post-purchase 1-click registration).
- [ ] **Address Autocomplete & Validation**: Predictive street address autocomplete to reduce delivery failures.
- [ ] **Shipping Rate Calculation**: Real-time shipping rate selection (Standard, Express, Overnight, Free Shipping thresholds).
- [ ] **Sales Tax Calculation**: Automated tax rate calculation based on shipping destination postal code.

### 6.2 Payment Methods & Stripe Integration

- [ ] **Credit & Debit Cards**: Visa, Mastercard, American Express, Discover with 3D Secure / SCA support.
- [ ] **Digital Wallets**: Apple Pay and Google Pay via Stripe Express Checkout Element.
- [ ] **Buy Now Pay Later (BNPL)**: Klarna, Afterpay, and Affirm installment options.
- [ ] **Stripe Connect Destination Charges**:
  - [ ] Platform fee commission split (% application fee retained by marketplace).
  - [ ] Net balance automatically routed to merchant's connected Stripe account.

---

## 7. Order Lifecycle & Fulfillment State Machine

### 7.1 Order Status Transitions

- [ ] **Standard Lifecycle**:
  - [ ] `Pending Payment` $\to$ Awaiting checkout completion.
  - [ ] `Paid / Confirmed` $\to$ Payment captured; inventory committed.
  - [ ] `Processing / Packing` $\to$ Order being prepared in warehouse.
  - [ ] `Shipped` $\to$ Tracking number attached; carrier in transit.
  - [ ] `Delivered` $\to$ Package confirmed delivered by carrier.
  - [ ] `Completed` $\to$ Order fulfilled and return window closed.
- [ ] **Exception & Cancellation States**:
  - [ ] `On Hold` $\to$ Manual review required (fraud flag / address issue).
  - [ ] `Cancelled` $\to$ Order terminated; inventory restored.
  - [ ] `Refunded` (Full / Partial) $\to$ Funds reversed via Stripe.
  - [ ] `Disputed / Chargeback` $\to$ Payment challenged by cardholder.

### 7.2 Fulfillment Tools

- [ ] **Fulfillment Drawer / Inspector**: Slideout drawer to fulfill specific items or split shipments into multiple packages.
- [ ] **Tracking Number & Carrier Management**: Assign carrier (FedEx, UPS, USPS, DHL) and tracking code with clickable links.
- [ ] **Automated Customer Shipping Notification**: Instant email & SMS alert containing tracking URL when marked shipped.
- [ ] **Printable Invoices & Packing Slips**: 1-click printable PDF packing slip and receipt formatted for thermal/standard printers.
- [ ] **Audit Trail & Order Timeline**: Chronological log of every order event, status change, note, and staff action.

### 7.3 Returns & Refunds Management

- [ ] **Full & Partial Refunds**: Process refunds with optional automatic restocking of returned inventory.
- [ ] **Customer Return Requests**: Self-service return portal where customers can submit return reasons and photo evidence.
- [ ] **Return Status Tracking**: `Requested` $\to$ `Approved` $\to$ `Item Received` $\to$ `Refund Issued`.

---

## 8. Customer Account Portal

### 8.1 Customer Self-Service

- [ ] **Authentication & Security**: Email/password login, social login (Google/GitHub), and password reset flows.
- [ ] **Profile & Preferences**: Update name, email, phone number, and communication preferences.
- [ ] **Address Book**: Save multiple shipping and billing addresses with default designations.

### 8.2 Order Tracking & Invoices

- [ ] **Live Order Tracking**: Visual progress bar showing real-time order status from placement to delivery.
- [ ] **Order History & Invoices**: Full historical order log with line-item receipts, prices, and PDF invoice downloads.
- [ ] **1-Click Re-Order**: Add all items from a past order back into active cart in a single click.

---

## 9. Real-Time Customer Support & Live Chat

### 9.1 Storefront Customer Chat Widget

- [ ] **Floating Live Chat Trigger**: Minimizable chat bubble on storefront with unread badge counter.
- [ ] **Live Message Streaming**: Instant WebSocket messaging with store support staff.
- [ ] **Typing Indicators & Read Receipts**: Visual feedback when an agent or customer is typing or has viewed messages.
- [ ] **Media & Attachment Uploads**: Upload photos, receipts, or screenshots directly in chat.

### 9.2 Merchant Support Inbox

- [ ] **Split-View Chat Workspace**: Resizable split screen panel (`GlobalSplitView`) in merchant dashboard for simultaneous chat and order inspection.
- [ ] **Conversation Assignment**: Assign chat tickets to specific team members.
- [ ] **Customer Context Card**: Right-hand panel displaying customer's lifetime spend, recent orders, and current cart items during chat.
- [ ] **Offline Digest Email**: If agent or customer goes offline, debounce and dispatch unread messages as an email summary after 5 minutes.

---

## 10. Customer Reviews, Ratings & Social Proof

### 10.1 Review Submission & Moderation

- [ ] **Verified Buyer Reviews**: 1–5 star rating, review headline, written review, and "Verified Buyer" badge.
- [ ] **Review Media**: Customers can attach product photos or videos to their reviews.
- [ ] **Merchant Moderation Queue**:
  - [ ] Approve, reject, or flag reviews before or after publishing.
  - [ ] Spam / profanity filter protection.
- [ ] **Merchant Public Replies**: Store owners can publicly respond to reviews to resolve complaints or thank customers.

### 10.2 Review Analytics & Aggregation

- [ ] **Rating Distribution Breakdown**: Visual bar chart showing % of 5-star, 4-star, 3-star, 2-star, and 1-star reviews.
- [ ] **Product Card Rating Badges**: Display aggregate star rating and review count on catalog cards.
- [ ] **Review Sorting & Search**: Filter reviews by rating, verified status, and keyword search.

---

## 11. Notifications & Communication Engine

### 11.1 Transactional Email Suite (React Email)

- [ ] **Customer Emails**:
  - [ ] Welcome & account verification.
  - [ ] Order confirmation with itemized receipt.
  - [ ] Order shipped with carrier tracking URL.
  - [ ] Out for delivery & delivered confirmation.
  - [ ] Refund processed notification.
  - [ ] Abandoned cart recovery reminder.
- [ ] **Merchant Notifications**:
  - [ ] New order notification with order value.
  - [ ] Low-stock & out-of-stock alerts.
  - [ ] Daily sales digest.
  - [ ] Payout processed notification.
  - [ ] New customer review pending moderation.

### 11.2 In-App Notification Center

- [ ] **Dashboard Notification Bell**: Real-time dropdown alerting merchants of urgent operational events.
- [ ] **Notification Preferences**: Configurable settings allowing users to toggle email, in-app, and push channels per event type.

---

## 12. Analytics, Financials & Reporting

### 12.1 Merchant Analytics Dashboard

- [ ] **Core KPI Hero Cards**:
  - [ ] Gross Merchandise Value (GMV).
  - [ ] Total Orders & Units Sold.
  - [ ] Average Order Value (AOV).
  - [ ] Store Conversion Rate (Visitors $\to$ Purchases).
- [ ] **Sales Trend Visualizations**: Interactive revenue graphs (Hourly, Daily, Weekly, Monthly, Annual).
- [ ] **Top Products & Categories**: Ranking of top-performing items by revenue and volume.
- [ ] **Customer Acquisition Metrics**: Returning customer rate vs. new customer acquisition.

### 12.2 Financial Ledgers & Stripe Payouts

- [ ] **Stripe Connect Split Reconciliation**: View gross sales, marketplace commission deductions, processing fees, and net merchant balance.
- [ ] **Payout Scheduling & History**: Track scheduled, in-transit, and completed bank account deposits.
- [ ] **Tax & Financial Reports**: Exportable CSV/PDF reports for quarterly and annual accounting.

---

## 13. Platform Superadmin & Multi-Store Governance

### 13.1 Platform-Wide Oversight

- [ ] **Global KPI Dashboard**: Aggregate GMV across all tenant stores, total active stores, platform commission revenue, and total customer count.
- [ ] **Tenant Directory & Lifecycle**:
  - [ ] View list of all registered stores with revenue tiers, domain status, and subscription plans.
  - [ ] 1-click store suspension (for policy violations) or store reactivation.
- [ ] **Platform Review & Dispute Moderation**: Superadmin escalation center for chargeback disputes and reported merchant misconduct.

### 13.2 Background Queue & Worker Health

- [ ] **Bull-Board Monitoring**: Real-time dashboard showing BullMQ queue health (`orders`, `stripe-webhooks`, `tenant-webhooks`, `emails`, `inventory-locks`, `abandoned-cart`, `crons`).
- [ ] **Failed Job Inspection & Replay**: View stack traces of failed jobs and trigger 1-click retry.

---

## 14. Outbound Webhooks & Developer APIs

### 14.1 Merchant Webhook Subscriptions

- [ ] **Webhook Event Registry**: Allow merchants to configure webhook endpoints listening to:
  - [ ] `order.created`, `order.paid`, `order.fulfilled`, `order.cancelled`
  - [ ] `product.created`, `product.updated`, `product.deleted`
  - [ ] `inventory.low_stock`, `inventory.out_of_stock`
  - [ ] `customer.created`
- [ ] **HMAC-SHA256 Signature Verification**: Sign all outbound payloads with merchant secret key for payload authenticity.
- [ ] **Webhook Delivery Logs & Retry**: History of HTTP response codes ($200, 400, 500$) with automated exponential backoff and manual retry button.
