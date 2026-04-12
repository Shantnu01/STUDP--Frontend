import { Link } from "react-router-dom";

export default function SimpleLanding() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '10vw', margin: '0 0 2rem 0', fontWeight: '900' }}>
        EDUSYNC
      </h1>
      <p style={{ fontSize: '2.5rem', maxWidth: '800px', color: '#888', marginBottom: '4rem' }}>
        SIMPLE SCHOOL MANAGEMENT.
      </p>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/login" style={{
          background: '#fff',
          color: '#000',
          padding: '2rem 4rem',
          fontSize: '2rem',
          fontWeight: 'bold',
          borderRadius: '100px',
          textDecoration: 'none'
        }}>
          LOGIN
        </Link>
        <Link to="/signup" style={{
          border: '4px solid #fff',
          color: '#fff',
          padding: '2rem 4rem',
          fontSize: '2rem',
          fontWeight: 'bold',
          borderRadius: '100px',
          textDecoration: 'none'
        }}>
          REGISTER
        </Link>
      </div>
    </div>
  );
}
