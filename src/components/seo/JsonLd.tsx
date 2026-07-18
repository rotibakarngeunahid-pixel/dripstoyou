// Server-rendered JSON-LD script tag. "<" is escaped so DB-sourced strings
// (product names, FAQ answers) can never break out of the script element.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
