
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
  const [touchStartX, setTouchStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Refs for the slideshow container
  const slideshowRef = useRef<HTMLDivElement>(null);
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  
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
  const goToSlide = (index: number) => {
    // Ensure index is within bounds
    const newIndex = (index + reviews.length) % reviews.length;
    setCurrentIndex(newIndex);
    
    // If we have a ref to the slides container, animate the scroll
    if (slidesContainerRef.current) {
      const slideWidth = slidesContainerRef.current.offsetWidth;
      slidesContainerRef.current.scrollTo({
        left: newIndex * slideWidth,
        behavior: 'smooth'
      });
    }
  };
  
  const nextReview = () => {
    goToSlide(currentIndex + 1);
  };
  
  const prevReview = () => {
    goToSlide(currentIndex - 1);
  };
  
  // Touch event handlers for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const touchEndX = e.touches[0].clientX;
    const diffX = touchStartX - touchEndX;
    
    // Prevent default to stop page scrolling during swipe
    if (Math.abs(diffX) > 5) {
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;
    
    // Swipe threshold
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe left, go to next
        nextReview();
      } else {
        // Swipe right, go to previous
        prevReview();
      }
    }
    
    setIsSwiping(false);
  };
  
  // Handle scroll event for pagination dots
  const handleScroll = () => {
    if (slidesContainerRef.current) {
      const scrollLeft = slidesContainerRef.current.scrollLeft;
      const slideWidth = slidesContainerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / slideWidth);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };
  
  // Set up scroll event listener
  useEffect(() => {
    const slidesContainer = slidesContainerRef.current;
    if (slidesContainer) {
      slidesContainer.addEventListener('scroll', handleScroll);
      return () => {
        slidesContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);
  
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
  
  // Limit visible reviews to improve display
  const reviewsToShow = reviews.slice(0, Math.min(reviews.length, 6));
  
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
        
        {/* Redesigned Slideshow container */}
        <div 
          ref={slideshowRef}
          className="relative max-w-6xl mx-auto mb-12"
        >
          {/* Navigation controls - absolute positioned on sides */}
          <button 
            onClick={prevReview}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors z-10 opacity-80 hover:opacity-100 -ml-4 sm:ml-0"
            aria-label="Previous review"
          >
            <ChevronLeft className="h-5 w-5 text-blue-600" />
          </button>
          
          <button 
            onClick={nextReview}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors z-10 opacity-80 hover:opacity-100 -mr-4 sm:mr-0"
            aria-label="Next review"
          >
            <ChevronRight className="h-5 w-5 text-blue-600" />
          </button>
          
          {/* Slides container with improved layout */}
          <div 
            ref={slidesContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Redesigned review cards for better responsiveness */}
            {reviewsToShow.map((review, index) => (
              <div 
                key={index}
                className="min-w-full sm:min-w-[calc(100%/2)] md:min-w-[calc(100%/3)] flex-shrink-0 snap-center px-3"
              >
                <div className="bg-white p-5 rounded-lg shadow-md h-full flex flex-col">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {review.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-bold text-base">{review.name}</h3>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="text-yellow-400 fill-yellow-400 h-3 w-3" />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Text with truncation and height limits */}
                  <div className="flex-grow overflow-hidden">
                    <p className="text-gray-700 text-sm line-clamp-4 max-h-24">
                      {review.text || "⭐️⭐️⭐️⭐️⭐️"}
                    </p>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">{review.publishAt}</p>
                  
                  {/* Conditional response from owner - limited height */}
                  {review.responseFromOwnerText && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="font-medium text-xs">Response from {company.name}:</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{review.responseFromOwnerText}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Improved pagination dots */}
          <div className="flex justify-center mt-5">
            {reviews.slice(0, Math.min(reviews.length, 8)).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`mx-1 w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-blue-600 scale-110' : 'bg-gray-300'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
            {reviews.length > 8 && (
              <span className="mx-1 text-gray-400">...</span>
            )}
          </div>
        </div>
        
        {/* View all reviews button */}
        {company?.location_reviews_link && (
          <div className="text-center">
            <button 
              onClick={handleViewAllReviews}
              className="inline-flex items-center px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
