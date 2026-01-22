import React from "react";

const blogs = [
  {
    id: 1,
    title: "Sustainable living through cutting-edge prefabricated homes",
    desc: "Give lady of they such they sure it. Me contained explained my education. Vulgar as hearts by g...",
    date: "2025-03-12",
    image: "https://serviceapi.spicezgold.com/download/1750304462017_1000005912.jpg",
  },
  {
    id: 2,
    title: "Explore sustainable living through cutting-edge prefabricated homes",
    desc: "Give lady of they such they sure it. Me contained explained my education. Vulgar as hearts by g...",
    date: "2025-03-12",
    image: "https://serviceapi.spicezgold.com/download/1741758993155_6-4.jpg",
  },
  {
    id: 3,
    title: "This prefabrice passive house is highly sustainable",
    desc: "Give lady of they such they sure it. Me contained explained my education. Vulgar as hearts by g...",
    date: "2025-03-12",
    image: "https://serviceapi.spicezgold.com/download/1741758867669_7-6.jpg",
  },
  {
    id: 4,
    title: "This prefabrice passive house is memorable highly sustainable",
    desc: "Give lady of they such they sure it. Me contained explained my education. Vulgar as hearts by g...",
    date: "2025-03-12",
    image: "https://serviceapi.spicezgold.com/download/1750304462017_1000005912.jpg",
  },
];

const BlogSection = () => {
  return (
    <section className="py-6 sm:py-16 px-3 sm:px-6 bg-white">
      <div className="">
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4 text-center">From The Blog</h2>
        <p className="text-[13px] sm:text-lg text-gray-600 mb-4 sm:mb-12 text-center max-w-3xl mx-auto leading-relaxed">
          Tips, trends, and insights from our experts. Stay updated with the latest in lifestyle and wellness.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Blog Image */}
              <div className="relative h-44 sm:h-56 overflow-hidden">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Date Badge */}
                <span className="absolute bottom-3 right-3 bg-blue-600 text-white text-[11px] sm:text-sm font-medium px-2.5 sm:px-3 py-1 rounded-full shadow-lg">
                  {blog.date}
                </span>
              </div>

              {/* Blog Content */}
              <div className="p-4 sm:p-6">
                <h3 className="font-bold text-[15px] sm:text-lg mb-2.5 sm:mb-3 text-gray-900 line-clamp-2">
                  {blog.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{blog.desc}</p>

                <button
                  className="text-blue-600 font-semibold text-sm hover:text-blue-700 flex items-center gap-2 transition-colors"
                  onClick={() => console.log('Read more:', blog.title)}
                >
                  Read More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
