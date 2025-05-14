import React, { useState, useEffect } from 'react';
import { Company, Review } from '@/types';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight, Star, ExternalLink } from 'lucide-react';

interface ReviewsProps {
  company: Company;
}

const Reviews: React.FC<ReviewsProps> = ({ company }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
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
  
  // Handle navigation
  const nextReview = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
  };
  
  const prevReview = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length);
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
  
  // Decide whether to use slideshow or static display based on review count
  const useSlideshow = reviews.length > 10;
  const displayReviews = useSlideshow 
    ? [reviews[currentIndex]] 
    : reviews.slice(0, Math.min(3, reviews.length));
  
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
        
        {useSlideshow ? (
          // Slideshow for many reviews
          <div className="relative max-w-4xl mx-auto">
            <div className="review-slideshow mb-8 min-h-[200px]">
              <div 
                key={currentIndex}
                className="bg-white p-8 rounded-lg shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {reviews[currentIndex].name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-lg">{reviews[currentIndex].name}</h3>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="text-yellow-400 fill-yellow-400 h-4 w-4" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-2">
                  {reviews[currentIndex].text || "⭐️⭐️⭐️⭐️⭐️"}
                </p>
                <p className="text-sm text-gray-500">{reviews[currentIndex].publishAt}</p>
                
                {reviews[currentIndex].responseFromOwnerText && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-medium text-sm">Response from {company.name}:</p>
                    <p className="text-sm text-gray-600 mt-1">{reviews[currentIndex].responseFromOwnerText}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Navigation controls */}
            <div className="flex justify-between">
              <button 
                onClick={prevReview}
                className="bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                aria-label="Previous review"
              >
                <ChevronLeft className="h-6 w-6 text-blue-600" />
              </button>
              
              <button 
                onClick={nextReview}
                className="bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                aria-label="Next review"
              >
                <ChevronRight className="h-6 w-6 text-blue-600" />
              </button>
            </div>
          </div>
        ) : (
          // Static display for fewer reviews
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
            {displayReviews.map((review, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {review.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-bold">{review.name}</h3>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="text-yellow-400 fill-yellow-400 h-3 w-3" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm flex-grow">
                  {review.text || "⭐️⭐️⭐️⭐️⭐️"}
                </p>
                <p className="text-xs text-gray-500 mt-2">{review.publishAt}</p>
                
                {review.responseFromOwnerText && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="font-medium text-xs">Response from {company.name}:</p>
                    <p className="text-xs text-gray-600 mt-1">{review.responseFromOwnerText}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* View all reviews button */}
        {company?.location_reviews_link && (
          <div className="text-center">
            <button 
              onClick={handleViewAllReviews}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Reviews
              <ExternalLink className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Reviews;