export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-auto">
      {children}
    </div>
  );
}
