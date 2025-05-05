import React from 'react';
import { Review } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ReviewsSectionProps {
  reviews: Review[];
  companyName: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, companyName }) => {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section id="reviews" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">What Our Customers Say</h2>
          <p className="text-gray-600 mt-2">Read reviews from our satisfied customers</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <Card key={review.review_id} className="h-full">
              <CardHeader>
                <div className="flex items-center mb-2">
                  {review.reviewer_image ? (
                    <img 
                      src={review.reviewer_image} 
                      alt={review.reviewer_name} 
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                      <span className="font-medium text-slate-700">
                        {review.reviewer_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{review.reviewer_name}</div>
                    <div className="text-yellow-500">
                      {'★'.repeat(review.stars)}
                      {'☆'.repeat(5 - review.stars)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{review.text}</p>
                
                {review.response_text && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium">{companyName} Response:</p>
                    <p className="text-gray-700">{review.response_text}</p>
                    {review.response_date && (
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(review.response_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-4">
                  {new Date(review.published_at_date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
