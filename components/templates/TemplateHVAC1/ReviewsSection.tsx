import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Explicitly define Review interface right here to avoid any import issues
interface Review {
  id?: number;
  review_id: string;
  biz_id: string;
  place_id: string;
  reviewer_name?: string;
  name?: string; // Alternative field
  text: string;
  stars: number;
  rating?: number; // Alternative field
  published_at_date: string;
  reviewer_image?: string;
  reviewer_photo_url?: string; // Alternative field
  response_text?: string;
  response_from_owner_text?: string; // Alternative field
  response_date?: string;
  response_from_owner_date?: string; // Alternative field
  reviews_link?: string;
  review_url?: string; // Alternative field
}

interface ReviewsSectionProps {
  reviews: Review[];
  companyName: string;
}

// Helper function to generate star rating display
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      ))}
    </div>
  );
};

// Format date to be more readable with fixed locale for consistent server/client rendering
const formatDate = (dateString: string) => {
  // Use a fixed locale and timezone to ensure consistent rendering between server and client
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC' // Use UTC to ensure consistency
  };

  try {
    // Use 'en-US' locale explicitly to prevent locale differences between server/client
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    // Fallback in case of invalid date
    return 'Unknown date';
  }
};

// Review Card Component
const ReviewCard = ({ review, companyName }: { review: Review, companyName: string }) => {
  // Get the appropriate fields based on what's available
  const reviewerName = review.reviewer_name || review.name || 'Anonymous';
  const reviewerImage = review.reviewer_image || review.reviewer_photo_url;
  const starRating = review.stars || review.rating || 5;
  const responseText = review.response_text || review.response_from_owner_text;
  const reviewLink = review.reviews_link || review.review_url;

  return (
    <Card className="h-full flex flex-col bg-white shadow-lg rounded-xl transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardContent className="pt-6 flex flex-col flex-grow">
        <div className="flex items-center mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mr-4 border-2 border-primary/20">
            {reviewerImage ? (
              <img 
                src={reviewerImage} 
                alt={reviewerName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary">
                {reviewerName && reviewerName.length > 0 
                  ? reviewerName.charAt(0).toUpperCase()
                  : 'A'}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-semibold">{reviewerName}</h4>
            <p className="text-sm text-gray-500">{formatDate(review.published_at_date)}</p>
          </div>
        </div>

        <StarRating rating={starRating} />

        <div className="my-4 text-gray-700 flex-grow">
          <p className="line-clamp-4">{review.text}</p>
        </div>

        {responseText && (
          <div className="mt-auto bg-gray-50 p-4 rounded-md border-l-4 border-primary">
            <p className="text-sm font-semibold">Response from {companyName}:</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-3">{responseText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, companyName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const reviewsPerPage = 3; // Show 3 reviews at a time in the carousel
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Create batches of reviews for the carousel
  const reviewBatches = [];
  for (let i = 0; i < reviews.length; i += reviewsPerPage) {
    reviewBatches.push(reviews.slice(i, i + reviewsPerPage));
  }

  // Navigation functions
  const goToNextSlide = useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages);
      setTimeout(() => setIsAnimating(false), 500); // Match transition duration
    }
  }, [totalPages, isAnimating]);

  const goToPrevSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prevIndex) => (prevIndex - 1 + totalPages) % totalPages);
      setTimeout(() => setIsAnimating(false), 500); // Match transition duration
    }
  };

  // Set up autoplay
  useEffect(() => {
    if (reviews.length > reviewsPerPage) {
      autoplayRef.current = setInterval(goToNextSlide, 5000);
      return () => {
        if (autoplayRef.current) clearInterval(autoplayRef.current);
      };
    }
  }, [goToNextSlide, reviews.length, reviewsPerPage]);

  // Pause autoplay on hover
  const pauseAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };

  // Resume autoplay on mouse leave
  const resumeAutoplay = () => {
    if (reviews.length > reviewsPerPage) {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      autoplayRef.current = setInterval(goToNextSlide, 5000);
    }
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;

    let sum = 0;
    reviews.forEach(review => {
      sum += review.stars || review.rating || 0;
    });

    return sum / reviews.length;
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white" id="reviews">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Customer Reviews</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6 rounded-full"></div>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Don't just take our word for it. See what our valued customers have to say about working with {companyName}.
          </p>

          {reviews.length > 0 && (
            <div className="flex items-center justify-center mt-6 gap-2">
              <div className="text-lg font-bold text-primary">{reviews.length}</div>
              <div className="flex">
                <StarRating rating={calculateAverageRating()} />
              </div>
              <div className="text-lg text-gray-600">Average Rating</div>
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          <>
            {/* If we have more than 3 reviews, show carousel */}
            {reviews.length > reviewsPerPage ? (
              <div 
                className="relative px-4" 
                onMouseEnter={pauseAutoplay}
                onMouseLeave={resumeAutoplay}
              >
                <div className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {reviewBatches.map((batch, batchIndex) => (
                      <div 
                        key={batchIndex} 
                        className="min-w-full grid grid-cols-1 md:grid-cols-3 gap-6"
                      >
                        {batch.map((review, index) => (
                          <ReviewCard 
                            key={review.id || review.review_id || index} 
                            review={review} 
                            companyName={companyName} 
                          />
                        ))}

                        {/* Fill in empty slots if needed */}
                        {batch.length < reviewsPerPage && 
                          Array(reviewsPerPage - batch.length).fill(0).map((_, i) => (
                            <div key={`empty-${i}`} className="hidden md:block"></div>
                          ))
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation buttons */}
                <button 
                  onClick={goToPrevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md z-10 focus:outline-none hover:bg-gray-100"
                  aria-label="Previous reviews"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button 
                  onClick={goToNextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md z-10 focus:outline-none hover:bg-gray-100"
                  aria-label="Next reviews"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Indicators */}
                <div className="flex justify-center mt-8 space-x-2">
                  {reviewBatches.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentIndex(i);
                        pauseAutoplay();
                      }}
                      className={`w-3 h-3 rounded-full ${
                        i === currentIndex ? 'bg-primary' : 'bg-gray-300'
                      }`}
                      aria-label={`Go to review set ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // If we have 3 or fewer reviews, show them in a grid without carousel
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((review, index) => (
                  <ReviewCard 
                    key={review.id || review.review_id || index} 
                    review={review} 
                    companyName={companyName} 
                  />
                ))}
              </div>
            )}

            {/* Call to action */}
            {reviews.length > 0 && (
              <div className="text-center mt-12">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-lg shadow transition-all"
                  onClick={() => window.open(
                    reviews[0].reviews_link || 
                    reviews[0].review_url || 
                    'https://www.google.com/maps', 
                    '_blank'
                  )}
                >
                  Leave a Review
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow-sm">
            <p className="text-lg">No reviews available yet. Be the first to leave a review!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;