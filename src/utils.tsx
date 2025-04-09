export const SwallopPointerEvents = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerEnter={(e) => e.stopPropagation()}
      onPointerLeave={(e) => e.stopPropagation()}
      onPointerCancel={(e) => e.stopPropagation()}
      onPointerOut={(e) => e.stopPropagation()}
      onPointerOver={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};
