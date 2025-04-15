import React, { useRef } from 'react';
import { Eye, Clock } from 'lucide-react';

// Accepts props: onGenerate function and isLoading boolean
const CreateSecretCard = ({ onGenerate, isLoading }) => {
    const textareaRef = useRef(null); // Ref to access textarea value

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission
        if (textareaRef.current && !isLoading) {
            onGenerate(textareaRef.current.value); // Call parent handler with text
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Eye className="mr-2" size={20} />
                Create a Secret Message
            </h2>

            <div className="mb-6">
                <textarea
                    ref={textareaRef}
                    required // Make textarea required
                    className="w-full h-40 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Type or paste your secret message here..."
                    disabled={isLoading} // Disable textarea when loading
                ></textarea>
            </div>

            <div className="flex flex-col space-y-4">
                <button
                    type="submit"
                    disabled={isLoading} // Disable button when loading
                    className="bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {/* Change button text based on loading state */}
                    {isLoading ? 'Generating...' : 'Generate Secret Link'}
                </button>
            </div>

            <div className="mt-4 text-sm text-gray-500 flex items-start">
                <Clock className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                <p>Secret will expire after 1 hour or after first view, whichever comes first.</p>
            </div>
        </form>
    );
};

export default CreateSecretCard;