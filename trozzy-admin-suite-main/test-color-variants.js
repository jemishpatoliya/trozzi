// Test script to create a product with color variants
const testProduct = {
    name: "Test T-Shirt with Colors",
    sku: "TSHIRT-001",
    price: 29.99,
    stock: 100,
    status: "active",
    image: "https://via.placeholder.com/300x300",
    galleryImages: ["https://via.placeholder.com/300x300"],
    category: "Fashion",
    description: "A comfortable t-shirt available in multiple colors",
    featured: false,
    sizes: ["S", "M", "L", "XL"],
    colors: ["black", "white", "red"],
    colorVariants: [
        {
            color: "black",
            colorName: "Black",
            colorCode: "#000000",
            images: ["https://via.placeholder.com/300x300/black"],
            price: 29.99,
            stock: 25,
            sku: "TSHIRT-001-BLK"
        },
        {
            color: "white",
            colorName: "White",
            colorCode: "#FFFFFF",
            images: ["https://via.placeholder.com/300x300/white"],
            price: 29.99,
            stock: 30,
            sku: "TSHIRT-001-WHT"
        },
        {
            color: "red",
            colorName: "Red",
            colorCode: "#FF0000",
            images: ["https://via.placeholder.com/300x300/red"],
            price: 34.99,
            stock: 20,
            sku: "TSHIRT-001-RED"
        }
    ],
    variants: [],
    tags: ["t-shirt", "cotton", "casual"],
    keyFeatures: ["100% Cotton", "Machine Washable", "Breathable Fabric"],
    warranty: "30 Days",
    warrantyDetails: "Return within 30 days for full refund",
    saleEnabled: false,
    saleDiscount: 0,
    saleStartDate: "",
    saleEndDate: "",
    metaTitle: "Test T-Shirt with Multiple Colors",
    metaDescription: "Comfortable t-shirt available in black, white, and red colors",
    weight: 0.2,
    dimensions: { length: 70, width: 50, height: 2 },
    badge: "",
    brand: "TestBrand"
};

console.log('Test Product with Color Variants:', JSON.stringify(testProduct, null, 2));
