'use client';

import React, { useState, useEffect, useRef } from 'react';

// Track if we've already shown the disclaimer in this session
let hasShownDisclaimerInSession = false;

export default function DismissibleDisclaimer() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const hasTrackedDismiss = useRef(false);

  useEffect(() => {
    // Check if the disclaimer has been dismissed before
    const hasBeenDismissed = localStorage.getItem('disclaimerDismissed');
    
    if (!hasBeenDismissed) {
      // Show the disclaimer after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        
        // Only track the first time the disclaimer is shown in this session
        if (!hasShownDisclaimerInSession) {
          hasShownDisclaimerInSession = true;
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    
    // Only track the dismissal once per session
    if (!hasTrackedDismiss.current) {
      hasTrackedDismiss.current = true;
    }
    
    // Set a timeout to match the animation duration
    setTimeout(() => {
      setIsVisible(false);
      // Store in localStorage that the user has dismissed the disclaimer
      localStorage.setItem('disclaimerDismissed', 'true');
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-muted border-t-3 border-dashed border-primary z-50 transition-transform duration-300 ${
        isClosing ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="container mx-auto px-4 py-3 relative">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-4 font-pixel-bold text-primary hover:text-orange-500"
          aria-label="Close disclaimer"
        >
          ✕
        </button>
        
        <div className="pr-8">
          <p className="text-sm font-pixel text-primary mb-1">
            <strong className="font-pixel-bold">DISCLAIMER:</strong> HNTLDR is an <strong className="font-pixel-bold">unofficial</strong> project and is <strong className="font-pixel-bold">not affiliated</strong> with Hacker News, Y Combinator, or any of their properties.
          </p>
          <p className="text-xs font-pixel text-muted">
            This is a fan-made project that summarizes content from Hacker News. &ldquo;Hacker News&rdquo; is a trademark of Y Combinator, which we use under nominative fair use solely to identify the source of the content we summarize.
          </p>
        </div>
      </div>
    </div>
  );
} 