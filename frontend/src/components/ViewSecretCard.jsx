import React from 'react';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link

// Accepts prop: decryptedSecret string
const ViewSecretCard = ({ decryptedSecret }) => {
    return (
         <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6 mb-8">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-semibold text-gray-800 flex items-center">
               <Eye className="mr-2" size={20} />
               Viewing Secret Message
             </h2>
             {/* Success indicator */}
             <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
               Secret Decrypted
             </div>
           </div>

           {/* Display the decrypted secret */}
           <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md min-h-[100px] max-h-[400px] overflow-y-auto">
             <p className="whitespace-pre-wrap break-words">{decryptedSecret}</p>
           </div>

           {/* Note about deletion */}
           <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-sm text-amber-800">
             <p className="font-medium">This message has now been permanently deleted from our servers.</p>
             {/* Optional: Display view timestamp if available */}
             {/* <p className="mt-1 text-xs">Viewed on {new Date().toLocaleString()}</p> */}
           </div>

            {/* Link back to homepage */}
           <div className="mt-6">
             <Link to="/" className="w-full block text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition font-medium">
                 Create Your Own Secret
             </Link>
           </div>
         </div>
    );
};

export default ViewSecretCard;