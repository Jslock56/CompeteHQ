"use client"

// C:\Users\Jared\competehq\src\components\common\footer.tsx
import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <Link href="/" className="flex items-center">
              <div className="h-6 w-6 rounded bg-primary-600 flex items-center justify-center text-white font-bold mr-2">
                C
              </div>
              <span className="text-sm font-medium text-gray-900">competeHQ</span>
            </Link>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-center text-sm text-gray-500">
              &copy; {currentYear} competeHQ. All rights reserved.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex justify-center space-x-6">
            <Link 
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Terms of Service
            </Link>
            <Link 
              href="/contact"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;