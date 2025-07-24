import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  });
  const [rows] = await connection.execute('SELECT NOW() as now');
  await connection.end();
  // Poprawka typowania wyniku:
  const now = Array.isArray(rows) && rows.length > 0 ? (rows[0] as any).now : null;
  return NextResponse.json({ now });
} 