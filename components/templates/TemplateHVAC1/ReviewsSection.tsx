import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Review } from '@/types';

interface ReviewsSectionProps {
  reviews: Review[];
  companyName: string;
}

// Helper function to generate star rating display
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      ))}
    </div>
  );
};

// Format date to be more readable
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, companyName }) => {
  // Use up to 6 reviews
  const displayReviews = reviews.slice(0, 6);

  return (
    <section className="py-16 bg-gray-50" id="reviews">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Customer Reviews</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            See what our customers are saying about {companyName} and our HVAC services.
          </p>
        </div>

        {displayReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-4">
                      {review.reviewer_image ? (
                        <img 
                          src={review.reviewer_image} 
                          alt={review.reviewer_name || 'Reviewer'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl text-gray-400">
                          {review.reviewer_name && review.reviewer_name.length > 0 
                            ? review.reviewer_name.charAt(0).toUpperCase()
                            : 'A'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{review.reviewer_name}</h4>
                      <p className="text-sm text-gray-500">{formatDate(review.published_at_date)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.stars} />
                  <p className="my-4 text-gray-600 line-clamp-3">{review.text}</p>
                  
                  {review.response_text && (
                    <div className="mt-4 bg-gray-100 p-3 rounded-md">
                      <p className="text-sm font-semibold">Response from {companyName}:</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{review.response_text}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow-sm">
            <p>No reviews available yet. Be the first to leave a review!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;