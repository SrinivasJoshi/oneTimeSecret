import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link for navigation

const Header = () => {
    return (
        <header className="bg-indigo-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex items-center">
                {/* Link the logo/title back to the homepage */}
                <Link to="/" className="flex items-center cursor-pointer">
                    <Shield className="mr-2" size={24} />
                    <h1 className="text-xl font-bold">OneTimeSecret</h1>
                </Link>
                <p className="ml-4 text-indigo-200 text-sm hidden sm:block">Secure. Ephemeral. Zero-knowledge.</p>
            </div>
        </header>
    );
};

export default Header;