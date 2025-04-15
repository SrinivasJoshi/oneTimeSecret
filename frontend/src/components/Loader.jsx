import React from 'react';
import { Loader2 } from 'lucide-react'; // Using Loader2 for a spinning animation

const Loader = ({ message = "Processing..." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-10 text-gray-600">
            {/* Apply Tailwind animation class */}
            <Loader2 className="animate-spin h-8 w-8 mb-3 text-indigo-600" />
            <p>{message}</p>
        </div>
    );
};

export default Loader;