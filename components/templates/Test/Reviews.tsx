
import React from 'react';
import { Company, Review } from '@/types';

interface ReviewsProps {
  company: Company;
  reviews?: Review[];
}

const Reviews: React.FC<ReviewsProps> = ({ company, reviews = [] }) => {
  return (
    <section id="reviews" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Customer Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.slice(0, 4).map((review, index) => (
            <div key={index} className="p-6 bg-white shadow-md rounded-lg">
              <div className="flex items-center mb-4">
                <div className="ml-4">
                  <h4 className="font-bold">{review.reviewer_name || review.name}</h4>
                  <div className="text-yellow-500">{"★".repeat(review.stars || review.rating || 5)}</div>
                </div>
              </div>
              <p>{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
