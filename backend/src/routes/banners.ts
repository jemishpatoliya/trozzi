import { Router, type Request, type Response } from "express";

const router = Router();

type Banner = {
  id: string;
  position: "home_hero" | "home_mid_slider" | "home_mid_banners" | "home_ad_grid" | "home_promo_slider";
  imageUrl: string;
  linkUrl: string;
};

const banners: Banner[] = [
  {
    id: "hero-1",
    position: "home_hero",
    imageUrl: "https://serviceapi.spicezgold.com/download/1751685130717_NewProject(8).jpg",
    linkUrl: "/ProductListing",
  },
  {
    id: "hero-2",
    position: "home_hero",
    imageUrl: "https://serviceapi.spicezgold.com/download/1751685144346_NewProject(11).jpg",
    linkUrl: "/ProductListing",
  },
  {
    id: "hero-3",
    position: "home_hero",
    imageUrl: "https://serviceapi.spicezgold.com/download/1748955932914_NewProject(1).jpg",
    linkUrl: "/ProductListing",
  },
  {
    id: "hero-4",
    position: "home_hero",
    imageUrl: "https://serviceapi.spicezgold.com/download/1755503364377_1721277298204_banner.jpg",
    linkUrl: "/ProductListing",
  },

  {
    id: "mid-slider-1",
    position: "home_mid_slider",
    imageUrl: "https://serviceapi.spicezgold.com/download/1756273096312_1737036773579_sample-1.jpg",
    linkUrl: "/ProductListing",
  },
  {
    id: "mid-slider-2",
    position: "home_mid_slider",
    imageUrl: "https://serviceapi.spicezgold.com/download/1742441193376_1737037654953_New_Project_45.jpg",
    linkUrl: "/ProductListing",
  },

  {
    id: "mid-banner-1",
    position: "home_mid_banners",
    imageUrl: "https://serviceapi.spicezgold.com/download/1741664496923_1737020250515_New_Project_47.jpg",
    linkUrl: "/ProductListing",
  },
  {
    id: "mid-banner-2",
    position: "home_mid_banners",
    imageUrl: "https://serviceapi.spicezgold.com/download/1741664665391_1741497254110_New_Project_50.jpg",
    linkUrl: "/ProductListing",
  },

  {
    id: "grid-1",
    position: "home_ad_grid",
    imageUrl: "https://img-prd-pim.poorvika.com/pageimg/Galaxy-Z-Flip-7-FE-Web-Banner-New-Mob-2025.webp",
    linkUrl: "/ProductListing",
  },
  {
    id: "grid-2",
    position: "home_ad_grid",
    imageUrl: "https://img.freepik.com/free-vector/soft-drink-ad_52683-9155.jpg?semt=ais_hybrid&w=740&q=80",
    linkUrl: "/ProductListing",
  },
  {
    id: "grid-3",
    position: "home_ad_grid",
    imageUrl: "https://img.freepik.com/free-psd/smartphone-camera-control-social-media-banner-design-template_47987-25416.jpg?semt=ais_incoming&w=740&q=80",
    linkUrl: "/ProductListing",
  },
  {
    id: "grid-4",
    position: "home_ad_grid",
    imageUrl: "https://d3jmn01ri1fzgl.cloudfront.net/photoadking/webp_thumbnail/tulip-tree-and-buddha-gold-fashion-banner-template-nr6gkr38da1f46.webp",
    linkUrl: "/ProductListing",
  },

  {
    id: "promo-1",
    position: "home_promo_slider",
    imageUrl: "https://static.vecteezy.com/system/resources/thumbnails/004/604/634/small/online-shopping-on-website-and-mobile-application-by-smart-phone-digital-marketing-shop-and-store-concept-vector.jpg",
    linkUrl: "/ProductListing",
  },
  {
    id: "promo-2",
    position: "home_promo_slider",
    imageUrl: "https://static.vecteezy.com/system/resources/thumbnails/004/604/634/small/online-shopping-on-website-and-mobile-application-by-smart-phone-digital-marketing-shop-and-store-concept-vector.jpg",
    linkUrl: "/ProductListing",
  },
  {
    id: "promo-3",
    position: "home_promo_slider",
    imageUrl: "https://static.vecteezy.com/system/resources/thumbnails/004/604/634/small/online-shopping-on-website-and-mobile-application-by-smart-phone-digital-marketing-shop-and-store-concept-vector.jpg",
    linkUrl: "/ProductListing",
  },
  {
    id: "promo-4",
    position: "home_promo_slider",
    imageUrl: "https://static.vecteezy.com/system/resources/thumbnails/004/604/634/small/online-shopping-on-website-and-mobile-application-by-smart-phone-digital-marketing-shop-and-store-concept-vector.jpg",
    linkUrl: "/ProductListing",
  },
];

router.get("/", (req: Request, res: Response) => {
  const position = req.query.position ? String(req.query.position) : "";
  const result = position ? banners.filter((b) => b.position === position) : banners;
  res.json(result);
});

export default router;
