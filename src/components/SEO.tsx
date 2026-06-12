import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  type?: string;
  name?: string;
  url?: string;
  image?: string;
}

export default function SEO({ 
  title = 'Uganda Medical Journal - UMA', 
  description = 'The Uganda Medical Journal is a peer-reviewed open access journal published by the Uganda Medical Association.',
  type = 'website',
  name = 'Uganda Medical Journal',
  url = 'https://www.uma.ug',
  image = 'https://images.unsplash.com/photo-1576091160550-2173ff9e5eb4?auto=format&fit=crop&q=80&w=1200&h=630'
}: SEOProps) {
  const fullTitle = title !== name ? `${title} | ${name}` : title;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      
      {/* Facebook tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      <meta name="robots" content="index, follow" />
    </Helmet>
  );
}
