export const metadata = {
  title: "Zerem",
  description: "Operations, organised.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
