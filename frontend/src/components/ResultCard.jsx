import React, { useState, useCallback } from 'react';
import { Shield, Copy, AlertTriangle } from 'lucide-react';

// Accepts props: generatedLink and onCreateAnother function
const ResultCard = ({ generatedLink, onCreateAnother }) => {
    const [copyStatus, setCopyStatus] = useState('Copy'); // State for copy button feedback

    // Memoized callback for copying to clipboard
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(generatedLink)
            .then(() => {
                setCopyStatus('Copied!');
                setTimeout(() => setCopyStatus('Copy'), 2000); // Reset after 2 seconds
            })
            .catch(err => {
                console.error('Failed to copy link:', err);
                setCopyStatus('Error');
                setTimeout(() => setCopyStatus('Copy'), 2000); // Reset after 2 seconds
            });
    }, [generatedLink]); // Dependency: run again if generatedLink changes


    return (
        <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Shield className="mr-2" size={20} />
                Your Secret Link is Ready
            </h2>

            <div className="mb-6">
                <label htmlFor="secretLink" className="block text-sm font-medium text-gray-700 mb-1">Share this link securely:</label>
                <div className="flex items-center">
                    <input
                        id="secretLink"
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="w-full p-3 bg-gray-100 border border-gray-300 rounded-l-md focus:outline-none truncate text-sm" // Added text-sm
                        aria-label="Generated secret link"
                    />
                    <button
                        onClick={handleCopy}
                        title={copyStatus}
                        // Change background color based on copy status
                        className={`bg-indigo-600 text-white p-3 rounded-r-md ${copyStatus === 'Copied!' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-indigo-700'} ${copyStatus === 'Error' ? 'bg-red-600 hover:bg-red-700' : ''} transition flex-shrink-0 flex items-center justify-center h-[50px] w-[50px]`}
                        aria-label="Copy secret link"
                    >
                        <Copy size={20} />
                    </button>
                </div>
                  {/* Display feedback message below input */}
                  {copyStatus !== 'Copy' && (
                       <p className={`text-xs mt-1 ${copyStatus === 'Copied!' ? 'text-green-600' : 'text-red-600'}`}>{copyStatus}</p>
                  )}
            </div>

            {/* Warning section */}
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-sm text-amber-800 flex items-start">
                <AlertTriangle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                <div>
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>This link can only be viewed once.</li>
                        <li>It will expire in 1 hour whether viewed or not.</li>
                        <li>Only share this link through secure channels.</li>
                    </ul>
                </div>
            </div>

            {/* Button to create another secret */}
            <div className="mt-6">
                <button
                    onClick={onCreateAnother}
                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition flex items-center justify-center font-medium"
                >
                    Create Another Secret
                </button>
            </div>
        </div>
    );
};

export default ResultCard;