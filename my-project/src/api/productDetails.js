import { api } from "./client";

import { fetchProductById } from "./catalog";

// Questions & Answers API
export async function fetchProductQuestions(productId, { page = 1, limit = 10 } = {}) {
    const params = { page, limit };
    const res = await api.get(`/product-details/${productId}/questions`, { params });
    return res.data;
}

export async function askQuestion(productId, questionData) {
    const res = await api.post(`/product-details/${productId}/questions`, questionData);
    return res.data;
}

export async function answerQuestion(questionId, answerData) {
    const res = await api.post(`/product-details/questions/${questionId}/answers`, answerData);
    return res.data;
}

export async function upvoteQuestion(questionId) {
    const res = await api.post(`/product-details/questions/${questionId}/upvote`);
    return res.data;
}

export async function upvoteAnswer(answerId) {
    const res = await api.post(`/product-details/answers/${answerId}/upvote`);
    return res.data;
}

// Product Details API
export async function fetchProductDetails(productId) {
    const [detailsRes, product] = await Promise.all([
        api.get(`/product-details/${productId}/details`),
        fetchProductById(productId, { mode: "public" }),
    ]);

    const details = detailsRes.data;
    if (!product) return details;

    const pickFirstNonEmptyString = (a, b) => {
        const sa = typeof a === 'string' ? a.trim() : '';
        if (sa) return a;
        const sb = typeof b === 'string' ? b.trim() : '';
        if (sb) return b;
        return a ?? b;
    };

    const pickNonEmptyArray = (a, b) => {
        const aa = Array.isArray(a) ? a.filter(Boolean) : [];
        if (aa.length > 0) return aa;
        const bb = Array.isArray(b) ? b.filter(Boolean) : [];
        if (bb.length > 0) return bb;
        return aa.length > 0 ? aa : bb;
    };

    return {
        ...details,
        id: product.id ?? details?.id,
        name: product.name ?? details?.name,
        description: product.description ?? details?.description,
        descriptionHtml: pickFirstNonEmptyString(product.descriptionHtml, details?.descriptionHtml),
        price: product.price ?? details?.price,
        image: pickFirstNonEmptyString(product.image, details?.image),
        galleryImages: pickNonEmptyArray(product.galleryImages, details?.galleryImages),
        sizes: product.sizes ?? details?.sizes,
        colors: product.colors ?? details?.colors,
        colorVariants: product.colorVariants ?? details?.colorVariants,
        brand: product.brand ?? details?.brand,
        category: product.category ?? details?.category,
        stock: product.stock ?? details?.stock,
        sizeGuide: product.sizeGuide ?? details?.sizeGuide,
        sizeGuideKey: product.sizeGuideKey ?? details?.sizeGuideKey,
        metaTitle: product.metaTitle ?? details?.metaTitle,
        metaDescription: product.metaDescription ?? details?.metaDescription,
        weight: product.weight ?? details?.weight,
        dimensions: product.dimensions ?? details?.dimensions,
    };
}

export async function fetchProductReviews(productId, { page = 1, limit = 10, sort = 'recent' } = {}) {
    const params = { page, limit, sort };
    const res = await api.get(`/product-details/${productId}/reviews`, { params });
    return res.data;
}

export async function submitProductReview(productId, reviewData) {
    const res = await api.post(`/product-details/${productId}/reviews`, reviewData);
    return res.data;
}

export async function helpfulReview(reviewId) {
    const res = await api.post(`/product-details/reviews/${reviewId}/helpful`);
    return res.data;
}
