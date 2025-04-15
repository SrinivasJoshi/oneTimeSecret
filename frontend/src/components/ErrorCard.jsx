import React from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link

// Accepts props: errorType string and optional referenceId
const ErrorCard = ({ errorType, referenceId }) => {
     let title = "Secret Not Available";
     let message = "An unexpected error occurred while trying to retrieve the secret.";
     let details = [];

     // Customize messages based on error type
     switch (errorType) {
        case 'SECRET_UNAVAILABLE':
             message = "This secret cannot be viewed because:";
             details = [
                 "It has already been viewed by someone.",
                 "It has expired (older than 1 hour).",
                 "The link is invalid."
             ];
             break;
        case 'RATE_LIMITED':
             title = "Too Many Requests";
             message = "We received too many requests from your location.";
             details = ["Please wait a moment and try refreshing the page."];
             break;
        case 'DECRYPTION_FAILED':
            title = "Decryption Failed";
             message = "Could not decrypt the secret.";
              details = ["The link might be incomplete, corrupted, or the decryption key is incorrect."];
             break;
        case 'INVALID_FRAGMENT':
             title = "Invalid Link Format";
             message = "The secret link format appears to be incorrect.";
             details = ["Please ensure you copied the entire link correctly."];
             break;
         case 'UNKNOWN_ERROR': // Keep a fallback
         default:
             title = "Error Retrieving Secret";
             message = "An unexpected server or network error occurred.";
             details = ["Please try again later."];
             break;
     }


    return (
        <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6 border-t-4 border-red-500">
            <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                {title}
            </h2>

            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-800 mb-6 text-sm">
                <p className="font-medium mb-2">{message}</p>
                {details.length > 0 && (
                    <ul className="list-disc list-inside space-y-1">
                       {details.map((detail, index) => <li key={index}>{detail}</li>)}
                    </ul>
                )}
                 {errorType === 'SECRET_UNAVAILABLE' && (
                    <p className="mt-3">If you were expecting to see a secret, the person who shared it with you will need to create a new one.</p>
                 )}
            </div>

            {/* Show the attempted link ID if available */}
            {referenceId && (
                <div className="flex items-center text-xs text-gray-500 mb-6 break-all">
                    <ArrowLeft className="mr-1 flex-shrink-0" size={14} />
                    <span>Attempted Link ID: <span className="font-mono bg-gray-100 p-1 rounded">{referenceId}</span></span>
                </div>
             )}

             {/* Link back to homepage */}
            <div className="mt-4">
                 <Link to="/" className="w-full block text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition font-medium">
                    Create Your Own Secret
                </Link>
            </div>
        </div>
    );
};

export default ErrorCard;