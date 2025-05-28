import React, { useState, useEffect } from 'react';

interface Review {
  name: string;
  stars: number;
  text: string;
  publishedAtDate: string;
  place_id: string;
}

interface GoogleReviewsProps {
  company: any;
}

const GoogleReviews: React.FC<GoogleReviewsProps> = ({ company }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/merged-reviews-with-companies.json');
        const allReviews = await response.json();
        
        // Filter good reviews for this company by place_id
        const companyReviews = allReviews.filter((review: any) => 
          review.placeId === company.place_id && 
          review.stars >= 4 && 
          review.text && 
          review.text.trim().length > 20
        );
        
        setReviews(companyReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };

    if (company.place_id) {
      fetchReviews();
    }
  }, [company.place_id]);

  useEffect(() => {
    if (reviews.length > 5) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [reviews.length]);

  // Smart logic based on your requirements
  const totalReviews = parseInt(company.reviews) || 0;
  const rating = parseFloat(company.rating) || 0;

  // Don't show if under 3 total reviews OR under 3 star rating
  if (totalReviews < 3 || rating < 3) {
    return null;
  }

  const displayReviews = reviews.length > 5 
    ? [reviews[currentIndex]] 
    : reviews.slice(0, 5);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          {/* Show rating if 4.5+ stars, otherwise just show review count */}
          <div className="flex items-center justify-center mb-4">
            {rating >= 4.5 && (
              <>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-gray-600 font-medium">
                  {Number(rating).toFixed(1)} Stars • {totalReviews} Reviews
                </span>
              </>
            )}
            {rating < 4.5 && (
              <span className="text-gray-600 font-medium">
                Customer Reviews ({totalReviews} Reviews)
              </span>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {reviews.length > 5 ? (
            // Slideshow for more than 5 reviews
            <div className="relative">
              <div className="bg-white rounded-xl shadow-lg p-8 mx-auto max-w-4xl">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
                    "{displayReviews[0].text}"
                  </blockquote>
                  <div className="text-gray-900 font-semibold">
                    {displayReviews[0].name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(displayReviews[0].publishedAtDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {/* Slideshow indicators */}
              <div className="flex justify-center mt-6 space-x-2">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Grid layout for 3-5 reviews
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayReviews.map((review, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4 text-sm leading-relaxed">
                    "{review.text.length > 150 ? review.text.substring(0, 150) + '...' : review.text}"
                  </blockquote>
                  <div className="text-gray-900 font-semibold text-sm">
                    {review.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(review.publishedAtDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Read More Reviews Button */}
          {company.location_reviews_link && (
            <div className="text-center mt-8">
              <a
                href={company.location_reviews_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Read More Reviews
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;