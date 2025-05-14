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
  
  // Always use slideshow now, regardless of review count
  // But limit visible slides based on screen size
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
        
        {/* Slideshow container */}
        <div 
          ref={slideshowRef}
          className="relative max-w-6xl mx-auto overflow-hidden mb-12"
        >
          {/* Slides container with horizontal scroll */}
          <div 
            ref={slidesContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Map all reviews to create slide items */}
            {reviewsToShow.map((review, index) => (
              <div 
                key={index}
                className="min-w-full sm:min-w-[calc(100%/2-16px)] md:min-w-[calc(100%/3-16px)] p-4 flex-shrink-0 snap-center"
              >
                <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {review.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-lg">{review.name}</h3>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="text-yellow-400 fill-yellow-400 h-4 w-4" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 flex-grow">
                    {review.text || "⭐️⭐️⭐️⭐️⭐️"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{review.publishAt}</p>
                  
                  {review.responseFromOwnerText && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="font-medium text-sm">Response from {company.name}:</p>
                      <p className="text-sm text-gray-600 mt-1">{review.responseFromOwnerText}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation controls - absolute positioned on sides */}
          <button 
            onClick={prevReview}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors z-10 opacity-80 hover:opacity-100"
            aria-label="Previous review"
          >
            <ChevronLeft className="h-6 w-6 text-blue-600" />
          </button>
          
          <button 
            onClick={nextReview}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors z-10 opacity-80 hover:opacity-100"
            aria-label="Next review"
          >
            <ChevronRight className="h-6 w-6 text-blue-600" />
          </button>
          
          {/* Pagination dots */}
          <div className="flex justify-center mt-6">
            {reviews.slice(0, Math.min(reviews.length, 8)).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`mx-1 w-3 h-3 rounded-full ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
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