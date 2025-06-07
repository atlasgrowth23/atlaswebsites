import React, { useState, useEffect } from 'react';

interface Review {
  name: string;
  stars: number;
  text: string;
  publishedAtDate: string;
  company_name: string;
  reviews_link: string;
}

interface CustomerReviewsProps {
  company: any;
}

const CustomerReviews: React.FC<CustomerReviewsProps> = ({ company }) => {
  const [fiveStarReviews, setFiveStarReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/merged-reviews-with-companies.json');
        const allReviews = await response.json();
        
        // Filter for 5-star reviews for this company by name
        const companyFiveStarReviews = allReviews.filter((review: any) => 
          review.company_name === company.name && 
          review.stars === 5 &&
          review.text && 
          review.text.trim().length > 10
        );
        
        setFiveStarReviews(companyFiveStarReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };

    if (company.name) {
      fetchReviews();
    }
  }, [company.name]);

  // Auto-advance slideshow
  useEffect(() => {
    if (fiveStarReviews.length > 1 && isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % fiveStarReviews.length);
      }, 5000); // 5 seconds per review
      return () => clearInterval(interval);
    }
  }, [fiveStarReviews.length, isAutoPlaying]);

  // Don't show if less than 3 five-star reviews
  if (fiveStarReviews.length < 3) {
    return null;
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % fiveStarReviews.length);
    setIsAutoPlaying(false); // Stop auto-play when user manually navigates
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + fiveStarReviews.length) % fiveStarReviews.length);
    setIsAutoPlaying(false);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Determine how many reviews to show based on your requirements
  const shouldShowSlideshow = fiveStarReviews.length >= 3;
  const reviewsToShow = fiveStarReviews.length <= 5 ? 3 : fiveStarReviews.length;

  const currentReview = fiveStarReviews[currentIndex];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-xl mb-6">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it – hear what our satisfied customers have to say about their experience with {company.name}.
          </p>
        </div>

        {/* Reviews Slideshow */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Main Review Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                <svg fill="currentColor" viewBox="0 0 100 100">
                  <path d="M30 10c-8.837 0-16 7.163-16 16s7.163 16 16 16c.205 0 .409-.004.612-.011C29.98 42.657 29.5 43.307 29.5 44c0 .693.48 1.343 1.112 2.011C30.409 46.004 30.205 46 30 46c-8.837 0-16 7.163-16 16s7.163 16 16 16 16-7.163 16-16c0-.693-.48-1.343-1.112-2.011.203.007.407.011.612.011 8.837 0 16-7.163 16-16S54.337 26 45.5 26c-.205 0-.409.004-.612.011C45.52 25.343 46 24.693 46 24c0-.693-.48-1.343-1.112-2.011C45.091 21.996 45.295 22 45.5 22c8.837 0 16-7.163 16-16S54.337-10 45.5-10 29.5 -2.837 29.5 6c0 .693.48 1.343 1.112 2.011C30.409 8.004 30.205 8 30 8c-8.837 0-16 7.163-16 16s7.163 16 16 16c.205 0 .409-.004.612-.011C29.98 40.657 29.5 41.307 29.5 42c0 .693.48 1.343 1.112 2.011C30.409 44.004 30.205 44 30 44z"/>
                </svg>
              </div>

              <div className="relative z-10">
                {/* Stars */}
                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-8 h-8 text-yellow-400 fill-current mx-1" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Review Text */}
                <blockquote className="text-xl md:text-2xl text-gray-700 text-center mb-8 leading-relaxed font-light">
                  "{currentReview?.text || 'Great service and professional staff!'}"
                </blockquote>

                {/* Customer Info */}
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    {currentReview?.name || 'Satisfied Customer'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentReview?.publishedAtDate ? new Date(currentReview.publishedAtDate).toLocaleDateString() : 'Verified Customer'}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            {fiveStarReviews.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 z-20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 z-20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {fiveStarReviews.length > 1 && (
            <div className="flex justify-center mt-8 space-x-3">
              {fiveStarReviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-blue-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Review Count & CTA */}
          <div className="text-center mt-12">
            
            {/* Read More Reviews Button */}
            {fiveStarReviews.length > 0 && fiveStarReviews[0]?.reviews_link && (
              <a
                href={fiveStarReviews[0].reviews_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Read More Reviews
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;