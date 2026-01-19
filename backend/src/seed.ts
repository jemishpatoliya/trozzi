import dotenv from "dotenv";

import { connectDb } from "./db";
import { CategoryModel } from "./models/category";
import { CartModel } from "./models/cart";
import { ProductModel } from "./models/product";
import { UserModel } from "./models/user";
import { OrderModel } from "./models/order";
import { PaymentModel } from "./models/payment";
import { WishlistModel } from "./models/wishlist";
import bcrypt from "bcryptjs";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI env var");
  }

  console.log("✅ Seed disabled: not inserting any demo data");
  process.exit(0);

  await connectDb(MONGODB_URI);

  console.log("✅ Seed disabled: not inserting demo products/categories");
  process.exit(0);

  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  const existingUsers = await UserModel.countDocuments({});
  if (existingUsers === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await UserModel.insertMany([
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin",
        active: true,
        emailVerified: true,
        createdAt: new Date(),
      },
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: await bcrypt.hash("user123", 10),
        role: "user",
        active: true,
        emailVerified: true,
        createdAt: new Date(),
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        password: await bcrypt.hash("user123", 10),
        role: "user",
        active: true,
        emailVerified: true,
        createdAt: new Date(),
      },
      {
        firstName: "Mike",
        lastName: "Johnson",
        email: "mike.johnson@example.com",
        password: await bcrypt.hash("user123", 10),
        role: "user",
        active: true,
        emailVerified: true,
        createdAt: new Date(),
      },
      {
        firstName: "Sarah",
        lastName: "Williams",
        email: "sarah.williams@example.com",
        password: await bcrypt.hash("user123", 10),
        role: "user",
        active: true,
        emailVerified: true,
        createdAt: new Date(),
      },
    ]);
    console.log("✅ Seeded users successfully");
  } else {
    console.log("✅ Users already exist, skipping seeding");
  }

  const existingOrders = await OrderModel.countDocuments({});
  if (existingOrders === 0) {
    await OrderModel.insertMany([
      {
        orderNumber: "ORD-2024-001",
        status: "delivered",
        currency: "INR",
        subtotal: 2598,
        shipping: 50,
        tax: 260,
        total: 2908,
        items: [
          {
            productId: "6958978b118e9bfd82080949",
            name: "Cotton Kurti - Blue",
            price: 599,
            quantity: 2,
            image: "https://serviceapi.spicezgold.com/download/1742452035509_rtrt2.jpg",
          },
          {
            productId: "6958978b118e9bfd82080950",
            name: "Designer Saree - Red",
            price: 1299,
            quantity: 1,
            image: "https://images.unsplash.com/photo-1594736797933-d0acc2401915?w=1200&q=80&auto=format&fit=crop",
          },
        ],
        customer: {
          name: "John Doe",
          email: "john.doe@example.com",
          phone: "+91 9876543210",
        },
        address: {
          line1: "123 Main Street",
          line2: "Apartment 4B",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
        },
        createdAtIso: nowIso,
      },
      {
        orderNumber: "ORD-2024-002",
        status: "processing",
        currency: "INR",
        subtotal: 15999,
        shipping: 0,
        tax: 1600,
        total: 17599,
        items: [
          {
            productId: "6958978b118e9bfd82080952",
            name: "Android Smartphone Pro",
            price: 15999,
            quantity: 1,
            image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80&auto=format&fit=crop",
          },
        ],
        customer: {
          name: "Jane Smith",
          email: "jane.smith@example.com",
          phone: "+91 9876543211",
        },
        address: {
          line1: "456 Park Avenue",
          line2: "Suite 12",
          city: "Bangalore",
          state: "Karnataka",
          postalCode: "560001",
          country: "India",
        },
        createdAtIso: nowIso,
      },
      {
        orderNumber: "ORD-2024-003",
        status: "shipped",
        currency: "INR",
        subtotal: 4498,
        shipping: 100,
        tax: 460,
        total: 5058,
        items: [
          {
            productId: "6958978b118e9bfd82080951",
            name: "Sports Running Shoes",
            price: 1599,
            quantity: 1,
            image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80&auto=format&fit=crop",
          },
          {
            productId: "6958978b118e9bfd82080953",
            name: "Men's Formal Shoes",
            price: 1899,
            quantity: 1,
            image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80&auto=format&fit=crop",
          },
        ],
        customer: {
          name: "Mike Johnson",
          email: "mike.johnson@example.com",
          phone: "+91 9876543212",
        },
        address: {
          line1: "789 Market Street",
          city: "Delhi",
          state: "Delhi",
          postalCode: "110001",
          country: "India",
        },
        createdAtIso: nowIso,
      },
    ]);
    console.log("✅ Seeded orders successfully");
  } else {
    console.log("✅ Orders already exist, skipping seeding");
  }

  const existingPayments = await PaymentModel.countDocuments({});
  if (existingPayments === 0) {
    const [john, jane, mike] = await Promise.all([
      UserModel.findOne({ email: "john.doe@example.com" }).lean(),
      UserModel.findOne({ email: "jane.smith@example.com" }).lean(),
      UserModel.findOne({ email: "mike.johnson@example.com" }).lean(),
    ]);

    const [ord1, ord2, ord3] = await Promise.all([
      OrderModel.findOne({ orderNumber: "ORD-2024-001" }).lean(),
      OrderModel.findOne({ orderNumber: "ORD-2024-002" }).lean(),
      OrderModel.findOne({ orderNumber: "ORD-2024-003" }).lean(),
    ]);

    const paymentsToInsert = [
      john && ord1
        ? {
            order: ord1._id,
            user: john._id,
            razorpayOrderId: "order_PLP123456789",
            razorpayPaymentId: "pay_PLP123456789",
            amount: 2908,
            currency: "INR",
            status: "completed",
            paymentMethod: "razorpay",
            createdAt: new Date(),
          }
        : null,
      jane && ord2
        ? {
            order: ord2._id,
            user: jane._id,
            razorpayOrderId: "order_PLP987654321",
            amount: 17599,
            currency: "INR",
            status: "pending",
            paymentMethod: "razorpay",
            createdAt: new Date(),
          }
        : null,
      mike && ord3
        ? {
            order: ord3._id,
            user: mike._id,
            razorpayOrderId: "order_PLP456789123",
            amount: 5058,
            currency: "INR",
            status: "failed",
            paymentMethod: "razorpay",
            createdAt: new Date(),
          }
        : null,
    ].filter(Boolean);

    if (paymentsToInsert.length) {
      await PaymentModel.insertMany(paymentsToInsert);
    }
    console.log("✅ Seeded payments successfully");
  } else {
    console.log("✅ Payments already exist, skipping seeding");
  }

  const desiredCategories = [
    {
      name: "Fashion",
      shortDescription: "",
      description: "",
      parentId: null,
      order: 0,
      active: true,
      imageUrl: "https://serviceapi.spicezgold.com/download/1755610847575_file_1734525204708_fash.png",
    },
    {
      name: "Electronics",
      shortDescription: "",
      description: "",
      parentId: null,
      order: 1,
      active: true,
      imageUrl: "https://serviceapi.spicezgold.com/download/1741660988059_ele.png",
    },
    {
      name: "Bags",
      shortDescription: "",
      description: "",
      parentId: null,
      order: 2,
      active: true,
      imageUrl: "https://serviceapi.spicezgold.com/download/1741661045887_bag.png",
    },
    {
      name: "Footwear",
      shortDescription: "",
      description: "",
      parentId: null,
      order: 3,
      active: true,
      imageUrl: "https://serviceapi.spicezgold.com/download/1741661061379_foot.png",
    },
    {
      name: "Grocery",
      shortDescription: "",
      description: "",
      parentId: null,
      order: 4,
      active: true,
      imageUrl: "https://serviceapi.spicezgold.com/download/1741661077633_gro.png",
    },
    {
      name: "Beauty",
      shortDescription: "",
      description: "",
      parentId: null,
      order: 5,
      active: true,
      imageUrl: "https://serviceapi.spicezgold.com/download/1741661092792_beauty.png",
    },
    {
      name: "Wellness",
      shortDescription: "",
      description: "",
      parentId: null,
      order: 6,
      active: true,
      imageUrl: "https://serviceapi.spicezgold.com/download/1741661105893_well.png",
    },
    {
      name: "Jewellery",
      shortDescription: "",
      description: "",
      parentId: null,
      order: 7,
      active: true,
      imageUrl: "https://serviceapi.spicezgold.com/download/1749273446706_jw.png",
    },
    {
      name: "Home & Kitchen",
      shortDescription: "",
      description: "",
      parentId: null,
      order: 8,
      active: true,
      imageUrl: "https://images.unsplash.com/photo-1556909052-0f152d77e05a?w=1200&q=80&auto=format&fit=crop",
    },
    {
      name: "Pelse",
      shortDescription: "Premium Pelse products",
      description: "High-quality Pelse items for everyday use",
      parentId: null,
      order: 9,
      active: true,
      imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80&auto=format&fit=crop",
    },
  ];

  const categoryOps = desiredCategories.map((c) => ({
    updateOne: {
      filter: { name: c.name },
      update: {
        $set: {
          shortDescription: c.shortDescription,
          description: c.description,
          parentId: c.parentId,
          order: c.order,
          active: c.active,
          imageUrl: c.imageUrl,
        },
        $setOnInsert: {
          name: c.name,
          productCount: 0,
        },
      },
      upsert: true,
    },
  }));

  await CategoryModel.bulkWrite(categoryOps);
  const categoryCount = await CategoryModel.countDocuments({});
  console.log(`✅ Categories ready (${categoryCount} total)`);

  const existingProducts = await ProductModel.countDocuments({});
  const TARGET_PRODUCT_COUNT = 120;

  function categorySkuPrefix(category: string) {
    const normalized = String(category || "").toLowerCase();
    if (normalized.includes("fashion")) return "FAS";
    if (normalized.includes("elect")) return "ELE";
    if (normalized.includes("bag")) return "BAG";
    if (normalized.includes("foot")) return "FOO";
    if (normalized.includes("groc")) return "GRO";
    if (normalized.includes("beaut")) return "BEA";
    if (normalized.includes("well")) return "WEL";
    if (normalized.includes("jewel")) return "JEW";
    if (normalized.includes("home")) return "HOM";
    if (normalized.includes("pelse")) return "PEL";
    return "PRD";
  }

  function slugify(value: string) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function hashString(value: string) {
    return value.split("").reduce((a, b) => {
      // eslint-disable-next-line no-bitwise
      a = (a << 5) - a + b.charCodeAt(0);
      // eslint-disable-next-line no-bitwise
      return a & a;
    }, 0);
  }

  function stableImagesForCategory(category: string, seed: number) {
    const setsByCategory: Record<string, string[][]> = {
      Fashion: [
        [
          "https://images.unsplash.com/photo-1520975958225-f0b6d1ee9f0f?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1520975693415-35a4c7f4b4f0?w=1200&q=80&auto=format&fit=crop",
        ],
      ],
      Electronics: [
        [
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1518441902117-f0a0c7f3e7b6?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1546868871-7041f2fb1e1a?w=1200&q=80&auto=format&fit=crop",
        ],
      ],
      Bags: [
        [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&q=80&auto=format&fit=crop",
        ],
      ],
      Footwear: [
        [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1528701800489-20be3c51e14e?w=1200&q=80&auto=format&fit=crop",
        ],
      ],
      Grocery: [
        [
          "https://images.unsplash.com/photo-1587049352234-1e38fd6e3326?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1576092768240-deeb33d284ce?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&q=80&auto=format&fit=crop",
        ],
      ],
      Beauty: [
        [
          "https://images.unsplash.com/photo-1570172619644-df23bb5fed50?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1596462502278-27bfdc4033ee?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1522335683457-687b1e5d533c?w=1200&q=80&auto=format&fit=crop",
        ],
      ],
      Wellness: [
        [
          "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1517961117435-43c9dbe65578?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1559867887-4cf05d75dcd0?w=1200&q=80&auto=format&fit=crop",
        ],
      ],
      Jewellery: [
        [
          "https://images.unsplash.com/photo-1596944924643-89ae18917fd2?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1602766798299-cd803d25c9e6?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1599643442055-b5890bbd6cfa?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80&auto=format&fit=crop",
        ],
      ],
      "Home & Kitchen": [
        [
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1556909052-0f152d77e05a?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1573242324917-0a9b0d0938c1?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1544735190-5a5d8e8c7e5?w=1200&q=80&auto=format&fit=crop",
        ],
      ],
      Pelse: [
        [
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1517961117435-43c9dbe65578?w=1200&q=80&auto=format&fit=crop",
        ],
        [
          "https://images.unsplash.com/photo-1596944924643-89ae18917fd2?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1602766798299-cd803d25c9e6?w=1200&q=80&auto=format&fit=crop",
        ],
      ],
    };

    const sets = setsByCategory[category] || setsByCategory.Electronics;
    const idx = Math.abs(seed) % sets.length;
    return sets[idx];
  }

  function makeExtraProducts(count: number, startIndex: number) {
    const categories = [
      "Fashion",
      "Electronics",
      "Bags",
      "Footwear",
      "Grocery",
      "Beauty",
      "Wellness",
      "Jewellery",
      "Home & Kitchen",
      "Pelse",
    ];

    const adjectives = [
      "Premium",
      "Classic",
      "Everyday",
      "Eco-Friendly",
      "Ultra",
      "Smart",
      "Comfort",
      "Pro",
      "Designer",
      "Travel",
      "Compact",
      "Luxury",
    ];

    const nounsByCategory: Record<string, string[]> = {
      Fashion: ["Kurti", "T-Shirt", "Shirt", "Jeans", "Dress", "Jacket", "Hoodie", "Saree"],
      Electronics: ["Smartwatch", "Earbuds", "Headphones", "Power Bank", "Tablet", "Bluetooth Speaker"],
      Bags: ["Backpack", "Handbag", "Sling Bag", "Duffel Bag", "Wallet"],
      Footwear: ["Sneakers", "Running Shoes", "Formal Shoes", "Sandals", "Heels"],
      Grocery: ["Organic Honey", "Assorted Tea", "Coffee Beans", "Spice Set", "Dry Fruits"],
      Beauty: ["Face Cream", "Serum", "Lipstick", "Shampoo", "Sunscreen"],
      Wellness: ["Yoga Mat", "Dumbbells", "Resistance Band", "Protein Powder", "Water Bottle"],
      Jewellery: ["Necklace", "Earrings", "Bracelet", "Ring", "Watch"],
      "Home & Kitchen": ["Air Fryer", "Coffee Maker", "Cookware Set", "Blender", "Storage Set"],
      Pelse: ["Pelse Device", "Pelse Gadget", "Pelse Tool", "Pelse Accessory", "Pelse Equipment"],
    };

    const brands = [
      "Trozzy",
      "NovaTrend",
      "UrbanLeaf",
      "PulseFit",
      "KitchenCraft",
      "GlowEra",
      "TechNest",
      "TravelPro",
    ];

    const extra: any[] = [];
    for (let i = 0; i < count; i++) {
      const idx = startIndex + i + 1;
      const category = categories[idx % categories.length];
      const adjective = pick(adjectives);
      const noun = pick(nounsByCategory[category] || ["Product"]);
      const brand = pick(brands);

      const baseName = `${adjective} ${noun}`;
      const name = `${baseName} - ${brand}`;
      const slug = `${slugify(category)}-${slugify(baseName)}-${idx}`;
      const sku = `${categorySkuPrefix(category)}-${String(idx).padStart(4, "0")}`;

      const priceRangeByCategory: Record<string, [number, number]> = {
        Fashion: [299, 2499],
        Electronics: [799, 49999],
        Bags: [399, 4999],
        Footwear: [499, 3999],
        Grocery: [149, 1299],
        Beauty: [199, 1499],
        Wellness: [299, 5999],
        Jewellery: [699, 19999],
        "Home & Kitchen": [499, 9999],
        Pelse: [999, 19999],
      };
      const [minPrice, maxPrice] = priceRangeByCategory[category] || [199, 9999];
      const price = randomInt(minPrice, maxPrice);
      const stock = randomInt(5, 120);

      const saleEnabled = Math.random() < 0.35;
      const saleDiscount = saleEnabled ? randomInt(10, 45) : 0;

      const stableGallery = stableImagesForCategory(category, hashString(sku));
      const image = stableGallery[0];
      const galleryImages = stableGallery;

      const sizes = category === "Fashion" ? ["S", "M", "L", "XL"] : [];
      const colors =
        category === "Fashion" || category === "Bags" || category === "Footwear"
          ? ["Black", "Blue", "White"]
          : [];

      extra.push({
        slug,
        visibility: "public",
        name,
        sku,
        price,
        stock,
        status: "active",
        image,
        galleryImages,
        category,
        description: `${name} with high-quality materials and reliable performance.`,
        featured: Math.random() < 0.2,
        createdAt: today,
        sizes,
        colors,
        variants: [],
        tags: [slugify(category), slugify(noun), "new-arrival"],
        keyFeatures: ["Quality tested", "Great value", "Fast delivery"],
        warranty: category === "Electronics" ? "1 Year" : "30 Days",
        warrantyDetails: "Covers manufacturing defects as per policy.",
        saleEnabled,
        saleDiscount,
        saleStartDate: saleEnabled ? today : "1970-01-01",
        saleEndDate: saleEnabled ? `${new Date().getFullYear() + 1}-12-31` : "1970-01-01",
        metaTitle: name,
        metaDescription: `${name} - Buy online at best price.`,
        weight: Number((Math.random() * 3 + 0.1).toFixed(2)),
        dimensions: {
          length: randomInt(5, 40),
          width: randomInt(5, 40),
          height: randomInt(2, 30),
        },
        badge: saleEnabled ? "sale" : "",
        brand,
        management: { source: "auto-seed", generatedAtIso: nowIso },
        managementUpdatedAt: nowIso,
      });
    }
    return extra;
  }

  const seedProducts = [
    {
        slug: "wireless-headphones-pro",
        visibility: "public",
        name: "Wireless Headphones Pro",
        sku: "WH-PRO-001",
        price: 299.99,
        stock: 42,
        status: "active",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1518441902117-f0a0c7f3e7b6?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Electronics",
        description: "Premium wireless headphones with active noise cancellation and 40-hour battery.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Black", "White"],
        variants: [],
        tags: ["audio", "wireless", "premium"],
        keyFeatures: ["Active noise cancellation", "40-hour battery", "Fast charge"],
        warranty: "1 Year",
        warrantyDetails: "Covers manufacturing defects.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Wireless Headphones Pro",
        metaDescription: "Premium ANC headphones with deep bass and long battery life.",
        weight: 0.28,
    },
    // Fashion Products
    {
        slug: "cotton-kurti-blue",
        visibility: "public",
        name: "Cotton Kurti - Blue",
        sku: "CK-BLUE-001",
        price: 599,
        oldPrice: 899,
        stock: 25,
        status: "active",
        image: "https://serviceapi.spicezgold.com/download/1742452035509_rtrt2.jpg",
        galleryImages: [
          "https://serviceapi.spicezgold.com/download/1742452035509_rtrt2.jpg",
          "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Fashion",
        description: "Beautiful cotton kurti with traditional embroidery. Perfect for casual and semi-formal occasions.",
        featured: true,
        createdAt: today,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Blue", "Pink", "Yellow"],
        variants: [],
        tags: ["kurti", "cotton", "traditional", "ethnic"],
        keyFeatures: ["Pure cotton fabric", "Hand embroidery", "Comfortable fit"],
        warranty: "30 Days",
        warrantyDetails: "Exchange or return within 30 days.",
        saleEnabled: true,
        saleDiscount: 33,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Cotton Kurti - Blue",
        metaDescription: "Traditional cotton kurti with beautiful embroidery.",
        weight: 0.25,
    },
    {
        slug: "designer-saree-red",
        visibility: "public",
        name: "Designer Saree - Red",
        sku: "DS-RED-001",
        price: 1299,
        oldPrice: 1899,
        stock: 15,
        status: "active",
        image: "https://images.unsplash.com/photo-1594736797933-d0acc2401915?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1594736797933-d0acc2401915?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1539008675658-fb321e7741e2?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Fashion",
        description: "Elegant designer saree with intricate work. Perfect for weddings and special occasions.",
        featured: false,
        createdAt: today,
        sizes: ["Free Size"],
        colors: ["Red", "Maroon", "Green"],
        variants: [],
        tags: ["saree", "designer", "wedding", "ethnic"],
        keyFeatures: ["Designer work", "Premium fabric", "Blouse piece included"],
        warranty: "15 Days",
        warrantyDetails: "Exchange within 15 days.",
        saleEnabled: true,
        saleDiscount: 32,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Designer Saree - Red",
        metaDescription: "Elegant designer saree perfect for special occasions.",
        weight: 0.5,
    },
    // Bags
    {
        slug: "leather-handbag-black",
        visibility: "public",
        name: "Leather Handbag - Black",
        sku: "LHB-BLK-001",
        price: 2499,
        stock: 20,
        status: "active",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Bags",
        description: "Premium leather handbag with multiple compartments. Stylish and practical for daily use.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Black", "Brown", "Tan"],
        variants: [],
        tags: ["handbag", "leather", "premium", "daily-use"],
        keyFeatures: ["Genuine leather", "Multiple compartments", "Adjustable strap"],
        warranty: "1 Year",
        warrantyDetails: "Manufacturing defects covered.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Leather Handbag - Black",
        metaDescription: "Premium leather handbag for daily use.",
        weight: 0.8,
    },
    {
        slug: "backpack-college-student",
        visibility: "public",
        name: "College Student Backpack",
        sku: "CBS-001",
        price: 899,
        oldPrice: 1299,
        stock: 30,
        status: "active",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Bags",
        description: "Spacious backpack perfect for college students with laptop compartment.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Black", "Blue", "Gray"],
        variants: [],
        tags: ["backpack", "college", "student", "laptop"],
        keyFeatures: ["Laptop compartment", "Water resistant", "Ergonomic design"],
        warranty: "6 Months",
        warrantyDetails: "Manufacturing defects covered.",
        saleEnabled: true,
        saleDiscount: 31,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "College Student Backpack",
        metaDescription: "Spacious backpack with laptop compartment.",
        weight: 0.6,
    },
    // Footwear
    {
        slug: "running-shoes-sports",
        visibility: "public",
        name: "Sports Running Shoes",
        sku: "RS-SPORT-001",
        price: 1599,
        oldPrice: 2199,
        stock: 35,
        status: "active",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Footwear",
        description: "Professional running shoes with advanced cushioning technology.",
        featured: true,
        createdAt: today,
        sizes: ["6", "7", "8", "9", "10"],
        colors: ["Black", "Blue", "Red"],
        variants: [],
        tags: ["shoes", "running", "sports", "athletic"],
        keyFeatures: ["Advanced cushioning", "Breathable mesh", "Non-slip sole"],
        warranty: "6 Months",
        warrantyDetails: "Manufacturing defects covered.",
        saleEnabled: true,
        saleDiscount: 27,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Sports Running Shoes",
        metaDescription: "Professional running shoes with advanced technology.",
        weight: 0.3,
    },
    {
        slug: "formal-shoes-men",
        visibility: "public",
        name: "Men's Formal Shoes",
        sku: "MFS-001",
        price: 1899,
        stock: 25,
        status: "active",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Footwear",
        description: "Elegant formal shoes perfect for office and business meetings.",
        featured: false,
        createdAt: today,
        sizes: ["7", "8", "9", "10", "11"],
        colors: ["Black", "Brown", "Tan"],
        variants: [],
        tags: ["shoes", "formal", "office", "business"],
        keyFeatures: ["Genuine leather", "Comfortable sole", "Classic design"],
        warranty: "1 Year",
        warrantyDetails: "Manufacturing defects covered.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Men's Formal Shoes",
        metaDescription: "Elegant formal shoes for business professionals.",
        weight: 0.4,
    },
    // Electronics
    {
        slug: "smartphone-android-pro",
        visibility: "public",
        name: "Android Smartphone Pro",
        sku: "ASP-001",
        price: 15999,
        oldPrice: 19999,
        stock: 18,
        status: "active",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1530346397187-f40f128009eb?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Electronics",
        description: "Latest Android smartphone with powerful processor and amazing camera.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Black", "White", "Blue"],
        variants: [],
        tags: ["smartphone", "android", "camera", "5G"],
        keyFeatures: ["5G connectivity", "48MP camera", "Fast charging", "128GB storage"],
        warranty: "1 Year",
        warrantyDetails: "Complete manufacturing warranty.",
        saleEnabled: true,
        saleDiscount: 20,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Android Smartphone Pro",
        metaDescription: "Latest 5G smartphone with professional camera.",
        weight: 0.18,
    },
    {
        slug: "laptop-ultrabook",
        visibility: "public",
        name: "UltraBook Laptop",
        sku: "UL-001",
        price: 45999,
        stock: 12,
        status: "active",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Electronics",
        description: "Ultra-thin laptop with powerful performance and all-day battery life.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Silver", "Space Gray"],
        variants: [],
        tags: ["laptop", "ultrabook", "professional", "portable"],
        keyFeatures: ["Intel i7 processor", "16GB RAM", "512GB SSD", "14-inch display"],
        warranty: "2 Years",
        warrantyDetails: "Complete hardware and software warranty.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "UltraBook Laptop",
        metaDescription: "Professional ultrabook with powerful performance.",
        weight: 1.2,
    },
    // Beauty
    {
        slug: "face-cream-premium",
        visibility: "public",
        name: "Premium Face Cream",
        sku: "PFC-001",
        price: 499,
        oldPrice: 699,
        stock: 40,
        status: "active",
        image: "https://images.unsplash.com/photo-1570172619644-df23bb5fed50?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1570172619644-df23bb5fed50?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Beauty",
        description: "Luxurious face cream with natural ingredients for glowing skin.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: [],
        variants: ["50g", "100g"],
        tags: ["skincare", "face-cream", "natural", "glowing-skin"],
        keyFeatures: ["Natural ingredients", "Anti-aging", "Moisturizing", "SPF 30"],
        warranty: "12 Months",
        warrantyDetails: "Quality guaranteed.",
        saleEnabled: true,
        saleDiscount: 29,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Premium Face Cream",
        metaDescription: "Natural face cream for glowing healthy skin.",
        weight: 0.1,
    },
    {
        slug: "lipstick-matte-collection",
        visibility: "public",
        name: "Matte Lipstick Collection",
        sku: "MLC-001",
        price: 299,
        stock: 60,
        status: "active",
        image: "https://images.unsplash.com/photo-1596462502278-27bfdc4033ee?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1596462502278-27bfdc4033ee?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1522335683457-687b1e5d533c?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Beauty",
        description: "Long-lasting matte lipstick collection with vibrant colors.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Red", "Pink", "Nude", "Berry", "Plum"],
        variants: [],
        tags: ["lipstick", "matte", "long-lasting", "makeup"],
        keyFeatures: ["Long-lasting", "Matte finish", "Vibrant colors", "Moisturizing"],
        warranty: "12 Months",
        warrantyDetails: "Quality guaranteed.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Matte Lipstick Collection",
        metaDescription: "Long-lasting matte lipsticks in vibrant colors.",
        weight: 0.05,
    },
    // Wellness
    {
        slug: "yoga-mat-premium",
        visibility: "public",
        name: "Premium Yoga Mat",
        sku: "PYM-001",
        price: 799,
        oldPrice: 999,
        stock: 25,
        status: "active",
        image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1506629905607-04e9487ea8a2?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Wellness",
        description: "Premium quality yoga mat with excellent grip and cushioning.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Purple", "Blue", "Green", "Pink"],
        variants: [],
        tags: ["yoga", "fitness", "exercise", "mat"],
        keyFeatures: ["Non-slip surface", "Extra cushioning", "Eco-friendly", "Easy to clean"],
        warranty: "1 Year",
        warrantyDetails: "Manufacturing defects covered.",
        saleEnabled: true,
        saleDiscount: 20,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Premium Yoga Mat",
        metaDescription: "High-quality yoga mat for comfortable practice.",
        weight: 1.5,
    },
    {
        slug: "protein-powder-whey",
        visibility: "public",
        name: "Whey Protein Powder",
        sku: "WPP-001",
        price: 2499,
        stock: 30,
        status: "active",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1559867887-4cf05d75dcd0?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Wellness",
        description: "High-quality whey protein powder for muscle building and recovery.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: [],
        variants: ["1kg", "2kg", "5kg"],
        tags: ["protein", "whey", "fitness", "muscle"],
        keyFeatures: ["25g protein per serving", "BCAA included", "Great taste", "Fast absorption"],
        warranty: "18 Months",
        warrantyDetails: "Quality and purity guaranteed.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Whey Protein Powder",
        metaDescription: "Premium whey protein for muscle building.",
        weight: 1.1,
    },
    // Jewellery
    {
        slug: "gold-necklace-designer",
        visibility: "public",
        name: "Designer Gold Necklace",
        sku: "DGN-001",
        price: 15999,
        oldPrice: 19999,
        stock: 8,
        status: "active",
        image: "https://images.unsplash.com/photo-1596944924643-89ae18917fd2?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1596944924643-89ae18917fd2?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1602766798299-cd803d25c9e6?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Jewellery",
        description: "Elegant designer gold necklace with intricate craftsmanship.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Gold", "Rose Gold"],
        variants: [],
        tags: ["necklace", "gold", "designer", "elegant"],
        keyFeatures: ["22k gold", "Designer piece", "Certified", "Gift box included"],
        warranty: "Lifetime",
        warrantyDetails: "Lifetime buyback guarantee.",
        saleEnabled: true,
        saleDiscount: 20,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Designer Gold Necklace",
        metaDescription: "Elegant designer gold necklace for special occasions.",
        weight: 0.02,
    },
    {
        slug: "diamond-earrings-stud",
        visibility: "public",
        name: "Diamond Stud Earrings",
        sku: "DSE-001",
        price: 8999,
        stock: 12,
        status: "active",
        image: "https://images.unsplash.com/photo-1599643442055-b5890bbd6cfa?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1599643442055-b5890bbd6cfa?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1602766798299-cd803d25c9e6?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Jewellery",
        description: "Beautiful diamond stud earrings perfect for daily wear.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["White Gold", "Yellow Gold"],
        variants: [],
        tags: ["earrings", "diamond", "stud", "daily-wear"],
        keyFeatures: ["Natural diamonds", "Hypoallergenic", "Secure backing", "Certified"],
        warranty: "Lifetime",
        warrantyDetails: "Lifetime buyback guarantee.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Diamond Stud Earrings",
        metaDescription: "Elegant diamond stud earrings for daily elegance.",
        weight: 0.01,
    },
    // Home & Kitchen
    {
        slug: "coffee-maker-automatic",
        visibility: "public",
        name: "Automatic Coffee Maker",
        sku: "ACM-001",
        price: 3999,
        oldPrice: 4999,
        stock: 15,
        status: "active",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1517668800776-9f3395785aab?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Home & Kitchen",
        description: "Fully automatic coffee maker with multiple brewing options.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Black", "Silver", "White"],
        variants: [],
        tags: ["coffee", "maker", "automatic", "kitchen"],
        keyFeatures: ["Multiple brewing options", "Programmable", "Easy to clean", "Large capacity"],
        warranty: "2 Years",
        warrantyDetails: "Complete warranty with service support.",
        saleEnabled: true,
        saleDiscount: 20,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Automatic Coffee Maker",
        metaDescription: "Premium coffee maker for perfect brew every time.",
        weight: 2.5,
    },
    {
        slug: "air-fryer-healthy",
        visibility: "public",
        name: "Healthy Air Fryer",
        sku: "HAF-001",
        price: 4999,
        stock: 20,
        status: "active",
        image: "https://images.unsplash.com/photo-1573242324917-0a9b0d0938c1?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1573242324917-0a9b0d0938c1?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Home & Kitchen",
        description: "Healthy air fryer for oil-free cooking with crispy results.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Black", "White"],
        variants: ["3.5L", "5.5L"],
        tags: ["air-fryer", "healthy", "cooking", "kitchen"],
        keyFeatures: ["Oil-free cooking", "Multiple presets", "Easy to clean", "Energy efficient"],
        warranty: "1 Year",
        warrantyDetails: "Complete warranty with service support.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Healthy Air Fryer",
        metaDescription: "Oil-free air fryer for healthy cooking.",
        weight: 3.2,
    },
    // Grocery
    {
        slug: "organic-honey-pure",
        visibility: "public",
        name: "Pure Organic Honey",
        sku: "POH-001",
        price: 299,
        oldPrice: 399,
        stock: 50,
        status: "active",
        image: "https://images.unsplash.com/photo-1587049352234-1e38fd6e3326?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1587049352234-1e38fd6e3326?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1562157995-357a57af9c93?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Grocery",
        description: "100% pure organic honey sourced from certified organic farms.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: [],
        variants: ["250g", "500g", "1kg"],
        tags: ["honey", "organic", "natural", "grocery"],
        keyFeatures: ["100% organic", "No preservatives", "Rich in antioxidants", "Natural sweetness"],
        warranty: "12 Months",
        warrantyDetails: "Quality and purity guaranteed.",
        saleEnabled: true,
        saleDiscount: 25,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Pure Organic Honey",
        metaDescription: "100% pure organic honey for healthy living.",
        weight: 1.1,
    },
    {
        slug: "premium-tea-assorted",
        visibility: "public",
        name: "Premium Assorted Tea",
        sku: "PAT-001",
        price: 499,
        stock: 35,
        status: "active",
        image: "https://images.unsplash.com/photo-1576092768240-deeb33d284ce?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1576092768240-deeb33d284ce?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1564890369478-c89ca6d8cde8?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Grocery",
        description: "Premium assorted tea collection from the best tea gardens.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: [],
        variants: ["100g", "250g"],
        tags: ["tea", "premium", "assorted", "beverage"],
        keyFeatures: ["Premium quality", "Multiple varieties", "Rich aroma", "Health benefits"],
        warranty: "18 Months",
        warrantyDetails: "Quality and freshness guaranteed.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Premium Assorted Tea",
        metaDescription: "Premium tea collection for tea lovers.",
        weight: 0.3,
    },
    // Additional Fashion Products
    {
        slug: "denim-jacket-men",
        visibility: "public",
        name: "Men's Denim Jacket",
        sku: "MDJ-001",
        price: 1299,
        oldPrice: 1799,
        stock: 30,
        status: "active",
        image: "https://images.unsplash.com/photo-1551908195-7e2e345ae9c1?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1551908195-7e2e345ae9c1?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1542272604-787c38354087?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Fashion",
        description: "Classic denim jacket perfect for casual outings. Modern fit with premium denim fabric.",
        featured: true,
        createdAt: today,
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Blue", "Black", "Gray"],
        variants: [],
        tags: ["jacket", "denim", "men", "casual"],
        keyFeatures: ["Premium denim", "Modern fit", "Multiple pockets", "Durable"],
        warranty: "6 Months",
        warrantyDetails: "Exchange or return within 30 days.",
        saleEnabled: true,
        saleDiscount: 28,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Men's Denim Jacket",
        metaDescription: "Classic denim jacket with modern fit.",
        weight: 0.6,
        colorVariants: [
            {
                color: "blue",
                colorName: "Classic Blue",
                colorCode: "#1E3A8A",
                images: [
                    "https://images.unsplash.com/photo-1551908195-7e2e345ae9c1?w=1200&q=80&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1542272604-787c38354087?w=1200&q=80&auto=format&fit=crop"
                ],
                price: 2499,
                stock: 12,
                sku: "MDJ-001-BLU"
            },
            {
                color: "black",
                colorName: "Black",
                colorCode: "#000000",
                images: [
                    "https://images.unsplash.com/photo-1571908195-7e2e345ae9c1?w=1200&q=80&auto=format&fit=crop&sat=-100",
                    "https://images.unsplash.com/photo-1542272604-787c38354087?w=1200&q=80&auto=format&fit=crop&sat=-100"
                ],
                price: 2699,
                stock: 8,
                sku: "MDJ-001-BLK"
            },
            {
                color: "gray",
                colorName: "Gray",
                colorCode: "#6B7280",
                images: [
                    "https://images.unsplash.com/photo-1551908195-7e2e345ae9c1?w=1200&q=80&auto=format&fit=crop&sat=0",
                    "https://images.unsplash.com/photo-1542272604-787c38354087?w=1200&q=80&auto=format&fit=crop&sat=0"
                ],
                price: 2599,
                stock: 10,
                sku: "MDJ-001-GRY"
            }
        ],
    },
    {
        slug: "summer-dress-women",
        visibility: "public",
        name: "Women's Summer Dress",
        sku: "WSD-001",
        price: 899,
        oldPrice: 1299,
        stock: 25,
        status: "active",
        image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1469336993910-0122f1f8f9d?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Fashion",
        description: "Light and breezy summer dress perfect for beach days and casual outings.",
        featured: false,
        createdAt: today,
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["Floral", "Yellow", "White", "Blue"],
        variants: [],
        tags: ["dress", "summer", "women", "casual"],
        keyFeatures: ["Lightweight fabric", "Breathable", "Easy wash", "Trendy design"],
        warranty: "30 Days",
        warrantyDetails: "Exchange or return within 30 days.",
        saleEnabled: true,
        saleDiscount: 31,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Women's Summer Dress",
        metaDescription: "Light summer dress perfect for beach days.",
        weight: 0.3,
    },
    {
        slug: "sports-tshirt-men",
        visibility: "public",
        name: "Men's Sports T-Shirt",
        sku: "MST-001",
        price: 399,
        stock: 50,
        status: "active",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9a17e2?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1521572163474-6864f9a17e2?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1517365830190-9bf84a19146?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Fashion",
        description: "Performance sports t-shirt with moisture-wicking technology.",
        featured: false,
        createdAt: today,
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Black", "Navy", "Gray", "White"],
        variants: [],
        tags: ["t-shirt", "sports", "men", "athletic"],
        keyFeatures: ["Moisture-wicking", "Quick dry", "Anti-odor", "Stretch fabric"],
        warranty: "3 Months",
        warrantyDetails: "Exchange within 15 days.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Men's Sports T-Shirt",
        metaDescription: "Performance sports t-shirt with moisture-wicking.",
        weight: 0.2,
    },
    // Additional Electronics
    {
        slug: "smart-watch-fitness",
        visibility: "public",
        name: "Smart Fitness Watch",
        sku: "SFW-001",
        price: 2499,
        oldPrice: 3499,
        stock: 35,
        status: "active",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1546868871-7041f2fb1e1a?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Electronics",
        description: "Advanced fitness tracker with heart rate monitoring and GPS tracking.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Black", "White", "Pink", "Blue"],
        variants: [],
        tags: ["smartwatch", "fitness", "tracker", "health"],
        keyFeatures: ["Heart rate monitor", "GPS tracking", "Water resistant", "7-day battery"],
        warranty: "1 Year",
        warrantyDetails: "Complete warranty with service support.",
        saleEnabled: true,
        saleDiscount: 29,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Smart Fitness Watch",
        metaDescription: "Advanced fitness tracker with health monitoring.",
        weight: 0.05,
    },
    {
        slug: "wireless-earbuds-pro",
        visibility: "public",
        name: "Wireless Earbuds Pro",
        sku: "WEP-001",
        price: 1299,
        stock: 40,
        status: "active",
        image: "https://images.unsplash.com/photo-1588423741070-e5e5186cffef?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1588423741070-e5e5186cffef?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Electronics",
        description: "Premium wireless earbuds with active noise cancellation and premium sound.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Black", "White"],
        variants: [],
        tags: ["earbuds", "wireless", "audio", "noise-cancellation"],
        keyFeatures: ["Active noise cancellation", "Premium sound", "Touch controls", "Wireless charging"],
        warranty: "1 Year",
        warrantyDetails: "Complete warranty with service support.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Wireless Earbuds Pro",
        metaDescription: "Premium wireless earbuds with ANC.",
        weight: 0.02,
    },
    {
        slug: "tablet-10-inch",
        visibility: "public",
        name: "10-Inch Tablet Pro",
        sku: "TTP-001",
        price: 18999,
        oldPrice: 24999,
        stock: 20,
        status: "active",
        image: "https://images.unsplash.com/photo-1544244015-0f43224e4a02?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1544244015-0f43224e4a02?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Electronics",
        description: "Professional tablet with stunning display and powerful performance.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Space Gray", "Silver"],
        variants: ["64GB", "128GB", "256GB"],
        tags: ["tablet", "pro", "display", "performance"],
        keyFeatures: ["10-inch retina display", "All-day battery", "Powerful processor", "Supports stylus"],
        warranty: "1 Year",
        warrantyDetails: "Complete warranty with service support.",
        saleEnabled: true,
        saleDiscount: 24,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "10-Inch Tablet Pro",
        metaDescription: "Professional tablet with stunning display.",
        weight: 0.5,
    },
    // Additional Bags
    {
        slug: "travel-duffel-bag",
        visibility: "public",
        name: "Travel Duffel Bag",
        sku: "TDB-001",
        price: 1599,
        stock: 25,
        status: "active",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Bags",
        description: "Spacious travel duffel bag perfect for weekend trips and gym.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Black", "Navy", "Gray", "Olive"],
        variants: [],
        tags: ["duffel", "travel", "gym", "weekend"],
        keyFeatures: ["Water resistant", "Multiple compartments", "Shoulder strap", "Durable material"],
        warranty: "1 Year",
        warrantyDetails: "Manufacturing defects covered.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Travel Duffel Bag",
        metaDescription: "Spacious travel duffel bag for weekend trips.",
        weight: 0.8,
    },
    {
        slug: "wallet-leather-men",
        visibility: "public",
        name: "Men's Leather Wallet",
        sku: "MLW-001",
        price: 699,
        oldPrice: 999,
        stock: 40,
        status: "active",
        image: "https://images.unsplash.com/photo-1627123450554-f3908d8d3e7?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1627123450554-f3908d8d3e7?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1609105935969-98d8d9d6e75?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Bags",
        description: "Premium leather wallet with RFID protection and multiple card slots.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Black", "Brown", "Tan"],
        variants: [],
        tags: ["wallet", "leather", "men", "rfid"],
        keyFeatures: ["Genuine leather", "RFID protection", "Multiple card slots", "Slim design"],
        warranty: "6 Months",
        warrantyDetails: "Manufacturing defects covered.",
        saleEnabled: true,
        saleDiscount: 30,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Men's Leather Wallet",
        metaDescription: "Premium leather wallet with RFID protection.",
        weight: 0.1,
    },
    // Additional Footwear
    {
        slug: "casual-sneakers-men",
        visibility: "public",
        name: "Men's Casual Sneakers",
        sku: "MCS-001",
        price: 1299,
        oldPrice: 1799,
        stock: 35,
        status: "active",
        image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Footwear",
        description: "Comfortable casual sneakers perfect for daily wear and light activities.",
        featured: true,
        createdAt: today,
        sizes: ["7", "8", "9", "10", "11"],
        colors: ["White", "Black", "Gray", "Blue"],
        variants: [],
        tags: ["sneakers", "casual", "men", "comfortable"],
        keyFeatures: ["Comfortable sole", "Breathable mesh", "Lightweight", "Modern design"],
        warranty: "6 Months",
        warrantyDetails: "Manufacturing defects covered.",
        saleEnabled: true,
        saleDiscount: 28,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Men's Casual Sneakers",
        metaDescription: "Comfortable casual sneakers for daily wear.",
        weight: 0.35,
    },
    {
        slug: "heels-women-formal",
        visibility: "public",
        name: "Women's Formal Heels",
        sku: "WFH-001",
        price: 1899,
        stock: 20,
        status: "active",
        image: "https://images.unsplash.com/photo-1543163561-3aee1a9b9409?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1543163561-3aee1a9b9409?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1441986300917-64674bd1d8da?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Footwear",
        description: "Elegant formal heels perfect for parties and special occasions.",
        featured: false,
        createdAt: today,
        sizes: ["5", "6", "7", "8", "9"],
        colors: ["Black", "Red", "Nude", "Silver"],
        variants: [],
        tags: ["heels", "formal", "women", "elegant"],
        keyFeatures: ["Elegant design", "Comfortable padding", "Non-slip sole", "Premium materials"],
        warranty: "3 Months",
        warrantyDetails: "Exchange within 15 days.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Women's Formal Heels",
        metaDescription: "Elegant formal heels for special occasions.",
        weight: 0.25,
    },
    // Additional Beauty Products
    {
        slug: "eyeshadow-palette-professional",
        visibility: "public",
        name: "Professional Eyeshadow Palette",
        sku: "PEP-001",
        price: 799,
        oldPrice: 1199,
        stock: 30,
        status: "active",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1596462502278-27bfdc4033ee?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Beauty",
        description: "Professional 12-color eyeshadow palette with highly pigmented shades.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Nude", "Smoky", "Vibrant"],
        variants: [],
        tags: ["eyeshadow", "palette", "makeup", "professional"],
        keyFeatures: ["12 colors", "Highly pigmented", "Long-lasting", "Includes mirror and brush"],
        warranty: "12 Months",
        warrantyDetails: "Quality guaranteed.",
        saleEnabled: true,
        saleDiscount: 33,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Professional Eyeshadow Palette",
        metaDescription: "12-color eyeshadow palette with high pigmentation.",
        weight: 0.15,
    },
    {
        slug: "foundation-full-coverage",
        visibility: "public",
        name: "Full Coverage Foundation",
        sku: "FCF-001",
        price: 599,
        stock: 45,
        status: "active",
        image: "https://images.unsplash.com/photo-1596462502278-27bfdc4033ee?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1596462502278-27bfdc4033ee?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1522335683457-687b1e5d533c?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Beauty",
        description: "Full coverage foundation with SPF 30 and long-lasting formula.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Ivory", "Beige", "Sand", "Caramel"],
        variants: [],
        tags: ["foundation", "full-coverage", "spf", "makeup"],
        keyFeatures: ["Full coverage", "SPF 30", "Long-lasting", "Multiple shades"],
        warranty: "12 Months",
        warrantyDetails: "Quality guaranteed.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Full Coverage Foundation",
        metaDescription: "Full coverage foundation with SPF 30 protection.",
        weight: 0.08,
    },
    // Additional Wellness Products
    {
        slug: "dumbbells-adjustable",
        visibility: "public",
        name: "Adjustable Dumbbells Set",
        sku: "ADS-001",
        price: 2999,
        oldPrice: 3999,
        stock: 15,
        status: "active",
        image: "https://images.unsplash.com/photo-1517961117435-43c9dbe65578?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1517961117435-43c9dbe65578?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Wellness",
        description: "Adjustable dumbbells set perfect for home workouts and strength training.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Black", "Red", "Blue"],
        variants: ["5kg", "10kg", "15kg", "20kg"],
        tags: ["dumbbells", "adjustable", "fitness", "home-workout"],
        keyFeatures: ["Adjustable weights", "Non-slip grip", "Compact storage", "Durable construction"],
        warranty: "1 Year",
        warrantyDetails: "Manufacturing defects covered.",
        saleEnabled: true,
        saleDiscount: 25,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Adjustable Dumbbells Set",
        metaDescription: "Adjustable dumbbells for home strength training.",
        weight: 8.0,
    },
    {
        slug: "water-bottle-insulated",
        visibility: "public",
        name: "Insulated Water Bottle",
        sku: "IWB-001",
        price: 399,
        stock: 50,
        status: "active",
        image: "https://images.unsplash.com/photo-1549466915-0ddf4e6d1a0d?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1549466915-0ddf4e6d1a0d?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1525373698355-2b913d8fd7a1?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Wellness",
        description: "Premium insulated water bottle keeps drinks cold for 24 hours.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Stainless Steel", "Black", "Blue", "Pink"],
        variants: ["500ml", "750ml", "1L"],
        tags: ["water-bottle", "insulated", "fitness", "hydration"],
        keyFeatures: ["24-hour insulation", "Leak-proof", "BPA-free", "Easy to clean"],
        warranty: "1 Year",
        warrantyDetails: "Manufacturing defects covered.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Insulated Water Bottle",
        metaDescription: "Premium insulated bottle keeps drinks cold 24 hours.",
        weight: 0.3,
    },
    // Additional Jewellery
    {
        slug: "silver-bracelet-women",
        visibility: "public",
        name: "Women's Silver Bracelet",
        sku: "WSB-001",
        price: 1299,
        oldPrice: 1799,
        stock: 18,
        status: "active",
        image: "https://images.unsplash.com/photo-1602766798299-cd803d25c9e6?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1602766798299-cd803d25c9e6?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1596944924643-89ae18917fd2?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Jewellery",
        description: "Elegant sterling silver bracelet with delicate design.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Silver", "Rose Gold"],
        variants: [],
        tags: ["bracelet", "silver", "women", "elegant"],
        keyFeatures: ["925 sterling silver", "Hypoallergenic", "Adjustable", "Gift box included"],
        warranty: "6 Months",
        warrantyDetails: "Tarnish-free guarantee.",
        saleEnabled: true,
        saleDiscount: 28,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Women's Silver Bracelet",
        metaDescription: "Elegant sterling silver bracelet with delicate design.",
        weight: 0.02,
    },
    {
        slug: "mens-watch-leather",
        visibility: "public",
        name: "Men's Leather Watch",
        sku: "MLW-001",
        price: 2499,
        stock: 22,
        status: "active",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1542272604-787c38354087?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Jewellery",
        description: "Classic men's watch with genuine leather strap and quartz movement.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Black", "Brown", "Tan"],
        variants: [],
        tags: ["watch", "men", "leather", "classic"],
        keyFeatures: ["Genuine leather", "Quartz movement", "Water resistant", "Classic design"],
        warranty: "1 Year",
        warrantyDetails: "Complete warranty with service support.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Men's Leather Watch",
        metaDescription: "Classic men's watch with genuine leather strap.",
        weight: 0.08,
        colorVariants: [
            {
                color: "black",
                colorName: "Black",
                colorCode: "#000000",
                images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&auto=format&fit=crop"],
                price: 2299,
                stock: 15,
                sku: "MLW-001-BLK"
            },
            {
                color: "brown",
                colorName: "Brown",
                colorCode: "#8B4513",
                images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop"],
                price: 2299,
                stock: 12,
                sku: "MLW-001-BRN"
            },
            {
                color: "tan",
                colorName: "Tan",
                colorCode: "#D2B48C",
                images: ["https://images.unsplash.com/photo-1542476490-a1a9be8c123c?w=1200&q=80&auto=format&fit=crop"],
                price: 2499,
                stock: 8,
                sku: "MLW-001-TAN"
            }
        ],
    },
    // Additional Home & Kitchen
    {
        slug: "blender-high-power",
        visibility: "public",
        name: "High Power Blender",
        sku: "HPB-001",
        price: 3499,
        oldPrice: 4499,
        stock: 18,
        status: "active",
        image: "https://images.unsplash.com/photo-1544735190-5a5d8e8c7e5?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1544735190-5a5d8e8c7e5?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1578662996442-81f4aa0a4a6e?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Home & Kitchen",
        description: "Professional high power blender perfect for smoothies and food processing.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: ["Black", "Red", "White"],
        variants: ["1.5L", "2L"],
        tags: ["blender", "kitchen", "high-power", "smoothies"],
        keyFeatures: ["1000W motor", "Multiple speed settings", "Pulse function", "Easy to clean"],
        warranty: "2 Years",
        warrantyDetails: "Complete warranty with service support.",
        saleEnabled: true,
        saleDiscount: 22,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "High Power Blender",
        metaDescription: "Professional blender for smoothies and food processing.",
        weight: 2.8,
        colorVariants: [
            {
                color: "black",
                colorName: "Black",
                colorCode: "#000000",
                images: ["https://images.unsplash.com/photo-1544735190-5a5d8e8c7e5?w=1200&q=80&auto=format&fit=crop"],
                price: 3499,
                stock: 8,
                sku: "HPB-001-BLK"
            },
            {
                color: "red",
                colorName: "Red",
                colorCode: "#FF0000",
                images: ["https://images.unsplash.com/photo-1578662996442-81f4aa0a4a6e?w=1200&q=80&auto=format&fit=crop"],
                price: 3499,
                stock: 6,
                sku: "HPB-001-RED"
            },
            {
                color: "white",
                colorName: "White",
                colorCode: "#FFFFFF",
                images: ["https://images.unsplash.com/photo-1544161515-70ab664f7c71?w=1200&q=80&auto=format&fit=crop"],
                price: 3699,
                stock: 4,
                sku: "HPB-001-WHT"
            }
        ],
    },
    {
        slug: "cookware-non-stick",
        visibility: "public",
        name: "Non-Stick Cookware Set",
        sku: "NCS-001",
        price: 2999,
        stock: 25,
        status: "active",
        image: "https://images.unsplash.com/photo-1556909052-0f152d77e05a?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1556909052-0f152d77e05a?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1556905055-8f358a7d0f8d?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Home & Kitchen",
        description: "Complete non-stick cookware set for healthy cooking.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: ["Black", "Gray"],
        variants: ["5-piece", "7-piece", "10-piece"],
        tags: ["cookware", "non-stick", "kitchen", "healthy-cooking"],
        keyFeatures: ["Non-stick coating", "Even heat distribution", "Dishwasher safe", "Multiple sizes"],
        warranty: "3 Years",
        warrantyDetails: "Complete warranty with service support.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Non-Stick Cookware Set",
        metaDescription: "Complete non-stick cookware set for healthy cooking.",
        weight: 3.5,
    },
    // Additional Grocery
    {
        slug: "organic-spices-set",
        visibility: "public",
        name: "Organic Spices Set",
        sku: "OSS-001",
        price: 499,
        oldPrice: 699,
        stock: 40,
        status: "active",
        image: "https://images.unsplash.com/photo-15621579969-5a5d8e8c7e5?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-15621579969-5a5d8e8c7e5?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1587049352234-1e38fd6e3326?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Grocery",
        description: "Premium organic spices set sourced from certified organic farms.",
        featured: false,
        createdAt: today,
        sizes: [],
        colors: [],
        variants: ["5-spice", "8-spice", "12-spice"],
        tags: ["spices", "organic", "cooking", "premium"],
        keyFeatures: ["100% organic", "No preservatives", "Rich flavor", "Airtight packaging"],
        warranty: "12 Months",
        warrantyDetails: "Quality and freshness guaranteed.",
        saleEnabled: true,
        saleDiscount: 29,
        saleStartDate: today,
        saleEndDate: "2024-12-31",
        metaTitle: "Organic Spices Set",
        metaDescription: "Premium organic spices set for healthy cooking.",
        weight: 0.5,
    },
    {
        slug: "premium-coffee-beans",
        visibility: "public",
        name: "Premium Coffee Beans",
        sku: "PCB-001",
        price: 899,
        stock: 30,
        status: "active",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80&auto=format&fit=crop",
        galleryImages: [
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1517668800776-9f3395785aab?w=1200&q=80&auto=format&fit=crop",
        ],
        category: "Grocery",
        description: "Premium arabica coffee beans roasted to perfection.",
        featured: true,
        createdAt: today,
        sizes: [],
        colors: [],
        variants: ["250g", "500g", "1kg"],
        tags: ["coffee", "beans", "premium", "arabica"],
        keyFeatures: ["100% arabica", "Medium roast", "Freshly roasted", "Rich aroma"],
        warranty: "6 Months",
        warrantyDetails: "Freshness guaranteed.",
        saleEnabled: false,
        saleDiscount: 0,
        saleStartDate: "1970-01-01",
        saleEndDate: "1970-01-01",
        metaTitle: "Premium Coffee Beans",
        metaDescription: "Premium arabica coffee beans roasted to perfection.",
        weight: 1.0,
    },
  ];

  const withManagement = (p: any) => ({
    ...p,
    management: p.management ?? { source: "seed", generatedAtIso: nowIso },
    managementUpdatedAt: p.managementUpdatedAt ?? nowIso,
  });

  if (existingProducts === 0) {
    await ProductModel.insertMany(seedProducts.map(withManagement));
    console.log("✅ Seeded products successfully");
  } else {
    console.log("✅ Products already exist, skipping base seeding");
  }

  const currentProductCount = await ProductModel.countDocuments({});
  if (currentProductCount < TARGET_PRODUCT_COUNT) {
    const missing = TARGET_PRODUCT_COUNT - currentProductCount;
    const extraProducts = makeExtraProducts(missing, currentProductCount);
    await ProductModel.insertMany(extraProducts.map(withManagement));
    console.log(`✅ Seeded ${extraProducts.length} additional products (total now ${TARGET_PRODUCT_COUNT}+)`);
  } else {
    console.log(`✅ Products already >= ${TARGET_PRODUCT_COUNT}, skipping top-up`);
  }

  const unstableProducts = await ProductModel.find({ image: { $regex: /^https:\/\/source\.unsplash\.com/i } })
    .select({ _id: 1, sku: 1, slug: 1, category: 1 })
    .lean();

  if (unstableProducts.length) {
    const ops = unstableProducts.map((p) => {
      const seed = hashString(String(p.sku || p.slug || p._id));
      const stableGallery = stableImagesForCategory(String(p.category || "Electronics"), seed);
      return {
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { image: stableGallery[0], galleryImages: stableGallery } },
        },
      };
    });
    await ProductModel.bulkWrite(ops);
    console.log(`✅ Updated ${unstableProducts.length} products to stable image URLs`);
  }

  // Fix products with missing/empty/null images or galleryImages
  const invalidImageProducts = await ProductModel.find({
    $or: [
      { image: { $in: [null, "", undefined] } },
      { image: { $exists: false } },
      { galleryImages: { $in: [null, [], undefined] } },
      { galleryImages: { $size: 0 } },
      { galleryImages: { $exists: false } },
    ],
  })
    .select({ _id: 1, sku: 1, slug: 1, category: 1 })
    .lean();

  if (invalidImageProducts.length) {
    const fixOps = invalidImageProducts.map((p) => {
      const seed = hashString(String(p.sku || p.slug || p._id));
      const stableGallery = stableImagesForCategory(String(p.category || "Electronics"), seed);
      return {
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { image: stableGallery[0], galleryImages: stableGallery } },
        },
      };
    });
    await ProductModel.bulkWrite(fixOps);
    console.log(`✅ Fixed ${invalidImageProducts.length} products with missing/empty images`);
  } else {
    console.log("✅ All products have valid images");
  }

  const existingCarts = await CartModel.countDocuments({});
  if (existingCarts === 0) {
    const [john, jane] = await Promise.all([
      UserModel.findOne({ email: "john.doe@example.com" }).lean(),
      UserModel.findOne({ email: "jane.smith@example.com" }).lean(),
    ]);

    const products = await ProductModel.find({ visibility: "public" }).sort({ createdAt: -1 }).limit(6).lean();

    const cartsToInsert = [
      john && products[0]
        ? {
            user: john._id,
            items: [
              {
                product: products[0]._id,
                quantity: 1,
                price: products[0].price,
                addedAt: new Date(),
              },
              ...(products[1]
                ? [
                    {
                      product: products[1]._id,
                      quantity: 2,
                      price: products[1].price,
                      addedAt: new Date(),
                    },
                  ]
                : []),
            ],
          }
        : null,
      jane && products[2]
        ? {
            user: jane._id,
            items: [
              {
                product: products[2]._id,
                quantity: 1,
                price: products[2].price,
                addedAt: new Date(),
              },
            ],
          }
        : null,
    ].filter(Boolean);

    if (cartsToInsert.length) {
      await CartModel.insertMany(cartsToInsert);
    }

    console.log("✅ Seeded carts successfully");
  } else {
    console.log("✅ Carts already exist, skipping seeding");
  }

  const existingWishlists = await WishlistModel.countDocuments({});
  if (existingWishlists === 0) {
    const [john, jane, mike] = await Promise.all([
      UserModel.findOne({ email: "john.doe@example.com" }).lean(),
      UserModel.findOne({ email: "jane.smith@example.com" }).lean(),
      UserModel.findOne({ email: "mike.johnson@example.com" }).lean(),
    ]);

    const products = await ProductModel.find({ visibility: "public" }).sort({ createdAt: -1 }).limit(8).lean();

    const wishlistsToInsert = [
      john && products[3]
        ? {
            user: john._id,
            items: [
              {
                product: products[3]._id,
                addedAt: new Date(),
              },
              ...(products[4]
                ? [
                    {
                      product: products[4]._id,
                      addedAt: new Date(),
                    },
                  ]
                : []),
            ],
          }
        : null,
      jane && products[5]
        ? {
            user: jane._id,
            items: [
              {
                product: products[5]._id,
                addedAt: new Date(),
              },
            ],
          }
        : null,
      mike && products[6]
        ? {
            user: mike._id,
            items: [
              {
                product: products[6]._id,
                addedAt: new Date(),
              },
            ],
          }
        : null,
    ].filter(Boolean);

    if (wishlistsToInsert.length) {
      await WishlistModel.insertMany(wishlistsToInsert);
    }

    console.log("✅ Seeded wishlists successfully");
  } else {
    console.log("✅ Wishlists already exist, skipping seeding");
  }

  console.log("🌱 Database seeding completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
