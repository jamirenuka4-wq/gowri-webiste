import './globals.css';

export const metadata = {
  title: 'Gowri Pickles – Authentic Homemade Indian Pickles | Buy Online',
  description: 'Buy authentic homemade Indian pickles online from Gowri Pickles. Traditional Andhra-style mango pickle, lemon pickle, chilli pickle & mixed pickle. No preservatives. Free delivery above ₹500.',
  keywords: 'Gowri Pickles, Indian pickles online, mango pickle, lemon pickle, chilli pickle, Andhra pickle, homemade pickle, authentic Indian achar',
  authors: [{ name: 'Gowri Pickles' }],
  openGraph: {
    type: 'website',
    siteName: 'Gowri Pickles',
    title: 'Gowri Pickles – Authentic Homemade Indian Pickles Online',
    description: 'Traditional Andhra-style pickles made fresh with authentic spices. Free delivery above ₹500.',
    url: 'https://www.gowripickles.com',
    images: [{ url: 'https://www.gowripickles.com/images/mango_pickle.png' }],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gowri Pickles – Authentic Homemade Indian Pickles',
    description: 'Buy authentic Indian pickles online. Traditional recipes, fresh ingredients.',
    images: ['https://www.gowripickles.com/images/mango_pickle.png'],
  },
  verification: {
    google: '-tcztVVwA7xYgJBaysn8x91dm3TbpuMmuKic-07rEgk',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/png" href="/images/logo.png" />
        <link rel="canonical" href="https://www.gowripickles.com/" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Gowri Pickles",
          "url": "https://www.gowripickles.com",
          "logo": "https://www.gowripickles.com/images/logo.png",
          "image": "https://www.gowripickles.com/images/mango_pickle.png",
          "description": "Authentic homemade Indian pickles made with traditional recipes. Andhra-style mango, lemon, chilli and mixed pickles.",
          "telephone": "+91-9515258527",
          "email": "orders@gowripickles.com",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Adharsh Nagar, Sector 8, Near Ushodhaya Sarvani Sweets, MVP Colony, Pedda Waltair",
            "addressLocality": "Visakhapatnam",
            "addressRegion": "Andhra Pradesh",
            "postalCode": "530017",
            "addressCountry": "IN"
          }
        })}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
