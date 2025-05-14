import React, { useState, useEffect, useRef } from 'react';
import { Company, Review } from '@/types';
import { ChevronLeft, ChevronRight, Star, ExternalLink } from 'lucide-react';

interface ReviewsProps {
  company: Company;
}

const Reviews: React.FC<ReviewsProps> = ({ company }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load reviews if we have a place_id
    if (company?.place_id) {
      setLoading(true);

      // Function to fetch reviews from our JSON file
      const fetchReviews = async () => {
        try {
          const response = await fetch('/dataset_Google-Maps-Reviews-Scraper_2025-05-14_17-36-14-844.json');
          if (!response.ok) {
            throw new Error('Failed to fetch reviews');
          }

          const allReviews: Review[] = await response.json();

          // Filter reviews for this company's place_id, and 5-star reviews only
          const companyReviews = allReviews.filter(
            review => review.placeId === company.place_id && review.stars === 5
          );

          setReviews(companyReviews);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching reviews:', error);
          setLoading(false);
        }
      };

      fetchReviews();
    } else {
      setLoading(false);
    }
  }, [company?.place_id]);

  // Navigation functions
  const goToNextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
  };

  const goToPrevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Handle external link
  const handleViewAllReviews = () => {
    if (company?.location_reviews_link) {
      window.open(company.location_reviews_link, '_blank');
    }
  };

  // If there are no reviews or still loading, display a basic message
  if (loading) {
    return (
      <section id="reviews" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-8">Customer Reviews</h2>
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null; // Don't show the section if no reviews
  }

  // Limit visible reviews
  const visibleReviews = reviews.slice(0, Math.min(reviews.length, 10));

  return (
    <section id="reviews" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-2">Customer Reviews</h2>

        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="text-yellow-400 fill-yellow-400 h-6 w-6" />
              ))}
            </div>
            <span className="ml-2 text-gray-600 font-medium">
              {reviews.length} 5-star reviews
            </span>
          </div>
        </div>

        {/* Completely redesigned review carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation arrows with better positioning and style */}
          <button 
            onClick={goToPrevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 -ml-3 sm:-ml-5 focus:outline-none"
            aria-label="Previous review"
          >
            <ChevronLeft className="h-6 w-6 text-blue-600" />
          </button>

          <button 
            onClick={goToNextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 -mr-3 sm:-mr-5 focus:outline-none"
            aria-label="Next review"
          >
            <ChevronRight className="h-6 w-6 text-blue-600" />
          </button>

          {/* Main review card - just show one at a time */}
          <div className="bg-white rounded-xl shadow-lg p-6 mx-12">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {visibleReviews[currentIndex]?.name?.charAt(0) || 'G'}
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-lg">{visibleReviews[currentIndex]?.name || 'Happy Customer'}</h3>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">{visibleReviews[currentIndex]?.publishAt || ''}</p>
              </div>
            </div>

            <div className="prose prose-sm max-w-none mb-4">
              <p className="text-gray-700">
                {visibleReviews[currentIndex]?.text || "⭐️⭐️⭐️⭐️⭐️"}
              </p>
            </div>

            {/* Owner response - only if exists */}
            {visibleReviews[currentIndex]?.responseFromOwnerText && (
              <div className="bg-gray-50 p-4 rounded-lg mt-4 border-l-4 border-blue-500">
                <p className="font-medium text-sm mb-1">Response from {company.name}:</p>
                <p className="text-sm text-gray-600">{visibleReviews[currentIndex].responseFromOwnerText}</p>
              </div>
            )}
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {visibleReviews.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 focus:outline-none ${
                  index === currentIndex 
                    ? 'bg-blue-600 scale-110' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* View all reviews button */}
        {company?.location_reviews_link && (
          <div className="text-center mt-8">
            <button 
              onClick={handleViewAllReviews}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Read All Reviews
              <ExternalLink className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Reviews;