import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header'; // Make sure Header.jsx exists
import HomePage from './pages/HomePage'; // Make sure HomePage.jsx exists
import ViewSecretPage from './pages/ViewSecretPage'; // Make sure ViewSecretPage.jsx exists
import NotFoundPage from './pages/NotFoundPage'; // Make sure NotFoundPage.jsx exists

function App() {
    return (
        // Using BrowserRouter for standard web routing
        <Router>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header /> {/* Display header on all pages */}
                <main className="container mx-auto flex-grow p-4 flex flex-col items-center">
                    {/* Define application routes */}
                    <Routes>
                        {/* Route for the homepage (secret creation) */}
                        <Route path="/" element={<HomePage />} />
                        {/* Route for viewing a specific secret */}
                        <Route path="/s/:id" element={<ViewSecretPage />} />
                         {/* Catch-all route for any undefined paths */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>
                {/* You could add a <Footer /> component here if needed */}
            </div>
        </Router>
    );
}

export default App;