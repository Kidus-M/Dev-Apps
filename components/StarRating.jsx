// components/StarRating.jsx
import { FiStar } from 'react-icons/fi';

const StarRating = ({ rating = 0, maxStars = 5, className = "" }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0; // Simple check, no actual half-star rendering here yet

  return (
    <div className={`flex items-center ${className}`}>
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <FiStar
            key={index}
            className={`w-4 h-4 ${
              starValue <= fullStars ? 'text-yellow-400 fill-current' : 'text-nova-gray-300'
              // Add half-star logic here if needed
            }`}
          />
        );
      })}
      {/* Optional: Display number rating */}
      {/* <span className="ml-1 text-xs text-nova-gray-500">({rating.toFixed(1)})</span> */}
    </div>
  );
};

export default StarRating;