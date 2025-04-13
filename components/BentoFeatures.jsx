// components/BentoFeatures.jsx
import FeatureCard from './FeatureCard';
import { FiUploadCloud, FiUsers, FiMessageSquare, FiCompass, FiShield, FiGift } from 'react-icons/fi'; // Example Icons

const BentoFeatures = () => {
  return (
    <section id="features" className="py-20 bg-nova-gray-50 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-nova-gray-900 mb-12">
          Everything You Need to <span className="text-nova-blue-500">Launch & Test</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large Card 1 */}
          <FeatureCard
            icon={FiUploadCloud}
            title="Upload & Share Instantly"
            description="Developers: Easily upload your builds and share them with a targeted audience for testing."
            className="md:col-span-2" // Span 2 columns on medium screens and up
          />

          {/* Small Card 1 */}
          <FeatureCard
            icon={FiMessageSquare}
            title="Direct Feedback Loop"
            description="Get valuable ratings and detailed feedback directly from real users."
          />

          {/* Small Card 2 */}
           <FeatureCard
            icon={FiUsers}
            title="Build Your Community"
            description="Connect with early adopters and testers who are passionate about new tech."
          />

          {/* Large Card 2 */}
          <FeatureCard
            icon={FiCompass}
            title="Discover Cutting-Edge Apps"
            description="Testers: Explore unique apps not yet available on mainstream stores."
             className="md:col-span-2" // Span 2 columns
          />

           {/* Small Card 3 */}
           <FeatureCard
            icon={FiGift}
            title="Free Access, Always"
            description="Download and test exciting new applications completely free of charge."
          />

          {/* Optional Small Card 4 */}
          {/* <FeatureCard
            icon={FiShield}
            title="Secure Environment"
            description="We prioritize a safe platform for both developers and testers."
          /> */}
        </div>
      </div>
    </section>
  );
};

export default BentoFeatures;