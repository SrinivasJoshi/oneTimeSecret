import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ViewSecretCard from '../components/ViewSecretCard';
import ErrorCard from '../components/ErrorCard';
import Loader from '../components/Loader';
import { consumeSecret } from '../services/api';
import { decryptSecret } from '../services/crypto';

const ViewSecretPage = () => {
    const { id } = useParams(); // Get referenceId from URL path
    const location = useLocation(); // Need this to get the initial hash
    const navigate = useNavigate(); // To clear hash

    // State: 'loading', 'success', 'error'
    const [viewState, setViewState] = useState('loading');
    // State to hold the final decrypted secret text
    const [decryptedSecret, setDecryptedSecret] = useState('');
    // State to hold the type of error for ErrorCard
    const [errorType, setErrorType] = useState(''); // e.g., 'SECRET_UNAVAILABLE', 'DECRYPTION_FAILED'

    useEffect(() => {
        let isMounted = true;
        const fragment = location.hash.substring(1); // Get fragment ('key.iv')

        // Define async function to process secret
        const processSecret = async () => {
            // --- Initial Validation ---
            if (!id || !fragment) {
                 console.log("Missing ID or Fragment");
                setErrorType('INVALID_FRAGMENT');
                setViewState('error');
                 // Clear hash if possible even on initial error
                 if (isMounted) navigate(location.pathname, { replace: true, state: null });
                return;
            }

            // --- Clear Hash Immediately ---
            // Do this early so it doesn't linger if decryption/API fails
             if (isMounted) {
                 console.log("Clearing hash");
                 navigate(location.pathname, { replace: true, state: null });
             }

            // --- Parse Fragment ---
            const parts = fragment.split('.');
            if (parts.length !== 2 || !parts[0] || !parts[1]) {
                console.log("Invalid fragment format");
                setErrorType('INVALID_FRAGMENT');
                setViewState('error');
                return;
            }
            const [keyBase64, ivBase64] = parts;


            // --- Attempt to Consume and Decrypt ---
            try {
                console.log(`Attempting to consume secret ID: ${id}`);
                // 1. Call API to consume/validate and get encrypted data
                const encryptedSecretBase64 = await consumeSecret(id);
                console.log(`API returned encrypted data.`);

                if (!isMounted) return; // Check if component unmounted during API call

                // 2. Decrypt if API call was successful
                console.log(`Attempting to decrypt...`);
                const plainText = await decryptSecret(encryptedSecretBase64, ivBase64, keyBase64);
                console.log(`Decryption successful.`);

                if (!isMounted) return; // Check if component unmounted during decryption

                // 3. Update state on success
                setDecryptedSecret(plainText);
                setViewState('success');

            } catch (error) {
                 if (!isMounted) return; // Check if component unmounted during error handling

                 console.error("Failed to view secret:", error);
                 // Map error messages from api.js/crypto.js to error types
                 if (error.message === 'SECRET_UNAVAILABLE') {
                     setErrorType('SECRET_UNAVAILABLE');
                 } else if (error.message === 'RATE_LIMITED') {
                    setErrorType('RATE_LIMITED');
                 } else if (error.message.toLowerCase().includes('decrypt') || error.message.toLowerCase().includes('key') || error.message.toLowerCase().includes('base64')) {
                     setErrorType('DECRYPTION_FAILED'); // Group potential decryption/key errors
                 } else {
                     setErrorType('UNKNOWN_ERROR'); // Generic fallback
                 }
                 setViewState('error');
            }
        };

        // Delay execution slightly to ensure hash is available and DOM is ready
        // although useEffect runs after render, this can sometimes help timing issues.
        // Consider if this timeout is truly necessary - often it's not.
        // setTimeout(processSecret, 10);
        processSecret();


        // Cleanup function for when component unmounts
        return () => {
            isMounted = false;
            console.log("ViewSecretPage unmounted.");
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // --- Render based on state ---
    return (
         <div className="w-full flex flex-col items-center justify-center flex-grow">
            {viewState === 'loading' && <Loader message="Retrieving and decrypting secret..." />}
            {viewState === 'success' && <ViewSecretCard decryptedSecret={decryptedSecret} />}
            {viewState === 'error' && <ErrorCard errorType={errorType} referenceId={id} />}
        </div>
    );
};

export default ViewSecretPage;