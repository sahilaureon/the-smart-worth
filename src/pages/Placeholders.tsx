import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';

export const PlaceholderPage = ({ title, description }: { title: string, description: string }) => (
  <div className="min-h-screen bg-white">
    <Helmet>
      <title>{title} | The Smart Worth</title>
      <meta name="description" content={description} />
    </Helmet>
    <Navbar />
    <PageHeader title={title} />
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
      <p className="text-gray-600">We are working hard to bring you the best experience for {title}.</p>
    </div>
    <Footer />
  </div>
);

export const About = () => <PlaceholderPage title="About Us" description="Learn more about The Smart Worth and our mission." />;
export const Blog = () => <PlaceholderPage title="Blog" description="Read our latest articles and updates." />;
export const Contact = () => <PlaceholderPage title="Contact Us" description="Get in touch with us for any queries or support." />;
