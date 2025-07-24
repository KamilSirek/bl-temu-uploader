import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const orders = await prisma.order.findMany();
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const data = await req.json();
  const order = await prisma.order.create({
    data: {
      email: data.email,
      product: data.product,
      price: data.price,
    },
  });
  return NextResponse.json(order);
} 