
import React from 'react';
import { Company } from '@/types';

interface ReviewsProps {
  company: Company;
}

const Reviews: React.FC<ReviewsProps> = ({ company }) => {
  const reviews = [
    {
      id: 1,
      name: 'Michael Johnson',
      text: 'Excellent service! The technician was professional, knowledgeable, and fixed our AC issue quickly. Highly recommend!',
      rating: 5,
    },
    {
      id: 2,
      name: 'Sarah Williams',
      text: 'We've been using their maintenance service for years. Always reliable, always on time, and they keep our system running perfectly.',
      rating: 5,
    },
    {
      id: 3,
      name: 'Robert Davis',
      text: 'Called for an emergency repair on a Sunday evening, and they were at our house within the hour. Outstanding service!',
      rating: 5,
    },
  ];

  return (
    <section id="reviews" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
          <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say about {company.name}.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-50 rounded-lg p-8 shadow-md">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">"{review.text}"</p>
              <div className="font-medium">- {review.name}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-block bg-blue-50 rounded-lg p-8 max-w-3xl">
            <div className="flex justify-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-800">5.0 Rating on Google</p>
            <p className="text-lg text-gray-600 mt-2">Based on 50+ customer reviews</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
