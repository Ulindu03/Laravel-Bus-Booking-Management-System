export default function AuthLayout({ children }) {
    return (
        <div style={{ minHeight: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                /* Hide global footer to prevent unnecessary scrolling on modern auth pages */
                footer { display: none !important; }
            `}</style>
            <div style={{ flex: 1, display: 'flex', width: '100%' }}>
                {children}
            </div>
        </div>
    );
}
