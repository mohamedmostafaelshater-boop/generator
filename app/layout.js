export const metadata = {
  title: "مولّد أوصاف المنتجات",
  description: "أداة لتوليد أوصاف منتجات تسويقية جاهزة للمتاجر الإلكترونية",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
