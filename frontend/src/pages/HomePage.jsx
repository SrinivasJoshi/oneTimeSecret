import React, { useState } from 'react';
import CreateSecretCard from '../components/CreateSecretCard';
import ResultCard from '../components/ResultCard';
import Loader from '../components/Loader';
import { encryptSecret } from '../services/crypto';
import { createSecret } from '../services/api';
import { AlertTriangle } from 'lucide-react'; // For error display

const HomePage = () => {
    // State 'view' controls which component/card is displayed
    const [view, setView] = useState('create'); // Initial view is the creation form
    const [generatedLink, setGeneratedLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Function passed to CreateSecretCard, triggered on form submission
    const handleGenerate = async (secretText) => {
        if (!secretText.trim()) {
            setErrorMessage("Secret message cannot be empty.");
            setView('error');
            return;
        }
        setIsLoading(true);
        setView('loading'); // Show loader while processing
        setErrorMessage('');

        try {
            // 1. Encrypt (Client-side)
            console.log("Encrypting secret...");
            const { encryptedBase64, ivBase64, keyBase64 } = await encryptSecret(secretText);
            console.log("Encryption complete.");

            // 2. Send encrypted data to API (Backend)
            console.log("Sending encrypted data to API...");
            const referenceId = await createSecret(encryptedBase64);
            console.log("API returned referenceId:", referenceId);

            // 3. Construct the full secret link (including fragment)
            const fragment = `${keyBase64}.${ivBase64}`; // Key and IV separated by '.'
            const link = `${window.location.origin}/s/${referenceId}#${fragment}`;

            // 4. Update state to show the result
            setGeneratedLink(link);
            setView('result');

        } catch (error) {
            console.error("Generation failed:", error);
            setErrorMessage(error.message || "Failed to generate secret link. Please try again.");
            setView('error'); // Show error view
        } finally {
            setIsLoading(false); // Ensure loading is turned off
        }
    };

    // Function passed to ResultCard to go back to the creation form
    const handleCreateAnother = () => {
        setView('create');
        setGeneratedLink('');
        setErrorMessage('');
    };

    // Conditional rendering based on the 'view' state
    return (
        <div className="w-full flex flex-col items-center justify-center flex-grow">
            {view === 'create' && (
                <CreateSecretCard
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                />
            )}
            {view === 'loading' && <Loader message="Generating secure link..." />}
            {view === 'result' && (
                <ResultCard
                    generatedLink={generatedLink}
                    onCreateAnother={handleCreateAnother}
                />
            )}
            {/* Simple error display for generation process */}
            {view === 'error' && (
                 <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6 text-center border-l-4 border-red-500">
                     <div className="flex justify-center items-center text-red-600 mb-3">
                         <AlertTriangle className="mr-2" size={20} />
                         <h3 className="font-semibold">Error Generating Link</h3>
                     </div>
                     <p className="text-gray-700 mb-4">{errorMessage}</p>
                      <button
                            onClick={handleCreateAnother} // Allow user to try again
                            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition font-medium"
                        >
                            Try Again
                      </button>
                 </div>
            )}
        </div>
    );
};

export default HomePage;