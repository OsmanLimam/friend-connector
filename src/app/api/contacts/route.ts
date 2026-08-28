import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
      include: { group: { select: { name: true } } },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, number, groupId, status } = body;

    const existing = await prisma.contact.findUnique({ where: { number } });
    if (existing) {
      return NextResponse.json(existing);
    }

    const contact = await prisma.contact.create({
      data: {
        name: name || 'Unknown',
        number,
        groupId: groupId || null,
        status: status || 'pending',
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Failed to create contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const number = searchParams.get('number') || undefined;

    if (!id && !number) {
      return NextResponse.json({ error: 'Contact id or number required' }, { status: 400 });
    }

    if (id) {
      await prisma.contact.delete({ where: { id } });
    } else {
      const existing = await prisma.contact.findUnique({ where: { number } });
      if (existing) {
        await prisma.contact.delete({ where: { number } });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
