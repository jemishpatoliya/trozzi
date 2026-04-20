# Trozzi Admin Use Case Diagram (Mermaid)

## Full Use Case Diagram

```mermaid
flowchart TB
    subgraph Actors
        A[👤 Admin]
        S[⚙️ System]
    end

    subgraph "🔐 Authentication"
        UC1[Admin Login]
        UC2[View Profile]
        UC3[Token Validation]
    end

    subgraph "📊 Dashboard & Analytics"
        UC4[View Dashboard]
        UC5[Analytics Overview]
        UC6[Real-time Analytics]
        UC7[BI Analytics]
        UC8[View Notifications]
        UC9[Mark Notification Read]
    end

    subgraph "👥 User Management"
        UC10[View Users]
        UC11[Search Users]
        UC12[Filter by Role]
        UC13[View User Cart]
        UC14[View User Orders]
    end

    subgraph "📦 Product Management"
        UC15[View Products]
        UC16[Search Products]
        UC17[Filter by Category]
        UC18[Create Product]
        UC19[Edit Product]
        UC20[Delete Product]
        UC21[View Product Details]
    end

    subgraph "📁 Category Management"
        UC22[View Categories]
        UC23[Create Category]
        UC24[Edit Category]
        UC25[Delete Category]
    end

    subgraph "⭐ Review Management"
        UC26[View Reviews]
        UC27[Filter by Rating/Status]
        UC28[Search Reviews]
        UC29[Update Review Status]
        UC30[Delete Review]
        UC31[View Review Stats]
        UC32[Export to CSV]
    end

    subgraph "🎯 Banner Management"
        UC33[View Banners]
        UC34[Create Banner]
        UC35[Edit Banner]
        UC36[Delete Banner]
        UC37[Toggle Banner Status]
        UC38[Upload Banner Image]
    end

    subgraph "🚚 Order & Shipment"
        UC39[View Orders]
        UC40[Mark Delivered]
        UC41[View Refund Requests]
        UC42[Approve Refund]
        UC43[Retry Shipment]
        UC44[Cancel Shipment]
        UC45[Sync AWB Tracking]
        UC46[PhonePe Refund]
    end

    subgraph "⚙️ Content Settings"
        UC47[View Settings]
        UC48[Update Brand Logo]
        UC49[Update Default Avatar]
        UC50[Configure Bio Length]
        UC51[Toggle Order History]
        UC52[Toggle Wishlist Count]
        UC53[Toggle Profile Edit]
        UC54[Toggle COD Option]
    end

    A --> UC1 & UC4 & UC10 & UC15 & UC22 & UC26 & UC33 & UC39 & UC47 & UC8
    S --> UC3 & UC6 & UC8
```

---

## Simplified Use Case Diagram by Module

### 1. Authentication Flow
```mermaid
flowchart LR
    A[Admin] --> B[Enter Credentials]
    B --> C{Valid?}
    C -->|Yes| D[Generate JWT Token]
    C -->|No| E[Show Error]
    D --> F[Access Dashboard]
    F --> G[Token Validation]
    G -->|Valid| H[Access Protected Routes]
    G -->|Expired| I[Redirect to Login]
```

### 2. Dashboard & Analytics
```mermaid
mindmap
  root((Admin Dashboard))
    Overview Metrics
      Total Orders
      Total Revenue
      Unique Visitors
      Conversion Rate
    Real-time
      Active Users
      Orders/Minute
      Page Views
      Live Traffic
    Analytics
      Traffic Trends
      Revenue by Day
      Top Products
      Regional Data
    Notifications
      Unread Count
      Mark Read
      Mark All Read
```

### 3. User Management
```mermaid
flowchart TD
    A[User Management] --> B[View Users List]
    B --> C[Search/Filter]
    C --> D[Select User]
    D --> E[View User Cart]
    D --> F[View User Orders]
    D --> G[View User Details]
    
    C --> H[Filter by Role]
    C --> I[Search by Name/Email/Phone]
```

### 4. Product Management
```mermaid
flowchart TD
    A[Product Management] --> B[View Products]
    B --> C[Search/Filter]
    C --> D[Select Product]
    
    D --> E[View Details]
    D --> F[Edit Product]
    D --> G[Delete Product]
    
    B --> H[Create Product]
    H --> I[Add Details]
    I --> J[Upload Images]
    J --> K[Set Price/Stock]
    K --> L[Save Product]
    
    C --> M[Filter by Category]
    C --> N[Search by Name/SKU/Brand]
```

### 5. Category Management
```mermaid
flowchart LR
    A[Category Management] --> B[View Categories]
    B --> C[Create Category]
    B --> D[Edit Category]
    B --> E[Delete Category]
    B --> F[Search Categories]
    
    C --> G[Set Name/Description]
    G --> H[Upload Image]
    H --> I[Set Order]
```

### 6. Review Management
```mermaid
flowchart TD
    A[Review Management] --> B[View Reviews]
    B --> C[Filter Reviews]
    C --> D[By Rating 1-5]
    C --> E[By Status]
    E --> F[Pending]
    E --> G[Approved]
    E --> H[Rejected]
    
    B --> I[Search Reviews]
    B --> J[View Statistics]
    B --> K[Export CSV]
    
    B --> L[Select Review]
    L --> M[Update Status]
    L --> N[Delete Review]
```

### 7. Banner Management
```mermaid
flowchart TD
    A[Banner Management] --> B[View Banners]
    B --> C[Filter by Position]
    C --> D[Home]
    C --> E[Category]
    C --> F[Product]
    
    B --> G[Create Banner]
    G --> H[Upload Image]
    H --> I[Set Title/Link]
    I --> J[Set Position]
    
    B --> K[Edit Banner]
    B --> L[Delete Banner]
    B --> M[Toggle Active Status]
```

### 8. Order & Shipment Management
```mermaid
flowchart TD
    A[Order Management] --> B[View Orders]
    B --> C[Select Order]
    
    C --> D[Mark Delivered]
    C --> E[Manage Shipment]
    
    E --> F[Retry Shipment]
    E --> G[Cancel Shipment]
    E --> H[Sync AWB]
    
    B --> I[Refund Requests]
    I --> J[View Pending]
    I --> K[View Approved]
    J --> L[Approve Refund]
    L --> M[PhonePe Refund]
```

### 9. Content Settings
```mermaid
flowchart LR
    A[Content Settings] --> B[Brand Logo]
    A --> C[Default Avatar]
    A --> D[Bio Max Length]
    A --> E[Feature Toggles]
    
    E --> F[Order History Display]
    E --> G[Wishlist Count]
    E --> H[Profile Editing]
    E --> I[COD Option]
```

---

## Use Case Summary Table

| Module | Total Use Cases | Core Functions |
|--------|-----------------|----------------|
| Authentication | 3 | Login, Profile, Token |
| Dashboard | 7 | Overview, Analytics, Notifications |
| User Mgmt | 5 | CRUD + Cart/Orders |
| Product Mgmt | 7 | CRUD + Search/Filter |
| Category Mgmt | 5 | CRUD + Search |
| Review Mgmt | 7 | CRUD + Stats + Export |
| Banner Mgmt | 6 | CRUD + Toggle + Upload |
| Order Mgmt | 8 | Orders + Shipments + Refunds |
| Settings | 8 | View + 7 Update functions |
| **TOTAL** | **56** | Complete Admin Suite |

---

## File Location
`c:\Users\computer\Downloads\trozzi\trozzi\trozzi\admin-use-case-mermaid.md`
