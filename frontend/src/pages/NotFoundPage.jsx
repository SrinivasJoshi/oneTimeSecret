import React from 'react';
import { Link } from 'react-router-dom';
import { ServerCrash } from 'lucide-react'; // Using a different icon for 404


const NotFoundPage = () => {
    return (
         <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-10 text-center my-10 mx-auto">
            <ServerCrash className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">404 - Page Not Found</h2>
            <p className="text-gray-600 mb-6">Oops! The page you're looking for doesn't seem to exist.</p>
            <Link
                to="/"
                className="inline-block bg-indigo-600 text-white py-2 px-5 rounded-md hover:bg-indigo-700 transition font-medium"
            >
                Go Back Home
            </Link>
         </div>
    );
};

export default NotFoundPage;