"use client";

import React from 'react';
import Link from 'next/link';
import TeamForm from '../../../components/forms/team-form';

/**
 * Page for creating a new team
 */
export default function NewTeamPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/teams" className="hover:text-gray-700">
              Teams
            </Link>
          </li>
          <li className="flex items-center">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="ml-2">Create New Team</span>
          </li>
        </ol>
      </nav>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Team</h1>
        <p className="text-gray-600">Enter your team information to get started.</p>
      </div>
      
      {/* Form Card */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <TeamForm />
        </div>
      </div>
    </div>
  );
}