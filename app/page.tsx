import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: 24 }}>
      <h1>Incidentmeldsysteem</h1>
      <p>Kies een route:</p>
      <ul>
        <li>
          <Link href="/report">Incident melden</Link>
        </li>
        <li>
          <Link href="/manager/login">Manager login</Link>
        </li>
      </ul>
    </main>
  );
}
