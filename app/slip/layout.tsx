export const metadata = { title: "অর্ডার স্লিপ — BizilCore" };

export default function SlipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f3",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "24px 16px",
        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
